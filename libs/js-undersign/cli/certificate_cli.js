var Fs = require("fs")
var Neodoc = require("neodoc")
var Certificate = require("../lib/certificate")
var outdent = require("../lib/outdent")
var slurp = require("../lib/stream").slurp
var sha1 = require("../lib/crypto").hash.bind(null, "sha1")
var co = require("co")

var USAGE_TEXT = `
Usage: hades certificate (-h | --help)
       hades certificate [options] [<certificate-file>|-]

Options:
    -h, --help           Display this help and exit.
`.trimLeft()

exports = module.exports = co.wrap(function*(argv) {
	var args = Neodoc.run(USAGE_TEXT, {argv: argv})
	if (args["--help"]) return void process.stdout.write(USAGE_TEXT)

	var certPath
	if (args["-"]) certPath = "-"
	else if ("<certificate-file>" in args) certPath = args["<certificate-file>"]
	if (certPath == null) return void process.stdout.write(USAGE_TEXT)

	var stream = certPath == "-" ? process.stdin : Fs.createReadStream(certPath)
	var cert = Certificate.parse(yield slurp("utf8", stream))
	console.log(stringify(cert))
})

exports.stringify = stringify

function stringify(certificate) {
	return outdent`
		Subject Name: ${certificate.subjectDistinguishedName.join(", ")}
		Subject SHA1: ${sha1(certificate.subject).toString("hex")}
		Serial Number: ${certificate.serialNumber.toString()}
		Serial Number (Hex): ${certificate.serialNumber.toString(16)}
		Public Key Algorithm: ${(
			certificate.publicKeyAlgorithmName ||
			certificate.publicKeyAlgorithm
		).toUpperCase()}
		OCSP URL: ${certificate.ocspUrl || "none"}

		Issuer Name: ${certificate.issuerDistinguishedName.join(", ")}
		Issuer Signature Algorithm: ${(
			certificate.issuerSignatureAlgorithmName ||
			certificate.issuerSignatureAlgorithm
		).toUpperCase()}
	`
}
