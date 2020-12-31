import { ViewType, ViewConfig } from "collection-views/config";
import { renderError } from "collection-views/dom";
import { groupNotes, sortNotes } from "collection-views/notes";
import { TableView, GalleryView, BoardView } from "collection-views/view";

const descriptions = {
	[ViewType.Board]: "Board view",
	[ViewType.Gallery]: "Gallery view",
	[ViewType.Table]: "Table view",
};

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

	if (!api.$container.parent(".note-detail-render-content").length) {
		api.$container.append(
			$("<em>").text(descriptions[config.view] || "Collection view")
		);
		return;
	}

	const notes = await api.searchForNotes(config.query);
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

			const groups = await groupNotes(notes, config.groupBy.name);
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
}

render();
