var O = require("oolong")

exports.each = O.each
exports.assign = O.assign
exports.defaults = O.defaults
exports.mapValues = O.map
exports.filterValues = O.filter
exports.merge = O.merge
exports.defineGetter = O.defineGetter
exports.compose = require("lodash.flowright")
exports.indexBy = require("lodash.indexby")

exports.map = function(obj, fn) {
	if (typeof obj.length == "number") return obj.map(fn)

	var array = []
	for (var key in obj) array.push(fn(obj[key], key))
	return array
}

exports.fromEntries = function(array) {
	return array.reduce((obj, kv) => (obj[kv[0]] = kv[1], obj), {})
}

exports.pick = function(obj, keys) {
	return O.pick.apply(null, [obj].concat(keys))
}
