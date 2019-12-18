var sha1 = require("./crypto").hash.bind(null, "sha1")
module.exports = Certificates

function Certificates(certs) {
	this.map = {}
	if (certs) certs.forEach(this.add, this)
}

Certificates.prototype.add = function(cert) {
	this.map[sha1(cert.subject)] = cert
}

Certificates.prototype.has = function(cert) {
	return sha1(cert.subject) in this.map
}

Certificates.prototype.getIssuer = function(cert) {
	return this.map[sha1(cert.issuer)]
}

Certificates.prototype.toJSON = function() {
	return this.map
}
