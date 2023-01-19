import {
	getAttribute,
	getAttributes,
	getAttributeValue,
	getCoverUrl,
	getLabelValueByPath,
	getSortableAttributeValue,
	getSortableGroupName,
	getSortableTitle,
	groupNotes,
	sortNotes,
} from "collection-views/notes";
import { MockApi, MockNoteShort } from "collection-views/test";

const attributeNote = new MockNoteShort({
	noteId: "1",
	title: "Title",
	attributes: [
		{ type: "label", name: "test", value: "Label" },
		{ type: "relation", name: "test", value: "Relation" },
		{ type: "label", name: "label", value: "2" },
		{ type: "relation", name: "relation", value: "2" },
		{ type: "relation", name: "relation", value: "3" },
		{ type: "relation", name: "relation", value: "bad" },
	],
});
const relatedNotes = [
	new MockNoteShort({
		noteId: "2",
		title: "Related note 1",
		attributes: [
			{ type: "label", name: "label", value: "Label 1" },
			{ type: "label", name: "label", value: "Label 2" },
		],
	}),
	new MockNoteShort({
		noteId: "3",
		title: "Related note 2",
		attributes: [{ type: "label", name: "label", value: "Label 3" }],
	}),
];

describe("getAttributes", () => {
	beforeEach(() => {
		new MockApi({ notes: relatedNotes });
	});

	test.each([
		["returns ID for $id", "$id", "1"],
		["returns ID for $noteId", "$noteId", "1"],
		["returns type", "$type", "text"],
		["returns content type", "$mime", "text/html"],
		["returns title", "$title", "Title"],
		["returns content length", "$contentSize", "1000"],
		["returns date created", "$dateCreated", "2020-01-02 03:04:05.678Z"],
		["returns date modified", "$dateModified", "2020-02-03 04:05:06.789Z"],
	])("%s", async (_, path, expected) => {
		const attributes = await getAttributes(attributeNote, path);
		expect(attributes).toHaveLength(1);
		expect(attributes[0].type).toBe("label");
		expect(attributes[0].value).toBe(expected);
	});

	test.each([
		["returns empty array for empty name", "", []],
		["returns empty array for invalid property", "$bad", []],
		["returns attributes", "test", ["Label", "Relation"]],
		[
			"returns related notes' attributes",
			"relation.label",
			["Label 1", "Label 2", "Label 3"],
		],
		["returns empty array for missing attribute", "bad", []],
		["returns empty array for attributes of labels", "label.label", []],
		[
			"returns empty array for attributes of missing attributes",
			"bad.bad",
			[],
		],
		[
			"returns related notes' properties",
			"relation.$title",
			["Related note 1", "Related note 2"],
		],
		[
			"returns empty array for missing attributes for related notes",
			"relation.bad",
			[],
		],
	])("%s", async (_, path, expected) => {
		const attributes = await getAttributes(attributeNote, path);
		expect(attributes.map((attribute) => attribute.value)).toEqual(
			expected
		);
	});
});

describe("getAttribute", () => {
	test("returns first attribute", async () => {
		const attribute = await getAttribute(attributeNote, "test");
		expect(attribute).not.toBeNull();
		expect(attribute?.value).toBe("Label");
	});

	test("returns null if not found", async () => {
		const attribute = await getAttribute(attributeNote, "bad");
		expect(attribute).toBeNull();
	});
});

describe("getAttributeValue", () => {
	test.each([
		["returns value of first attribute", "test", "Label"],
		["returns empty string if not found", "bad", ""],
	])("returns %s", async (_, path, expected) => {
		const value = await getAttributeValue(attributeNote, path);
		expect(value).toBe(expected);
	});
});

describe("getLabelValueByPath", () => {
	test("returns value of first label", async () => {
		const note = new MockNoteShort({
			attributes: [
				{ type: "relation", name: "test", value: "Relation" },
				{ type: "label", name: "test", value: "Label 1" },
				{ type: "label", name: "test", value: "Label 2" },
			],
		});

		const value = await getLabelValueByPath(note, "test");
		expect(value).toBe("Label 1");
	});

	test("returns empty string if not found", async () => {
		const value = await getLabelValueByPath(attributeNote, "relation");
		expect(value).toBe("");
	});
});

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
	test("returns empty array if no notes", async () => {
		expect(await groupNotes([], "group")).toEqual([]);
	});

	test("returns groups for attribute", async () => {
		const relatedNotes = [
			new MockNoteShort({ noteId: "1", title: "Note 1" }),
			new MockNoteShort({
				noteId: "2",
				title: "Note 2",
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

		const groups = await groupNotes(notes, "group");
		expect(groups).toEqual([
			{ name: "a", relatedNote: null, notes: [notes[2]] },
			{
				name: "Note 2",
				relatedNote: relatedNotes[1],
				notes: [notes[3]],
			},
			{ name: "bad", relatedNote: null, notes: [notes[4]] },
			{
				name: "Note 1",
				relatedNote: relatedNotes[0],
				notes: [notes[3]],
			},
			{ name: "z", relatedNote: null, notes: [notes[2]] },
			{ name: undefined, relatedNote: null, notes: [notes[0], notes[1]] },
		]);
	});

	test("returns groups for related note's attribute", async () => {
		const notes = [
			new MockNoteShort({
				attributes: [
					{ type: "relation", name: "relation", value: "1" },
				],
			}),
			new MockNoteShort({
				attributes: [
					{ type: "relation", name: "relation", value: "2" },
				],
			}),
		];
		const relatedNotes = [
			new MockNoteShort({
				noteId: "1",
				attributes: [
					{ type: "label", name: "label", value: "Label 1" },
				],
			}),
			new MockNoteShort({
				noteId: "2",
				attributes: [
					{ type: "label", name: "label", value: "Label 2" },
				],
			}),
		];

		new MockApi({ notes: relatedNotes });

		const groups = await groupNotes(notes, "relation.label");
		expect(groups).toEqual([
			{ name: "Label 1", relatedNote: null, notes: [notes[0]] },
			{ name: "Label 2", relatedNote: null, notes: [notes[1]] },
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

	beforeEach(() => {
		new MockApi({ notes: relatedNotes });
	});

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
			[{ path: "text", descending: false }],
			["5", "2", "1", "3", "4"],
		],
		[
			"sorts notes by text descending, then title",
			textNotes,
			[{ path: "text", descending: true }],
			["4", "2", "1", "3", "5"],
		],
		[
			"sorts notes by number ascending, then title",
			numericNotes,
			[{ path: "number", descending: false }],
			["7", "2", "1", "3", "5", "4", "6"],
		],
		[
			"sorts notes by number descending, then title",
			numericNotes,
			[{ path: "number", descending: true }],
			["6", "4", "5", "2", "1", "3", "7"],
		],
		[
			"sorts notes by multiple attributes",
			multipleNotes,
			[
				{ path: "one", descending: false },
				{ path: "two", descending: true },
			],
			["3", "5", "2", "4", "1"],
		],
	])("%s", async (_, notes, sortAttributes, expected) => {
		await sortNotes(notes, sortAttributes);
		expect(notes.map((note) => note.noteId)).toEqual(expected);
	});
});

describe("getSortableGroupName", () => {
	test.each([
		["returns group name", "  Group  ", null, "  group  "],
		[
			"returns related note's title",
			"  Group  ",
			new MockNoteShort({ title: "  Title  " }),
			"title",
		],
		[
			"returns related note's sortableTitle",
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
	const notes = [
		new MockNoteShort({
			attributes: [
				{ type: "label", name: "label", value: "  Value 1  " },
				{ type: "label", name: "label", value: "Value 2" },
				{ type: "relation", name: "relation", value: "1" },
				{ type: "relation", name: "relation", value: "2" },
				{ type: "relation", name: "sortable", value: "2" },
				{ type: "relation", name: "notFound", value: "  Bad  " },
			],
		}),
		new MockNoteShort({
			noteId: "1",
			title: "  Title 1  ",
			attributes: [
				{ type: "label", name: "label", value: "  Related Label 1  " },
			],
		}),
		new MockNoteShort({
			noteId: "2",
			title: "  Title 2  ",
			attributes: [
				{ type: "label", name: "sortableTitle", value: "  Sortable  " },
				{ type: "label", name: "label", value: "Related Label 2" },
			],
		}),
	];

	beforeEach(() => {
		new MockApi({ notes });
	});

	test.each([
		["returns label's value", "label", "value 1"],
		["returns related note's title", "relation", "title 1"],
		["returns related note's sortableTitle", "sortable", "sortable"],
		[
			"returns relation's value if related note not found",
			"notFound",
			"bad",
		],
		[
			"returns related note's label's value",
			"relation.label",
			"related label 1",
		],
		["returns empty string if attribute not found", "bad", ""],
	])("%s", async (_, path, expected) => {
		const value = await getSortableAttributeValue(notes[0], path);
		expect(value).toBe(expected);
	});
});

describe("getSortableTitle", () => {
	test.each([
		["returns note's title", [], "title"],
		[
			"returns note's sortableTitle",
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
