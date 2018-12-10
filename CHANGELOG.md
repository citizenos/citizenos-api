## 10.12.2018

* E-mail system changes to be able to localise e-mails with Crowdin.
* E-mails are sent synchronously so that if for example sign-up e-mail sending fails, the API returns error code.

## 12.11.2018 

* Support configuration of logging with `CITIZENOS_LOGGING` environment variable.

## 05.11.2018

* DB peer authentication support. More info on the configuration - https://github.com/citizenos/citizenos-api/wiki/Configuration
* Fixed group invite link to redirect to /my/groups/:groupId