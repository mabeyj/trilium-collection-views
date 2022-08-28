import {
	getCoverUrl,
	getSortableAttributeValue,
	getSortableGroupName,
	getSortableTitle,
	groupNotes,
	sortNotes,
} from "collection-views/notes";
import { MockApi, MockNoteShort } from "collection-views/test";

describe("getCoverUrl", () => {
	test.each([
		["<p></p>", undefined],
		[
			'<p>text</p><img src="api/images/cover.png"><img src="ignore.png">',
			"api/images/cover.png",
		],
	])("%p returns %p", async (content, expected) => {
		const note = new MockNoteShort({ content });
		expect(await getCoverUrl(note)).toBe(expected);
	});
});

describe("groupNotes", () => {
	test("returns empty array for no notes", async () => {
		expect(await groupNotes([], "group")).toEqual([]);
	});

	test("returns groups of notes", async () => {
		const relatedNotes = [
			new MockNoteShort({ noteId: "1", title: "Title 1" }),
			new MockNoteShort({
				noteId: "2",
				title: "Title 2",
				attributes: [
					{
						type: "label",
						name: "sortableTitle",
						value: "  b  ",
					},
				],
			}),
		];

		const notes = [
			// Note without group attribute.
			new MockNoteShort({
				attributes: [{ type: "label", name: "test", value: "test" }],
			}),

			// Note with blank attribute for group attribute.
			new MockNoteShort({
				attributes: [{ type: "label", name: "group", value: "   " }],
			}),

			// Note with multiple labels for group attribute.
			new MockNoteShort({
				attributes: [
					{ type: "label", name: "group", value: "a" },
					{ type: "label", name: "group", value: "z" },
					{ type: "label", name: "group", value: "a" },
				],
			}),

			// Note with multiple relations for group attribute.
			new MockNoteShort({
				attributes: [
					{
						type: "relation",
						name: "group",
						value: relatedNotes[0].noteId,
					},
					{
						type: "relation",
						name: "group",
						value: relatedNotes[1].noteId,
					},
					{
						type: "relation",
						name: "group",
						value: relatedNotes[0].noteId,
					},
				],
			}),

			// Note with invalid relation for group attribute.
			new MockNoteShort({
				attributes: [{ type: "relation", name: "group", value: "bad" }],
			}),
		];

		new MockApi({ notes: relatedNotes });

		expect(await groupNotes(notes, "group")).toEqual([
			{ name: "a", relatedNote: null, notes: [notes[2]] },
			{
				name: "Title 2",
				relatedNote: relatedNotes[1],
				notes: [notes[3]],
			},
			{ name: "bad", relatedNote: null, notes: [notes[4]] },
			{
				name: "Title 1",
				relatedNote: relatedNotes[0],
				notes: [notes[3]],
			},
			{ name: "z", relatedNote: null, notes: [notes[2]] },
			{ name: undefined, relatedNote: null, notes: [notes[0], notes[1]] },
		]);
	});
});

describe("sortNotes", () => {
	const relatedNotes = [
		new MockNoteShort({ noteId: "10", title: "a" }),
		new MockNoteShort({
			noteId: "11",
			attributes: [{ type: "label", name: "sortableTitle", value: "a" }],
		}),
		new MockNoteShort({ noteId: "20", title: "10" }),
		new MockNoteShort({
			noteId: "21",
			attributes: [{ type: "label", name: "sortableTitle", value: "10" }],
		}),
	];

	const textNotes = [
		new MockNoteShort({
			// Label = a, title = b
			noteId: "1",
			title: "b",
			attributes: [{ type: "label", name: "text", value: "a" }],
		}),
		new MockNoteShort({
			// Related note title = a, title = a
			noteId: "2",
			title: "a",
			attributes: [{ type: "relation", name: "text", value: "10" }],
		}),
		new MockNoteShort({
			// Related note sortableTitle = a, title = c
			noteId: "3",
			title: "c",
			attributes: [{ type: "relation", name: "text", value: "11" }],
		}),
		new MockNoteShort({
			// Label = b
			noteId: "4",
			attributes: [{ type: "label", name: "text", value: "b" }],
		}),
		new MockNoteShort({
			// Missing attribute
			noteId: "5",
		}),
	];

	const numericNotes = [
		new MockNoteShort({
			// Label = 10, title = b
			noteId: "1",
			title: "b",
			attributes: [{ type: "label", name: "number", value: "10" }],
		}),
		new MockNoteShort({
			// Related note title = 10, title = a
			noteId: "2",
			title: "a",
			attributes: [{ type: "relation", name: "number", value: "20" }],
		}),
		new MockNoteShort({
			// Related note title = 10, title = c
			noteId: "3",
			title: "c",
			attributes: [{ type: "relation", name: "number", value: "21" }],
		}),
		new MockNoteShort({
			// Label = 100
			noteId: "4",
			attributes: [{ type: "label", name: "number", value: "100" }],
		}),
		new MockNoteShort({
			// Label = 20
			noteId: "5",
			attributes: [{ type: "label", name: "number", value: "20" }],
		}),
		new MockNoteShort({
			// Label = a
			noteId: "6",
			attributes: [{ type: "label", name: "number", value: "a" }],
		}),
		new MockNoteShort({
			// Missing attribute
			noteId: "7",
		}),
	];

	const multipleNotes = [
		new MockNoteShort({
			// Label one = b
			noteId: "1",
			attributes: [{ type: "label", name: "one", value: "b" }],
		}),
		new MockNoteShort({
			// Label one = a, label two = a, title = a
			noteId: "2",
			title: "a",
			attributes: [
				{ type: "label", name: "one", value: "a" },
				{ type: "label", name: "two", value: "a" },
			],
		}),
		new MockNoteShort({
			// Label one = a, label two = b, title = a
			noteId: "3",
			title: "a",
			attributes: [
				{ type: "label", name: "one", value: "a" },
				{ type: "label", name: "two", value: "b" },
			],
		}),
		new MockNoteShort({
			// Label one = a, label two = a, title = b
			noteId: "4",
			title: "b",
			attributes: [
				{ type: "label", name: "one", value: "a" },
				{ type: "label", name: "two", value: "a" },
			],
		}),
		new MockNoteShort({
			// Label one = a, label two = b, title = b
			noteId: "5",
			title: "b",
			attributes: [
				{ type: "label", name: "one", value: "a" },
				{ type: "label", name: "two", value: "b" },
			],
		}),
	];

	test.each([
		[
			"sorts notes by title",
			[
				new MockNoteShort({ noteId: "1", title: "c" }),
				new MockNoteShort({ noteId: "2", title: "a" }),
				new MockNoteShort({
					noteId: "3",
					title: "b",
					attributes: [
						{ type: "label", name: "sortableTitle", value: "z" },
					],
				}),
			],
			[],
			["2", "1", "3"],
		],
		[
			"sorts notes by text ascending, then title",
			textNotes,
			[{ name: "text", descending: false }],
			["5", "2", "1", "3", "4"],
		],
		[
			"sorts notes by text descending, then title",
			textNotes,
			[{ name: "text", descending: true }],
			["4", "2", "1", "3", "5"],
		],
		[
			"sorts notes by number ascending, then title",
			numericNotes,
			[{ name: "number", descending: false }],
			["7", "2", "1", "3", "5", "4", "6"],
		],
		[
			"sorts notes by number descending, then title",
			numericNotes,
			[{ name: "number", descending: true }],
			["6", "4", "5", "2", "1", "3", "7"],
		],
		[
			"sorts notes by multiple attributes",
			multipleNotes,
			[
				{ name: "one", descending: false },
				{ name: "two", descending: true },
			],
			["3", "5", "2", "4", "1"],
		],
	])("%s", async (_, notes, sortAttributes, expected) => {
		new MockApi({ notes: relatedNotes });
		await sortNotes(notes, sortAttributes);
		expect(notes.map((note) => note.noteId)).toEqual(expected);
	});
});

describe("getSortableGroupName", () => {
	test.each([
		["returns the group name", "  Group  ", null, "  group  "],
		[
			"returns a related note's title",
			"  Group  ",
			new MockNoteShort({ title: "  Title  " }),
			"title",
		],
		[
			"returns a related note's sortableTitle",
			"  Group  ",
			new MockNoteShort({
				title: "  Title  ",
				attributes: [
					{
						type: "label",
						name: "sortableTitle",
						value: "  Sortable Title  ",
					},
				],
			}),
			"sortable title",
		],
		[
			"returns an empty string if no name or related note",
			undefined,
			null,
			"",
		],
	])("%s", (_, name, relatedNote, expected) => {
		const group = { name, relatedNote, notes: [] };
		expect(getSortableGroupName(group)).toBe(expected);
	});
});

describe("getSortableAttributeValue", () => {
	test.each([
		[
			"returns a label's value",
			[],
			[
				{ type: "label", name: "test", value: "  Value 1  " },
				{ type: "label", name: "test", value: "  Value 2  " },
			],
			"value 1",
		],
		[
			"returns a related note's title",
			[new MockNoteShort({ noteId: "1", title: "  Title  " })],
			[
				{ type: "relation", name: "test", value: "1" },
				{ type: "relation", name: "test", value: "2" },
			],
			"title",
		],
		[
			"returns a related note's sortableTitle",
			[
				new MockNoteShort({
					noteId: "1",
					title: "  Title  ",
					attributes: [
						{
							type: "label",
							name: "sortableTitle",
							value: "  Sortable Title  ",
						},
					],
				}),
			],
			[{ type: "relation", name: "test", value: "1" }],
			"sortable title",
		],
		[
			"returns a relation's value if no related note found",
			[],
			[{ type: "relation", name: "test", value: "  Bad  " }],
			"bad",
		],
		["returns an empty string if no attribute found", [], [], ""],
	])("%s", async (_, notes, attributes, expected) => {
		new MockApi({ notes });
		const note = new MockNoteShort({ attributes });
		expect(await getSortableAttributeValue(note, "test")).toBe(expected);
	});
});

describe("getSortableTitle", () => {
	test.each([
		["returns a note's title", [], "title"],
		[
			"returns a note's sortableTitle",
			[
				{
					type: "label",
					name: "sortableTitle",
					value: "  Sortable Title 1  ",
				},
				{
					type: "label",
					name: "sortableTitle",
					value: "  Sortable Title 2  ",
				},
			],
			"sortable title 1",
		],
	])("%s", (_, attributes, expected) => {
		const note = new MockNoteShort({ title: "  Title  ", attributes });
		expect(getSortableTitle(note)).toBe(expected);
	});
});
