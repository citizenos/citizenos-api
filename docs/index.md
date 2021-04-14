# CitizenOS

## Architecture overview

![Components](imgs/schematics/components.svg)

Where:

* **citizenos-fe** - https://github.com/citizenos/citizenos-fe
* **citizenos-api** - https://github.com/citizenos/citizenos-api
* **etherpad-lite** - https://github.com/ether/etherpad-lite
    * **NOTE:** In order to run **citizenos-api** following Etherpad (EP) plugins need to be installed and configured:
        * https://github.com/citizenos/ep_auth_citizenos - CitizenOS authentication and authorization
        * https://github.com/citizenos/ep_webhooks - Sync pad updates between CitizenOS and Etherpad.
    * It's easiest to install both to Heroku and own server with https://github.com/citizenos/etherpad-lite-heroku.
    
    
## Running the whole CitizenOS in your own environment

To install whole CitizenOS the main components are to be installed separately by following install guides of each.

Installion order:

* **Etherpad-Lite** - Use https://github.com/ether/etherpad-lite or https://github.com/citizenos/etherpad-lite-heroku. Later used by Citizen OS and is tested to work with our setup.
    * **NOTE!** In order for Citizen OS API & FE to cooperate with Etherpad it needs a certain set of plugins and configuration. See the example configuration - https://github.com/citizenos/etherpad-lite-heroku/blob/master/config/local.json.example_citizenos
* **citizenos-api** - https://github.com/citizenos/citizenos-api
* **citizenos-fe** - https://github.com/citizenos/citizenos-fe
