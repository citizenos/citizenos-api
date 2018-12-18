## 2018-12-18

* Fix issue where missing e-mail addresses would fail adding Topics to a Group. Regression from 2018-12-10.

## 2018-12-17

* Generate new and thus invalidate existing password reset code on successful reset - https://github.com/citizenos/citizenos-api/issues/68 

## 2018-12-13

* Update Mobiil-ID test numbers

## 2018-12-11

* Update GET /api/users/:userId/topics endpoint to filter results by status https://github.com/citizenos/citizenos-fe/issues/122

## 2018-12-10

* E-mail system changes to be able to localise e-mails with Crowdin - https://github.com/citizenos/citizenos-api/issues/41
* E-mails are sent synchronously so that if for example sign-up e-mail sending fails, the API returns error code - https://github.com/citizenos/citizenos-api/issues/41

## 2018-12-06

* Update /api/acitivities and /api/users/self/activities endpoints to support filter "VoteList", add filter option to /api/topics/:topicId/activities and /api/users/self/topics/:topicId/activities endpoint - https://github.com/citizenos/citizenos-api/issues/7

## 2018-11-12

* Support configuration of logging with `CITIZENOS_LOGGING` environment variable.

## 2018-11-05

* DB peer authentication support. More info on the configuration - https://github.com/citizenos/citizenos-api/wiki/Configuration
* Fixed group invite link to redirect to /my/groups/:groupId