import $ from "jquery";

interface MockApiProps {
	originEntity?: NoteShort | null;
	notes?: NoteShort[];
}

export class MockApi {
	public $component: HTMLElement;
	public $container: JQuery;
	public originEntity: NoteShort | null;
	public notes: NoteShort[];

	constructor({ originEntity = null, notes = [] }: MockApiProps = {}) {
		this.$component = document.createElement("div");
		this.$component.className = "component";
		this.$component.innerHTML = `
			<div class="note-detail component">
				<div class="note-detail-render component">
					<div class="note-detail-render-content">
						<div></div>
					</div>
				</div>
			</div>
		`;

		window.api = this;
		document.body.append(this.$component);
		this.$container = $(".note-detail-render-content div");

		this.originEntity = originEntity;
		this.notes = notes;
	}

	public async createNoteLink(
		notePath: string,
		noteTitle?: string
	): Promise<JQuery> {
		return $("<div>");
	}

	public async getNote(noteId: string): Promise<NoteShort | null> {
		return this.notes.find((note) => note.noteId === noteId) ?? null;
	}

	public async searchForNotes(searchString: string): Promise<NoteShort[]> {
		return this.notes;
	}
}

interface NoteShortProps {
	noteId?: string;
	title?: string;
	content?: string;
	attributes?: MockAttribute[];
}

interface MockAttribute {
	type: string;
	name: string;
	value: string;
}

export class MockNoteShort {
	public noteId: string;
	public title: string;
	private content: string;
	private attributes: MockAttribute[];

	constructor({
		noteId = "",
		title = "",
		content = "",
		attributes = [],
	}: NoteShortProps = {}) {
		this.noteId = noteId;
		this.title = title;
		this.content = content;
		this.attributes = attributes;
	}

	public getAttribute(type?: string, name?: string): Attribute | null {
		return this.getAttributes(type, name)[0] ?? null;
	}

	public getAttributes(type?: string, name?: string): Attribute[] {
		return this.attributes.filter(
			(attribute) =>
				(type === undefined || attribute.type === type) &&
				(name === undefined || attribute.name === name)
		);
	}

	public async getContent(): Promise<string> {
		return this.content;
	}

	public getLabels(name: string): Attribute[] {
		return this.getAttributes("label", name);
	}

	public getLabelValue(name: string): string | null {
		return this.getAttribute("label", name)?.value ?? null;
	}
}
