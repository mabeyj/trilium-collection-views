import { parseFloatStrict } from "collection-views/math";

const attributeNameRegex = "(\\$[a-z]+|[\\w:]+)";
export const attributePathRegex = new RegExp(
	`${attributeNameRegex}(\.${attributeNameRegex})*`,
	"i"
);

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
 * Returns attributes at the given path for the given note.
 *
 * A path can either be a single attribute name or multiple names separated by
 * a period (".").
 *
 * If the path is a single attribute name, then this will return all attributes
 * defined on the given note having that name.
 *
 * If the path consists of multiple names, then the last name refers to an
 * attribute and all other names in the path refer to relations. This will
 * fetch all notes targeted by those relations, then return all attributes from
 * those targeted notes having the attribute name.
 *
 * For example, the path "x.y.z" would mean:
 *
 * 1. Fetch all notes targeted by relation "x" of the given note.
 * 2. Fetch all notes targeted by relation "y" of all notes from step 1.
 * 3. Return all "z" attributes of all notes from step 2.
 *
 * A name can either be the name of an attribute or one of the special names
 * listed below. These special names refer to a note's properties instead of
 * user-defined attributes. Properties are returned in the form of a label.
 *
 * - $id or $noteId: The note's ID.
 * - $type: The note's type (as listed under Note Info such as "text").
 * - $mime: The note's content type (as listed under Note Info such as
 *   "text/html").
 * - $title: The note's title.
 * - $contentSize: The size of the note's content in bytes.
 * - $dateCreated: The note's creation date in UTC and RFC 3339 format.
 * - $dateModified: The note's modification date in UTC and RFC 3339 format.
 *
 * If an attribute is not found, then an empty array is returned.
 *
 * If a relation refers to a note that does not exist, then it is ignored.
 */
export async function getAttributes(
	note: NoteShort,
	path: string
): Promise<Attribute[]> {
	if (!path) {
		return [];
	}

	const parts = path.split(".");
	if (parts.length > 1) {
		const attributes = [];
		const targetPath = parts.slice(1).join(".");
		for (const target of await note.getRelationTargets(parts[0])) {
			const targetAttributes = await getAttributes(target, targetPath);
			attributes.push(...targetAttributes);
		}

		return attributes;
	}

	let value: string | undefined;
	switch (path) {
		case "$id":
		case "$noteId":
			value = note.noteId;
			break;
		case "$type":
			value = note.type;
			break;
		case "$mime":
			value = note.mime;
			break;
		case "$title":
			value = note.title;
			break;
		case "$contentSize":
			value = `${(await note.getNoteComplement()).contentLength}`;
			break;
		case "$dateCreated":
			value = (await note.getNoteComplement()).utcDateCreated;
			break;
		case "$dateModified":
			value = (await note.getNoteComplement()).combinedUtcDateModified;
			break;
	}
	if (value !== undefined) {
		return [{ type: "label", value }];
	}

	return note.getAttributes(undefined, path);
}

/**
 * Returns the first value of the attribute referenced by the given path that
 * belong to the given note or notes targeted by the given note's relations.
 *
 * See getAttributes for more details.
 *
 * If no attributes are found, then an empty string is returned.
 */
export async function getAttributeValue(
	note: NoteShort,
	name: string
): Promise<string> {
	const attributes = await getAttributes(note, name);
	return attributes[0]?.value || "";
}

/**
 * Returns the URL for a note's cover image or undefined if it has none.
 */
export async function getCoverUrl(
	note: NoteShort
): Promise<string | undefined> {
	const content = await note.getContent();
	if (!content.includes("<img")) {
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

			const floatA = parseFloatStrict(valueA);
			const floatB = parseFloatStrict(valueB);
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
export function getSortableGroupName(group: Group): string {
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
export async function getSortableAttributeValue(
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
export function getSortableTitle(note: NoteShort): string {
	const sortableTitle = note.getLabelValue("sortableTitle") || "";
	const title = sortableTitle.trim() || note.title.trim();
	return title.toLowerCase();
}
