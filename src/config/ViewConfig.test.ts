import { AttributeConfig, ViewConfig, ViewType } from "collection-views/config";
import { MockApi, MockNoteShort } from "collection-views/test";

describe("ViewConfig", () => {
	describe("constructor", () => {
		function getNote(name: string, value: string): NoteShort {
			return new MockNoteShort({
				title: "Note Title",
				attributes: [{ type: "label", name, value }],
			});
		}

		test.each([
			["  board  ", ViewType.Board],
			["gallery", ViewType.Gallery],
			["table", ViewType.Table],
			["bad", ViewType.Table],
		])("view label %p sets view to %p", (value, expected) => {
			const config = new ViewConfig(getNote("view", value));
			expect(config.view).toBe(expected);
		});

		test("sets query", () => {
			const config = new ViewConfig(
				getNote("query", "  #one and #two  "),
			);
			expect(config.query).toBe("#one and #two");
		});

		test.each([
			["clears groupBy if groupBy label is empty", "  ", undefined],
			[
				"sets groupBy otherwise",
				"path,badge",
				new AttributeConfig("path,badge"),
			],
		])("%s", (_, value, expected) => {
			const config = new ViewConfig(getNote("groupBy", value));
			expect(config.groupBy).toEqual(expected);
		});

		test.each([
			["clears sort if sort label is empty", "  ", []],
			[
				"sets sort otherwise",
				"  one  ,  !two  ",
				[
					{ path: "one", descending: false },
					{ path: "two", descending: true },
				],
			],
		])("%s", (_, value, expected) => {
			const config = new ViewConfig(getNote("sort", value));
			expect(config.sort).toEqual(expected);
		});

		test.each([
			["", undefined],
			["0", 1],
			["10.9", 10],
			["99", 20],
			["bad", undefined],
		])("columns label %p sets columns to %p", (value, expected) => {
			const config = new ViewConfig(getNote("columns", value));
			expect(config.columns).toBe(expected);
		});

		test.each([
			["", undefined],
			["0", 1],
			["10.9", 10],
			["9999", 1000],
			["bad", undefined],
		])(
			"columnWidth label %p sets column width to %p",
			(value, expected) => {
				const config = new ViewConfig(getNote("columnWidth", value));
				expect(config.columnWidth).toBe(expected);
			},
		);

		test.each([
			["", undefined],
			["-1", 0],
			["10.9", 10],
			["9999", 1000],
			["bad", undefined],
		])(
			"coverHeight label %p sets cover height to %p",
			(value, expected) => {
				const config = new ViewConfig(getNote("coverHeight", value));
				expect(config.coverHeight).toBe(expected);
			},
		);

		test("sets attributes from attribute labels", () => {
			const note = new MockNoteShort({
				attributes: [
					{ type: "label", name: "attribute", value: "one,badge" },
					{ type: "label", name: "attribute", value: "two,number" },
				],
			});

			const config = new ViewConfig(note);
			expect(config.attributes).toEqual([
				new AttributeConfig("one,badge"),
				new AttributeConfig("two,number"),
			]);
		});
	});

	describe("getQuery", () => {
		const relatedNote = new MockNoteShort({
			noteId: "2",
			attributes: [{ type: "label", name: "label", value: "related" }],
		});

		beforeEach(() => {
			new MockApi({ notes: [relatedNote] });
		});

		test.each([
			["$id", '"1"'],
			["#test = $id", '#test = "1"'],
			["#test = $id.bad", '#test = "1".bad'],
			["#test = $noteId", '#test = "1"'],
			["#test = $noteId.bad", '#test = "1".bad'],
			["#test = $title", '#test = "Note Title"'],
			["#test = $title.bad", '#test = "Note Title".bad'],
			["#test = $renderNote", "#test = $renderNote"],
			["#test = $renderNote.", "#test = $renderNote."],
			["#test = $renderNote.$", "#test = $renderNote.$"],
			["#test = $renderNote.$id", '#test = "1"'],
			["#test = $renderNote.label", '#test = "value"'],
			["#test = $renderNote.label.", '#test = "value".'],
			["#test = $renderNote.relation.label", '#test = "related"'],
			["#test = $renderNote.bad", '#test = ""'],
			["#test = $bad", "#test = $bad"],
			["#test = $renderNote.escape", '#test = "\\\\ \\" \\\\ \\""'],
			[
				"note.noteId = $id or note.title = $title or #test",
				'note.noteId = "1" or note.title = "Note Title" or #test',
			],
			[
				"#label = $renderNote.relation.label and #test",
				'#label = "related" and #test',
			],
		])("query %p returns %p", async (rawQuery, expected) => {
			const note = new MockNoteShort({
				noteId: "1",
				title: "Note Title",
				attributes: [
					{ type: "label", name: "label", value: "value" },
					{ type: "label", name: "query", value: rawQuery },
					{ type: "label", name: "escape", value: '\\ " \\ "' },
					{ type: "relation", name: "relation", value: "2" },
				],
			});

			const config = new ViewConfig(note);
			const query = await config.getQuery();
			expect(query).toBe(expected);
		});
	});
});
