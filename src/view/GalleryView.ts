import { CardView } from "collection-views/view/CardView";
import { ViewConfig } from "collection-views/config";
import { staggeredRender } from "collection-views/dom";

const initialRenderSize = 20;

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
	async render(): Promise<HTMLElement> {
		const { columns } = this.config;

		const $gallery = document.createElement("div");
		$gallery.className = "collection-view-gallery";
		if (columns) {
			$gallery.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
		}
		await staggeredRender($gallery, initialRenderSize, this.notes, (note) =>
			this.renderCard(note, true)
		);
		return $gallery;
	}
}
