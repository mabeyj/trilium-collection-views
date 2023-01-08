import { AttributeConfig, ViewConfig } from "collection-views/config";
import { MockApi, MockNoteShort } from "collection-views/test";
import { CardView } from "collection-views/view";

class TestView extends CardView {
	async render(): Promise<HTMLElement> {
		return document.createElement("div");
	}
}

const note = new MockNoteShort({
	noteId: "note",
	title: "Title",
});
const attributeNote = new MockNoteShort({
	noteId: "attributes",
	title: "Title",
	attributes: [
		{ type: "label", name: "test", value: "Label 1" },
		{ type: "label", name: "test", value: "Label 2" },
	],
});
const coverNote = new MockNoteShort({
	noteId: "cover",
	title: "Title",
	content: '<img src="cover.png">',
});

describe("CardView", () => {
	let config: ViewConfig;
	let view: CardView;

	beforeEach(() => {
		new MockApi({ notes: [note, attributeNote, coverNote] });
		config = new ViewConfig(new MockNoteShort());
		view = new TestView(config);
	});

	describe("renderCard", () => {
		function getCover($card: HTMLElement): HTMLElement | null {
			return $card.querySelector(".collection-view-card-cover");
		}

		it("returns card with cover", async () => {
			const $card = await view.renderCard(coverNote, false);
			expect($card).toHaveTextContent("Title");
			expect(getCover($card)).not.toBeNull();
		});

		it("returns card without empty cover if hiding empty covers", async () => {
			const $card = await view.renderCard(note, false);
			expect(getCover($card)).toBeNull();
		});

		it("returns card with empty cover if showing empty covers", async () => {
			const $card = await view.renderCard(note, true);
			expect(getCover($card)).not.toBeNull();
		});
	});

	describe("renderCardCover", () => {
		it("returns cover with defaults", async () => {
			const $cover = await view.renderCardCover(coverNote, false);
			expect($cover).toHaveStyle({
				backgroundImage: 'url("cover.png")',
				height: "",
			});
		});

		it("returns cover with custom height", async () => {
			config.coverHeight = 100;
			const $cover = await view.renderCardCover(coverNote, false);
			expect($cover).toHaveStyle({ height: "100px" });
		});

		it("returns undefined if cover height is zero", async () => {
			config.coverHeight = 0;
			const $cover = await view.renderCardCover(coverNote, false);
			expect($cover).toBeUndefined();
		});

		it("returns cover if no cover and showing empty covers", async () => {
			const $cover = await view.renderCardCover(note, true);
			expect($cover).toHaveStyle({ backgroundImage: "" });
		});

		it("returns undefined if no cover and hiding empty covers", async () => {
			const $cover = await view.renderCardCover(note, false);
			expect($cover).toBeUndefined();
		});
	});

	describe("renderCardAttributeList", () => {
		it("returns list", async () => {
			config.attributes.push(new AttributeConfig("test"));
			const $list = await view.renderCardAttributeList(attributeNote);
			expect($list).toHaveTextContent("Title");
			expect($list).toHaveTextContent("Label");
		});
	});

	describe("renderCardTitle", () => {
		it("returns list item", async () => {
			const $item = await view.renderCardTitle(note);
			expect($item).toHaveTextContent("Title");
		});
	});

	describe("renderCardAttributeValues", () => {
		it("returns list items", async () => {
			const $items = await view.renderCardAttributeValues(
				attributeNote,
				new AttributeConfig("test")
			);

			expect($items).toHaveLength(2);
			expect($items[0]).toHaveTextContent("Label 1");
			expect($items[1]).toHaveTextContent("Label 2");
		});
	});
});
