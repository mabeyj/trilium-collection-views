declare namespace api {
	const $container: JQuery;
	const originEntity: NoteShort | null;
	async function createNoteLink(
		notePath: string,
		noteTitle?: string
	): Promise<JQuery>;
	async function getNote(noteId: string): Promise<NoteShort | null>;
	async function searchForNotes(searchString: string): Promise<NoteShort[]>;
}

interface NoteShort {
	noteId: string;
	type: string;
	mime: string;
	title: string;
	getAttribute(type?: string, name?: string): Attribute | null;
	getAttributes(type?: string, name?: string): Attribute[];
	getBlob?(): Promise<FBlob>; // Available since Trilium v0.61.
	getLabels(name: string): Attribute[];
	getLabelValue(name: string): string | null;
	getMetadata?(): Promise<FNoteMetadata>; // Available since Trilium v0.61.6.
	getNoteComplement?(): Promise<FBlob | NoteComplement>; // Deprecated and returns FBlob since Trilium v0.61.
	getRelationTargets(name?: string): Promise<NoteShort[]>;
}

// Available since Trilium v0.61.
interface FBlob {
	content: string | null;
	contentLength: number;
	utcDateModified: string;
}

// Available since Trilium v0.61.6.
interface FNoteMetadata {
	utcDateCreated: string;
	utcDateModified: string;
}

// Removed since Trilium v0.61.
interface NoteComplement {
	content?: string;
	contentLength: number;
	utcDateCreated: string;
	combinedUtcDateModified: string;
}

interface Attribute {
	type: string;
	value: string;
}
