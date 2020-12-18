import { AttributeConfig, ViewConfig } from "collection-views/config";
import { View } from "collection-views/view/View";

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
	async render(): Promise<JQuery> {
		return $("<div class='collection-view-scroll'>").append(
			$(
				"<table class='table table-bordered table-hover table-sm collection-view-table'>"
			).append(this.renderHeader(), await this.renderBody())
		);
	}

	/**
	 * Returns an element for rendering the table header.
	 */
	renderHeader(): JQuery {
		return $("<thead>").append(
			$("<tr>").append($("<th>Title</th>"), ...this.renderHeaderCells())
		);
	}

	/**
	 * Returns elements for rendering cells in the table header.
	 */
	renderHeaderCells(): JQuery[] {
		return this.config.attributes.map((attributeConfig) =>
			this.renderHeaderCell(attributeConfig)
		);
	}

	/**
	 * Returns an element for rendering a header cell for some attribute.
	 */
	renderHeaderCell(attributeConfig: AttributeConfig): JQuery {
		const $cell = $("<th>").text(
			attributeConfig.header || attributeConfig.name
		);
		if (attributeConfig.align) {
			$cell.css("text-align", attributeConfig.align);
		}
		if (attributeConfig.width !== undefined) {
			$cell.css("min-width", `${attributeConfig.width}px`);
		}
		return $cell;
	}

	/**
	 * Returns an element for rendering the table body.
	 */
	async renderBody(): Promise<JQuery> {
		return $("<tbody>").append(...(await this.renderRows()));
	}

	/**
	 * Returns elements for rendering rows in the table body.
	 */
	async renderRows(): Promise<JQuery[]> {
		return await Promise.all(
			this.notes.map((note) => this.renderRow(note))
		);
	}

	/**
	 * Returns an element for rendering a table row for a note.
	 */
	async renderRow(note: NoteShort): Promise<JQuery> {
		const promises = [this.renderTitleCell(note)];
		for (const attributeConfig of this.config.attributes) {
			promises.push(this.renderAttributeCell(note, attributeConfig));
		}
		const $cells = await Promise.all(promises);

		return $("<tr>").append(...$cells);
	}

	/**
	 * Returns an element for rendering the note title cell in a row.
	 */
	async renderTitleCell(note: NoteShort): Promise<JQuery> {
		const $link = (await api.createNoteLink(note.noteId)).find("a");
		$link.addClass("stretched-link no-tooltip-preview");
		return $("<td>").append($("<strong>").append($link));
	}

	/**
	 * Returns an element for rendering a cell containing the note's attributes
	 * of the same name.
	 */
	async renderAttributeCell(
		note: NoteShort,
		attributeConfig: AttributeConfig
	): Promise<JQuery> {
		const $cell = $("<td>");
		if (attributeConfig.align) {
			$cell.css("text-align", attributeConfig.align);
		}
		$cell.append(
			...(await this.renderAttributeCellValues(note, attributeConfig))
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
	): Promise<Array<JQuery | string>> {
		const $values = await this.renderAttributeValues(note, attributeConfig);

		let $separator: JQuery | string | undefined;
		if (attributeConfig.badge) {
			$separator = " ";
		} else if (!attributeConfig.denominatorName) {
			$separator = $("<br>");
		}
		if (!$separator) {
			return $values;
		}

		const $separatedValues: Array<JQuery | string> = [];
		$values.forEach(($value, i) => {
			if ($separator && i) {
				$separatedValues.push($separator);
			}
			$separatedValues.push($value);
		});
		return $separatedValues;
	}
}
