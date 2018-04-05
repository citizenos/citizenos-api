# CitizenOS-API

CitizenOS API - https://api.citizenos.com

## Running locally

### Prerequisites

* [Understand the architecture of CitizenOS platform](docs/index.md)
* Software
    * Node.JS >= 6.13.1 (https://github.com/mklement0/n-install) 
    * PostgreSQL >= 9.5
    * Etherpad-Lite >=1.6.3 (https://github.com/citizenos/etherpad-lite/tree/html_export_fix) with minimum set of plugins:
        * https://github.com/citizenos/ep_auth_citizenos - CitizenOS authentication and authorization
        * https://github.com/citizenos/ep_webhooks - Sync pad updates between CitizenOS and Etherpad.
        * Live environment Etherpad plugin list (`package.json`) and sample configuration (`settings.json`) can be found https://github.com/citizenos/etherpad-lite-heroku.

### Installing

* Get the source - `git clone git@github.com:citizenos/citizenos-api.git`
* Go to the source directory - `cd citizenos-api`
* Install dependencies - `npm install`
* Add to dev.api.citizenos.com to your hosts file - `sudo -- sh -c -e "echo '127.0.0.1 dev.api.citizenos.com' >> /etc/hosts"`
* **FIXME:** Add DB creation structure creation instructions here! :shipit:

**NOTES:**

* When using over HTTPS you need to add `./config/certs/citizenosCARoot.pem` to your trusted CA certificate store or browsers will complain.

### Running

* Start the app - `npm start`
* By default API is available https://dev.citizenos.com:3003 or over plain HTTP http://dev.api.citizenos.com:3002.

## Contributing

### Pull requests

* All pull requests to `master` branch
* Live site runs on `prod` branch