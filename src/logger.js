const { createLogger, format, transports } = require('winston');
const { Logtail } = require('@logtail/node');
const { LogtailTransport } = require('@logtail/winston');
const config = require('./config');

const loggerTransports = [
  new transports.Console({
    level: config.logging.level,
    format: format.combine(format.colorize(), format.timestamp(), format.printf(({ timestamp, level, message, ...meta }) => {
      const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
      return `[${timestamp}] ${level}: ${message}${metaString}`;
    }))
  })
];

if (config.logging.logtailToken) {
  const logtail = new Logtail(config.logging.logtailToken);
  loggerTransports.push(
    new LogtailTransport(logtail, {
      level: 'info',
      batch: true
    })
  );
}

const logger = createLogger({
  level: config.logging.level,
  format: format.combine(format.timestamp(), format.json()),
  defaultMeta: { service: 'ftifto-backend' },
  transports: loggerTransports
});

logger.stream = {
  write: (message) => logger.info(message.trim())
};

module.exports = logger;

