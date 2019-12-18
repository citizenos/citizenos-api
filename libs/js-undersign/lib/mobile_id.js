var _ = require("../lib/underscore")
var Certificate = require("./certificate")
var StandardError = require("standard-error")
var fetchDefaults = require("fetch-defaults")
var URL = "https://mid.sk.ee/mid-api/"
var DEMO_URL = "https://tsp.demo.sk.ee/mid-api/"
exports = module.exports = MobileId
exports.MobileIdError = MobileIdError
exports.confirmation = confirmation

function MobileId(url, opts) {
	if (typeof url != "string") { opts = url; url = null }

	this.user = opts.user
	this.password = opts.password
	this.fetch = fetchDefaults(this.fetch, url || URL)
}

MobileId.prototype.fetch = fetchDefaults(require("./fetch"), {
	timeout: 20 * 1000,
	headers: {"Accept": "application/json"}
})

MobileId.prototype.request = function(url, opts) {
	return this.fetch(url, "json" in opts ? _.defaults({
		json: _.assign({
			relyingPartyName: this.user,
			relyingPartyUUID: this.password
		}, opts.json)
	}, opts) : opts)
}

MobileId.prototype.readCertificate = function(number, id) {
	return this.request("certificate", {
		method: "POST",
		json:  {phoneNumber: number, nationalIdentityNumber: id}
	}).then(parse).then((obj) => (
		new Certificate(Buffer.from(obj.cert, "base64")
	)))
}

MobileId.prototype.sign = function(phoneNumber, idNumber, signable, opts) {
	// The signature endpoint seems to always return a session id. It's only when
	// requesting the session status do you get errors.
	return this.request("signature", {
		method: "POST",
		json:  _.assign({
			phoneNumber: phoneNumber,
			nationalIdentityNumber: idNumber,
			hash: signable.toString("base64"),
			hashType: "SHA256",
			language: "EST"
		}, opts)
	}).then((res) => res.body.sessionID)
}

MobileId.prototype.waitForSignature = function(sessionId, timeout) {
	if (timeout == null) timeout = 90
	var url = "signature/session/" + sessionId + "?timeoutMs=" + (timeout * 1000)
	var res = this.request(url, {timeout: (timeout + 5) * 1000})

	return res.then(parse).then((obj) => (
		obj.state == "COMPLETE" ? Buffer.from(obj.signature.value, "base64") : null
	))
}

exports.demo = new MobileId(DEMO_URL, {
	user: "DEMO",
	password: "00000000-0000-0000-0000-000000000000"
})

// https://github.com/SK-EID/MID#24-verification-code
// 6 bits from the beginning of the hash and 7 from the end, then concatenated.
function confirmation(signable) {
	return (
		((signable[0] & 0b11111100) << 5) +
		(signable[signable.length - 1] & 0b01111111)
	)
}

function parse(res) {
	if (res.body.result == "OK") return res.body
	throw new MobileIdError(res.body.result, {response: res})
}

// https://github.com/SK-EID/MID/wiki/Test-number-for-automated-testing-in-DEMO
var ERROR_MESSAGES = {
	// Certificate errors:
	// https://github.com/SK-EID/MID#317-possible-result-values
	NOT_FOUND: "Person is not a Mobile-Id user or id code doesn't match",
	NOT_ACTIVE: "Person hasn't activated their certificates",

	// Signing errors:
	// https://github.com/SK-EID/MID#338-session-end-result-codes
	TIMEOUT: "Person did not respond in time",
	NOT_MID_CLIENT: "Person is not a Mobile-Id client or id code doesn't match",
	USER_CANCELLED: "Person cancelled",
	SIGNATURE_HASH_MISMATCH: "Mobile-Id certificate differs from service provider's",
	PHONE_ABSENT: "Phone is unavailable",
	DELIVERY_ERROR: "Failed to send a message to the phone",
	SIM_ERROR: "SIM application error"
}

function MobileIdError(code, props) {
	this.code = code
	StandardError.call(this, ERROR_MESSAGES[code] || code, props)
	if (this.response) Object.defineProperty(this, "response", {enumerable: !!0})
}

MobileIdError.prototype = Object.create(StandardError.prototype, {
	constructor: {value: MobileIdError, configurable: true, writeable: true}
})
