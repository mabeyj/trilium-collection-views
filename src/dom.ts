const staggeredSize = 25;

/**
 * Appends multiple elements or text nodes to some parent element.
 */
export function appendChildren(
	$parent: HTMLElement,
	$children: Array<HTMLElement | Text>
): void {
	for (const $child of $children) {
		$parent.appendChild($child);
	}
}

/**
 * Renders an error message.
 */
export function renderError(message: string): void {
	const $error = document.createElement("div");
	$error.className = "collection-view-error";
	$error.innerHTML = message;
	api.$container.append($error);
}

/**
 * Observes the container containing the current note's contents and resizes an
 * element to fit the container's height when the container is resized (keeping
 * the horizontal scrollbar at the bottom of the visible area).
 */
export function fitToNoteDetailContainer($element: HTMLElement): void {
	const $container = api.$container[0].closest(".note-detail")?.parentElement;
	if (!$container) {
		throw new Error("note container element not found");
	}

	new ResizeObserver((entries, observer) => {
		if (!document.body.contains($element)) {
			observer.disconnect();
			return;
		}

		const entry = entries[entries.length - 1];
		$element.style.height = `${entry.contentRect.height}px`;
	}).observe($container);
}

/**
 * Renders notes in a staggered manner, appending elements returned from
 * a render function to some parent element.
 *
 * This will resolve after an initial set of notes are rendered, then it will
 * render the remaining notes in chunks asynchronously.
 */
export async function staggeredRender(
	$parent: HTMLElement,
	initialSize: number,
	notes: NoteShort[],
	render: (note: NoteShort) => Promise<HTMLElement>
): Promise<void> {
	const initial = notes.slice(0, initialSize);
	const remaining = notes.slice(initialSize);

	const $children = await Promise.all(initial.map(render));
	appendChildren($parent, $children);
	staggeredRenderAsync($parent, remaining, render);
}

/**
 * Returns immediately and will render notes and append the resulting elements
 * to a parent element in a staggered manner asynchronously.
 */
function staggeredRenderAsync(
	$parent: HTMLElement,
	notes: NoteShort[],
	render: (note: NoteShort) => Promise<HTMLElement>
) {
	if (!notes.length) {
		return;
	}

	setTimeout(async () => {
		const chunk = notes.slice(0, staggeredSize);
		const remaining = notes.slice(staggeredSize);

		const $children = await Promise.all(chunk.map(render));

		requestAnimationFrame(() => {
			appendChildren($parent, $children);
			staggeredRenderAsync($parent, remaining, render);
		});
	});
}
