# CitizenOS-API

CitizenOS API - https://api.citizenos.com

**TOC:**

<!-- toc -->

- [Running locally](#running-locally)
  * [Prerequisites](#prerequisites)
  * [Installing](#installing)
  * [Running](#running)
  * [Testing](#testing)
  * [Debugging](#debugging)
- [Contributing](#contributing)
  * [Pull requests](#pull-requests)
- [Improvement ideas](#improvement-ideas)

<!-- tocstop -->

## Running locally

### Prerequisites

* [Understand the architecture of CitizenOS platform](docs/index.md)
* Software
    * Node.JS >= 6.13.1 (https://github.com/mklement0/n-install) 
    * PostgreSQL >= 9.5 with PostGIS >= 2.4
    * Etherpad-Lite - https://github.com/citizenos/etherpad-lite-heroku. See the README.md and use the `config/local.json.example` as a basis to get the right plugin configuration.

### Installing

* Get the source - `git clone git@github.com:citizenos/citizenos-api.git`
* Go to the source directory - `cd citizenos-api`
* Install dependencies - `npm install`
* Add to dev.api.citizenos.com to your hosts file - `sudo -- sh -c -e "echo '127.0.0.1 dev.api.citizenos.com' >> /etc/hosts"`
* Create the DB:
    * **NOTE:** Do not use this in production, you may want different privileges! 
    ```
    sudo su -c "createdb citizenos" postgres
    sudo su -c "psql -c \"CREATE USER citizenos WITH PASSWORD 'citizenos'\"" postgres
    sudo su -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE citizenos TO citizenos\"" postgres
    sudo su -c "psql citizenos -c \"CREATE EXTENSION postgis;\"" postgres
    ```
    * Create the DB structure - `npm run createdb` - this test should pass, if it does not or it hangs, you should consult the `./logs/app.log`
      
### Running

* Start the app - `npm start`
* By default API is available https://dev.citizenos.com:3003 or over plain HTTP http://dev.api.citizenos.com:3002.

**NOTES:**

* When using over HTTPS you need to add `./config/certs/citizenosCARoot.pem` to your trusted CA certificate store or browsers will complain.

### Testing

* You need an instance of `citizenos-api` and `etherpad-lite` running before you execute tests.
* `npm test`

### Debugging

* By default logs are in `./logs/app.log`

## Contributing

### Pull requests

* All pull requests to `master` branch
* Live site runs on `prod` branch

## Improvement ideas

* Support different authentication and signing methods so that anyone could add their country specifics. That takes us to modular architecture where ideally I would like to add new methods by installing a module and configuring it.
* Generic file storage - don't force the use of AWS as a storage. As a starting point local file storage would be nice for "off the grid" deployments.
* Implement generic "if this, then that" engine where anyone can plug into Topic state changes with their own custom logic. Right now for example Rahvaalgatus.ee has a flow where a signed document is sent to Parliament via e-mail, but this is very region/partner specific.  
* Email layout designing should be much simpler. Right now there is hard-coded CitizenOS layout and special layout for Rahvaalgatus.ee. We may consider using MailChimp or other services so that there is a separate service where mails are designed and sent and for which each Partner pays themselves.
* ...