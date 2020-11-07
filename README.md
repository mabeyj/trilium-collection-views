# Trilium collection views

A plugin for [Trilium](https://github.com/zadam/trilium) that implements different ways of viewing collections of notes.

- **Board view:** Displays notes in a Kanban board. Notes are grouped by some attribute and listed in columns.
- **Gallery view:** Displays notes in a grid.
- **Table view:** Displays notes in a table.

## Screenshots

### Board view

### Gallery view

### Table view

## Installation

1. Create an empty code note:

   - **Type:** HTML

2. Add a child note for the CSS:

   - **Type:** CSS
   - Copy the contents of [index.css](src/index.css) and paste it into this note.
   - Add the `#appCss` label to this note.

3. Add a child note for the JavaScript code:

   - **Type:** JS frontend
   - Copy the contents of [index.js](src/index.js) and paste it into this note.

4. Reload the frontend (Menu → Reload frontend).

## Usage

1. Create a note that will render a view:

   - **Type:** Render Note
   - Add a `renderNote` relation targeting the plugin's HTML note.

2. Add a [`query` label](#query) to the Render Note with a [search query](https://github.com/zadam/trilium/wiki/Search) as its value. This will be executed by Trilium's search engine, and the resulting notes will be displayed in the view.

3. Optionally, add a [`view` label](#view) to the Render Note to select which type of view to use. By default, the table view will be used.

4. Optionally, [add labels](#configuration) to configure the view.

## Configuration

### View settings

Views are configured by adding labels to the note rendering the view.

#### `view`

- Optional (default: `table`)
- Single value

Selects which view to use. Possible values:

- `board`
- `gallery`
- `table`

Example: `#view=board`

#### `query`

- Required
- Single value

A [search query](https://github.com/zadam/trilium/wiki/Search) that will be executed using Trilium's search engine. The notes returned by this search are the notes that will be included in the view.

Example: `#query="#book #status=read"` would include all notes having a `book` label and a `status` label set to `read`.

#### `groupBy`

- Board views only
- Required
- Single value

Determines the columns of the board view. The value of this label is an attribute name.

- If a label is referenced, notes are grouped by the values of that label.

- If a relation is referenced, notes are grouped by the target notes of that relation. Column headers will display the titles of target notes ([badges](#badge) are supported).

Example: `#groupBy=status` would group notes by their values of the `status` label.

#### `columns`

- Gallery views only
- Optional (default: `4`)
- Single value

Sets the number of columns in a gallery view.

Example: `#columns=8`

#### `columnWidth`

- Board views only
- Optional (default: `250`)
- Single value

Sets the width of a board view's columns in pixels.

Example: `#columnWidth=100`

#### `coverHeight`

- Board and gallery views only
- Optional (default: `120`)
- Single value

Sets the height of card cover images in pixels. Setting this to `0` hides cover images.

Example: `#coverHeight=500`

#### `attribute`

- Optional
- Multiple values

Configures which note attributes will be displayed in the view and how they should be formatted.

* For board and gallery views, attributes appear underneath the cover image.
* For table views, attributes appear as additional columns in the table.

The value of the `attribute` label is a comma-separated list. The first item in this list names the attribute to be displayed. Any remaining items are optional attribute settings which can either be flags (`settingName`) or key/value pairs (`settingName=value`). [#attribute-settings](See below) for a list of attribute settings.

By default, attribute values will be shown as plain text. For labels, the label's value will be shown. For relations, the titles of target notes will be shown.

#### Badge

`#attribute=relationName`

If a target note of a relation has certain badge labels defined, then a colored badge will be displayed.

1. Set the value of the `attribute` label to a relation name.
2. Add one or more of the following labels to notes targeted by the relation:
   - `badgeBackground`: The badge's background style (any CSS `background` value).
   - `badgeColor`: The badge's font color (any CSS color).

### Attribute settings

The value of the `attribute` label is a comma-separated list. The first item in the list is an attribute name. Any remaining items in the list are settings (described below) either in the form of a flag (`settingName`) or a key/value pair (`settingName=value`).

#### `align`

* Table views only
* Optional (default: `left`)

Sets the text alignment of cells in the attribute's column. Can be any `text-align` value (e.g., `center`, `right`).

Example: `#attribute="price,align=right"`

#### `badge`

* Optional

Renders this attribute's value as a badge.

Badge colors can be customized in two ways:

* The [`badgeBackground`](#badgeBackground) and [`badgeColor`](#badgeColor) attribute settings.

* If this attribute is a relation, notes targeted by this relation can set the `badgeBackground` and `badgeColor` attributes.

Example: `#attribute="status,badge"`

#### `badgeBackground`

* Optional

Sets the background style of badges for this attribute. Any CSS `background` style can be set. If set, the [`badge`](#badge) setting is implicitly enabled.

If this attribute is a relation, notes targeted by this relation can set the `badgeBackground` attribute to override this style.

Example: `#attribute="status,badgeBackground=red"`

#### `badgeColor`

* Optional

Sets the text color of badges for this attribute. Any CSS color can be set. If set, the [`badge`](#badge) setting is implicitly enabled.

If this attribute is a relation, notes targeted by this relation can set the `badgeColor` attribute to override this style.

Example: `#attribute="status,badgeColor=black"`

#### `header`

* Table views only
* Optional (default: the attribute's name)

Sets the text displayed in the header cell of the attribute's column.

Examples:

* `#attribute="price,header=Price (in dollars)"`
* `#attribute="status,header="` (empty header cell)

#### `prefix`

* Optional

Adds a string in front of the attribute's value.

Examples:

* `#attribute="price,prefix=$"`
* `#attribute="total,prefix=Total: "`

#### `progressBar`

* Optional

Renders a progress bar using the attribute as the numerator and another attribute (named by this setting's value) as the denominator. Both attributes must be labels with numeric values.

Example: `#attribute="completed,progressBar=total"`

#### `suffix`

* Optional

Adds a string behind the attribute's value.

Examples:

* `#attribute="weight,suffix=kg"`
* `#attribute="price,suffix= CAD"`

#### `width`

* Table views only
* Optional (default: `300` for note title, `0` for attributes)

Sets the minimum width (in pixels) of the attribute's column. Columns may be resized proportionally since tables are set to 100% width.

Example: `#attribute=status,width=100`
