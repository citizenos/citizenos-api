var Neodoc = require("neodoc")
var Timestamp = require("../lib/timestamp")
var outdent = require("../lib/outdent")
var co = require("co")

var USAGE_TEXT = `
Usage: hades ts (-h | --help)
       hades ts [options] <digest>

Options:
    -h, --help           Display this help and exit.
    -f, --format=FMT     Format to print the response. [default: text]
    --url=URL            URL for time stamp server.

Formats:
    text                 Print human-readable information.
    der                  Print full server response in DER.
`.trimLeft()

module.exports = co.wrap(function*(argv) {
	var args = Neodoc.run(USAGE_TEXT, {argv: argv})
	if (args["--help"]) return void process.stdout.write(USAGE_TEXT)

	var digest = args["<digest>"]
	if (digest == null) return void process.stdout.write(USAGE_TEXT)
	digest = Buffer.from(digest, "hex")

	var url = args["--url"]
	if (url == null) throw new Error("Pass --url.")

	var stamp = yield Timestamp.read(url, digest)

	var fmt = args["--format"]
	switch (fmt.toLowerCase()) {
		case "text":
			console.log(outdent`
				Response Status: ${stamp.status}
				Response Status Message: ${stamp.message}
			`)
			break

		case "der":
			process.stdout.write(stamp.toBuffer())
			break

		default: throw new RangeError("Unsupported format: " + fmt)
	}
})
