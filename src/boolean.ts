const falsyStrings = ["n", "no", "f", "false"];

/**
 * Returns true if some string can be interpreted as true.
 */
export function isTruthy(value: string): boolean {
	return !falsyStrings.includes(value.trim().toLowerCase());
}
