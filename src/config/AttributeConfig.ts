import { parseOptionalInt } from "collection-views/math";

const escapeCharacter = "`";
const escapeableCharacters = [escapeCharacter, ","];

const separatorAliases: Record<string, string> = {
	comma: ", ",
	space: " ",
};

/**
 * Configuration related to an attribute.
 */
export class AttributeConfig {
	path: string;
	denominatorPath = "";

	align = "";
	truncate?: number;
	width?: number;
	wrap = false;

	header?: string;

	badge = false;
	badgeBackground = "";
	badgeColor = "";

	boolean = false;
	number = false;
	precision?: number;

	prefix = "";
	repeat = "";
	separator?: string;
	suffix = "";

	constructor(value: string) {
		const settings = splitComma(value);
		this.path = settings.shift() ?? "";

		for (const setting of settings) {
			const parts = setting.split("=");
			const key = (parts.shift() ?? "").trim();
			const value = parts.join("=");

			switch (key) {
				case "badge":
				case "boolean":
				case "number":
				case "wrap":
					this[key] = true;
					break;

				case "align":
				case "header":
				case "repeat":
					this[key] = value.trim();
					break;

				case "prefix":
				case "separator":
				case "suffix":
					this[key] = value;
					break;

				case "badgeBackground":
				case "badgeColor":
					this.badge = true;
					this[key] = value.trim();
					break;

				case "progressBar":
					this.denominatorPath = value;
					break;

				case "precision":
					this.number = true;
					this.precision = parseOptionalInt(value, 0, 20);
					break;

				case "truncate":
					this.wrap = true;
					this.truncate = parseOptionalInt(value || 1, 1, 1000);
					break;

				case "width":
					this.width = parseOptionalInt(value, 0, 1000);
					break;
			}
		}
	}

	/**
	 * Returns a string affixed with the configured prefix and suffix.
	 */
	affix(text: string): string {
		return `${this.prefix}${text}${this.suffix}`;
	}

	/**
	 * Returns an array of elements or text nodes affixed with the configured
	 * prefix and suffix.
	 */
	affixNodes(...$nodes: (HTMLElement | Text)[]): (HTMLElement | Text)[] {
		const $affixed = [];
		if (this.prefix) {
			$affixed.push(document.createTextNode(this.prefix));
		}
		$affixed.push(...$nodes);
		if (this.suffix) {
			$affixed.push(document.createTextNode(this.suffix));
		}
		return $affixed;
	}

	/**
	 * Returns the separator to use for multiple attribute values in a table.
	 */
	getSeparator(): HTMLElement | Text | undefined {
		let separator = this.separator;
		if (separator === undefined) {
			separator = this.badge || this.boolean ? "space" : "comma";
		}

		if (!separator) {
			return undefined;
		}
		if (separator === "newline") {
			return document.createElement("br");
		}
		return document.createTextNode(
			separatorAliases[separator] || separator,
		);
	}
}

/**
 * Returns a list of values from splitting on each comma in the given value,
 * accounting for escape sequences.
 */
function splitComma(value: string): string[] {
	const values: string[] = [];
	let next = "";
	let escaping = false;

	for (const character of value) {
		if (escaping) {
			escaping = false;

			if (escapeableCharacters.includes(character)) {
				next += character;
				continue;
			}

			next += escapeCharacter;
		}

		switch (character) {
			case escapeCharacter:
				escaping = true;
				break;
			case ",":
				values.push(next);
				next = "";
				break;
			default:
				next += character;
		}
	}
	if (escaping) {
		next += escapeCharacter;
	}
	if (next) {
		values.push(next);
	}

	return values;
}
