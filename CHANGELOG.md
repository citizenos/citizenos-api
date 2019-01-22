## 2019-01-22

* Parliament e-mails - configuration `config.features.sendToParliament.sendContainerDownloadLinkToCreator` to choose if BDOC link is sent to Topic creator or not in Parliament e-mails.
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