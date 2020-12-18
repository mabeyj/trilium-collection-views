import { parseOptionalInt } from "collection-views/math";
import { SortAttribute } from "collection-views/notes";
import { AttributeConfig } from "collection-views/config/AttributeConfig";

export enum ViewType {
	Board = "board",
	Gallery = "gallery",
	Table = "table",
}

/**
 * Configuration for the entire view.
 */
export class ViewConfig {
	note: NoteShort;

	view: ViewType = ViewType.Table;
	query: string = "";
	groupBy?: AttributeConfig;
	sort: SortAttribute[] = [];
	columns?: number;
	columnWidth?: number;
	coverHeight?: number;

	attributes: AttributeConfig[] = [];

	constructor(note: NoteShort) {
		this.note = note;
		this.parseView(note.getLabelValue("view") || "");
		this.parseQuery(note.getLabelValue("query") || "");
		this.parseGroupBy(note.getLabelValue("groupBy") || "");
		this.parseSort(note.getLabelValue("sort") || "");
		this.parseColumns(note.getLabelValue("columns") || "");
		this.parseColumnWidth(note.getLabelValue("columnWidth") || "");
		this.parseCoverHeight(note.getLabelValue("coverHeight") || "");
		this.parseAttributes(
			note.getLabels("attribute").map((label) => label.value)
		);
	}

	/**
	 * Sets the view type from a string.
	 */
	parseView(value: string): void {
		value = value.trim();
		if (
			value === ViewType.Board ||
			value === ViewType.Gallery ||
			value === ViewType.Table
		) {
			this.view = value;
		}
	}

	/**
	 * Sets the search query from a string.
	 *
	 * The following substrings are substituted:
	 * - $title: Origin note's title (quoted).
	 */
	parseQuery(value: string): void {
		value = value.trim();
		this.query = value.replace(/\$title/g, `"${this.note.title}"`);
	}

	/**
	 * Sets the grouping configuration from a string.
	 */
	parseGroupBy(value: string): void {
		if (!value.trim()) {
			this.groupBy = undefined;
			return;
		}

		this.groupBy = new AttributeConfig(value);
	}

	/**
	 * Sets the note sort order from a string.
	 */
	parseSort(value: string): void {
		if (!value.trim()) {
			this.sort = [];
			return;
		}

		this.sort = value.split(",").map((name) => {
			name = name.trim();

			let descending = false;
			if (name.startsWith("!")) {
				descending = true;
				name = name.slice(1);
			}

			return { name, descending };
		});
	}

	/**
	 * Sets the number of columns for the board view from a string.
	 */
	parseColumns(value: string): void {
		this.columns = parseOptionalInt(value, 1, 20);
	}

	/**
	 * Sets the column width for the board view from a string.
	 */
	parseColumnWidth(value: string): void {
		this.columnWidth = parseOptionalInt(value, 1, 1000);
	}

	/**
	 * Sets the height of card covers from a string.
	 */
	parseCoverHeight(value: string): void {
		this.coverHeight = parseOptionalInt(value, 0, 1000);
	}

	/**
	 * Sets attribute configuration from an array of strings.
	 */
	parseAttributes(values: string[]): void {
		this.attributes = values.map((value) => new AttributeConfig(value));
	}
}
