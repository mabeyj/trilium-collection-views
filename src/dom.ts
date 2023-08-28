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

	// The offset is the amount of borders, padding, and margin between the
	// edges of .scrolling-container and the edges of $element.
	//
	// A min-height is temporarily set because $element needs to be at least as
	// tall as .scrolling-container. Otherwise, empty space due to the content
	// not filling .scrolling-container would be included in the offset.
	//
	// getBoundingClientRect is the only API which returns non-rounded values.
	// This is necessary to avoid an extra scrollbar appearing inconsistently
	// due to rounding causing the $element height to be one pixel too large.

	var scrollBehavior = $container.style.scrollBehavior;
	$container.style.scrollBehavior = "auto";
	$element.style.minHeight = "100vh";

	let offset =
		$element.getBoundingClientRect().top -
		$container.getBoundingClientRect().top;

	$container.scrollTop = $container.scrollHeight;
	offset +=
		$container.getBoundingClientRect().bottom -
		$element.getBoundingClientRect().bottom;

	$container.scrollTop = 0;
	$container.style.scrollBehavior = scrollBehavior;
	$element.style.minHeight = "";

	new ResizeObserver((entries, observer) => {
		if (!document.body.contains($element)) {
			observer.disconnect();
			return;
		}

		const entry = entries[entries.length - 1];
		const height = `${Math.floor(entry.contentRect.height - offset)}px`;
		if (height === $element.style.height) {
			return;
		}

		observer.disconnect();
		$element.style.height = height;
		requestAnimationFrame(() => observer.observe($container));
	}).observe($container);
}

/**
 * Fix display issues when a view is rendered as an included note.
 */
export function fixIncludedNote(): void {
	const $include = api.$container[0].closest(".include-note");
	if (!($include instanceof HTMLElement)) {
		return;
	}

	// Box size is not applied when the current note is read only.
	$include.classList.add(`box-size-${$include.dataset.boxSize}`);

	let $wrapper = $include.querySelector(".include-note-wrapper");
	if (!$wrapper) {
		// Trilium v0.46 to v0.56: Fix content being displayed beside the
		// included note's title instead of below due to a missing wrapper
		// element when the current note is read only.
		$wrapper = document.createElement("div");
		$wrapper.className = "include-note-wrapper";
		$wrapper.append(...$include.children);
		$include.append($wrapper);
	}
	$wrapper.classList.add("collection-view-include-note");
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
