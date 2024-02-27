/**
 * Returns true if some string is a value of some enum.
 */
export function isEnumValue<T extends { [key: string]: string }>(
	enum_: T,
	value: string
): value is T[keyof T] {
	return Object.values<string>(enum_).includes(value);
}
