import { View } from "collection-views/view/View";
import { getCoverUrl } from "collection-views/notes";
import { AttributeConfig } from "collection-views/config";

/**
 * Base view implementing common rendering of cards.
 */
export abstract class CardView extends View {
	/**
	 * Returns an element for rendering a card for the given note, optionally
	 * showing an empty cover if the note does not have one.
	 */
	async renderCard(
		note: NoteShort,
		showEmptyCovers: boolean
	): Promise<JQuery> {
		const [$cover, $list] = await Promise.all([
			this.renderCardCover(note, showEmptyCovers),
			this.renderCardAttributeList(note),
		]);

		const $card = $("<div class='collection-view-card'>");
		if ($cover) {
			$card.append($cover);
		}
		$card.append($list);
		return $card;
	}

	/**
	 * Returns an element for rendering a cover image for the given note,
	 * optionally showing an empty cover if the note does not have one.
	 */
	async renderCardCover(
		note: NoteShort,
		showEmpty: boolean
	): Promise<JQuery | undefined> {
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

	/**
	 * Returns an element for rendering a list of a note's attributes in a card.
	 */
	async renderCardAttributeList(note: NoteShort): Promise<JQuery> {
		const titlePromise = this.renderCardTitle(note);

		const attributePromises: Promise<JQuery[]>[] = [];
		for (const attributeConfig of this.config.attributes) {
			attributePromises.push(
				this.renderCardAttributeValues(note, attributeConfig)
			);
		}

		const $title = await titlePromise;
		const $attributeValues = await Promise.all(attributePromises);

		const $list = $("<ul class='collection-view-card-attributes'>").append(
			$title
		);
		for (const $values of $attributeValues) {
			$list.append(...$values);
		}
		return $list;
	}

	/**
	 * Returns an element for rendering a list item for a note's title in a card.
	 */
	async renderCardTitle(note: NoteShort): Promise<JQuery> {
		const $link = (await api.createNoteLink(note.noteId)).find("a");
		$link.addClass("no-tooltip-preview stretched-link");
		return $("<li>").append($("<strong>").append($link));
	}

	/**
	 * Returns elements for rendering list items for a note's attributes in
	 * a card.
	 */
	async renderCardAttributeValues(
		note: NoteShort,
		attributeConfig: AttributeConfig
	): Promise<JQuery[]> {
		const $values = await this.renderAttributeValues(note, attributeConfig);
		return $values.map(($value) => $("<li>").append($value));
	}
}
