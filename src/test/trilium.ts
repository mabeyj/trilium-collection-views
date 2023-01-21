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
		const note = await this.getNote(notePath);
		if (!note) {
			throw new Error("Note not found");
		}

		const $link = $("<a>").attr("href", note.noteId).text(note.title);
		return $("<span>").append($link);
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
	type?: string;
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
	public type: string;
	public mime: string = "text/html";
	public title: string;
	private content?: string;
	private attributes: MockAttribute[];

	constructor({
		noteId = "",
		type = "text",
		title = "",
		content,
		attributes = [],
	}: NoteShortProps = {}) {
		this.noteId = noteId;
		this.type = type;
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

	public getLabels(name: string): Attribute[] {
		return this.getAttributes("label", name);
	}

	public getLabelValue(name: string): string | null {
		return this.getAttribute("label", name)?.value ?? null;
	}

	public async getNoteComplement(): Promise<NoteComplement> {
		return {
			content: this.content,
			contentLength: 1000,
			utcDateCreated: "2020-01-02 03:04:05.678Z",
			combinedUtcDateModified: "2020-02-03 04:05:06.789Z",
		};
	}

	public async getRelationTargets(name?: string): Promise<NoteShort[]> {
		const targets: NoteShort[] = [];
		for (const attribute of this.getAttributes("relation", name)) {
			const note = await api.getNote(attribute.value);
			if (note) {
				targets.push(note);
			}
		}

		return targets;
	}
}
