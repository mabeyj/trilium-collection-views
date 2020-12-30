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
 * Returns a number parsed from some arbitrary value or NaN if the value is not
 * numeric.
 *
 * Unlike parseFloat, strings with a non-numeric suffix (e.g., dates) are
 * considered NaN.
 */
export function parseFloatStrict(value: any): number {
	if (typeof value === "string") {
		value = value.trim();
		if (!value.match(/^[+-]?\d*(\.\d+)?$/)) {
			return NaN;
		}
	}

	return parseFloat(value);
}

/**
 * Returns a number clamped between two values (inclusive) or undefined if not
 * a number.
 */
export function clamp(number: number, min: number, max: number): number {
	return Math.max(min, Math.min(number, max));
}
