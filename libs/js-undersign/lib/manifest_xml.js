var Hugml = require("hugml")

var hugml = new Hugml({
	"urn:oasis:names:tc:opendocument:xmlns:manifest:1.0": "m"
})

exports.parse = hugml.parse.bind(hugml)
exports.stringify = hugml.stringify.bind(hugml)
