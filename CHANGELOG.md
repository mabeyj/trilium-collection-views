# Changelog

## Unreleased

- Add support for the "include note" feature, allowing views to be embedded in other notes.
- Add `wrap` attribute setting for table views for enabling text wrapping.
- `boolean` attributes will now display a single unchecked checkbox instead of nothing when a note does not have the attribute defined.
- `boolean` checkboxes now look like to-do list checkboxes to better distinguish checked and unchecked when using a dark theme.
- Fix sticky table cell borders not rendering correctly when scrolling large tables in Trilium 0.47.
- Fix attribute values not being separated correctly when there are more than two values displayed in a single table cell. Only the last two values would be separated by a space or line break instead of all values.
- Fix `boolean` checkboxes being inverted (true as unchecked, false as checked).

## 1.0.0 - 2021-04-17

- Initial release.
