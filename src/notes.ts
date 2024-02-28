import { parseFloatStrict } from "collection-views/math";

const attributeNameRegex = "(\\$[a-z]+|[\\w:]+)";
export const attributePathRegex = new RegExp(
	`${attributeNameRegex}(\\.${attributeNameRegex})*`,
	"i"
);

export interface Group {
	name?: string;
	relatedNote: NoteShort | null;
	notes: NoteShort[];
}

export interface SortAttribute {
	path: string;
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
export async function getAttributesByPath(
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
			attributes.push(...(await getAttributesByPath(target, targetPath)));
		}

		return attributes;
	}

	let value: string | null = null;
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

		case "$contentSize": {
			const size = await getContentLength(note);
			if (size !== null) {
				value = `${size}`;
			}
			break;
		}

		case "$dateCreated":
			value = await getDateCreated(note);
			break;

		case "$dateModified":
			value = await getDateModified(note);
			break;
	}
	if (value !== null) {
		return [{ type: "label", value }];
	}

	return note.getAttributes(undefined, path);
}

/**
 * Returns the first attribute referenced by the given path for the given note
 * or null if no attributes are found.
 *
 * See getAttributesByPath for attribute path syntax.
 */
export async function getAttributeByPath(
	note: NoteShort,
	path: string
): Promise<Attribute | null> {
	const attributes = await getAttributesByPath(note, path);
	return attributes.length ? attributes[0] : null;
}

/**
 * Returns the value of the first attribute referenced by the given path for the
 * given note or an empty string if no attributes are found.
 *
 * See getAttributesByPath for attribute path syntax.
 */
export async function getAttributeValueByPath(
	note: NoteShort,
	path: string
): Promise<string> {
	const attribute = await getAttributeByPath(note, path);
	return attribute?.value ?? "";
}

/**
 * Returns the value of the first label referenced by the given path for the
 * given note or an empty string if no labels are found.
 *
 * See getAttributesByPath for attribute path syntax.
 */
export async function getLabelValueByPath(
	note: NoteShort,
	path: string
): Promise<string> {
	for (const attribute of await getAttributesByPath(note, path)) {
		if (attribute.type === "label") {
			return attribute.value;
		}
	}
	return "";
}

/**
 * Returns the URL for a note's cover image or undefined if it has none.
 */
export async function getCoverUrl(
	note: NoteShort
): Promise<string | undefined> {
	if (note.type === "image") {
		return `api/images/${note.noteId}/${encodeURIComponent(note.title)}`;
	}
	if (note.type !== "text") {
		return undefined;
	}

	const content = await getContent(note);
	if (!content?.includes("<img")) {
		return undefined;
	}

	const match = content.match(/src="([^"]+)"/);
	if (!match) {
		return undefined;
	}

	return match[1] || undefined;
}

interface NotesByAttributeType {
	label: Partial<Record<string, NoteShort[]>>;
	relation: Partial<Record<string, NoteShort[]>>;
	none: NoteShort[];
}

interface AddedFlags {
	label: Partial<Record<string, boolean>>;
	relation: Partial<Record<string, boolean>>;
}

/**
 * Group notes by attribute values, returning an array of group objects.
 */
export async function groupNotes(
	notes: NoteShort[],
	path: string
): Promise<Group[]> {
	const types: NotesByAttributeType = {
		label: {},
		relation: {},
		none: [],
	};

	for (const note of notes) {
		const attributes = await getAttributesByPath(note, path);

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

			const groupNotes = (types[attribute.type][attribute.value] ??= []);
			groupNotes.push(note);

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
			notes: groupNotes ?? [],
		});
	}
	for (const [noteId, groupNotes] of Object.entries(types.relation)) {
		const relatedNote = await api.getNote(noteId);
		groups.push({
			name: relatedNote ? relatedNote.title : noteId,
			relatedNote,
			notes: groupNotes ?? [],
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
				sortAttribute.path
			);
			sortableValues[note.noteId][sortAttribute.path] = value;
		}
	}

	notes.sort((a, b) => {
		for (const sortAttribute of sortAttributes) {
			let valueA: number | string =
				sortableValues[a.noteId][sortAttribute.path];
			let valueB: number | string =
				sortableValues[b.noteId][sortAttribute.path];

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
 * Returns the sortable value of an attribute at the given path for the given
 * note.
 *
 * If the attribute is a relation, then the related note's sortable title is
 * returned. Otherwise, the attribute's value is returned.
 *
 * See getAttributesByPath for attribute path syntax.
 */
export async function getSortableAttributeValue(
	note: NoteShort,
	path: string
): Promise<string> {
	const attribute = await getAttributeByPath(note, path);
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
	const sortableTitle = note.getLabelValue("sortableTitle") ?? "";
	const title = sortableTitle.trim() || note.title.trim();
	return title.toLowerCase();
}

/**
 * Returns the given note's content or null if not available.
 */
export async function getContent(note: NoteShort): Promise<string | null> {
	if (note.getBlob) {
		// Available since Trilium v0.61.
		return (await note.getBlob()).content;
	}
	if (note.getNoteComplement) {
		// Deprecated since Trilium v0.61.
		return (await note.getNoteComplement()).content ?? null;
	}
	return null;
}

/**
 * Returns the size of the given note's content in bytes or null if not
 * available.
 */
export async function getContentLength(
	note: NoteShort
): Promise<number | null> {
	if (note.getBlob) {
		// Available since Trilium v0.61.
		return (await note.getBlob()).contentLength;
	}
	if (note.getNoteComplement) {
		// Deprecated since Trilium v0.61.
		return (await note.getNoteComplement()).contentLength;
	}
	return null;
}

/**
 * Returns the creation date of the given note or null if not available.
 */
export async function getDateCreated(note: NoteShort): Promise<string | null> {
	if (note.getMetadata) {
		// Available since Trilium v0.61.6.
		return (await note.getMetadata()).utcDateCreated;
	}
	if (note.getNoteComplement) {
		// Deprecated since Trilium v0.61.
		const complement = await note.getNoteComplement();
		if ("utcDateCreated" in complement) {
			return complement.utcDateCreated;
		}
	}
	return null;
}

/**
 * Returns the modification date of the given note or null if not available.
 */
export async function getDateModified(note: NoteShort): Promise<string | null> {
	if (note.getMetadata) {
		// Available since Trilium v0.61.6.
		return (await note.getMetadata()).utcDateModified;
	}
	if (note.getBlob) {
		// Available since Trilium v0.61.
		return (await note.getBlob()).utcDateModified;
	}
	if (note.getNoteComplement) {
		// Deprecated since Trilium v0.61.
		const complement = await note.getNoteComplement();
		if ("combinedUtcDateModified" in complement) {
			return complement.combinedUtcDateModified;
		}
	}
	return null;
}
