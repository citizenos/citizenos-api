var PEM_WRAPPER = /^-{5}BEGIN [^-]+-----\s*\n([\s\S]*)\n-----END [^-]+-----\s*$/

exports.parse = function(pem) {
	var content = PEM_WRAPPER.exec(pem)
	if (!content) throw new SyntaxError("Cannot parse certificate: " + pem)
	return Buffer.from(content[1], "base64")
}

exports.serialize = function(type, buffer) {
	var encoded = buffer.toString("base64")
	return `-----BEGIN ${type}-----\n${encoded}\n-----END ${type}-----`
}

exports.isPem = function(pem) {
	return (
		typeof pem == "string" ||
		Buffer.isBuffer(pem) && /^-----BEGIN/.exec(pem)
	)
}
