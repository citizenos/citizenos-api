var Fs = require("fs")
var Neodoc = require("neodoc")
var Tsl = require("../lib/tsl")
var Ocsp = require("../lib/ocsp")
var Certificate = require("../lib/certificate")
var outdent = require("../lib/outdent")
var co = require("co")

var USAGE_TEXT = `
Usage: hades ocsp (-h | --help)
       hades ocsp [options] <certificate> [<issuer-certificate>]

Options:
    -h, --help           Display this help and exit.
    -f, --format=FMT     Format to print the OCSP response. [default: text]
    --url=URL            URL for OCSP server.
		--tsl=FILE           Use given Trust Service List.
		--nonce=NONCE        Use given hexadecimal nonce.

Formats:
    text                 Print human-readable information.
		der                  Print full server response in DER.
`.trimLeft()

module.exports = co.wrap(function*(argv) {
	var args = Neodoc.run(USAGE_TEXT, {argv: argv})
	if (args["--help"]) return void process.stdout.write(USAGE_TEXT)

	var certPath = args["<certificate>"]
	if (certPath == null) return void process.stdout.write(USAGE_TEXT)
	var cert = Certificate.parse(Fs.readFileSync(certPath))

	var tslPath = args["--tsl"]
	var issuerPath = args["<issuer-certificate>"]

	if (!(tslPath || issuerPath))
		throw new Error("Pass either --tsl or <issuer-certificate>")

	var tsl = tslPath && Tsl.parse(Fs.readFileSync(tslPath))
	var issuer = issuerPath && Certificate.parse(Fs.readFileSync(issuerPath))
	if (issuer == null) issuer = tsl.certificates.getIssuer(cert)

	if (issuer == null) throw new Error(
		"Can't find issuer: " + cert.issuerDistinguishedName.join(", ")
	)

	var ocsp = yield Ocsp.read(issuer, cert, {
		url: args["--url"],
		nonce: args["--nonce"] && Buffer.from(args["--nonce"], "hex")
	})

	var fmt = args["--format"]
	switch (fmt.toLowerCase()) {
		case "text":
			console.log(outdent`
				Response Status: ${ocsp.status}
				Response Type: ${ocsp.type}
			`)

			ocsp.certificates.forEach((status) => console.log(outdent`

					Certificate Serial: ${status.serial.toString(16)}
					Certificate Status: ${status.status}
					Certificate Responded At: ${status.at.toISOString()}
			`))
			break

		case "der":
			process.stdout.write(ocsp.toBuffer())
			break

		default: throw new RangeError("Unsupported format: " + fmt)
	}
})
