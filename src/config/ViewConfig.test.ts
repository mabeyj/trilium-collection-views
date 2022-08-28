import { MockNoteShort } from "collection-views/test";
import { AttributeConfig, ViewConfig, ViewType } from "collection-views/config";

describe("ViewConfig", () => {
	describe("constructor", () => {
		function getNote(name: string, value: string): NoteShort {
			return new MockNoteShort({
				title: "Title",
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

		test.each([
			["  #one and #two  ", "#one and #two"],
			["#title = $title", '#title = "Title"'],
		])("query label %p sets query to %p", (value, expected) => {
			const config = new ViewConfig(getNote("query", value));
			expect(config.query).toBe(expected);
		});

		test.each([
			["empty groupBy label clears groupBy", "  ", undefined],
			[
				"non-empty groupBy label sets groupBy",
				"name,badge",
				new AttributeConfig("name,badge"),
			],
		])("%s", (_, value, expected) => {
			const config = new ViewConfig(getNote("groupBy", value));
			expect(config.groupBy).toEqual(expected);
		});

		test.each([
			["empty sort label sets clears sort", "  ", []],
			[
				"non-empty sort label sets sort",
				"  one  ,  !two  ",
				[
					{ name: "one", descending: false },
					{ name: "two", descending: true },
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
			}
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
			}
		);

		test("attribute labels set attributes", () => {
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
});
