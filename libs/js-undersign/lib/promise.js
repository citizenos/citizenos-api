exports.wait = function(obj, event) {
	return new Promise(obj.once.bind(obj, event))
}
