# CitizenOS-API

* CitizenOS API - https://api.citizenos.com
* Documentation - http://api.citizenos.com/documentation

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
    * PostgreSQL >= 9.5
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
    ```
    * Create the DB structure - `npm run createdb` - this test should pass, if it does not or it hangs, you should consult the `./logs/app.log`
      
### Configuration

We use https://github.com/lorenwest/node-config.

Configuration files are in `./config` directory.

Order of applying, further down the list overrides value from the sources above it:

* `default.json` - Global configuration that is same for all environments.
* `{process.env.NODE_ENV}.json` - Environment specific overrides.
* `local.json` - Your local configuration that you create your self. This file is for YOUR SPECIFIC overrides, the file is in .gitignore so you don't accidentally commit it.
* ENV - configuration values defined in environment variables. What can be overwritten there, can be read from `custom-environment-variables.json`

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


### Issues

#### FATAL ERROR: Committing semi space failed. Allocation failed - process out of memory

Node.JS runs out of memory. This can be solved by tuning the garbage collection (GC) of Node.JS runtime via V8 options.

* `--max-old-space-size` - Max size of the old generation (in Mbytes). By default it's 1.5GB. Set it to amount that is maximum that you want Node.JS process to allocate. Example: `node --max-old-space-size=250 ./bin/www`

Reading:

* All available V8 options - https://gist.github.com/sarupbanskota/a68e8148aa4cdc95e66a1b0e93df48ef

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