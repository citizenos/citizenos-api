process.on("unhandledRejection", function() {})

// Must.js doesn't support comparing buffers' contents out of the box, so let's
// fix Buffer to help with that.
Buffer.prototype.valueOf = Buffer.prototype.toJSON
