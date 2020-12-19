const staggeredSize = 25;

/**
 * Renders an error message.
 */
export function renderError(message: string): void {
	const $error = $("<div class='collection-view-error'>").html(message);
	api.$container.append($error);
}

/**
 * Renders notes in a staggered manner, appending elements returned from
 * a render function to some parent element.
 *
 * This will resolve after an initial set of notes are rendered, then it will
 * render the remaining notes in chunks asynchronously.
 */
export async function staggeredRender(
	$parent: JQuery,
	initialSize: number,
	notes: NoteShort[],
	render: (note: NoteShort) => Promise<JQuery>
): Promise<void> {
	const initial = notes.slice(0, initialSize);
	const remaining = notes.slice(initialSize);

	const $children = await Promise.all(initial.map(render));
	$parent.append(...$children);
	staggeredRenderAsync($parent, remaining, render);
}

/**
 * Returns immediately and will render notes in a staggered manner
 * asynchronously.
 */
function staggeredRenderAsync(
	$parent: JQuery,
	notes: NoteShort[],
	render: (note: NoteShort) => Promise<JQuery>
) {
	if (!notes.length) {
		return;
	}

	setTimeout(async () => {
		const chunk = notes.slice(0, staggeredSize);
		const remaining = notes.slice(staggeredSize);

		const $children = await Promise.all(chunk.map(render));

		requestAnimationFrame(() => {
			$parent.append(...$children);
			staggeredRenderAsync($parent, remaining, render);
		});
	});
}
