# CitizenOS

## Architecture overview

![Components](imgs/schematics/components.svg)

Where:

* **citizenos-fe** - https://github.com/citizenos/citizenos-fe
* **citizenos-api** - https://github.com/citizenos/citizenos-api
* **etherpad-lite** - https://github.com/citizenos/etherpad-lite/tree/html_export_fix (a fork of https://github.com/ether/etherpad-lite until https://github.com/ether/etherpad-lite/pull/3268 is merged).
    * **NOTE:** In order to run **citizenos-api** following Etherpad (EP) plugins need to be installed and configured:
        * https://github.com/citizenos/ep_auth_citizenos - CitizenOS authentication and authorization
        * https://github.com/citizenos/ep_webhooks - Sync pad updates between CitizenOS and Etherpad.
    * Live environment Etherpad plugin list (`package.json`) and sample configuration (`settings.json`) can be found https://github.com/citizenos/etherpad-lite-heroku.
   