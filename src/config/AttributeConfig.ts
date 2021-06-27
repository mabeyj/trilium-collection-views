import { parseOptionalInt } from "collection-views/math";

/**
 * Configuration related to an attribute.
 */
export class AttributeConfig {
	name: string;
	denominatorName: string = "";

	align: string = "";
	width?: number;
	wrap: boolean = false;

	header: string = "";

	badge: boolean = false;
	badgeBackground: string = "";
	badgeColor: string = "";

	boolean: boolean = false;
	number: boolean = false;
	precision?: number;

	prefix: string = "";
	suffix: string = "";
	repeat: string = "";

	constructor(value: string) {
		const options = value.split(",");
		this.name = options.shift() || "";

		for (var option of options) {
			const parts = option.split("=");
			const key = (parts.shift() || "").trim();
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
				case "suffix":
					this[key] = value;
					break;

				case "badgeBackground":
				case "badgeColor":
					this.badge = true;
					this[key] = value.trim();
					break;

				case "progressBar":
					this.denominatorName = value;
					break;

				case "precision":
					this.number = true;
					this.precision = parseOptionalInt(value, 0, 20);
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
	affixNodes(
		...$nodes: Array<HTMLElement | Text>
	): Array<HTMLElement | Text> {
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
	makeSeparator(): HTMLElement | Text {
		if (this.badge) {
			return document.createTextNode(" ");
		}
		return document.createElement("br");
	}
}
