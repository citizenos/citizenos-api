var XadesXml = require("./lib/xades_xml")
var Crypto = require("./lib/crypto")
var Certificate = require("./lib/certificate")
var OcspResponse = require("./lib/ocsp").OcspResponse
var TimestampResponse = require("./lib/timestamp").TimestampResponse
// XML Security URLs: https://tools.ietf.org/html/rfc6931
var C14N_URL = "http://www.w3.org/2001/10/xml-exc-c14n#"
var SHA256_URL = "http://www.w3.org/2001/04/xmlenc#sha256"
var sha256 = Crypto.hash.bind(null, "sha256")
var concat = Array.prototype.concat.bind(Array.prototype)
module.exports = Xades

// https://www.w3.org/TR/xmldsig-core1/#sec-AlgID
var SIG_ALGORITHM_URLS = {
	rsa: "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256",
	ecdsa: "http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256",
	dsa: "http://www.w3.org/2009/xmldsig11#dsa-sha256"
}

// curl https://www.sk.ee/repository/bdoc-spec21.pdf | sha256sum |
// awk '{ printf("%s", $1) }' | xxd -r -p | base64
var BDOC_2_1_0_OID = "1.3.6.1.4.1.10015.1000.3.2.1"
var BDOC_2_1_0_SHA256 = "3Tl1oILSvOAWomdI9VeWV6IA/32eSXRUri9kPEz1IVs="
//var BDOC_2_1_2_OID = "1.3.6.1.4.1.10015.1000.3.2.3"

// Profile-wise BDOC v2.1.2 creates XAdES-LT signatures based on either
// XAdES-EPES or XAdES-BES. "LT" stands for "long-term". "T" for time, which
// can come from a time-mark (TM) or a time-stamp (TS). Time-mark is a method
// of getting a timestamp from the OCSP response. Time-stamp gets it from
// a dedicated server.
//
// The XAdES profiles are described in https://www.etsi.org/deliver/etsi_ts/103100_103199/103171/02.01.01_60/ts_103171v020101p.pdf.
function Xades(cert, files) {
	this.certificate = cert

	var signedProperties = {
		Id: "signed-properties",

		xades$SignedSignatureProperties: {
			// BDOC v2.1.2 says the time of the signature creation is the time of the
			// OCSP response. However it still requires a <xades:SigningTime>
			// element.
			//
			// TODO: Confirm whether this can include milliseconds or not.
			xades$SigningTime: {$: formatIsoDateTime(new Date)},

			xades$SigningCertificate: {
				xades$Cert: {
					xades$CertDigest: {
						ds$DigestMethod: {Algorithm: SHA256_URL},
						ds$DigestValue: {$: sha256(cert.toBuffer()).toString("base64")}
					},

					xades$IssuerSerial: {
						// https://www.w3.org/TR/xmldsig-core1/ refers to RFC 4514 and its
						// distinguished name encoding rules.
						ds$X509IssuerName: {$: cert.issuerRfc4514Name},
						ds$X509SerialNumber: {$: cert.serialNumber.toString()}
					}
				}
			},

			// Only used with BDOC and its time-mark variant.
			xades$SignaturePolicyIdentifier: {
				// The order of elements in <xades:SignaturePolicyIdentifier> is fixed
				// according to libdigidocpp's schemas.

				// There's also <xades:SignaturePolicyImplied>.
				xades$SignaturePolicyId: {
					xades$SigPolicyId: {
						xades$Identifier: {
							// Digidoc4j v3.3.0 fails if not given BDOC v2.1.0's OID. That
							// is, it doesn't support BDOC v2.1.2.
							Qualifier: "OIDAsURN",
							$: `urn:oid:${BDOC_2_1_0_OID}`
						}
					},

					// <xades:SigPolicyHash> is the hash of the <xades:SPURI> content,
					// although BDOC v2.1.2 says it's not to be really validated.
					xades$SigPolicyHash: {
						ds$DigestMethod: {Algorithm: SHA256_URL},
						ds$DigestValue: {$: BDOC_2_1_0_SHA256}
					},

					// TODO: Move specification somewhere under our control.
					xades$SigPolicyQualifiers: {
						xades$SigPolicyQualifier: {
							xades$SPURI: {$: "https://www.sk.ee/repository/bdoc-spec21.pdf"}
						}
					}
				}
			}
		},

		xades$SignedDataObjectProperties: {
			xades$DataObjectFormat: files.map((file, i) => ({
				ObjectReference: "#file-" + i,
				xades$MimeType: {$: String(file.type)}
			}))
		}
	}

	var canonicalizedSignedProps = XadesXml.canonicalize({
		asic$XAdESSignatures: {
			ds$Signature: {
				ds$Object: {
					xades$QualifyingProperties: {
						xades$SignedProperties: signedProperties
					}
				}
			}
		}
	}, [
		"asic$XAdESSignatures",
		"ds$Signature",
		"ds$Object",
		"xades$QualifyingProperties",
		"xades$SignedProperties"
	])


	var sigAlgorithmUrl = SIG_ALGORITHM_URLS[cert.publicKeyAlgorithmName]
	if (sigAlgorithmUrl == null) throw new RangeError(
		"Unsupported signature algorithm: " + cert.publicKeyAlgorithmName
	)

	var signedInfo = {
		// While BDOC v2.1.2 seems to hint the use of
		// http://www.w3.org/2006/12/xml-c14n11, libdigidocpp v3.14.1 supports
		// Exclusive XML Canonicalization just fine. So does Digidoc4j v3.3.0. As
		// the exclusive variant is a more robust canonicalization method for
		// extracted subtrees, sticking to that. Libdigidocpp's source code even
		// has comments and Digidoc4j has tests regarding explicit support for
		// exclusive canonicalization.  In the worst case we're just EIDAS and
		// XADES LT-TM compatible.
		ds$CanonicalizationMethod: {Algorithm: C14N_URL},
		ds$SignatureMethod: {Algorithm: sigAlgorithmUrl},

		ds$Reference: concat({
			Type: "http://uri.etsi.org/01903#SignedProperties",
			URI: "#signed-properties",
			ds$Transforms: {ds$Transform: {Algorithm: C14N_URL}},
			ds$DigestMethod: {Algorithm: SHA256_URL},
			ds$DigestValue: {$: sha256(canonicalizedSignedProps).toString("base64")}
		}, files.map((file, i) => ({
			// An id is required to match the DataObjectFormat to this
			// reference.
			Id: "file-" + i,
			URI: file.path,
			ds$DigestMethod: {Algorithm: SHA256_URL},
			ds$DigestValue: {$: file.hash.toString("base64")}
		})))
	}

	var canonicalizedSignedInfo = XadesXml.canonicalize({
		asic$XAdESSignatures: {
			ds$Signature: {
				ds$SignedInfo: signedInfo
			}
		}
	}, [
		"asic$XAdESSignatures",
		"ds$Signature",
		"ds$SignedInfo"
	])

	this.obj = {
		// https://www.w3.org/TR/XAdES/
		asic$XAdESSignatures: {
			ds$Signature: {
				Id: "signature",
				ds$SignedInfo: signedInfo,
				ds$SignatureValue: {},

				ds$KeyInfo: {
					ds$X509Data: {ds$X509Certificate: {$: cert.toString("base64")}}
				},

				ds$Object: {
					xades$QualifyingProperties: {
						Target: "#signature",

						xades$SignedProperties: signedProperties,

						xades$UnsignedProperties: {
							xades$UnsignedSignatureProperties: {
								// TODO: According to BDOC v2.1.2 Section 6, based on XAdES LT,
								// <xades:CertificateValues> needs to include the issuer chain
								// certificates and the OCSP response certificate if the latter
								// is not included in the OCSP response itself. That inclues
								// the time stamp's certificate if not included in the time
								// stamp itself.
								//
								// libdigidocpp v3.14.1 doesn't seem to make use of any
								// included certificates though.
								//
								// Digidoc4j v3.3.0 on the other hand throws "OCSP Responder
								// does not meet TM requirements" if the OCSP response
								// certificate is missing.  It doesn't seem to depend on the
								// issuer nor root CA certificate.
								//xades$CertificateValues: {
								//  xades$EncapsulatedX509Certificate: []
								//},

								// Optionally insert <xades:RevocationValues> here later.
								// Optionally insert <xades:SignatureTimeStamp> here later.
							}
						}
					}
				}
			}
		}
	}

	this.signable = sha256(canonicalizedSignedInfo)
}

Xades.prototype.obj = null
Xades.prototype.certificate = null

Xades.prototype.__defineGetter__("signature", function() {
	return Buffer.from(
		this.obj.asic$XAdESSignatures.ds$Signature.ds$SignatureValue.$,
		"base64"
	)
})

Xades.prototype.setSignature = function(signature) {
	var basedSig = signature.toString("base64")
	this.obj.asic$XAdESSignatures.ds$Signature.ds$SignatureValue.$ = basedSig
}

// The <ds:SignatureVale> element is hashed for time stamping as per XAdES
// v1.4.1 Specification.
Xades.prototype.__defineGetter__("signatureElement", function() {
	return XadesXml.canonicalize(this.obj, [
		"asic$XAdESSignatures",
		"ds$Signature",
		"ds$SignatureValue"
	])
})

// BDOC v2.1.0 required that the time stamp be queried before the OCSP response.
// http://open-eid.github.io/libdigidocpp/manual.html#signature-notes:
//
// «An exception is thrown if the OCSP confirmation's time is earlier than
// time-stamp's time. If the OCSP confirmation's time is later than
// time-stamp's time by more than 15 minutes then a warning is returned. If the
// difference is more than 24 hours then exception is thrown.»
//
// BDOC v2.1.2, however, removed that requirement as can be seen in the
// specification and from the CHANGELOG: https://www.id.ee/?id=36110.
//
// BDOC v2.1.2 says only OCSP resposnes with status "good" are allowed.
Xades.prototype.setOcspResponse = function(ocsp) {
	var obj = this.obj.asic$XAdESSignatures.ds$Signature.ds$Object
	var props = obj.xades$QualifyingProperties.xades$UnsignedProperties
	props = props.xades$UnsignedSignatureProperties

	props.xades$RevocationValues = {
		xades$OCSPValues: {
			xades$EncapsulatedOCSPValue: {$: serializeOcsp(ocsp).toString("base64")}
		}
	}
}

// http://open-eid.github.io/libdigidocpp/manual.html#signature-notes
// «In case of BDOC-TS signature, the time-stamping authority's (TSA's)
// certificate is not added to the <CertificateValues> element (differently
// from the requirements of BDOC specification, chap 6) to avoid duplication of
// the certificate in the signature. It is expected that the TSA certificate is
// present in the time-stamp token itself.»
Xades.prototype.setTimestamp = function(stamp) {
	var obj = this.obj.asic$XAdESSignatures.ds$Signature.ds$Object
	var props = obj.xades$QualifyingProperties.xades$UnsignedProperties
	props = props.xades$UnsignedSignatureProperties

	props.xades$SignatureTimeStamp = {
		xades$EncapsulatedTimeStamp: {
			$: serializeTimestamp(stamp).toString("base64")
		}
	}
}

Xades.prototype.toString = function() {
	return XadesXml.stringify(this.obj)
}

Xades.parse = function(xml) {
	var obj = XadesXml.parse(xml)

	var keyInfo = obj.asic$XAdESSignatures.ds$Signature.ds$KeyInfo
	var der = Buffer.from(keyInfo.ds$X509Data.ds$X509Certificate.$, "base64")
	var cert = new Certificate(der)

	// TODO: Compare signables after creating Xades.
	var xades = Object.create(Xades.prototype)
	xades.obj = obj
	xades.certificate = cert
	return xades
}

function serializeOcsp(ocsp) {
	if (ocsp instanceof OcspResponse) return ocsp.toBuffer()
	if (ocsp instanceof Buffer) return ocsp
	throw new TypeError("Invalid OCSP response type: " + ocsp)
}

function serializeTimestamp(stamp) {
	if (stamp instanceof TimestampResponse) return stamp.token
	if (stamp instanceof Buffer) return stamp
	throw new TypeError("Invalid time stamp type: " + stamp)
}

function formatIsoDateTime(time) {
	return time.toISOString().replace(/\.\d\d\dZ$/, "Z")
}
