## FIXME

* BREAKING CHANGE: Started using **async/await**, so Node.JS >=7.6.0 is required.
* FEATURE: Added Topic Report API - https://github.com/citizenos/citizenos-api/issues/5
* Default Node.JS version upgraded to 10.13.0.

## 2019-04-29

* E-mail verification (`GET /api/auth/verify/:code`) not to automatically log in User after e-mail verification - https://github.com/citizenos/citizenos-api/issues/122

## 2019-04-19

* Add `/api/interal/report` endpoint to log csp-reports

## 2019-04-10

* Fix Etherpad sync endpoint, remove rev number to put less stress on etherpad. 
* Fix partner topic read test
* Update morgan

## 2019-02-22

* Fix `GET /api/users/:userId/topics/:topicId/members/users` not returning all member users https://github.com/citizenos/citizenos-api/issues/117

## 2019-02-19

* Updated old `/api/topics/:topicId/comments` and `/api/users/:userId/topics/:topicId/comments` and depreacted `/api/v2/topics/:topicId/comments` and `/api/v2/users/:userId/topics/:topicId/comments`
* Added offset and limit options to `/api/topics/:topicId/comments` and `/api/users/:userId/topics/:topicId/comments` endpoints and return data includes ```count: {pro: 1, con: 2, total: 3}```
* Updated tests

## 2019-01-31

* Fixed title character counting and changed title character limit from 100 to 1000 in db using migration
* Title length configurable but not over 1000 characters as in db https://github.com/citizenos/citizenos-api/issues/2

## 2019-01-30

* Optimize activity feed queries to get better speed and memory usage https://github.com/citizenos/citizenos-api/issues/28

## 2019-01-29

* Set attachments limit from config https://github.com/citizenos/citizenos-fe/issues/181

## 2019-01-22

* Parliament e-mails - configuration `config.features.sendToParliament.sendContainerDownloadLinkToCreator` to choose if BDOC link is sent to Topic creator or not in Parliament e-mails. 
* Update `db/config/database.sql` to be up to date. Was supposed to be updated with changes on 2018-12-18.
* Make users verify e-mail address if they update it in their profile https://github.com/citizenos/citizenos-api/issues/54

## 2019-01-16

* Update email layout so partner emails could be modified from config. Related to https://github.com/citizenos/citizenos-api/issues/26 and https://github.com/citizenos/citizenos-api/issues/6. 
```
{
    "email":{
        "styles":{
            "headerBackgroundColor":"#252525",
            "logoWidth":237,
            "logoHeight":43
        },
        "partnerStyles":{
            "partner1.com":{
                "headerBackgroundColor":"#004892",
                "logoWidth":360,
                "logoHeight":51
            },
            "partner2.eu":{
                "headerBackgroundColor":"#004892",
                "logoWidth":300,
                "logoHeight":91
            }
        }
    }
}
```

## 2019-01-14

* Unify restricted use token generation and validation - https://github.com/citizenos/citizenos-api/issues/70

## 2019-01-11

* Swap out passport-google-oauth2 to official passport-google-oauth20. Changed configuration and updated result parsing https://github.com/citizenos/citizenos-api/issues/72

## 2019-01-09

* Update topic argument reply, vote, report endpoints to return 404 when performing actions on deleted arguments/replies

## 2019-01-04

* Add endpoints to read attachment json or download uploaded attachment file with proper filename by adding query parameter `?download=true`
    `GET /api/users/:userId/topics/:topicId/attachments/:attachmentId`
    `GET /api/topics/:topicId/attachments/:attachmentId`

## 2018-12-18

* Fix issue where missing e-mail addresses would fail adding Topics to a Group. Regression from 2018-12-10.
* Add possibility to set topics as pinned, new table is added. New API enpoints:
    `POST /api/users/:userId/topics/:topicId/pin` - to pin a topic
    `DELETE /api/users/:userId/topics/:topicId/pin` - to remove pin from topic
    All authorized endpoints, returning topics data, will also have pinned boolean value
* Update GET /api/users/:userId/topics endpoint to filter results by pinned https://github.com/citizenos/citizenos-fe/issues/122
* Update GET /api/v2/search endpoint to support topic filtering by status and pinned

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
