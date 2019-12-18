var Crypto = require("crypto")

exports.randomBytes = Crypto.randomBytes

exports.hash = function(hash, data) {
	return Crypto.createHash(hash).update(data).digest()
}

exports.hashStream = function(hash, stream) {
	return new Promise(function(resolve, reject) {
		var hasher = Crypto.createHash(hash)
		stream.pipe(hasher)
		hasher.on("finish", () => resolve(hasher.read()))
		hasher.on("error", reject)
	})
}
