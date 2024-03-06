import { AttributeConfig, ViewConfig } from "collection-views/config";
import { appendChildren, staggeredRender } from "collection-views/dom";
import { View } from "collection-views/view/View";

const initialRenderSize = 25;

/**
 * Renders a table view. Rows are notes. Columns are attributes.
 */
export class TableView extends View {
	notes: NoteShort[];

	constructor(config: ViewConfig, notes: NoteShort[]) {
		super(config);
		this.notes = notes;
	}

	/**
	 * Returns an element for rendering a table view.
	 */
	async render(): Promise<HTMLElement> {
		const $table = document.createElement("table");
		$table.classList.add(
			"table",
			"table-bordered",
			"table-hover",
			"table-sm",
			"collection-view-table",
		);
		appendChildren($table, [this.renderHeader(), await this.renderBody()]);

		const $scroll = document.createElement("div");
		$scroll.className = "collection-view-scroll";
		$scroll.appendChild($table);
		return $scroll;
	}

	/**
	 * Returns an element for rendering the table header.
	 */
	renderHeader(): HTMLElement {
		const $title = document.createElement("th");
		$title.textContent = "Title";

		const $row = document.createElement("tr");
		$row.appendChild($title);
		appendChildren($row, this.renderHeaderCells());

		const $header = document.createElement("thead");
		$header.appendChild($row);
		return $header;
	}

	/**
	 * Returns elements for rendering cells in the table header.
	 */
	renderHeaderCells(): HTMLElement[] {
		return this.config.attributes.map((attributeConfig) =>
			this.renderHeaderCell(attributeConfig),
		);
	}

	/**
	 * Returns an element for rendering a header cell for some attribute.
	 */
	renderHeaderCell(attributeConfig: AttributeConfig): HTMLElement {
		const $cell = document.createElement("th");
		$cell.textContent = attributeConfig.header ?? attributeConfig.path;
		if (attributeConfig.align) {
			$cell.style.textAlign = attributeConfig.align;
		}
		if (attributeConfig.width !== undefined) {
			$cell.style.minWidth = `${attributeConfig.width}px`;
		}
		if (attributeConfig.wrap) {
			$cell.style.whiteSpace = "normal";
		}
		return $cell;
	}

	/**
	 * Returns an element for rendering the table body.
	 */
	async renderBody(): Promise<HTMLElement> {
		const $body = document.createElement("tbody");
		await staggeredRender($body, initialRenderSize, this.notes, (note) =>
			this.renderRow(note),
		);
		return $body;
	}

	/**
	 * Returns an element for rendering a table row for a note.
	 */
	async renderRow(note: NoteShort): Promise<HTMLElement> {
		const promises = [this.renderTitleCell(note)];
		for (const attributeConfig of this.config.attributes) {
			promises.push(this.renderAttributeCell(note, attributeConfig));
		}

		const $row = document.createElement("tr");
		appendChildren($row, await Promise.all(promises));
		return $row;
	}

	/**
	 * Returns an element for rendering the note title cell in a row.
	 */
	async renderTitleCell(note: NoteShort): Promise<HTMLElement> {
		const $link = (await api.createNoteLink(note.noteId)).find("a");
		$link.addClass("stretched-link no-tooltip-preview");

		const $strong = document.createElement("strong");
		$strong.appendChild($link[0]);

		const $cell = document.createElement("td");
		$cell.appendChild($strong);
		return $cell;
	}

	/**
	 * Returns an element for rendering a cell containing the note's attributes
	 * of the same name.
	 */
	async renderAttributeCell(
		note: NoteShort,
		attributeConfig: AttributeConfig,
	): Promise<HTMLElement> {
		const $cell = document.createElement("td");
		if (attributeConfig.align) {
			$cell.style.textAlign = attributeConfig.align;
		}
		if (attributeConfig.wrap) {
			$cell.style.whiteSpace = "normal";
		}

		const $values = await this.renderAttributeValues(note, attributeConfig);
		if (attributeConfig.truncate) {
			$cell.appendChild(this.renderTruncated($values, attributeConfig));
		} else {
			appendChildren($cell, $values);
		}

		return $cell;
	}

	/**
	 * Returns content wrapped in a container that truncates the content to the
	 * number of lines set in the given configuration.
	 */
	renderTruncated(
		$children: (HTMLElement | Text)[],
		attributeConfig: AttributeConfig,
	): HTMLElement {
		const $container = document.createElement("div");
		$container.className = "collection-view-truncate";
		$container.style.webkitLineClamp = `${attributeConfig.truncate}`;
		appendChildren($container, $children);
		return $container;
	}
}
