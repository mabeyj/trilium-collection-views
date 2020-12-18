import { ViewConfig } from "collection-views/config";
import { Group } from "collection-views/notes";
import { numberFormat } from "collection-views/math";
import { CardView } from "collection-views/view/CardView";

/**
 * Renders a board view. Notes are grouped by an attribute's value into columns.
 * Each column is a list of cards.
 */
export class BoardView extends CardView {
	groups: Group[];

	constructor(config: ViewConfig, groups: Group[]) {
		super(config);
		this.groups = groups;
	}

	/**
	 * Returns an element for rendering a board view.
	 */
	async render(): Promise<JQuery> {
		return $(
			"<div class='collection-view-scroll collection-view-board'>"
		).append(...(await this.renderColumns()));
	}

	/**
	 * Returns elements for rendering columns for each group of notes.
	 */
	async renderColumns(): Promise<JQuery[]> {
		return await Promise.all(
			this.groups.map((group) => this.renderColumn(group))
		);
	}

	/**
	 * Returns an element for rendering a column of cards for a group of notes.
	 */
	async renderColumn(group: Group): Promise<JQuery> {
		const { columnWidth } = this.config;

		const [$header, $cards] = await Promise.all([
			this.renderColumnHeader(group),
			this.renderColumnCards(group),
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

	/**
	 * Returns an element for rendering the header of a column for a group of
	 * notes.
	 */
	async renderColumnHeader(group: Group): Promise<JQuery> {
		return $("<div class='collection-view-board-column-header'>").append(
			await this.renderColumnName(group),
			this.renderColumnCount(group)
		);
	}

	/**
	 * Returns an element for rendering the name of a column for a group of
	 * notes.
	 */
	async renderColumnName(group: Group): Promise<JQuery> {
		if (!this.config.groupBy) {
			throw new Error("missing groupBy in view config");
		}

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

	/**
	 * Returns an element for rendering the number of cards in a column for
	 * a group of notes.
	 */
	renderColumnCount(group: Group): JQuery {
		return $("<div class='collection-view-board-column-count'>").append(
			$("<span class='badge badge-secondary'>").append(
				numberFormat.format(group.notes.length)
			)
		);
	}

	/**
	 * Returns an element for rendering the cards in a column for a group of
	 * notes.
	 */
	async renderColumnCards(group: Group): Promise<JQuery> {
		return $("<div class='collection-view-board-column-cards'>").append(
			...(await this.renderCards(group.notes, false))
		);
	}
}
