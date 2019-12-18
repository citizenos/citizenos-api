var X509Asn = require("../lib/x509_asn")
var OCSP_URL_OID = require("../lib/x509_asn").OCSP_URL
var EMPTY_BUFFER = new Buffer(0)
var nextSerialNumber = Math.floor(10000 * Math.random())

exports.newCertificate = function(opts) {
	var extensions = []
	if (opts && opts.ocspUrl) extensions.push(serializeOcspUrl(opts.ocspUrl))

	return X509Asn.Certificate.encode({
		tbsCertificate: {
			serialNumber: nextSerialNumber++,
			signature: {algorithm: X509Asn.RSA_SHA256, parameters: EMPTY_BUFFER},
			subject: {type: "rdnSequence", value: []},
			issuer: {type: "rdnSequence", value: []},

			validity: {
				notBefore: {type: "utcTime", value: new Date},
				notAfter: {type: "utcTime", value: new Date}
			},

			subjectPublicKeyInfo: {
				algorithm: {algorithm: X509Asn.RSA, parameters: EMPTY_BUFFER},
				subjectPublicKey: {unused: 0, data: EMPTY_BUFFER}
			},

			extensions: extensions
		},

		signatureAlgorithm: {
			algorithm: X509Asn.RSA_SHA256,
			parameters: EMPTY_BUFFER
		},

		signature: {unused: 0, data: EMPTY_BUFFER}
	})
}

function serializeOcspUrl(url) {
	return {
		extnID: "authorityInformationAccess",
		extnValue: [{
			accessMethod: OCSP_URL_OID,
			accessLocation: {type: "uniformResourceIdentifier", value: url}
		}]
	}
}
