const numberFormat = Intl.NumberFormat();

/**
 * Reads configuration and renders the entire view.
 */
async function render() {
    const config = new Config(api.originEntity);

    if (!config.query) {
        this.renderError(
            "This note must define a <code>query</code> attribute."
        );
        return;
    }

    const notes = await getNotes(config.query);
    if (!notes.length) {
        this.renderError("No notes found.");
        return;
    }

    let $view;
    switch (config.view) {
        case "board":
            if (!config.groupBy) {
                this.renderError(
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
    const notes = await api.searchForNotes(query);
    notes.sort((a, b) =>
        a.title.toLowerCase() < b.title.toLowerCase() ? -1 : 1
    );
    return notes;
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
        const attribute = note.getAttribute(undefined, name);
        if (!attribute || !attribute.value) {
            types.none.push(note);
            continue;
        }

        const groups = types[attribute.type];
        if (!groups[attribute.value]) {
            groups[attribute.value] = [];
        }
        groups[attribute.value].push(note);
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
    groups.sort((a, b) =>
        a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1
    );
    if (types.none.length) {
        groups.push({ notes: types.none });
    }
    return groups;
}

/**
 * Returns the URL for a note's cover image or undefined if it has none.
 */
async function getCoverUrl(note) {
    const content = await note.getContent();
    const parser = new DOMParser();
    const $content = $(parser.parseFromString(content, "text/html"));
    const $image = $content.find("body > figure:first-child > img").first();
    return $image.attr("src") || undefined;
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
                    this.badge = true;
                    break;

                case "align":
                case "header":
                case "prefix":
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
            if (denominator) {
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

        const $bar = $("<div class='progress'>").append(
            $("<div class='progress-bar'>")
                .width(percentWidth)
                .text(percentText)
        );

        return $("<div class='collection-view-progress'>").append(
            $fraction,
            $bar
        );
    }

    /**
     * Renders a value formatted according to the given attribute configuration,
     * returning an element. An optional note may be passed for badge styling.
     */
    renderValue(value, attributeConfig, note) {
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

        const $column = $("<div class='collection-view-board-column'>").append(
            this.renderColumnHeader(group),
            await this.renderColumnCards(group)
        );
        if (columnWidth) {
            $column.width(columnWidth).css("min-width", `${columnWidth}px`);
        }
        return $column;
    }

    renderColumnHeader(group) {
        return $("<div class='collection-view-board-column-header'>").append(
            this.renderColumnName(group),
            this.renderColumnCount(group)
        );
    }

    renderColumnName(group) {
        const $name = $("<div class='collection-view-board-column-name'>");
        if (group.name) {
            $name.append(
                this.renderValue(
                    group.name,
                    this.config.groupBy,
                    group.relatedNote
                )
            );
        } else {
            $name.append($("<span class='text-muted'>None</span>"));
        }
        return $name;
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

        const $valuesWithBreaks = [];
        $values.forEach(($value, i) => {
            $valuesWithBreaks.push($value);
            if (
                typeof $value === "string" &&
                typeof $values[i + 1] === "string"
            ) {
                $valuesWithBreaks.push($("<br>"));
            }
        });
        return $valuesWithBreaks;
    }
}

render();
