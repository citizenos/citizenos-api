var fetch = require("fetch-off")
fetch = require("fetch-jsonify")(fetch)

fetch = require("fetch-parse")(fetch, {
	json: true,
	"application/ocsp-response": parseBuffer,
	"application/timestamp-reply": parseBuffer
})

fetch = require("fetch-throw")(fetch)
module.exports = fetch

function parseBuffer(res) { return res.arrayBuffer().then(Buffer.from) }
