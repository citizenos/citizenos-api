# E-mail templates and localization

We use Mustache templates.

The structure:

* `./*.mu.html` - Mu HTML template files with specific emails contents.
* `layouts` - Common layout (headers, footers..) for emails. At the point of writing we had only 1 layout which all of the emails use.
* `languages` - Localization files.
* `images` - Images.
* `build` - Crowdin generated templates that are actually used when sending the emails.


## Development

* Modify `*.mu.html` or language files.
* Translate in Crowdin - https://crowdin.com/translate/citizen-os-api