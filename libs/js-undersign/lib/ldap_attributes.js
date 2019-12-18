var _ = require("./underscore")
var Asn = require("./asn")
var X509Asn = require("./x509_asn")
var LDAP_ATTRS = require("./ldap_attributes.json")
var DEFAULT = new LdapAttributes(LDAP_ATTRS)
exports = module.exports = LdapAttributes
exports.default = DEFAULT
exports.serializeUnknownKv = serializeUnknownKv

var directoryString = {
	encode: (v) => X509Asn.DirectoryString.encode({type: "utf8String", value: v}),
	decode: (value) => X509Asn.DirectoryString.decode(value).value
}

var SYNTAXES = {
	// https://tools.ietf.org/html/rfc4517#appendix-A
	"1.3.6.1.4.1.1466.115.121.1.11": Asn.PrintableString, // Country string.
	"1.3.6.1.4.1.1466.115.121.1.15": directoryString,
	"1.3.6.1.4.1.1466.115.121.1.26": Asn.Ia5String,
	"1.3.6.1.4.1.1466.115.121.1.44": Asn.PrintableString
}

function LdapAttributes(attrs) {
	attrs = _.mapValues(attrs, withOid)
	this.attrsByOid = attrs
	this.attrsByName = _.indexBy(attrs, "name")
}

LdapAttributes.prototype.get = function(nameOrOid) {
	if (Array.isArray(nameOrOid)) nameOrOid = nameOrOid.join(".")
	return this.attrsByName[nameOrOid] || this.attrsByOid[nameOrOid]
}

LdapAttributes.prototype.has = function(nameOrOid) {
	return this.get(nameOrOid) != null
}

LdapAttributes.prototype.parse = function(nameOrOid, value) {
	var attr = this.get(nameOrOid)
	if (attr == null) throw new RangeError("Unsupported attribute: " + nameOrOid)

	var decoder = SYNTAXES[attr.syntax]
	return decoder ? decoder.decode(value) : value
}

LdapAttributes.prototype.serialize = function(nameOrOid, value) {
	var attr = this.get(nameOrOid)
	if (attr == null) throw new RangeError("Unsupported attribute: " + nameOrOid)

	var encoder = SYNTAXES[attr.syntax]
	return encoder ? encoder.encode(value) : value
}

// String Representation of Distinguished Names is described in
// https://tools.ietf.org/html/rfc4514. The names of attribute types are in
// turn described in https://tools.ietf.org/html/rfc4519#section-2
//
// RFC 4519 itself gets some of the names from X.520 from the International
// Telecommunication Union, which paywalls the latest version. Ridiculous way
// to promote interoperability. While Estonia is a member state of the
// organization, good luck going through the bureacracy to ever get access.
// Fortunately the older 2016 version is available:
// https://www.itu.int/rec/T-REC-X.520-201910-P.
LdapAttributes.prototype.serializeKv = function(nameOrOid, value) {
	var attr = this.get(nameOrOid)
	if (attr == null) throw new RangeError("Unsupported attribute: " + nameOrOid)
	
	var encoder = SYNTAXES[attr.syntax]
	return encoder
		? `${attr.shortName || attr.name}=${escape(value)}`
		: serializeUnknownKv(attr.oid, value)
}

exports.has = DEFAULT.has.bind(DEFAULT)
exports.get = DEFAULT.get.bind(DEFAULT)
exports.parse = DEFAULT.parse.bind(DEFAULT)
exports.serialize = DEFAULT.serialize.bind(DEFAULT)
exports.serializeKv = DEFAULT.serializeKv.bind(DEFAULT)

function escape(name) {
	// https://tools.ietf.org/html/rfc4514#section-2.4
	name = name.replace(/^[ #]/, "\\$&")
	name = name.replace(/ $/, "\\$&")
	name = name.replace(/\0/g, "\\00")
	name = name.replace(/["+,;<>\\]/g, "\\$&")
	return name
}

function serializeUnknownKv(oid, value) {
	return `${oid.join(".")}=#${value.toString("hex")}`
}

function withOid(obj, oid) { return _.defaults({oid: parseOid(oid)}, obj) }
function parseOid(string) { return string.split(/\./g).map(Number) }
