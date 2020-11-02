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

Views are configured by adding labels to the note rendering the view.

### `view`

- Optional (default: `table`)
- Single value

Selects which view to use. Possible values:

- `board`
- `gallery`
- `table`

Example: `#view=board`

### `query`

- Required
- Single value

A [search query](https://github.com/zadam/trilium/wiki/Search) that will be executed using Trilium's search engine. The notes returned by this search are the notes that will be included in the view.

Example: `#query="#book #status=read"` would include all notes having a `book` label and a `status` label set to `read`.

### `groupBy`

- Board views only
- Required
- Single value

Determines the columns of the board view. The value of this label is an attribute name.

- If a label is referenced, notes are grouped by the values of that label.

- If a relation is referenced, notes are grouped by the target notes of that relation. Column headers will display the titles of target notes ([badges](#badge) are supported).

Example: `#groupBy=status` would group notes by their values of the `status` label.

### `columns`

- Gallery views only
- Optional (default: `4`)
- Single value

Sets the number of columns in a gallery view.

Example: `#columns=8`

### `columnWidth`

- Board views only
- Optional (default: `250`)
- Single value

Sets the width of a board view's columns in pixels.

Example: `#columnWidth=100`

### `coverHeight`

- Board and gallery views only
- Optional (default: `200`)
- Single value

Sets the height of card cover images in pixels. Setting this to `0` hides cover images.

Example: `#coverHeight=500`

### `attribute`

- Optional
- Multiple values

Specifies which note attributes will be displayed in the view.

- For board and gallery views, attributes will be displayed below note titles in cards.
- For table views, attributes will be displayed as additional columns.

Attribute values can be displayed in a few different ways.

#### Text

`#attribute=labelOrRelationName`

This is the default display. Attribute values are shown as plain text.

Set the value of the `attribute` label to a label or relation name.

- If a label name is given, values for that label will be displayed.
- If a relation name is given, the titles of target notes for that relation will be displayed.

Example: `#attribute=status`

#### Badge

`#attribute=relationName`

If a target note of a relation has certain badge labels defined, then a colored badge will be displayed.

1. Set the value of the `attribute` label to a relation name.
2. Add one or more of the following labels to notes targeted by the relation:
   - `badgeBackground`: The badge's background style (any CSS `background` value).
   - `badgeColor`: The badge's font color (any CSS color).

#### Progress bar

`#attribute="numeratorLabelName/denominatorLabelName"`

Displays a progress bar based on two numeric labels.

Set the value of the `attribute` label to two label names separated by `/`. The referenced labels must have numeric values.

Example: `#attribute="completed/total"`
