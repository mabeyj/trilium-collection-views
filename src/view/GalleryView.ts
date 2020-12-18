import { CardView } from "collection-views/view/CardView";
import { ViewConfig } from "collection-views/config";

/**
 * Renders a gallery view. Notes are rendered as cards in a grid.
 */
export class GalleryView extends CardView {
	notes: NoteShort[];

	constructor(config: ViewConfig, notes: NoteShort[]) {
		super(config);
		this.notes = notes;
	}

	/**
	 * Returns an element for rendering a gallery view.
	 */
	async render(): Promise<JQuery> {
		const { columns } = this.config;

		const $gallery = $("<div class='collection-view-gallery'>");
		if (columns) {
			$gallery.css(
				"grid-template-columns",
				`repeat(${columns}, minmax(0, 1fr))`
			);
		}
		$gallery.append(...(await this.renderCards(this.notes, true)));
		return $gallery;
	}
}
