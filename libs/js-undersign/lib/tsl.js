var TslXml = require("./tsl_xml")
var Certificate = require("./certificate")
var Certificates = require("./certificates")
var flatten = Function.apply.bind(Array.prototype.concat, Array.prototype)
var lazy = require("lazy-object").defineLazyProperty
exports = module.exports = Tsl

function Tsl(xml) {
	this.xml = xml
	this.obj = TslXml.parse(xml)
}

lazy(Tsl.prototype, "certificates", function() {
	var providers = this.obj.TrustServiceStatusList.TrustServiceProviderList
	providers = providers && wrap(providers.TrustServiceProvider) || []

	var pems = flatten(providers.map(function(provider) {
		return flatten(wrap(provider.TSPServices.TSPService).map(function(service) {
			var identity = service.ServiceInformation.ServiceDigitalIdentity
			var pems = wrap(identity.DigitalId).map((el) => el.X509Certificate)
			return pems.filter(Boolean).map((el) => el.$)
		}))
	}))

	return new Certificates(
		pems.map((pem) => new Certificate(Buffer.from(pem, "base64")))
	)
})

Tsl.prototype.toString = function(fmt) {
	switch (fmt) {
		case undefined:
		case "xml": return this.xml
		default: throw new RangeError("Unsupported format: " + fmt)
	}
}

exports.parse = function(xml) { return new Tsl(xml) }

function wrap(value) { return Array.isArray(value) ? value : [value] }
