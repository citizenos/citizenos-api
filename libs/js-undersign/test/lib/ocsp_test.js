var _ = require("../../lib/underscore")
var X509 = require("../../lib/x509_asn")
var Ocsp = require("../../lib/ocsp")
var OcspAsn = require("../../lib/ocsp_asn")
var Certificate = require("../../lib/certificate")
var OcspResponse = Ocsp.OcspResponse
var OcspError = Ocsp.OcspError
var newCertificate = require("../fixtures").newCertificate
var wait = require("../../lib/promise").wait
var parseBody = require("../mitm").parseBody
var sha1 = require("../../lib/crypto").hash.bind(null, "sha1")
var SHA1_OID = require("../../lib/x509_asn").SHA1
var OCSP_URL = "http://example.com/ocsp"
var EMPTY_BUFFER = new Buffer(0)

describe("Ocsp", function() {
	describe(".read", function() {
		require("../mitm")()

		it("must get certificate status", function*() {
			var issuer = new Certificate(newCertificate())
			var cert = new Certificate(newCertificate({ocspUrl: OCSP_URL}))
			var ocsp = Ocsp.read(issuer, cert)

			var req = yield wait(this.mitm, "request")
			req.headers.host.must.equal("example.com")
			req.headers["content-type"].must.equal("application/ocsp-request")
			req.headers.accept.must.equal("application/ocsp-response")
			req.method.must.equal("POST")
			req.url.must.equal("/ocsp")

			var asn = OcspAsn.OCSPRequest.decode(yield parseBody(req))
			asn.tbsRequest.version.must.equal("v1")
			var reqAsn = asn.tbsRequest.requestList[0]
			reqAsn.reqCert.hashAlgorithm.algorithm.must.eql(SHA1_OID)
			reqAsn.reqCert.serialNumber.must.eql(cert.serialNumber)
			reqAsn.reqCert.issuerNameHash.must.eql(sha1(issuer.issuer))
			reqAsn.reqCert.issuerKeyHash.must.eql(sha1(issuer.publicKey))

			var extensions = asn.tbsRequest.requestExtensions
			extensions[0].extnID.must.eql(OcspAsn.OCSP_RESPONSE_TYPE)
			extensions[0].critical.must.be.false()
			var types = OcspAsn.ResponseTypes.encode(["id-pkix-ocsp-basic"])
			extensions[0].extnValue.must.eql(types)

			respond({
				responseStatus: "successful",

				responseBytes: {
					responseType: "id-pkix-ocsp-basic",

					response: OcspAsn.BasicOCSPResponse.encode({
						tbsResponseData: {
							responderID: {
								type: "byName",
								value: {type: "rdnSequence", value: []}
							},

							producedAt: new Date,

							responses: [{
								certId: {
									hashAlgorithm: {algorithm: SHA1_OID},
									serialNumber: cert.serialNumber,
									issuerNameHash: sha1(cert.issuer),
									issuerKeyHash: sha1(issuer.publicKey)
								},

								certStatus: {type: "good", value: null},
								thisUpdate: new Date(2015, 5, 18, 13, 37, 42),
								singleExtensions: []
							}]
						},

						signatureAlgorithm: {
							algorithm: X509.RSA_SHA256,
							parameters: EMPTY_BUFFER
						},

						signature: {unused: 0, data: EMPTY_BUFFER}
					})
				}
			}, req)

			ocsp = yield ocsp
			ocsp.must.be.an.instanceof(OcspResponse)
			ocsp.status.must.equal("successful")
			ocsp.type.must.equal("id-pkix-ocsp-basic")
			ocsp.certificates.length.must.equal(1)
			ocsp.certificates[0].at.must.eql(new Date(2015, 5, 18, 13, 37, 42))
			ocsp.certificates[0].serial.must.eql(cert.serialNumber)
			ocsp.certificates[0].status.must.equal("good")
		})

		_.each({
			malformed_request: "malformedRequest",
			internal_error: "internalError",
			try_later: "tryLater",
			sig_required: "sigRequired",
			unauthorized: "unauthorized"
		}, function(code, status) {
			it(`must reject with OcspError given ${code} status`, function*() {
				var issuer = new Certificate(newCertificate())
				var cert = new Certificate(newCertificate({ocspUrl: OCSP_URL}))
				var ocsp = Ocsp.read(issuer, cert)

				var req = yield wait(this.mitm, "request")
				respond({responseStatus: status}, req)

				var err
				try { yield ocsp } catch (ex) { err = ex }
				err.must.be.an.error(OcspError)
				err.code.must.equal(code)
			})
		})
	})
})

function respond(ocsp, req) {
	req.res.setHeader("Content-Type", "application/ocsp-response")
	req.res.end(OcspAsn.OCSPResponse.encode(ocsp))
}
