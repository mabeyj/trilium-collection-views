/**
 * Renders an error message.
 */
export function renderError(message: string): void {
	const $error = $("<div class='collection-view-error'>").html(message);
	api.$container.append($error);
}
