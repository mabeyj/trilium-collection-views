export const numberFormat = Intl.NumberFormat();

/**
 * Returns a number parsed from a string value and clamped between two values
 * (inclusive) or undefined if not a number.
 */
export function parseOptionalInt(
	value: any,
	min: number,
	max: number
): number | undefined {
	if (typeof value === "string") {
		value = value.trim();
	}

	const number = parseInt(value, 10);
	if (isNaN(number)) {
		return undefined;
	}

	return clamp(number, min, max);
}

/**
 * Returns a number clamped between two values (inclusive) or undefined if not
 * a number.
 */
export function clamp(number: number, min: number, max: number): number {
	return Math.max(min, Math.min(number, max));
}
