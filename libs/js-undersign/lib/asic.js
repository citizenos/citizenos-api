var Zip = require("yazl").ZipFile
var ReadableStream = require("stream").Readable
var ManifestXml = require("./manifest_xml")
var Xades = require("../xades")
var concat = Array.prototype.concat.bind(Array.prototype)
var MIMETYPE_BUFFER = Buffer.from("application/vnd.etsi.asic-e+zip")
module.exports = Asic

function Asic() {
	this.zip = new Zip

	// As per the ASiC specification v1.1.1
	// (https://www.etsi.org/deliver/etsi_en/319100_319199/31916201/01.01.01_60/en_31916201v010101p.pdf), mimetype needs to be both first and uncompressed.
	this.zip.addBuffer(MIMETYPE_BUFFER, "mimetype", {compress: false})

	this.signatures = 0
	this.files = []
}

Asic.prototype.type = "application/vnd.etsi.asic-e+zip"

Asic.prototype.add = function(path, data, type) {
	add(this.zip, path, data)
	this.files.push({path: path, type: type})
}

Asic.prototype.addSignature = function(signature) {
	if (signature instanceof Xades) signature = signature.toString()
	add(this.zip, `META-INF/signatures-${++this.signatures}.xml`, signature)
}

Asic.prototype.toStream = function() { return this.zip.outputStream }

Asic.prototype.pipe = function(to, opts) {
	return this.toStream().pipe(to, opts)
}

Asic.prototype.unpipe = function(to) { return this.toStream().unpipe(to) }

Asic.prototype.end = function() {
	this.zip.addBuffer(serializeManifest(this.files), "META-INF/manifest.xml")
	this.zip.end()
}

function serializeManifest(files) {
	return ManifestXml.stringify({
		"m$manifest": {
			"m$file-entry": concat({
				"m$media-type": "application/vnd.etsi.asic-e+zip",
				"m$full-path": "/"
			}, files.map((file) => ({
				"m$media-type": String(file.type),
				"m$full-path": file.path
			})))
		}
	})
}

function add(zip, path, data) {
	if (typeof data == "string") data = Buffer.from(data)
	if (data instanceof Buffer) zip.addBuffer(data, path)
	else if (data instanceof ReadableStream) zip.addReadStream(data, path)
	else throw new TypeError("Unsupported Asic data: " + data)
}
