var Asn = require("asn1.js")
var X509Asn = require("./x509_asn")
exports.SIGNED_DATA_OID = [1, 2, 840, 113549, 1, 7, 2]

// https://tools.ietf.org/html/rfc3161
var PkiStatus = Asn.define("PkiStatus", function() {
  this.int({
    0: "granted",
    1: "grantedWithMods",
    2: "rejection",
    3: "waiting",
    4: "revocationWarning",
    5: "revocationNotification"
  })
})

var PkiFreeText = Asn.define("PkiFreeText", function() {
	this.utf8str()
})

var PkiStatusInfo = Asn.define("PkiStatusInfo", function() {
	this.seq().obj(
		this.key("status").use(PkiStatus),
		this.key("statusString").optional().seqof(PkiFreeText),
		this.key("failInfo").optional().bitstr()
	)
})

// The declaration of SignedData is incomplete as only used in tests for now.
var SignedData = Asn.define("SignedData", function() {
	this.octstr()
})

// ContentInfo with its SignedData is defined in
// https://tools.ietf.org/html/rfc2630.
var ContentInfo = Asn.define("PkiStatusInfo", function() {
	this.seq().obj(
		this.key("contentType").objid(),
		this.key("content").explicit(0).any()
	)
})

var TimestampResponse = Asn.define("TimestampResponse", function() {
  this.seq().obj(
		// Camel-cased "timeStamp" comes from RFC 3161.
    this.key("status").use(PkiStatusInfo),
		this.key("timeStampToken").optional().use(ContentInfo)
	)
})

var MessageImprint = Asn.define("DigestInfo", function() {
	this.seq().obj(
    this.key("hashAlgorithm").use(X509Asn.AlgorithmIdentifier),
    this.key("hashedMessage").octstr()
	)
})

var TimestampRequest = Asn.define("TimestampRequest", function() {
  this.seq().obj(
		// Camel-cased "timeStamp" comes from RFC 3161.
    this.key("version").int({1: "v1"}),
    this.key("messageImprint").use(MessageImprint),
		this.key("reqPolicy").optional().objid(),
		this.key("nonce").optional().int(),
    this.key("certReq").bool().def(false)
	)
})

exports.TimestampRequest = TimestampRequest
exports.TimestampResponse = TimestampResponse
exports.ContentInfo = ContentInfo
exports.SignedData = SignedData
