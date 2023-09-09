# Changelog

## 1.2.1 - Unreleased

- Fix scrolling issues (double scrollbar and scrolling down on load) that occur in Trilium v0.60+.
- Fix the `$dateCreated` and `$dateModified` properties displaying an empty value in Trilium v0.61+.
  - For Trilium v0.61.0 to v0.61.5, `$dateCreated` is not available and `$dateModified` will display the modification date of the note's content and not the note itself.
  - If you are using the v0.61 beta, upgrade to at least v0.61.6 for these dates to work as intended.
- Fix the `header` attribute setting displaying the attribute name instead of an empty header cell when set to an empty value (`#attribute=name,header=`).

## 1.2.0 - 2023-01-22

- Add support for using properties of a note.
  - Wherever an attribute name can be specified, there are now some special names (prefixed with `$`) which refer to a note's properties instead of its user-defined attributes.
  - `$id` and `$noteId` are the note's ID.
  - `$type` is the note type (for example, `text`).
  - `$mime` is the note's content type (for example, `text/html`).
  - `$title` is the note's title.
  - `$contentSize` is the size of the note's content in bytes.
  - `$dateCreated` is the note's creation date and time in UTC and RFC 3339 format (`YYYY-MM-DD hh:mm:ss.sssZ`).
  - `$dateModified` is the note's modification date and time in UTC and RFC 3339 format.
- Add support for using attributes of notes targeted by a note's relations, similar to that supported by [Trilium's search engine](https://github.com/zadam/trilium/wiki/Search#advanced-use-cases).
  - Wherever an attribute name can be specified, a "path" can now be specified instead.
  - A path consists of one or more names separated by a period (`.`). The last name in the path must be an attribute name or a property name. All other names in the path must be relation names.
  - For example:
    - `name` would find attributes named `name` defined on a note.
    - `employee.name` would find attributes named `name` defined on all notes targeted by the `employee` relation defined on a note.
    - `company.employee.name` would find attributes named `name` defined on all notes targeted by the `employee` relation defined on all notes targeted by the `company` relation defined on a note.
- Add tokens to `#query` for substituting the Render Note's ID and attributes into the search query.
  - `$id` and `$noteId` will be replaced with the Render Note's ID.
  - `$renderNote.name` will be replaced with the value of the first attribute found for the Render Note (or an empty string if not found). `name` can be the name of an attribute, a property, or a related note's attribute.
- `#attribute` now supports properties (`#attribute="$dateModified"`) and attributes of related notes (`#attribute=relation.label`).
- `#groupBy` now supports properties (`#groupBy="$type"`) and attributes of related notes (`#groupBy=relation.label`).
- `#sort` now supports properties (`#sort="$dateModified"`) and attributes of related notes (`#sort=relation.label`).
- `progressBar` now supports properties (`#attribute="count,progressBar=$contentSize"`) and attributes of related notes (`#attribute="count,progressBar=relation.total"`).
- Add a `separator` attribute setting for controlling how multiple values for a single attribute are separated:
  - `separator=newline` inserts a newline between values, resulting in one value per line.
  - `separator=comma` inserts a comma and space between values.
  - `separator=space` inserts a space between values.
  - Any other value will be inserted as is between values, allowing for custom separators.
- The default separator is now `separator=comma`, except `separator=space` is used for `badge` and `boolean` attributes.
  - Before, the default was `separator=newline`, except `separator=space` was used for `badge` attributes in table views.
- Escape sequences are now supported in attribute setting values using a backtick as the escape character: <code>``</code> and <code>\`,</code>. This allows for using a comma in settings that accept arbitrary text such as `header`.
- Board and gallery views will now display a cover image for image notes (uploaded image files). The image itself will be used as its cover.
- Add margin around all views to better align the edges of views when using Trilium's default themes. This can be changed using the `--collection-view-margin` CSS variable.
- Fix some cases where the sizing of scrollable containers would cause two vertical scrollbars to display. This could happen when using a custom theme that changes the border, padding, or margin around the note content area.
- Fix "ResizeObserver loop limit exceeded" errors occurring in console when the note content area is resized.
- Fix `#query` tokens not escaping backslashes and double quotes in values.
- Fix included notes inside a read-only note having an incorrect height when the included note's box size is set to small or medium in Trilium 0.57+.
- Fix badges sometimes being misplaced when displayed in an included note inside an editable note.
- Fix `boolean` checkbox styles not being applied in Trilium 0.46.
- Fix an error that occurs when attempting to display a cover image for image notes and web-view notes.
- Content of non-text notes is no longer inspected for covers which may reduce memory and bandwidth usage.

## 1.1.0 - 2021-07-21

- Add support for the "include note" feature, allowing views to be embedded in other notes.
- Add `truncate` attribute setting for table views for truncating long text to one or more lines.
- Add `wrap` attribute setting for table views for enabling text wrapping.
- Improve vertical alignment and spacing of badges.
- Badges are now normal font weight instead of bold.
- `boolean` attributes will now display a single unchecked checkbox instead of nothing when a note does not have the attribute defined.
- `boolean` checkboxes now look like to-do list checkboxes to better distinguish checked and unchecked when using a dark theme.
- Fix sticky table cell borders not rendering correctly when scrolling large tables in Trilium 0.47.
- Fix attribute values not being separated correctly when there are more than two values displayed in a single table cell. Only the last two values would be separated by a space or line break instead of all values.
- Fix `boolean` checkboxes being inverted (true as unchecked, false as checked).
- Fix `prefix` and `suffix` settings not working with `boolean` checkboxes.

## 1.0.0 - 2021-04-17

- Initial release.
