const numberFormat = Intl.NumberFormat();

async function render() {
    const renderNote = api.originEntity;

    const query = parseQuery(renderNote);
    if (!query) {
        renderError("This note must define a <code>query</code> attribute.");
        return;
    }

    const notes = await getNotes(query);
    if (!notes.length) {
        renderError("No notes found.");
        return;
    }

    const view = parseView(renderNote);
    const attributeConfigs = AttributeConfig.fromNote(renderNote);

    let coverHeight;
    if (view === "board" || view === "gallery") {
        coverHeight = parseLabelInt(renderNote, "coverHeight", 0, 1000);
    }

    let $view;
    switch (view) {
        case "board":
            const groupBy = renderNote.getLabelValue("groupBy");
            if (!groupBy) {
                renderError("This note must define a <code>groupBy</code> attribute.");
                return;
            }
            const groupConfig = new AttributeConfig(groupBy);

            const groups = await groupNotes(notes, groupConfig.name);
            const columnWidth = parseLabelInt(renderNote, "columnWidth", 1, 1000);
            $view = await renderBoard(
                groups, columnWidth, coverHeight, groupConfig, attributeConfigs
            );
            break;

        case "gallery":
            const columns = parseLabelInt(renderNote, "columns", 1, 20);
            $view = await renderGallery(notes, columns, coverHeight, attributeConfigs);
            break;

        case "table":
            $view = await renderTable(notes, attributeConfigs);
            break;
    }

    api.$container.append($view);
}

function renderError(message) {
    const $error = $("<div class='collection-view-error'>").html(message);
    api.$container.append($error);
}

async function renderBoard(
    groups, columnWidth, coverHeight, groupConfig, attributeConfigs
) {
    const $columns = await Promise.all(
        groups.map(group => renderColumn(
            group, columnWidth, coverHeight, groupConfig, attributeConfigs
        ))
    );
    return $("<div class='collection-view-scroll collection-view-board'>").append(
        ...$columns
    );
}

async function renderColumn(
    group, columnWidth, coverHeight, groupConfig, attributeConfigs
) {
    const $cards = await Promise.all(
        group.notes.map(note => renderCard(note, coverHeight, false, attributeConfigs))
    );

    const $column = $("<div class='collection-view-column'>").append(
        await renderColumnHeader(group, groupConfig),
        $("<div class='collection-view-column-cards'>").append(...$cards),
    );
    if (columnWidth) {
        $column.width(columnWidth).css("min-width", `${columnWidth}px`);
    }
    return $column;
}

async function renderColumnHeader(group, groupConfig) {
    const $name = $("<div class='collection-view-column-name'>");
    if (group.name) {
        $name.append(renderValue(group.name, groupConfig, group.relatedNote));
    } else {
        $name.append($("<span class='text-muted'>None</span>"));
    }

    const $count = $("<div class='collection-view-column-count'>").append(
        $("<span class='badge badge-secondary'>").append(
            numberFormat.format(group.notes.length)
        )
    );

    return $("<div class='collection-view-column-header'>").append($name, $count);
}

async function renderGallery(notes, columns, coverHeight, attributeConfigs) {
    const $grid = $("<div class='collection-view-grid'>");
    if (columns) {
        $grid.css("grid-template-columns", `repeat(${columns}, minmax(0, 1fr))`);
    }

    const $cards = await Promise.all(
        notes.map(note => renderCard(note, coverHeight, true, attributeConfigs))
    );

    return $grid.append(...$cards);
}

async function renderTable(notes, attributeConfigs) {
    const $rows = await Promise.all(
        notes.map(note => renderTableRow(note, attributeConfigs))
    )
    return $("<div class='collection-view-scroll'>").append(
        $("<table class='table table-bordered table-hover table-sm collection-view-table'>").append(
            renderTableHeader(attributeConfigs),
            $("<tbody>").append(...$rows),
        )
    );
}

function renderTableHeader(attributeConfigs) {
    const $cells = attributeConfigs.map(
        attributeConfig => {
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
    )
    return $("<thead>").append(
        $("<tr>").append($("<th>Title</th>"), ...$cells)
    );
}

async function renderTableRow(note, attributeConfigs) {
    const $link = (await api.createNoteLink(note.noteId)).find("a");
    $link.addClass("stretched-link no-tooltip-preview");

    const $row = $("<tr>").append(
        $("<td>").append($("<strong>").append($link))
    );
    for (const attributeConfig of attributeConfigs) {
        const $values = await renderAttributes(note, attributeConfig);

        const $cell = $("<td>");
        if (attributeConfig.align) {
            $cell.css("text-align", attributeConfig.align);
        }
        $values.forEach(($value, i) => {
            $cell.append($value);
        })

        $row.append($cell);
    }
    return $row;
}

async function renderCard(note, coverHeight, alwaysShowCover, attributeConfigs) {
    const [$cover, $info] = await Promise.all([
        renderCardCover(note, coverHeight, alwaysShowCover),
        renderCardInfo(note, attributeConfigs)
    ]);

    const $card = $("<div class='collection-view-card'>");
    if ($cover) {
        $card.append($cover);
    }
    $card.append($info);
    return $card;
}

async function renderCardCover(note, height, alwaysShow) {
    if (height === 0) {
        return undefined;
    }

    const url = await getCoverUrl(note);
    if (!alwaysShow && !url) {
        return undefined;
    }

    const $cover = $("<div class='collection-view-card-cover'>");
    if (url) {
        $cover.css("background-image", `url("${url}")`);
    }
    if (height) {
        $cover.height(height);
    }
    return $cover;
}

async function renderCardInfo(note, attributeConfigs) {
    const $info = $("<ul class='collection-view-card-info'>");

    const $link = (await api.createNoteLink(note.noteId)).find("a");
    $link.addClass("no-tooltip-preview stretched-link");
    $info.append($("<li>").append($("<strong>").append($link)));

    for (const attributeConfig of attributeConfigs) {
        const $values = await renderAttributes(note, attributeConfig);
        for (const $value of $values) {
            $info.append($("<li>").append($value));
        }
    }

    return $info;
}

/**
 * Renders all values of the given note's attributes sharing the same name
 * according to the given attribute configuration, returning an array of
 * elements.
 */
async function renderAttributes(note, attributeConfig) {
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
            $value = renderProgressBar(value, denominator, attributeConfig);
        }
        if (!$value) {
            $value = renderValue(value, attributeConfig, relatedNote);
        }

        $values.push($value);
    }

    return $values;
}

/**
 * Renders a value formatted according to the given attribute configuration,
 * returning an element. An optional note may be passed for badge styling.
 */
function renderValue(value, attributeConfig, note) {
    value = attributeConfig.affix(value);

    if (attributeConfig.badge) {
        return renderBadge(value, attributeConfig, note);
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
function renderBadge(string, attributeConfig, note) {
    let background = attributeConfig.badgeBackground;
    let color = attributeConfig.badgeColor;
    if (note) {
        background = note.getLabelValue("badgeBackground") || background;
        color = note.getLabelValue("badgeColor") || color;
    }

    const $badge = $("<span class='badge badge-secondary'>").text(string);
    if (background) {
        $badge.css("background", background);
    }
    if (color) {
        $badge.css("color", color);
    }
    return $badge;
}

function renderProgressBar(numerator, denominator, attributeConfig) {
    numerator = parseFloat(numerator);
    denominator = parseFloat(denominator);
    if (isNaN(numerator) || isNaN(denominator)) {
        return undefined;
    }

    let percent = 0;
    if (denominator !== 0) {
        percent = 100 * numerator / denominator;
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
        ),
    );
    if (attributeConfig.suffix) {
        $fraction.append(attributeConfig.suffix);
    }

    const $bar = $("<div class='progress'>").append(
        $("<div class='progress-bar'>").width(percentWidth).text(percentText)
    );

    return $("<div class='collection-view-progress'>").append($fraction, $bar);
}

function parseQuery(note) {
    let query = note.getLabelValue("query");
    return query ? query.replace(/\$title/g, `"${note.title}"`) : undefined;
}

function parseView(note) {
    let view = note.getLabelValue("view");
    if (!view || !["board", "gallery", "table"].includes(view)) {
        return "table";
    }
    return view;
}

function parseLabelInt(note, name, min, max) {
    const value = note.getLabelValue(name);
    if (!value) {
        return undefined;
    }

    const number = parseInt(value, 10);
    return isNaN(number) ? undefined : clamp(number, min, max);
}

async function getNotes(query) {
    const notes = await api.searchForNotes(query);
    notes.sort((a, b) => a.title.toLowerCase() < b.title.toLowerCase() ? -1 : 1);
    return notes;
}

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
    groups.sort((a, b) => a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1);
    if (types.none.length) {
        groups.push({ notes: types.none });
    }
    return groups;
}

async function getCoverUrl(note) {
    const content = await note.getContent();
    const parser = new DOMParser();
    const $content = $(parser.parseFromString(content, "text/html"));
    const $image = $content.find("body > figure:first-child > img").first();
    return $image.attr("src");
}

function clamp(number, min, max) {
    return isNaN(number) ? number : Math.max(min, Math.min(number, max));
}

/**
 * Configuration for displayed attribute values.
 */
class AttributeConfig {
    /**
     * Returns an array of AttributeConfig objects based on a note's attribute
     * labels.
     */
    static fromNote(note) {
        const values = note.getLabels("attribute").map(label => label.value);
        return values.map(value => new AttributeConfig(value));
    }

    constructor(string) {
        const options = string.split(",");
        this.name = options.shift();

        options.forEach(option => {
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
                    break

                case "progressBar":
                    this.denominatorName = value;
                    break;

                case "width":
                    this.width = clamp(intValue, 0, 1000);
                    break;
            }
        })
    }

    /**
     * Returns a string affixed with the configured prefix and suffix.
     */
    affix(string) {
        return `${this.prefix || ""}${string}${this.suffix || ""}`;
    }
}

render();
