import { AttributeConfig, ViewConfig } from "collection-views/config";
import { MockApi, MockNoteShort } from "collection-views/test";
import { TableView } from "collection-views/view";

const attributeNote = new MockNoteShort({
	noteId: "1",
	title: "Title 1",
	attributes: [
		{ type: "label", name: "label1", value: "Label 1" },
		{ type: "label", name: "label2", value: "Label 2" },
	],
});
const multipleValueNote = new MockNoteShort({
	noteId: "2",
	title: "Title 2",
	attributes: [
		{ type: "label", name: "test", value: "Value 1" },
		{ type: "label", name: "test", value: "Value 2" },
	],
});

describe("TableView", () => {
	let config: ViewConfig;
	let view: TableView;

	beforeEach(() => {
		const notes = [attributeNote, multipleValueNote];
		new MockApi({ notes });

		config = new ViewConfig(new MockNoteShort());
		config.attributes = [
			new AttributeConfig("label1"),
			new AttributeConfig("label2"),
		];
		view = new TableView(config, notes);
	});

	describe("render", () => {
		it("returns view", async () => {
			const $view = await view.render();
			expect($view).toHaveTextContent(
				"Titlelabel1label2Title 1Label 1Label 2Title 2"
			);
		});
	});

	describe("renderHeader", () => {
		it("returns table row", () => {
			const $row = view.renderHeader();
			const $cells = $row.querySelectorAll("th");
			expect($cells).toHaveLength(3);
			expect($cells[0]).toHaveTextContent("Title");
			expect($cells[1]).toHaveTextContent("label1");
			expect($cells[2]).toHaveTextContent("label2");
		});
	});

	describe("renderHeaderCells", () => {
		it("returns table cells", () => {
			const $cells = view.renderHeaderCells();
			expect($cells).toHaveLength(2);
			expect($cells[0]).toHaveTextContent("label1");
			expect($cells[1]).toHaveTextContent("label2");
		});
	});

	describe("renderHeaderCell", () => {
		it("returns table cell with defaults", () => {
			const $cell = view.renderHeaderCell(new AttributeConfig("test"));
			expect($cell).toHaveStyle({
				textAlign: "",
				minWidth: "",
				whiteSpace: "",
			});
			expect($cell).toHaveTextContent("test");
		});

		it("returns table cell with custom header text", () => {
			const $cell = view.renderHeaderCell(
				new AttributeConfig("test,header=Header")
			);
			expect($cell).toHaveTextContent("Header");
		});

		it("returns table cell with custom width", () => {
			const $cell = view.renderHeaderCell(
				new AttributeConfig("test,align=right")
			);
			expect($cell).toHaveStyle({ textAlign: "right" });
		});

		it("returns table cell with custom width", () => {
			const $cell = view.renderHeaderCell(
				new AttributeConfig("test,width=100")
			);
			expect($cell).toHaveStyle({ minWidth: "100px" });
		});

		it("returns table cell with wrapped text", () => {
			const $cell = view.renderHeaderCell(
				new AttributeConfig("test,wrap")
			);
			expect($cell).toHaveStyle({ whiteSpace: "normal" });
		});
	});

	describe("renderBody", () => {
		it("returns table body", async () => {
			const $body = await view.renderBody();
			expect($body).toHaveTextContent(
				"Title 1" + "Label 1" + "Label 2" + "Title 2"
			);
		});
	});

	describe("renderRow", () => {
		it("returns table row", async () => {
			const $row = await view.renderRow(attributeNote);
			expect($row).toHaveTextContent("Title 1" + "Label 1" + "Label 2");
		});
	});

	describe("renderTitleCell", () => {
		it("returns table cell", async () => {
			const $cell = await view.renderTitleCell(attributeNote);
			const $link = $cell.querySelector("a");
			expect($link).toHaveClass("stretched-link", "no-tooltip-preview");
		});
	});

	describe("renderAttributeCell", () => {
		it("returns table cell with defaults", async () => {
			const $cell = await view.renderAttributeCell(
				attributeNote,
				new AttributeConfig("label1")
			);

			expect($cell).toHaveStyle({ textAlign: "", whitespace: "" });
			expect($cell).toHaveTextContent("Label 1");
			expect($cell.children).toHaveLength(0);
		});

		it("returns table cell with text alignment", async () => {
			const $cell = await view.renderAttributeCell(
				attributeNote,
				new AttributeConfig("label1,align=right")
			);

			expect($cell).toHaveStyle({ textAlign: "right" });
		});

		it("returns table cell with wrapped text", async () => {
			const $cell = await view.renderAttributeCell(
				attributeNote,
				new AttributeConfig("label1,wrap")
			);

			expect($cell).toHaveStyle({ whiteSpace: "normal" });
		});

		it("returns table cell with truncated content", async () => {
			const $cell = await view.renderAttributeCell(
				attributeNote,
				new AttributeConfig("label1,truncate=3")
			);

			expect($cell.children).toHaveLength(1);
			expect($cell.children[0]).toHaveClass("collection-view-truncate");
		});
	});

	describe("renderAttributeCellValues", () => {
		it("returns separated values", async () => {
			const $values = await view.renderAttributeCellValues(
				multipleValueNote,
				new AttributeConfig("test")
			);

			expect($values).toHaveLength(3);
			expect($values[0]).toHaveTextContent("Value 1");
			expect($values[1]).toEqual(document.createElement("br"));
			expect($values[2]).toHaveTextContent("Value 2");
		});

		it("returns progress bars unseparated", async () => {
			const $values = await view.renderAttributeCellValues(
				new MockNoteShort({
					attributes: [
						{ type: "label", name: "count", value: "1" },
						{ type: "label", name: "count", value: "2" },
						{ type: "label", name: "total", value: "2" },
					],
				}),
				new AttributeConfig("count,progressBar=total")
			);

			expect($values).toHaveLength(2);
			expect($values[0]).toHaveTextContent("50%");
			expect($values[1]).toHaveTextContent("100%");
		});
	});

	describe("renderTruncated", () => {
		it("returns truncated content", () => {
			const $container = view.renderTruncated(
				[document.createElement("div"), new Text("Content")],
				new AttributeConfig("name,truncate=3")
			);

			expect($container).toHaveStyle({ webkitLineClamp: "3" });
			expect($container).toHaveTextContent("Content");
		});
	});
});
