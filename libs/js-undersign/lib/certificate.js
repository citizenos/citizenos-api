var _ = require("./underscore")
var X509Asn = require("./x509_asn")
var Pem = require("./pem")
var LdapAttributes = require("./ldap_attributes")
var deepEgal = require("egal").deepEgal
var OCSP_URL_OID = require("./x509_asn").OCSP_URL
// https://tools.ietf.org/html/rfc4517#appendix-A
var OIDS_TO_ALGORITHMS = X509Asn.OIDS_TO_ALGORITHMS
var EMPTY_ARR = Array.prototype
var LDAP_ATTRS = require("./ldap_attributes.json")
exports = module.exports = Certificate

var RFC4514 = [
  "0.9.2342.19200300.100.1.1", // userId
  "0.9.2342.19200300.100.1.25", // domainComponent
  "2.5.4.3", // commonName
  "2.5.4.6", // countryName
  "2.5.4.7", // localityName
  "2.5.4.8", // stateOrProvinceName
  "2.5.4.9", // streetAddress
  "2.5.4.10", // organizationName
  "2.5.4.11", // organizationalUnitName
]

var rfc4514Attrs = new LdapAttributes(_.pick(LDAP_ATTRS, RFC4514))

function Certificate(der) {
	// NOTE: Asn.js can decode PEM directly, too.
	this.asn = X509Asn.Certificate.decode(der)
}

Certificate.prototype.__defineGetter__("serialNumber", function() {
	return this.asn.tbsCertificate.serialNumber
})

Certificate.prototype.__defineGetter__("subjectDistinguishedName", function() {
	return serializeDistinguishedName(this.asn.tbsCertificate.subject)
})

Certificate.prototype.__defineGetter__("subjectRfc4514Name", function() {
	return serializeRfc4514Name(this.asn.tbsCertificate.subject)
})

Certificate.prototype.__defineGetter__("subject", function() {
	return X509Asn.Name.encode(this.asn.tbsCertificate.subject)
})

Certificate.prototype.__defineGetter__("publicKey", function() {
	return this.asn.tbsCertificate.subjectPublicKeyInfo.subjectPublicKey.data
})

Certificate.prototype.__defineGetter__("publicKeyAlgorithm", function() {
	var oid = this.asn.tbsCertificate.subjectPublicKeyInfo.algorithm.algorithm
	return oid.join(".")
})

Certificate.prototype.__defineGetter__("publicKeyAlgorithmName", function() {
	return OIDS_TO_ALGORITHMS[this.publicKeyAlgorithm]
})

Certificate.prototype.__defineGetter__("issuerDistinguishedName", function() {
	return serializeDistinguishedName(this.asn.tbsCertificate.issuer)
})

Certificate.prototype.__defineGetter__("issuerRfc4514Name", function() {
	return serializeRfc4514Name(this.asn.tbsCertificate.issuer)
})

Certificate.prototype.__defineGetter__("issuer", function() {
	return X509Asn.Name.encode(this.asn.tbsCertificate.issuer)
})

Certificate.prototype.__defineGetter__("issuerSignatureAlgorithm", function() {
	return this.asn.signatureAlgorithm.algorithm.join(".")
})

Certificate.prototype.__defineGetter__("issuerSignatureAlgorithmName",
	function() {
	return OIDS_TO_ALGORITHMS[this.issuerSignatureAlgorithm]
})

Certificate.prototype.__defineGetter__("ocspUrl", function() {
	// Authority Information Access is defined in RFC 5280.
	// https://tools.ietf.org/html/rfc5280#section-4.2.2.1
	var extensions = this.asn.tbsCertificate.extensions || EMPTY_ARR

	var info = extensions.find((e) => e.extnID == "authorityInformationAccess")
	if (info == null) return null

	var ocspInfo = info.extnValue.find((info) => (
		deepEgal(info.accessMethod, OCSP_URL_OID) &&
		info.accessLocation.type == "uniformResourceIdentifier"
	))

	return ocspInfo && ocspInfo.accessLocation.value
})

Certificate.prototype.toBuffer = function() {
	return X509Asn.Certificate.encode(this.asn)
}

Certificate.prototype.toString = function(fmt) {
	switch (fmt) {
		case "hex":
		case "base64": return this.toBuffer().toString(fmt)
		case "pem": return Pem.serialize("CERTIFICATE", this.toBuffer())
		default: throw new RangeError("Unsupported format: " + fmt)
	}
}

exports.parse = function(derOrPem) {
	var der = Pem.isPem(derOrPem) ? Pem.parse(derOrPem) : derOrPem
	return new Certificate(der)
}

function serializeDistinguishedName(seq) {
	return seq.value.map((names) => names.map(function(name) {
		var oid = name.type, value = name.value

		return LdapAttributes.has(oid)
			? LdapAttributes.serializeKv(oid, LdapAttributes.parse(oid, value))
			: LdapAttributes.serializeUnknownKv(oid, value)
		}).join("+")
	)
}

function serializeRfc4514Name(seq) {
	return seq.value.map((names) => names.map(function(name) {
		var oid = name.type, value = name.value

		return rfc4514Attrs.has(oid)
			? rfc4514Attrs.serializeKv(oid, LdapAttributes.parse(oid, value))
			: LdapAttributes.serializeUnknownKv(oid, value)
	}).join("+")).join(",")
}
