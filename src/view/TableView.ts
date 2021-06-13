import { AttributeConfig, ViewConfig } from "collection-views/config";
import { View } from "collection-views/view/View";
import { appendChildren, staggeredRender } from "collection-views/dom";

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
			"collection-view-table"
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
			this.renderHeaderCell(attributeConfig)
		);
	}

	/**
	 * Returns an element for rendering a header cell for some attribute.
	 */
	renderHeaderCell(attributeConfig: AttributeConfig): HTMLElement {
		const $cell = document.createElement("th");
		$cell.textContent = attributeConfig.header || attributeConfig.name;
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
			this.renderRow(note)
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
		attributeConfig: AttributeConfig
	): Promise<HTMLElement> {
		const $cell = document.createElement("td");
		if (attributeConfig.align) {
			$cell.style.textAlign = attributeConfig.align;
		}
		if (attributeConfig.wrap) {
			$cell.style.whiteSpace = "normal";
		}
		appendChildren(
			$cell,
			await this.renderAttributeCellValues(note, attributeConfig)
		);
		return $cell;
	}

	/**
	 * Returns elements or strings for rendering a note's attributes of the same
	 * name in a cell.
	 */
	async renderAttributeCellValues(
		note: NoteShort,
		attributeConfig: AttributeConfig
	): Promise<Array<HTMLElement | Text>> {
		const $values = await this.renderAttributeValues(note, attributeConfig);

		let $separator: HTMLElement | Text | undefined;
		if (attributeConfig.badge) {
			$separator = document.createTextNode(" ");
		} else if (!attributeConfig.denominatorName) {
			$separator = document.createElement("br");
		}
		if (!$separator) {
			return $values;
		}

		const $separatedValues: Array<HTMLElement | Text> = [];
		$values.forEach(($value, i) => {
			if ($separator && i) {
				$separatedValues.push($separator);
			}
			$separatedValues.push($value);
		});
		return $separatedValues;
	}
}
