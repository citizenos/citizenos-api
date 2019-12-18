var concatStream = require("concat-stream")

exports.slurp = function(encoding, stream) {
	return new Promise(function(resolve, reject) {
		stream.setEncoding(encoding).pipe(concatStream(resolve))
		stream.on("error", reject)
	})
}
