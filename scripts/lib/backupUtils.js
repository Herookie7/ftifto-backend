const { PassThrough, Readable } = require('stream');
const { S3Client, ListObjectsV2Command, DeleteObjectsCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const archiver = require('archiver');
const unzipper = require('unzipper');
const readline = require('readline');
const { EJSON } = require('bson');

const DEFAULT_PREFIX = 'backups/';
const DEFAULT_RETENTION = 7;
const FORCE_PATH_STYLE_ENDPOINTS = ['http://', 'https://'];

const buildS3Client = ({ region, endpoint, accessKeyId, secretAccessKey }) => {
  const endpointTrimmed = endpoint?.trim();
  const hasEndpoint = Boolean(endpointTrimmed);
  const forcePathStyle = hasEndpoint && FORCE_PATH_STYLE_ENDPOINTS.some((scheme) => endpointTrimmed.startsWith(scheme));

  return new S3Client({
    region: region || 'us-east-1',
    endpoint: hasEndpoint ? endpointTrimmed : undefined,
    forcePathStyle,
    credentials:
      accessKeyId && secretAccessKey
        ? {
            accessKeyId,
            secretAccessKey
          }
        : undefined
  });
};

const generateBackupKey = ({ prefix, timestamp, extension = 'zip' }) => {
  const normalizedPrefix = prefix?.endsWith('/') ? prefix : `${prefix || DEFAULT_PREFIX}`.replace(/\/?$/, '/');
  const safeTimestamp = timestamp.replace(/[:.]/g, '-');
  return `${normalizedPrefix}backup-${safeTimestamp}.${extension}`;
};

const appendCollectionToArchive = (db, archive, collectionName, logger) => {
  const collection = db.collection(collectionName);
  const stream = Readable.from(
    (async function* streamCollection() {
      const cursor = collection.find({});
      try {
        while (await cursor.hasNext()) {
          const doc = await cursor.next();
          yield `${EJSON.stringify(doc)}\n`;
        }
      } finally {
        await cursor.close();
      }
    })()
  );

  archive.append(stream, { name: `${collectionName}.jsonl` });
  logger.debug?.(`Queued collection ${collectionName} for backup`);
};

const createBackupArchive = async ({ db, logger }) => {
  const archive = archiver('zip', { zlib: { level: 9 } });
  const stream = new PassThrough();
  archive.pipe(stream);

  const collections = await db.listCollections({}, { nameOnly: true }).toArray();
  collections.forEach(({ name }) => appendCollectionToArchive(db, archive, name, logger));
  const finalizePromise = archive.finalize();

  return { archive, stream, finalizePromise };
};

const uploadBackup = async ({ s3Client, bucket, key, bodyStream, logger }) => {
  let totalBytes = 0;
  bodyStream.on('data', (chunk) => {
    totalBytes += chunk.length;
  });

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: bucket,
      Key: key,
      Body: bodyStream,
      ContentType: 'application/zip'
    }
  });

  const result = await upload.done();

  logger.info(`Uploaded backup to s3://${bucket}/${key}`, { sizeBytes: totalBytes });

  return {
    location: { bucket, key },
    sizeBytes: totalBytes,
    etag: result.ETag
  };
};

const listBackups = async ({ s3Client, bucket, prefix }) => {
  let continuationToken;
  const items = [];

  do {
    // eslint-disable-next-line no-await-in-loop
    const response = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken
      })
    );

    if (response.Contents) {
      items.push(...response.Contents);
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return items.sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified));
};

const enforceRetention = async ({ s3Client, bucket, prefix, retention = DEFAULT_RETENTION, logger }) => {
  if (!retention || retention <= 0) {
    return { deleted: 0, retained: 0 };
  }

  const backups = await listBackups({ s3Client, bucket, prefix });
  if (backups.length <= retention) {
    return { deleted: 0, retained: backups.length };
  }

  const toDelete = backups.slice(retention);
  const deleteCommand = new DeleteObjectsCommand({
    Bucket: bucket,
    Delete: {
      Objects: toDelete.map((item) => ({ Key: item.Key }))
    }
  });

  await s3Client.send(deleteCommand);

  logger.info(`Deleted ${toDelete.length} backup(s) due to retention policy`, {
    deletedKeys: toDelete.map((item) => item.Key)
  });

  return { deleted: toDelete.length, retained: backups.length - toDelete.length };
};

const restoreCollectionsFromZip = async ({ zipStream, db, logger, batchSize = 500 }) => {
  const restoredCounts = {};
  const directory = zipStream.pipe(unzipper.Parse({ forceStream: true }));

  // eslint-disable-next-line no-restricted-syntax
  for await (const entry of directory) {
    if (entry.type !== 'File' || !entry.path.endsWith('.jsonl')) {
      entry.autodrain();
      // eslint-disable-next-line no-continue
      continue;
    }

    const collectionName = entry.path.replace(/\.jsonl$/, '');
    const collection = db.collection(collectionName);

    await collection.drop().catch((error) => {
      if (error.codeName !== 'NamespaceNotFound') {
        throw error;
      }
    });

    entry.setEncoding('utf8');
    const rl = readline.createInterface({ input: entry, crlfDelay: Infinity });
    let batch = [];
    let inserted = 0;

    // eslint-disable-next-line no-restricted-syntax
    for await (const line of rl) {
      if (!line.trim()) {
        // eslint-disable-next-line no-continue
        continue;
      }

      let doc;
      try {
        doc = EJSON.parse(line);
      } catch (error) {
        logger.error(`Failed to parse backup line for ${collectionName}`, { error: error.message, lineSnippet: line.slice(0, 100) });
        throw error;
      }

      batch.push(doc);

      if (batch.length >= batchSize) {
        // eslint-disable-next-line no-await-in-loop
        await collection.insertMany(batch, { ordered: false });
        inserted += batch.length;
        batch = [];
      }
    }

    if (batch.length) {
      await collection.insertMany(batch, { ordered: false });
      inserted += batch.length;
    }

    restoredCounts[collectionName] = inserted;
    logger.info(`Restored ${inserted} document(s) to collection ${collectionName}`);
  }

  return restoredCounts;
};

const downloadBackupStream = async ({ s3Client, bucket, key }) => {
  const response = await s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  return response.Body;
};

module.exports = {
  buildS3Client,
  createBackupArchive,
  uploadBackup,
  generateBackupKey,
  enforceRetention,
  listBackups,
  restoreCollectionsFromZip,
  downloadBackupStream
};


