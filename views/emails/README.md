# E-mail templates and localization

We use Mustache templates.

The structure:

* `./*.mu` - Source template files with specific emails contents.
* `layouts` - Common layout (headers, footers..) for emails. At the point of writing we had only 1 layout which all of the emails use.
* `images` - Images.
* `build` - Crowdin generated templates that are actually used when sending the emails.