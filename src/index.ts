import { ViewType, ViewConfig } from "collection-views/config";
import {
	fitToNoteDetailContainer,
	fixIncludedNote,
	renderError,
} from "collection-views/dom";
import { groupNotes, sortNotes } from "collection-views/notes";
import { TableView, GalleryView, BoardView } from "collection-views/view";

const descriptions = {
	[ViewType.Board]: "Board view",
	[ViewType.Gallery]: "Gallery view",
	[ViewType.Table]: "Table view",
};

enum RenderMode {
	Text,
	Include,
	Note,
}

/**
 * Reads configuration and renders the entire view.
 */
async function render(): Promise<void> {
	if (!api.originEntity) {
		renderError("Origin entity not found.");
		return;
	}

	const config = new ViewConfig(api.originEntity);
	if (!config.query) {
		renderError("This note must define a <code>query</code> attribute.");
		return;
	}

	let mode = RenderMode.Text;
	if (api.$container.closest(".include-note").length) {
		mode = RenderMode.Include;
	} else if (api.$container.parent(".note-detail-render-content").length) {
		mode = RenderMode.Note;
	}

	if (mode === RenderMode.Text) {
		api.$container.append(
			$("<em>").text(descriptions[config.view] || "Collection view")
		);
		return;
	}

	const notes = await api.searchForNotes(await config.getQuery());
	if (!notes.length) {
		renderError("No notes found.");
		return;
	}
	await sortNotes(notes, config.sort);

	let $view;
	switch (config.view) {
		case ViewType.Board:
			if (!config.groupBy) {
				renderError(
					"This note must define a <code>groupBy</code> attribute."
				);
				return;
			}

			const groups = await groupNotes(notes, config.groupBy.path);
			$view = await new BoardView(config, groups).render();
			break;

		case ViewType.Gallery:
			$view = await new GalleryView(config, notes).render();
			break;

		case ViewType.Table:
			$view = await new TableView(config, notes).render();
			break;

		default:
			renderError("Invalid <code>view</code> attribute.");
			return;
	}

	api.$container.append($view);

	switch (mode) {
		case RenderMode.Include:
			fixIncludedNote();
			break;

		case RenderMode.Note:
			if ($view.classList.contains("collection-view-scroll")) {
				fitToNoteDetailContainer($view);
			}
			break;
	}
}

render();
