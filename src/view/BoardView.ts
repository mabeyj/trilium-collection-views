import { ViewConfig } from "collection-views/config";
import { Group } from "collection-views/notes";
import { numberFormat } from "collection-views/math";
import { CardView } from "collection-views/view/CardView";
import { appendChildren, staggeredRender } from "collection-views/dom";

const initialRenderSize = 10;

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
	async render(): Promise<HTMLElement> {
		const $board = document.createElement("div");
		$board.classList.add("collection-view-scroll", "collection-view-board");
		appendChildren($board, await this.renderColumns());
		return $board;
	}

	/**
	 * Returns elements for rendering columns for each group of notes.
	 */
	async renderColumns(): Promise<HTMLElement[]> {
		return await Promise.all(
			this.groups.map((group) => this.renderColumn(group)),
		);
	}

	/**
	 * Returns an element for rendering a column of cards for a group of notes.
	 */
	async renderColumn(group: Group): Promise<HTMLElement> {
		const { columnWidth } = this.config;

		const $column = document.createElement("div");
		$column.className = "collection-view-board-column";
		if (columnWidth) {
			$column.style.width = $column.style.minWidth = `${columnWidth}px`;
		}
		appendChildren(
			$column,
			await Promise.all([
				this.renderColumnHeader(group),
				this.renderColumnCards(group),
			]),
		);
		return $column;
	}

	/**
	 * Returns an element for rendering the header of a column for a group of
	 * notes.
	 */
	async renderColumnHeader(group: Group): Promise<HTMLElement> {
		const $header = document.createElement("div");
		$header.className = "collection-view-board-column-header";
		appendChildren($header, [
			await this.renderColumnName(group),
			this.renderColumnCount(group),
		]);
		return $header;
	}

	/**
	 * Returns an element for rendering the name of a column for a group of
	 * notes.
	 */
	async renderColumnName(group: Group): Promise<HTMLElement> {
		const { groupBy } = this.config;

		if (!groupBy) {
			throw new Error("missing groupBy in view config");
		}

		const $name = document.createElement("div");
		$name.className = "collection-view-board-column-name";
		if (!group.name) {
			const $none = document.createElement("span");
			$none.className = "text-muted";
			$none.textContent = "None";

			$name.appendChild($none);
			return $name;
		}

		let $nodes = this.renderValue(group.name, groupBy, group.relatedNote);
		if (group.relatedNote) {
			const $link = (await api.createNoteLink(group.relatedNote.noteId))
				.find("a")
				.addClass("stretched-link no-tooltip-preview")
				.empty()
				.append(...$nodes)[0];
			$nodes = [$link];
		}

		appendChildren($name, $nodes);
		return $name;
	}

	/**
	 * Returns an element for rendering the number of cards in a column for
	 * a group of notes.
	 */
	renderColumnCount(group: Group): HTMLElement {
		const $badge = document.createElement("span");
		$badge.classList.add("badge", "badge-secondary");
		$badge.textContent = numberFormat.format(group.notes.length);

		const $count = document.createElement("div");
		$count.className = "collection-view-board-column-count";
		$count.appendChild($badge);
		return $count;
	}

	/**
	 * Returns an element for rendering the cards in a column for a group of
	 * notes.
	 */
	async renderColumnCards(group: Group): Promise<HTMLElement> {
		const $cards = document.createElement("div");
		$cards.className = "collection-view-board-column-cards";
		await staggeredRender($cards, initialRenderSize, group.notes, (note) =>
			this.renderCard(note, false),
		);
		return $cards;
	}
}
