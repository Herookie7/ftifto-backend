let uri = process.env.MONGO_URI || "";

uri = uri.replace(/^"+|"+$/g, "");   // remove every quote start/end

console.log("CLEAN_MONGO_URI:", uri);

process.env.MONGO_URI = uri;

