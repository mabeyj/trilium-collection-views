const falsyStrings = ["n", "no", "f", "false"];

/**
 * Returns true if some string can be interpreted as false.
 */
export function isFalsy(value: string): boolean {
	return !falsyStrings.includes(value.trim().toLowerCase());
}
