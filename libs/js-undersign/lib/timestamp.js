var X509Asn = require("./x509_asn")
var TimestampAsn = require("./timestamp_asn")
var TimestampRequestAsn = TimestampAsn.TimestampRequest
var TimestampResponseAsn = TimestampAsn.TimestampResponse
var fetch = require("./fetch")
var deepEgal = require("egal").deepEgal
var SIGNED_DATA_OID = TimestampAsn.SIGNED_DATA_OID
var SHA256_ALGORITHM = {algorithm: X509Asn.SHA256}
exports.TimestampResponse = TimestampResponse
exports.parse = parse

exports.read = function(url, digest) {
	return exports.request(url, digest).then(parse)
}

exports.request = function(url, digest) {
	var req = createRequest(digest)

	return fetch(url, {
		method: "POST",

		headers: {
			Accept:  "application/timestamp-reply",
			"Content-Type": "application/timestamp-query",
			"Content-Length": req.length
		},

		body: req
	}).then((res) => res.body)
}

function createRequest(digest) {
	return TimestampRequestAsn.encode({
		version: "v1",
		certReq: true,
		messageImprint: {hashAlgorithm: SHA256_ALGORITHM, hashedMessage: digest}
	})
}

function TimestampResponse(asn) {
	this.asn = asn
	this.status = asn.status.status

	// https://tools.ietf.org/html/rfc2510#section-3.1.1
	// Every message should contain a language tag, but they don't seem to.
	this.message = asn.status.statusString.join("; ")

	var type = asn.timeStampToken.contentType

	if (!deepEgal(type, SIGNED_DATA_OID)) throw new Error(
		`Token content type is not ${SIGNED_DATA_OID.join(".")}: ${type}`
	)
}

TimestampResponse.prototype.__defineGetter__("token", function() {
	return TimestampAsn.ContentInfo.encode(this.asn.timeStampToken)
})

TimestampResponse.prototype.toBuffer = function() {
	return TimestampResponseAsn.encode(this.asn)
}

function parse(der) {
	return new TimestampResponse(TimestampResponseAsn.decode(der))
}
