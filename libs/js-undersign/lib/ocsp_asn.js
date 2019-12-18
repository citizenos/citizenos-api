var Asn = require("asn1.js")
var OcspAsn = require("asn1.js-rfc2560")
exports = module.exports = Object.create(OcspAsn)

exports.OCSP_RESPONSE_TYPE = [1, 3, 6, 1, 5, 5, 7, 48, 1, 4]

var ResponseType = Asn.define("ResponseType", function() {
	this.objid({"1 3 6 1 5 5 7 48 1 1": "id-pkix-ocsp-basic"})
})

var ResponseTypes = Asn.define("ResponseTypes", function() {
	this.seqof(ResponseType)
})

exports.ResponseType = ResponseType
exports.ResponseTypes = ResponseTypes
