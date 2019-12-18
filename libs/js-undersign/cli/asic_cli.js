var Fs = require("fs")
var Neodoc = require("neodoc")
var Asic = require("../lib/asic")
var Mime = require("mime")

var USAGE_TEXT = `
Usage: hades asic (-h | --help)
       hades asic [options] [<signature-file>|-] <file>...

Options:
    -h, --help           Display this help and exit.
    -o, --output=ZIP     Where to save the ASiC zip file. [default: -]
`.trimLeft()

module.exports = function(argv) {
	var args = Neodoc.run(USAGE_TEXT, {argv: argv})
	if (args["--help"]) return void process.stdout.write(USAGE_TEXT)

	var sigPath
	if (args["-"]) sigPath = "-"
	else if ("<signature-file>" in args) sigPath = args["<signature-file>"]
	if (sigPath == null) return void process.stdout.write(USAGE_TEXT)

	var sigStream = sigPath == "-" ? process.stdin : Fs.createReadStream(sigPath)

	var outPath = args["--output"]
	var outStream = outPath == "-"? process.stdout : Fs.createWriteStream(outPath)

	var asic = new Asic
	asic.pipe(outStream)
	asic.addSignature(sigStream)

	args["<file>"].forEach(function(path) {
		asic.add(path, Fs.createReadStream(path), Mime.lookup(path))
	})

	asic.end()
}
