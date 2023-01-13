import { View } from "collection-views/view/View";
import { getCoverUrl } from "collection-views/notes";
import { AttributeConfig } from "collection-views/config";
import { appendChildren } from "collection-views/dom";

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
	): Promise<HTMLElement> {
		const [$cover, $list] = await Promise.all([
			this.renderCardCover(note, showEmptyCovers),
			this.renderCardAttributeList(note),
		]);

		const $card = document.createElement("div");
		$card.className = "collection-view-card";
		if ($cover) {
			$card.appendChild($cover);
		}
		$card.appendChild($list);
		return $card;
	}

	/**
	 * Returns an element for rendering a cover image for the given note,
	 * optionally showing an empty cover if the note does not have one.
	 */
	async renderCardCover(
		note: NoteShort,
		showEmpty: boolean
	): Promise<HTMLElement | undefined> {
		const { coverHeight } = this.config;
		if (coverHeight === 0) {
			return undefined;
		}

		const url = await getCoverUrl(note);
		if (!url && !showEmpty) {
			return undefined;
		}

		const $cover = document.createElement("div");
		$cover.className = "collection-view-card-cover";
		if (url) {
			$cover.style.backgroundImage = `url("${url}")`;
		}
		if (coverHeight) {
			$cover.style.height = `${coverHeight}px`;
		}
		return $cover;
	}

	/**
	 * Returns an element for rendering a list of a note's attributes in a card.
	 */
	async renderCardAttributeList(note: NoteShort): Promise<HTMLElement> {
		const titlePromise = this.renderCardTitle(note);

		const attributePromises: Promise<HTMLElement>[] = [];
		for (const attributeConfig of this.config.attributes) {
			attributePromises.push(
				this.renderCardAttribute(note, attributeConfig)
			);
		}

		const $title = await titlePromise;
		const $attributes = await Promise.all(attributePromises);

		const $list = document.createElement("ul");
		$list.className = "collection-view-card-attributes";
		$list.appendChild($title);
		appendChildren($list, $attributes);
		return $list;
	}

	/**
	 * Returns an element for rendering a list item for a note's title in a card.
	 */
	async renderCardTitle(note: NoteShort): Promise<HTMLElement> {
		const $link = (await api.createNoteLink(note.noteId)).find("a");
		$link.addClass("no-tooltip-preview stretched-link");

		const $strong = document.createElement("strong");
		$strong.appendChild($link[0]);

		const $item = document.createElement("li");
		$item.appendChild($strong);
		return $item;
	}

	/**
	 * Returns an element for rendering a list item containing all values of
	 * a note's attribute.
	 */
	async renderCardAttribute(
		note: NoteShort,
		attributeConfig: AttributeConfig
	): Promise<HTMLElement> {
		const $values = await this.renderAttributeValues(note, attributeConfig);

		const $item = document.createElement("li");
		appendChildren($item, $values);
		return $item;
	}
}
