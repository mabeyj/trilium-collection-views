import { parseOptionalInt } from "collection-views/math";
import {
	attributePathRegex,
	getAttributeValueByPath,
	SortAttribute,
} from "collection-views/notes";
import { AttributeConfig } from "collection-views/config/AttributeConfig";
import { isEnumValue } from "collection-views/util";

const tokens = ["$id", "$noteId", "$title", "$renderNote"];

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
	query = "";
	groupBy?: AttributeConfig;
	sort: SortAttribute[] = [];
	columns?: number;
	columnWidth?: number;
	coverHeight?: number;

	attributes: AttributeConfig[] = [];

	constructor(note: NoteShort) {
		this.note = note;
		this.parseView(note.getLabelValue("view") ?? "");
		this.parseQuery(note.getLabelValue("query") ?? "");
		this.parseGroupBy(note.getLabelValue("groupBy") ?? "");
		this.parseSort(note.getLabelValue("sort") ?? "");
		this.parseColumns(note.getLabelValue("columns") ?? "");
		this.parseColumnWidth(note.getLabelValue("columnWidth") ?? "");
		this.parseCoverHeight(note.getLabelValue("coverHeight") ?? "");
		this.parseAttributes(
			note.getLabels("attribute").map((label) => label.value),
		);
	}

	/**
	 * Sets the view type from a string.
	 */
	parseView(value: string): void {
		value = value.trim();
		if (isEnumValue(ViewType, value)) {
			this.view = value;
		}
	}

	/**
	 * Sets the search query from a string.
	 */
	parseQuery(value: string): void {
		this.query = value.trim();
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

		this.sort = value.split(",").map((path) => {
			path = path.trim();

			let descending = false;
			if (path.startsWith("!")) {
				descending = true;
				path = path.slice(1);
			}

			return { path, descending };
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

	/**
	 * Returns the query with all tokens replaced with their respective values.
	 *
	 * Tokens are substrings beginning with "$" that are substituted with
	 * a value associated with the Render Note. The following tokens are
	 * supported:
	 *
	 * - $id or $noteId: The Render Note's ID.
	 * - $title: The Render Note's title.
	 * - $renderNote.path: The value of the first attribute found for the Render
	 *   Note at "path" (an attribute path; see getAttributesByPath). If no
	 *   attribute is found, then the value is an empty string.
	 *
	 * All substituted values are double quoted ("value").
	 */
	async getQuery(): Promise<string> {
		let query = "";
		let remainder = this.query;
		while (remainder) {
			let path = getTokenPrefix(remainder);
			if (path === "$renderNote") {
				path = getAttributePath(remainder);
			}
			if (path === "$renderNote") {
				path = null;
			}
			if (!path) {
				query += remainder[0];
				remainder = remainder.slice(1);
				continue;
			}

			const length = path.length;
			if (path.startsWith("$renderNote")) {
				path = path.split(".").slice(1).join(".");
			}

			const value = await getAttributeValueByPath(this.note, path);
			query += `"${escapeValue(value)}"`;
			remainder = remainder.slice(length);
		}

		return query;
	}
}

/**
 * Returns the token at the beginning of the given string or null if it does not
 * start with a token.
 */
function getTokenPrefix(text: string): string | null {
	for (const token of tokens) {
		if (text.startsWith(token)) {
			return token;
		}
	}
	return null;
}

/**
 * Returns the first attribute path found in the given string or null if no path
 * was found.
 */
function getAttributePath(text: string): string | null {
	const match = text.match(attributePathRegex);
	return match ? match[0] : null;
}

/**
 * Returns a string with all backslashes and double quotes escaped with
 * a backslash.
 */
function escapeValue(value: string): string {
	// TODO: Use replaceAll when Trilium 0.46 is dropped.
	return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
