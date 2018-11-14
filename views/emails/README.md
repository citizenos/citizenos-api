# E-mail templates and localization

We use Mustache templates.

The structure:

* `./*.html` - Mu HTML template files with specific emails contents.
* `./source.json` - Non-layout related translations. That is e-mail subjects and reusable variables.
* `layouts` - Common layout (headers, footers..) for emails. At the point of writing we had only 1 layout which all of the emails use.
* `languages` - Localization files.
* `images` - Images.
* `build` - Crowdin generated templates that are actually used when sending the emails.


## Development

* Modify Mu templates `*.html` or language files.
* Translate in Crowdin - https://crowdin.com/translate/citizen-os-api