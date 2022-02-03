## 2022-01-31

* `GET /api/topics/:topicId/invites/users/:inviteId` & `GET /api/users/:userId/topics/:topicId/invites/users/:inviteId` to return status code 20002 when invited User has not been registered - https://github.com/citizenos/citizenos-fe/issues/773
* `GET /api/groups/:groupId/invites/users/:inviteId` & `GET /api/users/:userId/groups/:groupId/invites/users/:inviteId` to return status code 20002 when invited User has not been registered - https://github.com/citizenos/citizenos-fe/issues/773

## 2021-12-14

* Add a new Comment type - poi (Point of Information) - https://github.com/citizenos/citizenos-fe/issues/329
* `GET /api/users/:userId/topics/:topicId/comments` & `GET /api/topics/:topicId/comments` to return Comments with POI type - https://github.com/citizenos/citizenos-fe/issues/329

## 2021-12-13

* Create new API endpoint for user searching `GET /api/users/:userId/search/users` - https://github.com/citizenos/citizenos-api/issues/222
* Remove users from general search results

## 2021-12-09

* Add TokenRevocation table to database, add token revocation logic to logout - https://github.com/citizenos/citizenos-api/issues/220

## 2021-11-11 - v. 5.0.4

* Add `PUT /api/topics/:topicId/invites/users/:inviteId`, `PUT /api/users/:userId/topics/:topicId/invites/users/:inviteId` - to update invited users permissions
* Update topic members groups, users and invites enpoints to support ordering - https://github.com/citizenos/citizenos-fe/issues/239

## 2021-11-11 - v. 5.0.3

* Update Topic and Group member and invite list API-s to return User contact info for Topic/Group admins and systems global Moderators - https://github.com/citizenos/citizenos-fe/issues/670

## 2021-11-04 - v. 5.0.2

* Update Groups permission check method to not have any "Promise was rejected with non error" warnings
* Update `GET /api/users/:userId/groups/:groupId/invites/users` - returns invites for current user if he/she hasn't accepted yet - https://github.com/citizenos/citizenos-fe/issues/360
* Update `GET /api/users/:userId/topics/:topicId/invites/users` - returns invites for current user if he/she hasn't accepted yet - https://github.com/citizenos/citizenos-fe/issues/360

## 2021-10-28 - v. 5.0.1

* Update `POST /api/users/:userId/groups` to return Group join token info - https://github.com/citizenos/citizenos-fe/issues/325
* Update `GET /activites` - do not return `context` property - https://github.com/citizenos/citizenos-fe/issues/325
* Add API `PUT /api/users/:userId/groups/:groupId/join` - generation of join links with specific access level - https://github.com/citizenos/citizenos-fe/issues/325
* Add API `PUT /api/users/:userId/groups/:groupId/join/:token` - assign access level for given join token - https://github.com/citizenos/citizenos-fe/issues/325

## 2021-10-08 - v. 4.0.1

* Rename `GET /api/v2/search` as `GET /api/search`
* `GET /api/search` only returns users with preferences JSON containing `showInSearch: true`
* Update `POST /api/auth/signup` AND `PUT /api/users/:userId` - Add preferences option https://github.com/citizenos/citizenos-fe/issues/310
* Update `GET /api/auth/status` - add prefgerences field

## 2021-10-08 - v. 4.0.0

* Add API `PUT /api/users/:userId/topics/:topicId/join` - generation of join links with specific access level - https://github.com/citizenos/citizenos-fe/issues/311
* Add API `PUT /api/users/:userId/topics/:topicId/join/:token` - assign access level for given join token - https://github.com/citizenos/citizenos-fe/issues/311
* Remove API `PUT /api/users/:userId/topics/:topicId/tokenJoin` - use the new API-s above - https://github.com/citizenos/citizenos-fe/issues/311

## 2021-09-28 - v. 3.0.1

* Add duplicate topic endpoint /api/users/:userId/topics/:topicId/duplicate - https://github.com/citizenos/citizenos-fe/issues/416

## 2021-06-01 - v. 3.0.0

* Remove Topic and Group auto-accept user endpoints
    * Remove API POST /api/users/:userId/groups/:groupId/members/users is now replaced with  POST /groups/groupId:/invites
    * Remove API POST /api/users/:userId/topics/:topicId/members/users is now replaced with  POST /topics/topicId:/invites
    * Removed all related test
* All tests updated to async await structure

## 2021-06-01 - v. 2.2.1

* API /logout not to try unset Etherpad cookies as it does not work cross domains - https://github.com/citizenos/citizenos-fe/issues/676

## 2021-05-11

* Rename model GroupMember to GroupMemberUser - https://github.com/citizenos/citizenos-api/issues/198
* Pump version to 2.2.0.

## 2020-09-29

* Update inviting users to topic behaviour - https://github.com/citizenos/citizenos-fe/issues/254

## 2020-09-28

* Hide moderated topics behind filter - https://github.com/citizenos/citizenos-fe/issues/464

## 2020-09-23

* FIX 'See who liked your argument' feature not working - https://github.com/citizenos/citizenos-fe/issues/572

## 2020-09-22

* Update dependencies and related code


## 2020-09-15

* FIX Activity feed shows incorrect activity - title update - https://github.com/citizenos/citizenos-fe/issues/508

## 2020-09-14

* Update many tests to Promises

## 2020-09-10

* Drop DigiDocService for ID-card - https://github.com/citizenos/citizenos-api/issues/157

## 2020-08-19

* FIX Reorder topic report e-mail layout - https://github.com/citizenos/citizenos-api/issues/140
* Fix comments api query

## 2020-08-17

* Update API add GET `/api/users/:userId/topics/:topicId/comments/:commentId/votes` endpoint - https://github.com/citizenos/citizenos-fe/issues/470
## 2020-08-10

* FIX API crashes when attachment name contains non ASCII character - https://github.com/citizenos/citizenos-api/issues/173

## 2020-07-22

* Fix user bdoc creating
* Update lodash, smart-id and mobiil-id dependencies



## 2020-06-27

* Update sending emails to not fail other transactions if e-mail fails to send
* Add email template language fallback
* Group tests to Promises
* Some Topics tests to Promises

## 2020-05-27

* Remove .csv file from final.bdoc container

## 2020-05-13

* Redirect users to topic from invite links after initial access - https://github.com/citizenos/citizenos-fe/issues/469
* Update Invite tests to Promises

## 2020-04-22

* Add topicId, userId, groupId extra properties to activities if needed

## 2020-04-22

* Update activity feed to include topicId for CommentVote

## 2020-04-06

* Email layout is wonky on mobile - https://github.com/citizenos/citizenos-api/issues/159
* Email footer is served in English, instead of 13 languages.- https://github.com/citizenos/citizenos-api/issues/160

## 2020-03-30

* Fix vote counting bug for multiple-choice votes with delegation -  https://github.com/citizenos/citizenos-fe/issues/443 https://github.com/citizenos/citizenos-fe/issues/413

## 2020-02-20

* Update "UserConnection" "connectionUserId" values to have PNO prefix Where "connectionId" esteid or smartid
* Allow users to sign votes under multiple accounts if that account does not have different connection with esteid or smartid
* Add lastActivity field to public topics list /api/topics https://github.com/citizenos/citizenos-fe/issues/231

## 2020-02-14

* Optimize (speed up) activity feed - https://github.com/citizenos/citizenos-api/issues/161
* Fixed some tests that were randomly failing

## 2020-01-29

* Move away from digidoc service - https://github.com/citizenos/citizenos-api/issues/144
* Add Smart-ID vote signing - https://github.com/citizenos/citizenos-api/issues/134
* Add extra validation to Mobiil-ID and Smart-ID signing - https://github.com/citizenos/citizenos-api/issues/40

## 2019-12-18

* Allow longer vote options. New limit is 200 characters - https://github.com/citizenos/citizenos-fe/issues/105

## 2019-11-19

* FEATURE: Topic User invite flow API - `/api/users/:userId/topics/:topicId/invites` - https://github.com/citizenos/citizenos-fe/issues/112
* FEATURE: `CitizenOS-Deprecated` response header sent for deprecated API calls. It is important for API clients to log warnings when receiving such response header - https://github.com/citizenos/citizenos-fe/issues/112
* DEPRECATED: `POST /api/users/:userId/topics/:topicId/members/users`, use new invite API (`POST /api/users/:userId/topics/:topicId/invites` ) and other invite API-s instead - https://github.com/citizenos/citizenos-fe/issues/112
* DEVELOPMENT: `deprecated` middleware to send `CitizenOS-Deprecated` response header for deprecated API calls - https://github.com/citizenos/citizenos-fe/issues/112

## 2019-09-24
* Dropped support for legacy restricted use token validation - https://github.com/citizenos/citizenos-api/issues/70

## 2019-08-02

* Log user ip-s into activities table (Law enforcement) - https://github.com/citizenos/citizenos-api/issues/133

## 2019-07-19

* Lodash security update to version 4.17.13

## 2019-06-27

* Add linkPrivacyPolicy property to Partners table
* Add new API endpoint GET /api/partners/:partnerId

## 2019-06-06

* Update base64-url version update dssClient tests

## 2019-06-04

* Quick fix for app crashing when `DATABASE_OPTIONS_POOL_MAX` env variable is set - https://github.com/citizenos/citizenos-api/issues/137

## 2019-06-03

* BREAKING CHANGE: Started using **async/await**, so Node.JS >=7.6.0 is required. Default Node.JS version upgraded to 10.13.0.
* FEATURE: Added Topic Report API - https://github.com/citizenos/citizenos-api/issues/5
* DEVELOPMENT: `asyncMiddleware` added so that `async/await` can be used in Express routes.
* Upgraded to Sequelize 5.x.

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
