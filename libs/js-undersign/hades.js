var _ = require("./lib/underscore")
var Timestamp = require("./lib/timestamp")
var Ocsp = require("./lib/ocsp")
var Xades = require("./xades")
var sha256 = require("./lib/crypto").hash.bind(null, "sha256")
var digest = require("./lib/x509_asn").digest
exports = module.exports = Hades

function Hades(attrs) {
	this.tsl = attrs.tsl
	this.timemarkUrl = attrs.timemarkUrl
	this.timestampUrl = attrs.timestampUrl
	this.ocspUrl = attrs.ocspUrl
}

Hades.prototype.tsl = null
Hades.prototype.timemarkUrl = null
Hades.prototype.timestampUrl = null
Hades.prototype.ocspUrl = null

Hades.prototype.new = function(cert, files) {
	return new Xades(cert, files)
}

Hades.prototype.with = function(attrs) {
	return _.assign(new Hades(this), attrs)
}

Hades.prototype.timemark = function(xades) {
	var cert = xades.certificate

	var issuer = this.tsl.certificates.getIssuer(cert)
	if (issuer == null) throw new Error(
		"Can't find issuer: " + cert.issuerDistinguishedName.join(", ")
	)

	var digestInfo = digest("sha1", xades.signature)
	return Ocsp.read(issuer, cert, {url: this.timemarkUrl, nonce: digestInfo})
}

Hades.prototype.timestamp = function(xades) {
	var digest = sha256(xades.signatureElement)
	return Timestamp.read(this.timestampUrl, digest)
}

Hades.prototype.ocsp = function(cert) {
	var issuer = this.tsl.certificates.getIssuer(cert)
	if (issuer == null) throw new Error(
		"Can't find issuer: " + cert.issuerDistinguishedName.join(", ")
	)

	return Ocsp.read(issuer, cert, {url: this.ocspUrl})
}
