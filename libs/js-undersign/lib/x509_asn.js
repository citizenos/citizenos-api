var Asn = require("asn1.js")
var X509Asn = require("asn1.js-rfc5280")
var hash = require("./crypto").hash
var keys = Object.keys
exports = module.exports = Object.create(X509Asn)

exports.OCSP_URL = [1, 3, 6, 1, 5, 5, 7, 48, 1]

// https://tools.ietf.org/html/rfc3279 MD5, SHA1, ECDSA with SHA1
// https://tools.ietf.org/html/rfc5758 SHA224+, ECDSA with SHA224+
// https://tools.ietf.org/html/rfc7427 RSA with SHA224+
exports.DSA = [1, 2, 840, 10040, 4, 1]
exports.RSA = [1, 2, 840, 113549, 1, 1, 1]
exports.ECDSA = [1, 2, 840, 10045, 2, 1]
exports.SHA1 = [1, 3, 14, 3, 2, 26]
exports.SHA224 = [2, 16, 840, 1, 101, 3, 4, 2, 4]
exports.SHA256 = [2, 16, 840, 1, 101, 3, 4, 2, 1]
exports.SHA384 = [2, 16, 840, 1, 101, 3, 4, 2, 2]
exports.SHA512 = [2, 16, 840, 1, 101, 3, 4, 2, 3]
exports.DSA_SHA1 = [1, 2, 840, 10040, 4, 3]
exports.DSA_SHA224 = [2, 16, 840, 1, 101, 3, 4, 3, 1]
exports.DSA_SHA256 = [2, 16, 840, 1, 101, 3, 4, 3, 2]
exports.RSA_SHA1 = [1, 2, 840, 113549, 1, 1, 5]
exports.RSA_SHA256 = [1, 2, 840, 113549, 1, 1, 11]
exports.RSA_SHA384 = [1, 2, 840, 113549, 1, 1, 12]
exports.RSA_SHA512 = [1, 2, 840, 113549, 1, 1, 12]
exports.ECDSA_SHA1 = [1, 2, 840, 10045, 4, 1]
exports.ECDSA_SHA224 = [1, 2, 840, 10045, 4, 3, 1]
exports.ECDSA_SHA256 = [1, 2, 840, 10045, 4, 3, 2]
exports.ECDSA_SHA384 = [1, 2, 840, 10045, 4, 3, 3]
exports.ECDSA_SHA512 = [1, 2, 840, 10045, 4, 3, 4]

var ALGORITHMS_TO_OIDS = {
	dsa: exports.DSA,
	rsa: exports.RSA,
	ecdsa: exports.ECDSA,
	sha1: exports.SHA1,
	sha224: exports.SHA224,
	sha256: exports.SHA256,
	sha384: exports.SHA384,
	sha512: exports.SHA512,
	"dsa-sha1": exports.DSA_SHA1,
	"dsa-sha224": exports.DSA_SHA224,
	"dsa-sha256": exports.DSA_SHA256,
	"rsa-sha1": exports.RSA_SHA1,
	"rsa-sha256": exports.RSA_SHA256,
	"rsa-sha384": exports.RSA_SHA384,
	"rsa-sha512": exports.RSA_SHA512,
	"ecdsa-sha1": exports.ECDSA_SHA1,
	"ecdsa-sha224": exports.ECDSA_SHA224,
	"ecdsa-sha256": exports.ECDSA_SHA256,
	"ecdsa-sha384": exports.ECDSA_SHA384,
	"ecdsa-sha512": exports.ECDSA_SHA512,
}

var OIDS_TO_ALGORITHMS = keys(ALGORITHMS_TO_OIDS).reduce((obj, name) => (
	obj[ALGORITHMS_TO_OIDS[name].join(".")] = name, obj
), {})

exports.ALGORITHMS_TO_OIDS = ALGORITHMS_TO_OIDS
exports.OIDS_TO_ALGORITHMS = OIDS_TO_ALGORITHMS

var DigestInfo = Asn.define("DigestInfo", function() {
	this.seq().obj(
    this.key("digestAlgorithm").use(X509Asn.AlgorithmIdentifier),
    this.key("digest").octstr()
	)
})

exports.DigestInfo = DigestInfo

exports.digest = function(algorithm, data) {
	var oid = ALGORITHMS_TO_OIDS[algorithm]
	if (oid == null) throw new RangeError("Unknown algorithm: " + algorithm)

	return DigestInfo.encode({
		digestAlgorithm: {algorithm: oid},
		digest: hash(algorithm, data)
	})
}
