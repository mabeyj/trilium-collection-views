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
	title: string;
	getAttribute(type?: string, name?: string): Attribute | null;
	getAttributes(type?: string, name?: string): Attribute[];
	getContent(): Promise<string>;
	getLabels(name: string): Attribute[];
	getLabelValue(name: string): string | null;
}

interface Attribute {
	type: string;
	value: string;
}
