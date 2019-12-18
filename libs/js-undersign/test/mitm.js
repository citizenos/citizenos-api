var Mitm = require("mitm")
var Router = require("express").Router
var parseBody = require("body-parser").raw({type: "*/*"})
var parseJson = require("body-parser").json()

exports = module.exports = function() {
	beforeEach(exports.listen)
	afterEach(exports.close)
}

exports.listen = function() {
	this.mitm = Mitm()

	this.mitm.length = 0
  this.mitm.on("request", function(req) { this[this.length++] = req })

	// Using setImmediate for intercept checks failed when using Express Router.
	this.mitm.on("request", setTimeout.bind(null, checkIntercept, 0))
}

exports.router = function() {
	this.router = Router().use(parseJson)
	this.mitm.on("request", route.bind(null, this.router))
}

exports.close = function() {
	this.mitm.disable()
}

exports.parseBody = function(req) {
	return new Promise(function(resolve, reject) {
		parseBody(req, req.res, (err) => err ? reject(err) : resolve(req.body))
	})
}

exports.parseJson = function(req) {
	return new Promise(function(resolve, reject) {
		parseJson(req, req.res, (err) => err ? reject(err) : resolve(req.body))
	})
}

function route(router, req, res) {
	router(req, res, function(err) {
		if (err == null) return
		res.statusCode = 502
		res.end()
		console.error(err)
	})
}

function checkIntercept(req, res) {
	if (res.headersSent) return
	res.statusCode = 504
	res.statusMessage = "Not Intercepted: " + req.method + " " + req.url
	res.end()
}
