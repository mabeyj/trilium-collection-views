import { AttributeConfig, ViewConfig } from "collection-views/config";
import { Group } from "collection-views/notes";
import { MockApi, MockNoteShort } from "collection-views/test";
import { BoardView } from "collection-views/view";

const relatedNote = new MockNoteShort({ noteId: "related", title: "Related" });
const notes = [
	new MockNoteShort({ noteId: "1", title: "Note 1" }),
	new MockNoteShort({ noteId: "2", title: "Note 2" }),
];

const unnamedGroup = { relatedNote: null, notes };
const namedGroup = { name: "Named group", relatedNote: null, notes };
const relatedGroup = { name: "Related group", relatedNote, notes };

describe("BoardView", () => {
	let config: ViewConfig;
	let groupConfig: AttributeConfig;
	let view: BoardView;

	beforeEach(() => {
		new MockApi({ notes: [relatedNote, ...notes] });

		config = new ViewConfig(new MockNoteShort());
		groupConfig = config.groupBy = new AttributeConfig("group");
		view = new BoardView(config, [unnamedGroup, namedGroup]);
	});

	describe("render", () => {
		test("returns view", async () => {
			const $view = await view.render();
			expect($view).toHaveTextContent(
				"None2Note 1Note 2Named group2Note 1Note 2",
			);
		});
	});

	describe("renderColumns", () => {
		test("returns columns", async () => {
			const $columns = await view.renderColumns();
			expect($columns).toHaveLength(2);
			expect($columns[0]).toHaveTextContent("None2Note 1Note 2");
			expect($columns[1]).toHaveTextContent("Named group2Note 1Note 2");
		});
	});

	describe("renderColumn", () => {
		test("returns column with defaults", async () => {
			const $column = await view.renderColumn(namedGroup);
			expect($column).toHaveStyle({ minWidth: "", width: "" });
			expect($column).toHaveTextContent("Named group2Note 1Note 2");
		});

		test("returns column with custom width", async () => {
			config.columnWidth = 200;
			const $column = await view.renderColumn(namedGroup);
			expect($column).toHaveStyle({ minWidth: "200px", width: "200px" });
		});
	});

	describe("renderColumnHeader", () => {
		test("returns header", async () => {
			const $header = await view.renderColumnHeader(namedGroup);
			expect($header).toHaveTextContent("Named group2");
		});
	});

	describe("renderColumnName", () => {
		test("returns name for unnamed group", async () => {
			const $name = await view.renderColumnName(unnamedGroup);
			expect($name).toHaveTextContent("None");
			expect($name.querySelector("a")).toBeNull();
			expect($name.children[0]).toHaveClass("text-muted");
		});

		test("returns name for group without related note", async () => {
			const $name = await view.renderColumnName(namedGroup);
			expect($name).toHaveTextContent("Named group");
			expect($name.querySelector("a")).toBeNull();
			expect($name.querySelector(".text-muted")).toBeNull();
		});

		test("returns name for group with related note", async () => {
			const $name = await view.renderColumnName(relatedGroup);
			expect($name).toHaveTextContent("Related group");
			expect($name.children[0]).toHaveAttribute("href", "related");
		});

		test("returns formatted name", async () => {
			groupConfig.badge = true;
			const $name = await view.renderColumnName(relatedGroup);
			expect($name.querySelector(".badge")).not.toBeNull();
		});
	});

	describe("renderColumnCount", () => {
		test("returns badge", () => {
			const group: Group = { relatedNote: null, notes: [] };
			for (let i = 0; i < 1000; i++) {
				group.notes.push(new MockNoteShort());
			}

			const $count = view.renderColumnCount(group);
			expect($count).toHaveTextContent("1,000");
		});
	});

	describe("renderColumnCards", () => {
		test("returns cards", async () => {
			const $cards = await view.renderColumnCards(relatedGroup);
			expect($cards).toHaveTextContent("Note 1Note 2");
		});
	});
});
