# E-mail templates and localization

We use Mustache templates.

The structure:

* `./*.mu` - Template files with specific emails contents.
* `layouts` - Common layout (headers, footers..) for emails. At the point of writing we had only 1 layout which all of the emails use.
* `languages` - Localization files.
* `images` - Images.
* `build` - Generated templates that are actually used when sending the emails.


## Development

Every time you modify templates, layouts or language files, you need to make a new build which will generate final localized templates.

In short:

* Modify `*.mu` or language files.
* Build by executing `grunt mustache_render`
