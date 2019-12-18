var _ = require("../lib/underscore")
var Neodoc = require("neodoc")
var MobileId = require("../lib/mobile_id")
var MobileIdError = require("../lib/mobile_id").MobileIdError
var co = require("co")
var stringifyCertificate = require("./certificate_cli").stringify

var USAGE_TEXT = `
Usage: hades mobile-id-certificate (-h | --help)
       hades mobile-id-certificate [options] <phone-number> <id-number>

Options:
    -h, --help             Display this help and exit.
    -f, --format=FMT       Format to print the certificate in. [default: text]
		--mobile-id-user=NAME  Username (relying party name) for Mobile Id.
		--mobile-id-password=UUID  Password (relying party UUID) for Mobile Id.

Formats:
    text                  Print human-readable information.
		pem                   Print the certificate only in PEM.
`.trimLeft()

module.exports = _.compose(errorify, co.wrap(function*(argv) {
	var args = Neodoc.run(USAGE_TEXT, {argv: argv})
	if (args["--help"]) return void process.stdout.write(USAGE_TEXT)

	var phoneNumber = args["<phone-number>"]
	var idNumber = args["<id-number>"]
	if (phoneNumber == null) return void process.stdout.write(USAGE_TEXT)

	var mobileId = args["--mobile-id-user"] ? new MobileId({
		user: args["--mobile-id-user"],
		password:  args["--mobile-id-password"]
	}) : MobileId.demo

	var cert = yield mobileId.readCertificate(phoneNumber, idNumber)

	var fmt = args["--format"]
	switch (fmt.toLowerCase()) {
		case "text": console.log(stringifyCertificate(cert)); break
		case "pem": console.log(cert.toString("pem")); break
		default: throw new RangeError("Unsupported format: " + fmt)
	}
}))

function errorify(res) {
	return res.catch(function(err) {
		if (err instanceof MobileIdError) {
			process.exitCode = 3
			console.error("Mobile-Id Error: " + err.message)
		}
		else throw err
	})
}
