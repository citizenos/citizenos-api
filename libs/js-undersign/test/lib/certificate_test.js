var _ = require("../../lib/underscore")
var Asn = require("../../lib/asn")
var X509Asn = require("../../lib/x509_asn")
var Certificate = require("../../lib/certificate")
var LdapAttributes = require("../../lib/ldap_attributes")
var demand = require("must")
var OCSP_URL_OID = require("../../lib/x509_asn").OCSP_URL
var EMPTY_ARR = Array.prototype
var EMPTY_BUFFER = new Buffer(0)

describe("Certificate", function() {
	describe(".prototype.serialNumber", function() {
		it("must return the serial number", function() {
			var cert = new Certificate(newCertificate({serialNumber: 42}))
			cert.serialNumber.toNumber().must.eql(42)
		})
	})

	describe(".subjectRfc4514Name", function() {
		it("must serialize name with multiple relative parts", function() {
			var cert = new Certificate(newCertificate({
				subject: [
					{countryName: "EE"},
					{organizationName: "AS Foo"},
					{organizationalUnitName: "Bars", localityName: "Tallinn"}
				]
			}))

			cert.subjectRfc4514Name.must.equal("C=EE,O=AS Foo,OU=Bars+L=Tallinn")
		})

		_.each({
			userId: "UID",
			domainComponent: "DC",
			commonName: "CN",
			countryName: "C",
			localityName: "L",
			stateOrProvinceName: "ST",
			streetAddress: "STREET",
			organizationName: "O",
			organizationalUnitName: "OU",
		}, function(shortName, name) {
			it(`must serialize ${name} as string`, function() {
				var cert = new Certificate(newCertificate({
					subject: [{[name]: "foo"}]
				}))

				cert.subjectRfc4514Name.must.equal(`${shortName}=foo`)
			})
		})

		it("must serialize givenName as DirectoryString in hex", function() {
			var cert = new Certificate(newCertificate({
				subject: [{givenName: "John Smith"}]
			}))

			var oid = LdapAttributes.get("givenName").oid

			var value = Asn.DirectoryString.encode({
				type: "utf8String",
				value: "John Smith"
			})

			var dn = `${oid.join(".")}=#${value.toString("hex")}`
			cert.subjectRfc4514Name.must.equal(dn)
		})

		it("must serialize emailAddress as Ia5String in hex", function() {
			var cert = new Certificate(newCertificate({
				subject: [{emailAddress: "user@example.com"}]
			}))

			var oid = LdapAttributes.get("emailAddress").oid
			var value = Asn.Ia5String.encode("user@example.com")
			var dn = `${oid.join(".")}=#${value.toString("hex")}`
			cert.subjectRfc4514Name.must.equal(dn)
		})
	})

	describe(".prototype.ocspUrl", function() {
		it("must return null if no OCSP URL extension", function() {
			var cert = new Certificate(newCertificate())
			demand(cert.ocspUrl).be.null()
		})

		it("must return OCSP URL", function() {
			var cert = new Certificate(newCertificate({
				extensions: [{
					extnID: "authorityInformationAccess",
					extnValue: [{
						accessMethod: OCSP_URL_OID,
						accessLocation: {
							type: "uniformResourceIdentifier",
							value: "http://example.com/ocsp"
						}
					}]
				}]
			}))

			cert.ocspUrl.must.equal("http://example.com/ocsp")
		})
	})
})

function newCertificate(opts) {
	var extensions = opts && opts.extensions
	var subject = opts && opts.subject && serializeSubject(opts.subject)

	return X509Asn.Certificate.encode({
		tbsCertificate: {
			serialNumber: opts && opts.serialNumber || 1337,
			signature: {algorithm: X509Asn.RSA_SHA256, parameters: EMPTY_BUFFER},
			subject: {type: "rdnSequence", value: subject || EMPTY_ARR},
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

function serializeSubject(relativeNames) {
	return relativeNames.map((names) => _.map(names, (value, name) => ({
		type: LdapAttributes.get(name).oid,
		value: LdapAttributes.serialize(name, value)
	})))
}
