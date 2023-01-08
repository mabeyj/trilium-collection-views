import { ViewConfig } from "collection-views/config";
import { MockApi, MockNoteShort } from "collection-views/test";
import { GalleryView } from "collection-views/view";

describe("GalleryView", () => {
	let config: ViewConfig;
	let view: GalleryView;

	beforeEach(() => {
		const notes = [
			new MockNoteShort({ noteId: "1", title: "Title 1" }),
			new MockNoteShort({ noteId: "2", title: "Title 2" }),
		];
		new MockApi({ notes });
		config = new ViewConfig(new MockNoteShort());
		view = new GalleryView(config, notes);
	});

	describe("render", () => {
		function getGallery($view: HTMLElement): HTMLElement | null {
			return $view.querySelector(".collection-view-gallery");
		}

		it("renders view with defaults", async () => {
			const $view = await view.render();
			expect(getGallery($view)).toHaveStyle({ gridTemplateColumns: "" });
			expect($view).toHaveTextContent("Title 1");
			expect($view).toHaveTextContent("Title 2");
		});

		it("renders view with custom number of columns", async () => {
			config.columns = 3;
			const $view = await view.render();
			expect(getGallery($view)).toHaveStyle({
				gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
			});
		});
	});
});
