## 11.12.2018

* Update GET /api/users/:userId/topics endpoint to filter results by status

## 10.12.2018

* E-mail system changes to be able to localise e-mails with Crowdin - https://github.com/citizenos/citizenos-api/issues/41
* E-mails are sent synchronously so that if for example sign-up e-mail sending fails, the API returns error code - https://github.com/citizenos/citizenos-api/issues/41

## 06.12.2018

* Update /api/acitivities and /api/users/self/activities endpoints to support filter "VoteList", add filter option to /api/topics/:topicId/activities and /api/users/self/topics/:topicId/activities endpoint - https://github.com/citizenos/citizenos-api/issues/7

## 12.11.2018 

* Support configuration of logging with `CITIZENOS_LOGGING` environment variable.

## 05.11.2018

* DB peer authentication support. More info on the configuration - https://github.com/citizenos/citizenos-api/wiki/Configuration
* Fixed group invite link to redirect to /my/groups/:groupId