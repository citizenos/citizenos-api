var Asn = require("asn1.js")
var X509Asn = require("./x509_asn")
exports = module.exports = Object.create(Asn)

var PrintableString = Asn.define("PrintableString", function() {
	this.printstr()
})

var Ia5String = Asn.define("Ia5String", function() {
	this.ia5str()
})

exports.PrintableString = PrintableString
exports.Ia5String = Ia5String
exports.DirectoryString = X509Asn.DirectoryString
