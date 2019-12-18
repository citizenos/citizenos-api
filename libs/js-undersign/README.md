Undersign.js
============
[![NPM version][npm-badge]](https://www.npmjs.com/package/undersign)

Undersign.js is a **command line utility** and **JavaScript library** for creating **eIDAS** compatible **XAdES digital signatures** and **ASiC-E containers** with the accompanying **[OCSP](https://en.wikipedia.org/wiki/Online_Certificate_Status_Protocol) responses** ([RFC 2560][rfc2560]) and **timestamps** ([RFC 3161][rfc3161]). It's got built-in support for the Estonian Id-card, Mobile-Id services and their related [BDOC specification](https://www.sk.ee/repository/bdoc-spec21.pdf), but is otherwise useful for generic XAdES signatures. It uses the [Euroopean Trust List](https://webgate.ec.europa.eu/tl-browser) XML format as the source for certificate authorities.

Note that currently Undersign.js is in a **beta** and **request for comments** phase. Please give it a try and report back on its correctness and API design.

[npm-badge]: https://img.shields.io/npm/v/undersign.svg
[rfc2560]: https://tools.ietf.org/html/rfc2560
[rfc3161]: https://tools.ietf.org/html/rfc3161


Installing
----------
```sh
npm install undersign
```

Undersign.js follows [semantic versioning](http://semver.org), so feel free to depend on its major version with something like `>= 1.0.0 < 2` (a.k.a `^1.0.0`).

As said above, please note that Undersign.js is currently in a **request for comments** phase. Expect API breakage between minor versions until v1.

### Installing the Command Line Utility
Undersign.js comes with a command line utility named `hades`. NPM usually installs executables automatically either to the local path `./node_modules/.bin/hades` or, if you installed Undersign.js globally with `npm install --global undersign`, to `/usr/local/bin/hades`.

While the API of the library shall follow semantic versioning religiously, the command line utility is mostly for debugging and interactive use. As such, it's commands and options may change even between minor versions (from v1.3 to v1.4, for example). Still, [CHANGELOG](./CHANGELOG.md) will cover those changes, too. If you're intending to automate the use of Undersign.js, I suggest doing so via the library interface.


Using the Library
-----------------
Creating digital signatures is a multi-step process. Undersign.js comes with a coordinator named "Hades" that stores some of the configuration and has functions for easier use. It's also the main export of Undersign.js:

```javascript
var Hades = require("undersign")
```

Create a new instance of `Hades` with a trust service list you've acquired separately and a timemark or a timestamp service URL. For more information on trust lists, see the section below on [Trust Lists](#trust-lists). For timemark and timestamp service URLs, see [below](#timemark-and-timestamp-services).

```javascript
var Fs = require("fs")
var Tsl = require("undersign/lib/tsl")

var hades = new Hades({
  tsl: Tsl.parse(Fs.readFileSync("./tsl/ee.xml")),
  timemarkUrl: "…",
  timestampUrl: "…"
})
```

To start the signing process, create a new `Xades` document with the certificate of the signer and files to be signed. We'll talk how to get the certificate later.

```javascript
var Xades = require("undersign/xades")
var Crypto = require("crypto")
var Certificate = require("undersign/lib/certificate")
var certificate = Certificate.parse(Fs.readFileSync("./mary.pem"))
var document = Fs.readFileSync("./document.txt")

var xades = hades.new(certificate, [{
  path: "document.txt",
  type: "text/plain",
  hash: Crypto.createHash("sha256").update(document).digest()
}])

xades instanceof Xades // => true
```

Note that instead of the file contents, you're really giving only file paths, their MIME types and SHA256 hashes to `Xades`. This way you can precompute the hash if you're signing the same file over and over. The MIME type is part of the signature, so if you're later going to create an ASiC-E container (.asice or .bdoc file), use the same MIME type there. The reason a MIME type is signed seems to be legal, to be explicit that you're signing one interpretation of a stream of bytes as opposed to another. I probably never comes up in practice, but theoretically the same bytes could be two file formats with different presentations at the same time.

Once you've got a `Xades` document, you can get the SHA256 hash to be signed via `xades.signable`. It'll be a `Buffer` object on Node.js. We'll talk about how to sign that hash in more detail later, but for now, image you'll be passing that to the Id-card somehow and get back a signature. Then, give that signature back to the `Xades` document.

```javascript
xades.setSignature(signThroughMagic(xades.signable))
```

Almost done. For the signature to have legal value in Europe, you'll also need to **check the signer's certificate validity** and **timestamp the signature**. There are two methods to do so — regular timestamping or timemarking.

#### Timestamping
For a regular timestamp, you've got two operations ahead of you — a certificate validity request ([OCSP](https://en.wikipedia.org/wiki/Online_Certificate_Status_Protocol)) and a timestamp request.

`Hades.prototype.ocsp` will do the certificate validity request for you. As OCSP needs access to the certificate's issuer certificate, `Hades` will try to get the from the trust list you configured before. If it fails to do so, you'll see an error.

```javascript
xades.setOcspResponse(hades.ocsp(certificate))
```

The OCSP server is taken from the certificate itself as these servers generally are publicly available. That's certainly the case with the Estonian citizen certificates. If you insist on using another OCSP server, such as a proxy, you can pass that to `Hades` via `ocspUrl`:

```javascript
var hades = new Hades({ocspUrl: "…"})
```

While the OCSP server is available in the certificate, the timestamping server needs explicit configuration via `timestampUrl` before you can use `Hades.prototype.timestamp`:

```javascript
var hades = new Hades({timestampUrl: "…"})
var xades = …
xades.setTimestamp(await hades.timestamp(xades))
```

Legally, any timestamp server that returns responses signed by a certificate that's in the European Trust List will suffice. The Estonian government [provides a free timestamping proxy for **personal use**](https://www.id.ee/index.php?id=39021) at <http://dd-at.ria.ee/tsa> with a limit of 2000 timestamps per month per IP address. [SK ID Solutions AS](https://www.sk.ee) sells a [timestamping service](https://www.skidsolutions.eu/teenused/ajatempliteenus/) for approximately €0.036 per request as of Nov 27, 2019. You may find cheaper options elsewhere in Europe by browsing the [European Trust List](https://webgate.ec.europa.eu/tl-browser).

Worth a mention that the order of the two operations — OCSP request and timestamp — is not specified in the XAdES specification. If you meet software that asserts one needs to be before the other, let the author know they're deviating from the specification.


#### Timemarking
Timemarking utilizes the certificate validity ([OCSP][https://en.wikipedia.org/wiki/Online_Certificate_Status_Protocol]) request to also get a timestamp for the signature. However, **the OCSP server and its service provider you're using needs to support this explicitly**. It's not evident technically which OCSP servers do and which don't, as the process piggybacks on the regular _nonce_ feature of the OCSP request and is more a legal feature than a technical one. It relies on the OCSP server provider being able to provide timestamping proof later when asked.

The Estonian [SK ID Solutions AS](https://www.sk.ee) provides such a timemark-compatible OCSP server at <http://ocsp.sk.ee> for at worst [€0.1 per request](https://www.skidsolutions.eu/teenused/hinnakiri/kehtivuskinnituse-teenus).

To utilize that, set the `timemarkUrl` when creating an instance of `Hades`:

```javascript
var hades = new Hades({
  tsl: Tsl.parse(Fs.readFileSync("./tsl/ee.xml")),
  timemarkUrl: "http://ocsp.sk.ee"
})
```

Then, instead of a regular OCSP request, use `Hades.prototype.timemark` to get both a OCSP response and timemark in one call:

```javascript
xades.setOcspResponse(await hades.timemark(xades))
```

#### Container ASiC-E Generation

```javascript
var asic = new Asic
asic.addSignature(signature.xades)
asic.add(`initiative.${extension}`, text.text, text.type)
res.setHeader("Content-Type", asic.type)
asic.pipe(res)
asic.end()
```

### Timemark and Timestamp Services

### Trust Lists
The eIDAS digital signature infrastructure depends on [trust lists](https://ec.europa.eu/digital-single-market/en/eu-trusted-lists-trust-service-providers), which are XML documents describing which certificate authorities (CAs) are authorized to hand out certificates to citizens and later confirm their signatures with timestamps.

Undersign.js doesn't at the moment download the European or national trust lists automatically. To sign documents with Undersign.js, you'll need to get those lists yourself and possibly verify them with external tools. 


- [European Trust List](https://ec.europa.eu/information_society/policy/esignature/trusted-list/tl-mp.xml)
- [Estonian Trust List](https://sr.riik.ee/tsl/estonian-tsl.xml)

You can use the `hades` command line tool with `hades tsl <tsl-file>` to peek into the trust list.


### Mobile-Id Test Accounts
To test Mobile-Id signing, use one of the Mobile-Id test phone numbers:

Phone        | Personal id | Name
-------------|-------------|-----
+37200000766 | 60001019906 | Estonian Mary
+37200000566 | 60001018800 | Estonian Mary (New certificate format)
+37060000007 | 51001091072 | Lithuanian Seventh

For more info and test numbers, see the [SK ID Solutions wiki][mobile-id-test].

[mobile-id-test]: https://github.com/SK-EID/MID/wiki/Test-number-for-automated-testing-in-DEMO


Using the Command Line
----------------------
Undersign.js comes with an command line executable for interactive use, such as testing or signing a few documents of your own. Refer to the [Installing](#installing) section on where to find the `hades` executable.

If you run `hades` with the `--help` option, you'll see a list of available commands:

```
Usage: hades [options] [<command> [<args>...]]

Options:
    -h, --help             Display this help and exit.
    -V, --version          Display version and exit.

Commands:
    asic                   Create an ASiC-E file.
    certificate            Print information on certificate.
    ocsp                   Check certificate validity via OCSP.
    ts                     Query the timestamp server.
    tsl                    Get the European Trust Service List.
    mobile-id-certificate  Get the certificate associated with a phone number.
    mobile-id-sign         Sign a file with Mobile-Id.

For more help or to give feedback, please contact andri@dot.ee.
```

You can run each of the commands in turn with `--help` to see more detailed options:

```
$ hades mobile-id-sign --help
```

I'll add more elaborate documentation in the future, but for now, here are a few use cases:


License
-------
Undersign.js is released under a *Lesser GNU Affero General Public License*, which in summary means:

- You **can** use this program for **no cost**.
- You **can** use this program for **both personal and commercial reasons**.
- You **do not have to share your own program's code** which uses this program.
- You **have to share modifications** (e.g. bug-fixes) you've made to this program.

For more convoluted language, see the `LICENSE` file.


About
-----
**[Andri Möll][moll]** typed this and the code.  
**[SA Eesti Koostöö Kogu][kogu]** sponsored the majority of engineering work in the context of [Rahvaalgatus][rahvaalgatus], a public initiatives site.

If you find Undersign.js needs improving, please don't hesitate to type to me now at [andri@dot.ee][email] or [create an issue online][issues].

[email]: mailto:andri@dot.ee
[issues]: https://github.com/moll/js-undersign/issues
[moll]: https://m811.com
[kogu]: https://www.kogu.ee
[rahvaalgatus]: https://rahvaalgatus.ee
