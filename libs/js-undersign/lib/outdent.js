var slice = Function.call.bind(Array.prototype.slice)

module.exports = function tabout(strings) {
	var values = slice(arguments, 1)
	var string = strings.reduce(function(left, right, i) {
		return left + values[i - 1] + right
	})

	var indent
	string = string.replace(/^([ \t]+)/gm, function(_match, space) {
		if (indent == null) indent = new RegExp("^[ \t]{1," + space.length + "}")
		return space.replace(indent, "")
	})

	// NOTE: Replace only as single newline from the top and end to allow
	// explicit whitespace.
	string = string.replace(/^\n/, "")
	string = string.replace(/\n$/, "")
	return string
}
