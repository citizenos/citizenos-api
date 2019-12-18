var _ = require("../lib/underscore")
var Fs = require("fs")
var Neodoc = require("neodoc")
var Certificate = require("../lib/certificate")
var Tsl = require("../lib/tsl")
var co = require("co")
var outdent = require("../lib/outdent")

var USAGE_TEXT = `
Usage: hades tsl (-h | --help)
       hades tsl [options] <tsl-file> [<territory>]

Options:
    -h, --help           Display this help and exit.
    -f, --format=FMT     Format to print the OCSP response. [default: text]

Formats:
    text                 Print human-readable information.
`.trimLeft()

module.exports = co.wrap(function(argv) {
	var args = Neodoc.run(USAGE_TEXT, {argv: argv})
	if (args["--help"]) return void process.stdout.write(USAGE_TEXT)

	var tslPath = args["<tsl-file>"]
	if (tslPath == null) return void process.stdout.write(USAGE_TEXT)

	var tsl = Tsl.parse(Fs.readFileSync(tslPath))

	var fmt = args["--format"]
	switch (fmt.toLowerCase()) {
		case "text": printTslText(tsl, {territory: args["<territory>"]}); break
		default: throw new RangeError("Unsupported format: " + fmt)
	}
})

function printTslText(tsl, opts) {
	var info = tsl.obj.TrustServiceStatusList.SchemeInformation

	console.log(outdent`
		Location: ${info.DistributionPoints.URI.$}
		Version: ${info.TSLVersionIdentifier.$}.${info.TSLSequenceNumber.$}
		Issued At: ${info.ListIssueDateTime.$}
		Next Issue At: ${info.NextUpdate.dateTime.$}
		Operator: ${english(info.SchemeOperatorName.Name).$}
	`)

	var links = wrap(info.SchemeOperatorAddress.ElectronicAddress.URI)	
	var web = links.find((uri) => uri.$.match(/^https?:/))
	var email = links.find((uri) => uri.$.match(/^mailto:/))
	if (web) console.log(`Operator Web: ${web.$}`)
	if (email) console.log(`Operator Email: ${email.$.replace(/^mailto:/, "")}`)

	var pointers = wrap(info.PointersToOtherTSL.OtherTSLPointer || [])

	if (pointers.length > 0) console.log(outdent`\n\n
		Territory TSLs
		--------------
	`)

	console.log(pointers.map(function(el) {
		var info = el.AdditionalInformation.OtherInformation.reduce(_.merge, {})
		var territory = info.SchemeTerritory.$

		if (
			opts.territory && territory.toLowerCase() != opts.territory.toLowerCase()
		) return null

		return outdent`
			Territory: ${territory}
			Location: ${el.TSLLocation.$}
			Operator: ${english(info.SchemeOperatorName.Name).$}
		`
	}).filter(Boolean).join("\n\n"))

	var providers = tsl.obj.TrustServiceStatusList.TrustServiceProviderList
	providers = providers && wrap(providers.TrustServiceProvider) || []

	if (providers.length > 0) console.log(outdent`\n\n
		Providers
		---------
	`)

	providers.forEach(function(el, i) {
		if (i > 0) console.log("\n")

		var name = el.TSPInformation.TSPName.Name.$
		var links = wrap(el.TSPInformation.TSPAddress.ElectronicAddress.URI)	
		var web = links.find((uri) => uri.$.match(/^https?:/))
		var email = links.find((uri) => uri.$.match(/^mailto:/))

		console.log(`Name: ${name}`)
		if (web) console.log(`Web: ${web.$}`)
		if (email) console.log(`Email: ${email.$.replace(/^mailto:/, "")}`)

		var services = wrap(el.TSPServices.TSPService)
		if (services.length > 0) console.log("\nServices:")

		services.forEach(function(service, i) {
			if (i > 0) console.log()

			var type = service.ServiceInformation.ServiceTypeIdentifier.$
			var name = service.ServiceInformation.ServiceName.Name.$
			var startedAt = service.ServiceInformation.StatusStartingTime.$

			console.log(indent(outdent`
				Name: ${name}
				Type: ${type}
				Started At: ${startedAt}
			`))

			var identity = service.ServiceInformation.ServiceDigitalIdentity
			var pems = wrap(identity.DigitalId).map((el) => el.X509Certificate)
			pems = pems.filter(Boolean).map((el) => el.$)
			var certs = pems.map((pem) => new Certificate(Buffer.from(pem, "base64")))

			certs.forEach((cert) => console.log(indent(outdent`
				Certificate Name: ${cert.subjectDistinguishedName.join(", ")}
			`)))

			certs.forEach((cert) =>
				console.log(require("util").inspect(cert.asn.tbsCertificate.subject, {depth: null})))
		})
	})
}

function english(obj) {
	return wrap(obj).find((el) => el["xml:lang"] == "en")
}

function wrap(value) { return Array.isArray(value) ? value : [value] }
function indent(text) { return text.replace(/^/gm, "\t") }
