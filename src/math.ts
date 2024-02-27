export const numberFormat = Intl.NumberFormat();

/**
 * Returns a number parsed from a string value and clamped between two values
 * (inclusive) or undefined if not a number.
 */
export function parseOptionalInt(
	value: unknown,
	min: number,
	max: number
): number | undefined {
	if (typeof value === "number") {
		return Math.floor(value);
	}
	if (typeof value !== "string") {
		return undefined;
	}

	const intValue = parseInt(value, 10);
	if (isNaN(intValue)) {
		return undefined;
	}

	return clamp(intValue, min, max);
}

/**
 * Returns a number parsed from some arbitrary value or NaN if the value is not
 * numeric.
 *
 * Unlike parseFloat, strings with a non-numeric suffix (e.g., dates) are
 * considered NaN.
 */
export function parseFloatStrict(value: unknown): number {
	if (typeof value === "number") {
		return value;
	}
	if (
		typeof value !== "string" ||
		!value.trim().match(/^[+-]?\d*(\.\d+)?$/)
	) {
		return NaN;
	}

	return parseFloat(value);
}

/**
 * Returns a number clamped between two values (inclusive).
 */
export function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(value, max));
}
