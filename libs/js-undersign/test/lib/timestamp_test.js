var X509Asn = require("../../lib/x509_asn")
var Timestamp = require("../../lib/timestamp")
var TimestampResponse = Timestamp.TimestampResponse
var TimestampAsn = require("../../lib/timestamp_asn")
var TimestampRequestAsn = TimestampAsn.TimestampRequest
var TimestampResponseAsn = TimestampAsn.TimestampResponse
var wait = require("../../lib/promise").wait
var parseBody = require("../mitm").parseBody
var TIMESTAMP_URL = "http://example.com/tsa"
var DIGEST = Buffer.from("foobar")
var SIGNED_DATA_OID = TimestampAsn.SIGNED_DATA_OID

describe("Timestamp", function() {
	describe(".read", function() {
		require("../mitm")()

		it("must respond with timestamp", function*() {
			var timestamp = Timestamp.read(TIMESTAMP_URL, DIGEST)

			var req = yield wait(this.mitm, "request")
			req.headers.host.must.equal("example.com")
			req.headers["content-type"].must.equal("application/timestamp-query")
			req.headers.accept.must.equal("application/timestamp-reply")
			req.method.must.equal("POST")
			req.url.must.equal("/tsa")

			var asn = TimestampRequestAsn.decode(yield parseBody(req))
			asn.version.must.equal("v1")
			asn.messageImprint.hashAlgorithm.algorithm.must.eql(X509Asn.SHA256)
			asn.messageImprint.hashedMessage.must.eql(DIGEST)
			asn.certReq.must.be.true()

			var token = {
				contentType: SIGNED_DATA_OID,
				content: TimestampAsn.SignedData.encode(Buffer.from("xyz"))
			}

			respond({
				status: {status: "granted", statusString: ["Operation Okay"]},
				timeStampToken: token
			}, req)

			timestamp = yield timestamp
			timestamp.must.be.an.instanceof(TimestampResponse)
			timestamp.status.must.equal("granted")
			timestamp.token.must.eql(TimestampAsn.ContentInfo.encode(token))
		})
	})
})

function respond(timestamp, req) {
	var Fs = require("fs")
	req.res.setHeader("Content-Type", "application/timestamp-reply")
	Fs.writeFileSync("testts.res", TimestampResponseAsn.encode(timestamp))
	req.res.end(TimestampResponseAsn.encode(timestamp))
}
