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
		this.$component.style.overflowY = "auto";
		this.$component.style.scrollBehavior = "smooth";
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

	public async createNoteLink(notePath: string, _?: string): Promise<JQuery> {
		const note = await this.getNote(notePath);
		if (!note) {
			throw new Error("Note not found");
		}

		const $link = $("<a>").attr("href", note.noteId).text(note.title);
		return $("<span>").append($link);
	}

	public async getNote(noteId: string): Promise<NoteShort | null> {
		return Promise.resolve(
			this.notes.find((note) => note.noteId === noteId) ?? null
		);
	}

	public async searchForNotes(_?: string): Promise<NoteShort[]> {
		return Promise.resolve(this.notes);
	}
}

interface NoteShortProps {
	noteId?: string;
	type?: string;
	title?: string;
	content?: string | null;
	contentLength?: number;
	attributes?: MockAttribute[];
}

interface MockAttribute {
	type: string;
	name: string;
	value: string;
}

abstract class BaseMockFNote {
	public noteId: string;
	public type: string;
	public mime = "text/html";
	public title: string;
	protected content: string | null;
	protected contentLength: number;
	protected dateCreated = "2020-01-02 03:04:05.678Z";
	protected dateModified = "2020-02-03 04:05:06.789Z";
	private attributes: MockAttribute[];

	constructor({
		noteId = "",
		type = "text",
		title = "",
		content = null,
		contentLength = 1000,
		attributes = [],
	}: NoteShortProps = {}) {
		this.noteId = noteId;
		this.type = type;
		this.title = title;
		this.content = content;
		this.contentLength = contentLength;
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

/**
 * Mock of a note from Trilium v0.61.0 to v0.61.5.
 */
export class MockFNote0615 extends BaseMockFNote {
	public async getBlob(): Promise<FBlob> {
		return Promise.resolve({
			content: this.content,
			contentLength: this.contentLength,
			utcDateModified: this.dateModified,
		});
	}

	public async getNoteComplement(): Promise<FBlob> {
		return this.getBlob();
	}
}

/**
 * Mock of a note from Trilium v0.61.6 and newer.
 */
export class MockFNote extends MockFNote0615 {
	public async getMetadata(): Promise<FNoteMetadata> {
		return Promise.resolve({
			utcDateCreated: this.dateCreated,
			utcDateModified: this.dateModified,
		});
	}
}

/**
 * Mock of a note from Trilium v0.60 and below.
 */
export class MockNoteShort extends BaseMockFNote {
	public async getNoteComplement(): Promise<NoteComplement> {
		return Promise.resolve({
			content: this.content ?? undefined,
			contentLength: this.contentLength,
			utcDateCreated: this.dateCreated,
			combinedUtcDateModified: this.dateModified,
		});
	}
}
