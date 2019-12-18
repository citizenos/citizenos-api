var OcspAsn = require("./ocsp_asn")
var StandardError = require("standard-error")
var sha1 = require("../lib/crypto").hash.bind(null, "sha1")
var fetch = require("./fetch")
var SHA1_ALGORITHM = {algorithm: require("./x509_asn").SHA1}
exports.OcspResponse = OcspResponse
exports.OcspError = OcspError
exports.parse = parse

var ERROR_CODES = {
	malformed_request: "malformedRequest",
	internal_error: "internalError",
	try_later: "tryLater",
	sig_required: "sigRequired",
	unauthorized: "unauthorized"
}

exports.read = function(issuer, cert, opts) {
	return exports.request(issuer, cert, opts).then(parse)
}

exports.request = function(issuer, cert, opts) {
	var url = opts && opts.url || cert.ocspUrl
	if (url == null) throw new Error("No OCSP URL in certificate")

	var req = createRequest(issuer, cert, opts && opts.nonce)

	// OCSP over HTTP is specified in
	// https://tools.ietf.org/html/rfc2560#appendix-A.1.
	return fetch(url, {
		method: "POST",

		headers: {
			// NOTE: Content-Length is required. Otherwise SK's
			// http://demo.sk.ee/ocsp server throws malformed_request.
			Accept: "application/ocsp-response",
			"Content-Type": "application/ocsp-request",
			"Content-Length": req.length
		},

		body: req
	}).then((res) => res.body)
}

function OcspResponse(asn) {
	this.asn = asn

	var status = asn.responseStatus
	if (status != "successful") throw new OcspError(ERROR_CODES[status] || status)

	var type = asn.responseBytes.responseType
	if (type != "id-pkix-ocsp-basic")
		throw new OcspError("unsupportedResponse", null, {type: type})

	this.status = status
	this.type = type
	this.basic = OcspAsn.BasicOCSPResponse.decode(asn.responseBytes.response)
	this.certificates = this.basic.tbsResponseData.responses.map(parseCertStatus)
}

OcspResponse.prototype.toBuffer = function() {
	return OcspAsn.OCSPResponse.encode(this.asn)
}

OcspResponse.prototype.toString = function(fmt) {
	switch (fmt) {
		case "hex":
		case "base64": return this.toBuffer().toString(fmt)
		default: throw new RangeError("Unsupported format: " + fmt)
	}
}

function createRequest(issuer, cert, nonce) {
	// Fields come from RFC 2560 Section 4.1.1.
	return OcspAsn.OCSPRequest.encode({
		tbsRequest: {
			requestList: [{
				reqCert: {
					// NOTE: SK's http://demo.sk.ee/ocsp doesn't support SHA256,
					// returning "revoked" every time.
					//
					// RFC 2560 Section 4.3 also only lists SHA1 as the hashing algorithm.
					// https://tools.ietf.org/html/rfc2560#section-4.3
					//
					// RFC 6960 alludes to SHA256, though.
					// https://tools.ietf.org/html/rfc6960#section-4.3
					serialNumber: cert.serialNumber,
					hashAlgorithm: SHA1_ALGORITHM,
					issuerNameHash: sha1(cert.issuer),
					issuerKeyHash: sha1(issuer.publicKey)
				}
			}],

			// NOTE: The server MAY respond with the certificate it signed the
			// response with. To my knowledge there's no way to explicitly ask for
			// one, as there is in the timestamp reques.
			requestExtensions: [{
				extnID: OcspAsn.OCSP_RESPONSE_TYPE,
				extnValue: OcspAsn.ResponseTypes.encode(["id-pkix-ocsp-basic"])
			}, nonce ? {
				extnID: OcspAsn["id-pkix-ocsp-nonce"],
				extnValue: nonce
			} : null].filter(Boolean)
		}
	})
}

var ERROR_MESSAGES = {
	// RFC 2560 Exception Cases:
	malformedRequest: "Malformed OCSP Request",
	internalError: "Internal OCSP Server Error",
	tryLater: "Try Later",
	sigRequired: "Client Signature Required",
	unauthorized: "OCSP Request Unauthorized",

	// Our specific:
	unsupportedResponse: "Unsupported OCSP Response Type"
}

function OcspError(code, msg, props) {
	this.code = code
	StandardError.call(this, ERROR_MESSAGES[code] || msg, props)
}

OcspError.prototype = Object.create(StandardError.prototype, {
	constructor: {value: OcspError, configurable: true, writeable: true}
})

function parseCertStatus(status) {
	return {
		at: new Date(status.thisUpdate),
		serial: status.certId.serialNumber,
		status: status.certStatus.type
	}
}

function parse(der) {
	return new OcspResponse(OcspAsn.OCSPResponse.decode(der))
}
