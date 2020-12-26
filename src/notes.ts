export interface Group {
	name?: string;
	relatedNote: NoteShort | null;
	notes: NoteShort[];
}

export interface SortAttribute {
	name: string;
	descending: boolean;
}

/**
 * Returns the URL for a note's cover image or undefined if it has none.
 */
export async function getCoverUrl(
	note: NoteShort
): Promise<string | undefined> {
	const content = await note.getContent();
	if (!content.startsWith("<figure")) {
		return undefined;
	}

	const match = content.match(/src="([^"]+)"/);
	if (!match) {
		return undefined;
	}

	return match[1] || undefined;
}

interface NotesByAttributeType {
	label: Record<string, NoteShort[]>;
	relation: Record<string, NoteShort[]>;
	none: NoteShort[];
}

interface AddedFlags {
	label: Record<string, boolean>;
	relation: Record<string, boolean>;
}

/**
 * Group notes by attribute values, returning an array of group objects.
 */
export async function groupNotes(
	notes: NoteShort[],
	name: string
): Promise<Group[]> {
	const types: NotesByAttributeType = {
		label: {},
		relation: {},
		none: [],
	};

	for (const note of notes) {
		const attributes = note.getAttributes(undefined, name);

		let addToNone = !attributes.length;
		const added: AddedFlags = { label: {}, relation: {} };

		for (const attribute of attributes) {
			if (!attribute.value.trim()) {
				addToNone = true;
				continue;
			}
			if (attribute.type !== "label" && attribute.type !== "relation") {
				continue;
			}
			if (added[attribute.type][attribute.value]) {
				continue;
			}

			const groups = types[attribute.type];
			if (!groups[attribute.value]) {
				groups[attribute.value] = [];
			}
			groups[attribute.value].push(note);
			added[attribute.type][attribute.value] = true;
		}

		if (addToNone) {
			types.none.push(note);
		}
	}

	const groups: Group[] = [];
	for (const [value, groupNotes] of Object.entries(types.label)) {
		groups.push({
			name: value,
			relatedNote: null,
			notes: groupNotes,
		});
	}
	for (const [noteId, groupNotes] of Object.entries(types.relation)) {
		const relatedNote = await api.getNote(noteId);
		groups.push({
			name: relatedNote ? relatedNote.title : noteId,
			relatedNote,
			notes: groupNotes,
		});
	}

	groups.sort((a, b) =>
		getSortableGroupName(a) < getSortableGroupName(b) ? -1 : 1
	);

	if (types.none.length) {
		groups.push({ relatedNote: null, notes: types.none });
	}

	return groups;
}

/**
 * Sorts an array of notes.
 */
export async function sortNotes(
	notes: NoteShort[],
	sortAttributes: SortAttribute[]
): Promise<void> {
	const sortableValues: Record<string, Record<string, string>> = {};
	for (const note of notes) {
		sortableValues[note.noteId] = {};
		for (const sortAttribute of sortAttributes) {
			const value = await getSortableAttributeValue(
				note,
				sortAttribute.name
			);
			sortableValues[note.noteId][sortAttribute.name] = value;
		}
	}

	notes.sort((a, b) => {
		for (const sortAttribute of sortAttributes) {
			let valueA: number | string =
				sortableValues[a.noteId][sortAttribute.name];
			let valueB: number | string =
				sortableValues[b.noteId][sortAttribute.name];

			const floatA = parseFloat(valueA);
			const floatB = parseFloat(valueB);
			if (!isNaN(floatA) && !isNaN(floatB)) {
				valueA = floatA;
				valueB = floatB;
			}

			if (valueA < valueB) {
				return sortAttribute.descending ? 1 : -1;
			}
			if (valueA > valueB) {
				return sortAttribute.descending ? -1 : 1;
			}
		}

		const titleA = getSortableTitle(a);
		const titleB = getSortableTitle(b);
		if (titleA < titleB) {
			return -1;
		}
		if (titleA > titleB) {
			return 1;
		}

		return 0;
	});
}

/**
 * Returns the sortable name of a group.
 */
function getSortableGroupName(group: Group): string {
	if (group.relatedNote) {
		return getSortableTitle(group.relatedNote);
	}
	if (group.name) {
		return group.name.toLowerCase();
	}
	return "";
}

/**
 * Returns the sortable value of an attribute of some note.
 *
 * If the attribute is a relation, then the related note's sortable title is
 * returned. Otherwise, the attribute's value is returned.
 */
async function getSortableAttributeValue(
	note: NoteShort,
	name: string
): Promise<string> {
	const attribute = note.getAttribute(undefined, name);
	if (!attribute) {
		return "";
	}

	let relatedNote: NoteShort | null = null;
	if (attribute.type === "relation") {
		relatedNote = await api.getNote(attribute.value);
	}
	if (relatedNote) {
		return getSortableTitle(relatedNote);
	}

	return attribute.value.trim().toLowerCase();
}

/**
 * Returns the sortable title of a note.
 */
function getSortableTitle(note: NoteShort): string {
	const sortableTitle = note.getLabelValue("sortableTitle") || "";
	const title = sortableTitle.trim() || note.title.trim();
	return title.toLowerCase();
}
