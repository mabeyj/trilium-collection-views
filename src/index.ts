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

	async function genView() {
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

	await genView();	// generate and render $view

	const originalQuery = config.query;	// backup original config.query

	if (config.search) {
		const $search = document.createElement("input");	// generate search input
		$search.classList.add(
			"form-control",
			"promoted-attribute-input",
			"aa-input"
		);
		$search.placeholder = "Seach...";
		$search.style.width = "250px";
		$search.style.margin = "10px";

		$search.oninput = async function (event) {
			const inputElement = event.target as HTMLInputElement;
			const keyWord = inputElement.value.toLowerCase();

			if (keyWord) {	// modify config.query to search keyWord in title and values of #attributes
				config.query = `${config.query} AND ((note.title *=* '${keyWord}')`
				for (let i = 0; i < config.attributes.length; i++) {
					config.query = `${config.query} OR (#${config.attributes[i].path} *=* ${keyWord})`;
				}
				config.query = `${config.query})`;
			}

			api.$container[0].children[1].remove();	// remove old $view
			await genView();	// generate and render new $view
			config.query = originalQuery;	// restore original config.query

		};
		api.$container.prepend($search);
	}
}

render();
