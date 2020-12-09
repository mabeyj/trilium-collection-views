const numberFormat = Intl.NumberFormat();

/**
 * Reads configuration and renders the entire view.
 */
async function render() {
    const config = new Config(api.originEntity);

    if (!config.query) {
        renderError("This note must define a <code>query</code> attribute.");
        return;
    }

    const notes = await getNotes(config.query);
    if (!notes.length) {
        renderError("No notes found.");
        return;
    }
    await sortNotes(notes, config.sort);

    let $view;
    switch (config.view) {
        case "board":
            if (!config.groupBy) {
                renderError(
                    "This note must define a <code>groupBy</code> attribute."
                );
                return;
            }

            const groups = await groupNotes(notes, config.groupBy.name);
            $view = await new BoardView(config, groups).render();
            break;

        case "gallery":
            $view = await new GalleryView(config, notes).render();
            break;

        case "table":
            $view = await new TableView(config, notes).render();
            break;
    }

    api.$container.append($view);
}

/**
 * Renders an error message.
 */
function renderError(message) {
    const $error = $("<div class='collection-view-error'>").html(message);
    api.$container.append($error);
}

/**
 * Executes a search query and returns the resulting array of notes.
 */
async function getNotes(query) {
    return await api.searchForNotes(query);
}

/**
 * Group notes by attribute values, returning an array of group objects.
 */
async function groupNotes(notes, name) {
    const types = {
        none: [],
        label: {},
        relation: {}
    };
    for (const note of notes) {
        const attributes = note.getAttributes(undefined, name);

        let addToNone = !attributes.length;
        const added = { label: {}, relation: {} };

        for (const attribute of attributes) {
            if (!attribute.value) {
                addToNone = true;
                continue;
            }
            if (added[attribute.type][attribute.value]) {
                continue;
            }

            const groups = types[attribute.type];
            if (!groups[attribute.value]) {
                groups[attribute.value] = [];
            }
            groups[attribute.value].push(note);
            added[attribute.type][attribute.value] = true;
        }

        if (addToNone) {
            types.none.push(note);
        }
    }

    const groups = [];
    for (const [value, groupNotes] of Object.entries(types.label)) {
        groups.push({
            name: value,
            notes: groupNotes
        });
    }
    for (const [noteId, groupNotes] of Object.entries(types.relation)) {
        const relatedNote = await api.getNote(noteId);
        groups.push({
            name: relatedNote.title,
            relatedNote,
            notes: groupNotes
        });
    }

    groups.sort((a, b) => {
        const nameA = getSortableValue(a.name, a.relatedNote);
        const nameB = getSortableValue(b.name, b.relatedNote);
        return nameA < nameB ? -1 : 1;
    });

    if (types.none.length) {
        groups.push({ notes: types.none });
    }

    return groups;
}

/**
 * Sorts an array of notes.
 */
async function sortNotes(notes, sorts) {
    const sortableValues = {};
    for (const note of notes) {
        sortableValues[note.noteId] = {};
        for (const sort of sorts) {
            const value = await getSortableAttributeValue(note, sort.name);
            sortableValues[note.noteId][sort.name] = value;
        }
    }

    notes.sort((a, b) => {
        for (const sort of sorts) {
            const valueA = sortableValues[a.noteId][sort.name];
            const valueB = sortableValues[b.noteId][sort.name];
            if (valueA < valueB) {
                return sort.descending ? 1 : -1;
            }
            if (valueA > valueB) {
                return sort.descending ? -1 : 1;
            }
        }

        const titleA = getSortableValue(a.title, a);
        const titleB = getSortableValue(b.title, b);
        if (titleA < titleB) {
            return -1;
        }
        if (titleA > titleB) {
            return 1;
        }
        return 0;
    });
}

/**
 * Returns the URL for a note's cover image or undefined if it has none.
 */
async function getCoverUrl(note) {
    const content = await note.getContent();
    if (!content.startsWith("<figure")) {
        return undefined;
    }

    const match = content.match(/src="([^"]+)"/);
    if (!match) {
        return undefined;
    }

    return match[1] || undefined;
}

/**
 * Returns the sortable value of an attribute of some note.
 *
 * If the attribute is a relation, then the related note's sortableTitle or
 * title is returned. Otherwise, the attribute's value is returned.
 */
async function getSortableAttributeValue(note, name) {
    const attribute = note.getAttribute(undefined, name);
    if (!attribute) {
        return "";
    }

    let relatedNote;
    if (attribute.type === "relation") {
        relatedNote = await api.getNote(attribute.value);
    }

    const value = relatedNote ? relatedNote.title : attribute.value;
    return getSortableValue(value, relatedNote);
}

/**
 * Returns the given value or the sortableTitle of an optional related note.
 */
function getSortableValue(value, relatedNote) {
    let sortableTitle;
    if (relatedNote) {
        sortableTitle = relatedNote.getLabelValue("sortableTitle");
    }

    return (sortableTitle || value).toLowerCase();
}

/**
 * Returns a number clamped between two values (inclusive) or undefined if not
 * a number.
 */
function clamp(number, min, max) {
    number = parseInt(number, 10);
    if (isNaN(number)) {
        return undefined;
    }

    return Math.max(min, Math.min(number, max));
}

/**
 * View configuration read from a note's attributes.
 */
class Config {
    constructor(note) {
        this.note = note;
        this.parseView(note.getLabelValue("view"));
        this.parseQuery(note.getLabelValue("query"));
        this.parseGroupBy(note.getLabelValue("groupBy"));
        this.parseSort(note.getLabelValue("sort"));
        this.parseColumns(note.getLabelValue("columns"));
        this.parseColumnWidth(note.getLabelValue("columnWidth"));
        this.parseCoverHeight(note.getLabelValue("coverHeight"));
        this.parseAttributes(
            note.getLabels("attribute").map((label) => label.value)
        );
    }

    parseView(value) {
        if (!["board", "gallery", "table"].includes(value)) {
            value = "table";
        }

        this.view = value;
    }

    parseQuery(value) {
        if (!value) {
            this.query = undefined;
            return;
        }

        this.query = value.replace(/\$title/g, `"${this.note.title}"`);
    }

    parseGroupBy(value) {
        if (!value) {
            this.groupBy = undefined;
            return;
        }

        this.groupBy = new AttributeConfig(value);
    }

    parseSort(value) {
        if (!value) {
            this.sort = [];
            return;
        }

        this.sort = value.split(",").map((name) => {
            let descending = false;
            if (name.startsWith("!")) {
                descending = true;
                name = name.slice(1);
            }

            return { name, descending };
        });
    }

    parseColumns(value) {
        this.columns = clamp(value, 1, 20);
    }

    parseColumnWidth(value) {
        this.columnWidth = clamp(value, 1, 1000);
    }

    parseCoverHeight(value) {
        this.coverHeight = clamp(value, 0, 1000);
    }

    parseAttributes(values) {
        this.attributes = values.map((value) => new AttributeConfig(value));
    }
}

/**
 * Configuration related to an attribute.
 */
class AttributeConfig {
    constructor(string) {
        const options = string.split(",");
        this.name = options.shift();

        options.forEach((option) => {
            const parts = option.split("=");
            const key = parts.shift();
            const value = parts.join("=");

            let intValue = parseInt(value, 10);
            if (isNaN(intValue)) {
                intValue = undefined;
            }

            switch (key) {
                case "badge":
                case "boolean":
                case "number":
                    this[key] = true;
                    break;

                case "align":
                case "header":
                case "prefix":
                case "repeat":
                case "suffix":
                    this[key] = value;
                    break;

                case "badgeBackground":
                case "badgeColor":
                    this.badge = true;
                    this[key] = value;
                    break;

                case "progressBar":
                    this.denominatorName = value;
                    break;

                case "precision":
                    this.number = true;
                    this.precision = clamp(intValue, 0, 20);
                    break;

                case "width":
                    this.width = clamp(intValue, 0, 1000);
                    break;
            }
        });
    }

    /**
     * Returns a string affixed with the configured prefix and suffix.
     */
    affix(string) {
        return `${this.prefix || ""}${string}${this.suffix || ""}`;
    }
}

/**
 * Base view class implementing common rendering of cards and attributes.
 */
class View {
    constructor(config) {
        this.config = config;
    }

    async renderCards(notes, showEmptyCovers) {
        return await Promise.all(
            notes.map((note) => this.renderCard(note, showEmptyCovers))
        );
    }

    async renderCard(note, showEmptyCovers) {
        const [$cover, $list] = await Promise.all([
            this.renderCardCover(note, showEmptyCovers),
            this.renderCardAttributeList(note)
        ]);

        const $card = $("<div class='collection-view-card'>");
        if ($cover) {
            $card.append($cover);
        }
        $card.append($list);
        return $card;
    }

    async renderCardCover(note, showEmpty) {
        const { coverHeight } = this.config;

        if (coverHeight === 0) {
            return undefined;
        }

        const url = await getCoverUrl(note);
        if (!url && !showEmpty) {
            return undefined;
        }

        const $cover = $("<div class='collection-view-card-cover'>");
        if (url) {
            $cover.css("background-image", `url("${url}")`);
        }
        if (coverHeight) {
            $cover.height(coverHeight);
        }
        return $cover;
    }

    async renderCardAttributeList(note) {
        const promises = [this.renderCardTitle(note)];
        for (const attributeConfig of this.config.attributes) {
            promises.push(
                this.renderCardAttributeValues(note, attributeConfig)
            );
        }
        const [$title, ...$attributeValues] = await Promise.all(promises);

        const $list = $("<ul class='collection-view-card-attributes'>").append(
            $title
        );
        for (const $values of $attributeValues) {
            $list.append(...$values);
        }
        return $list;
    }

    async renderCardTitle(note) {
        const $link = (await api.createNoteLink(note.noteId)).find("a");
        $link.addClass("no-tooltip-preview stretched-link");
        return $("<li>").append($("<strong>").append($link));
    }

    async renderCardAttributeValues(note, attributeConfig) {
        const $values = await this.renderAttributeValues(note, attributeConfig);
        return $values.map(($value) => $("<li>").append($value));
    }

    /**
     * Renders all values of the given note's attributes sharing the same name
     * according to the given attribute configuration, returning an array of
     * elements.
     */
    async renderAttributeValues(note, attributeConfig) {
        const attributes = note.getAttributes(undefined, attributeConfig.name);

        let denominator;
        if (attributeConfig.denominatorName) {
            denominator = note.getLabelValue(attributeConfig.denominatorName);
        }

        const $values = [];
        for (const attribute of attributes) {
            let relatedNote;
            if (attribute.type === "relation") {
                relatedNote = await api.getNote(attribute.value);
            }

            let value = attribute.value;
            if (relatedNote) {
                value = relatedNote.title;
            }

            let $value;
            if (attributeConfig.boolean) {
                $value = this.renderBoolean(value);
            } else if (denominator) {
                $value = this.renderProgressBar(
                    value,
                    denominator,
                    attributeConfig
                );
            }
            if (!$value) {
                $value = this.renderValue(value, attributeConfig, relatedNote);
            }

            $values.push($value);
        }

        return $values;
    }

    renderBoolean(value) {
        const $checkbox = $(
            "<input class='collection-view-checkbox' type='checkbox' disabled>"
        );
        if (
            !value ||
            !["n", "no", "f", "false"].includes(value.toLowerCase())
        ) {
            $checkbox.attr("checked", true);
        }
        return $checkbox;
    }

    renderProgressBar(numerator, denominator, attributeConfig) {
        numerator = parseFloat(numerator);
        denominator = parseFloat(denominator);
        if (isNaN(numerator) || isNaN(denominator)) {
            return undefined;
        }

        let percent = 0;
        if (denominator !== 0) {
            percent = (100 * numerator) / denominator;
        }

        const percentWidth = `${clamp(percent, 0, 100)}%`;
        const percentText = `${Math.round(percent)}%`;

        const $fraction = $("<div class='collection-view-progress-fraction'>");
        if (attributeConfig.prefix) {
            $fraction.append(attributeConfig.prefix);
        }
        $fraction.append(
            $("<span class='collection-view-progress-number'>").text(
                numberFormat.format(numerator)
            ),
            " / ",
            $("<span class='collection-view-progress-number'>").text(
                numberFormat.format(denominator)
            )
        );
        if (attributeConfig.suffix) {
            $fraction.append(attributeConfig.suffix);
        }

        const $bar = $("<div class='progress-bar'>")
            .width(percentWidth)
            .text(percentText);
        if (percent >= 100) {
            $bar.addClass("bg-success");
        }

        return $("<div class='collection-view-progress'>").append(
            $fraction,
            $("<div class='progress'>").append($bar)
        );
    }

    /**
     * Renders a value formatted according to the given attribute configuration,
     * returning an element. An optional note may be passed for badge styling.
     */
    renderValue(value, attributeConfig, note) {
        if (attributeConfig.number) {
            const float = parseFloat(value);
            if (!isNaN(float)) {
                const options = {};
                if (attributeConfig.precision !== undefined) {
                    options.minimumFractionDigits = options.maximumFractionDigits =
                        attributeConfig.precision;
                }

                value = new Intl.NumberFormat(undefined, options).format(float);
            }
        }
        if (attributeConfig.repeat) {
            const int = parseInt(value, 10);
            if (!isNaN(int) && int >= 0) {
                value = attributeConfig.repeat.repeat(clamp(int, 0, 1000));
            }
        }

        value = attributeConfig.affix(value);

        if (attributeConfig.badge) {
            return this.renderBadge(value, attributeConfig, note);
        }

        return value;
    }

    /**
     * Renders a string as a badge, returning an element.
     *
     * Badge styles are taken from the given note (optional, its badgeBackground and
     * badgeColor attributes), then the given attribute configuration, then
     * Bootstrap's default.
     */
    renderBadge(value, attributeConfig, note) {
        let background = attributeConfig.badgeBackground;
        let color = attributeConfig.badgeColor;
        if (note) {
            background = note.getLabelValue("badgeBackground") || background;
            color = note.getLabelValue("badgeColor") || color;
        }

        const $badge = $("<span class='badge badge-secondary'>").text(value);
        if (background) {
            $badge.css("background", background);
        }
        if (color) {
            $badge.css("color", color);
        }
        return $badge;
    }
}

/**
 * Renders a board view. Notes are grouped by an attribute's value into
 * columns. Each column is a list of cards.
 */
class BoardView extends View {
    constructor(config, groups) {
        super(config);
        this.groups = groups;
    }

    async render() {
        return $(
            "<div class='collection-view-scroll collection-view-board'>"
        ).append(...(await this.renderColumns()));
    }

    async renderColumns() {
        return await Promise.all(
            this.groups.map((group) => this.renderColumn(group))
        );
    }

    async renderColumn(group) {
        const { columnWidth } = this.config;

        const [$header, $cards] = await Promise.all([
            this.renderColumnHeader(group),
            this.renderColumnCards(group)
        ]);

        const $column = $("<div class='collection-view-board-column'>").append(
            $header,
            $cards
        );
        if (columnWidth) {
            $column.width(columnWidth).css("min-width", `${columnWidth}px`);
        }
        return $column;
    }

    async renderColumnHeader(group) {
        return $("<div class='collection-view-board-column-header'>").append(
            await this.renderColumnName(group),
            this.renderColumnCount(group)
        );
    }

    async renderColumnName(group) {
        const $name = $("<div class='collection-view-board-column-name'>");
        if (!group.name) {
            return $name.append($("<span class='text-muted'>None</span>"));
        }

        let $value = this.renderValue(
            group.name,
            this.config.groupBy,
            group.relatedNote
        );
        if (group.relatedNote) {
            $value = (await api.createNoteLink(group.relatedNote.noteId))
                .find("a")
                .addClass("stretched-link no-tooltip-preview")
                .empty()
                .append($value);
        }

        return $name.append($value);
    }

    renderColumnCount(group) {
        return $("<div class='collection-view-board-column-count'>").append(
            $("<span class='badge badge-secondary'>").append(
                numberFormat.format(group.notes.length)
            )
        );
    }

    async renderColumnCards(group) {
        return $("<div class='collection-view-board-column-cards'>").append(
            ...(await this.renderCards(group.notes, false))
        );
    }
}

/**
 * Renders a gallery view. Notes are rendered as cards in a grid.
 */
class GalleryView extends View {
    constructor(config, notes) {
        super(config);
        this.notes = notes;
    }

    async render() {
        const { columns } = this.config;

        const $gallery = $("<div class='collection-view-gallery'>");
        if (columns) {
            $gallery.css(
                "grid-template-columns",
                `repeat(${columns}, minmax(0, 1fr))`
            );
        }
        $gallery.append(...(await this.renderCards(this.notes, true)));
        return $gallery;
    }
}

/**
 * Renders a table view. Rows are notes. Columns are attributes.
 */
class TableView extends View {
    constructor(config, notes) {
        super(config);
        this.notes = notes;
    }

    async render() {
        return $("<div class='collection-view-scroll'>").append(
            $(
                "<table class='table table-bordered table-hover table-sm collection-view-table'>"
            ).append(this.renderHeader(), await this.renderBody())
        );
    }

    renderHeader() {
        return $("<thead>").append(
            $("<tr>").append($("<th>Title</th>"), ...this.renderHeaderCells())
        );
    }

    renderHeaderCells() {
        return this.config.attributes.map((attributeConfig) =>
            this.renderHeaderCell(attributeConfig)
        );
    }

    renderHeaderCell(attributeConfig) {
        const $cell = $("<th>").text(
            attributeConfig.header !== undefined
                ? attributeConfig.header
                : attributeConfig.name
        );
        if (attributeConfig.align) {
            $cell.css("text-align", attributeConfig.align);
        }
        if (attributeConfig.width !== undefined) {
            $cell.css("min-width", `${attributeConfig.width}px`);
        }
        return $cell;
    }

    async renderBody() {
        return $("<tbody>").append(...(await this.renderRows()));
    }

    async renderRows() {
        return await Promise.all(
            this.notes.map((note) => this.renderRow(note))
        );
    }

    async renderRow(note) {
        const promises = [this.renderTitleCell(note)];
        for (const attributeConfig of this.config.attributes) {
            promises.push(this.renderAttributeCell(note, attributeConfig));
        }
        const $cells = await Promise.all(promises);

        return $("<tr>").append(...$cells);
    }

    async renderTitleCell(note) {
        const $link = (await api.createNoteLink(note.noteId)).find("a");
        $link.addClass("stretched-link no-tooltip-preview");
        return $("<td>").append($("<strong>").append($link));
    }

    async renderAttributeCell(note, attributeConfig) {
        const $cell = $("<td>");
        if (attributeConfig.align) {
            $cell.css("text-align", attributeConfig.align);
        }
        $cell.append(
            ...(await this.renderAttributeCellValues(note, attributeConfig))
        );
        return $cell;
    }

    async renderAttributeCellValues(note, attributeConfig) {
        const $values = await this.renderAttributeValues(note, attributeConfig);

        let separator;
        if (attributeConfig.badge) {
            separator = " ";
        } else if (!attributeConfig.denominatorName) {
            separator = $("<br>");
        }
        if (!separator) {
            return $values;
        }

        const $separatedValues = [];
        $values.forEach(($value, i) => {
            if (i) {
                $separatedValues.push(separator);
            }
            $separatedValues.push($value);
        });
        return $separatedValues;
    }
}

render();
