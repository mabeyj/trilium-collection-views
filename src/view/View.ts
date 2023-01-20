import { AttributeConfig, ViewConfig } from "collection-views/config";
import { appendChildren } from "collection-views/dom";
import { clamp, numberFormat } from "collection-views/math";
import {
	getAttributesByPath,
	getLabelValueByPath,
} from "collection-views/notes";
import { isTruthy } from "collection-views/boolean";

/**
 * Base view implementing common rendering of attributes.
 */
export abstract class View {
	config: ViewConfig;

	constructor(config: ViewConfig) {
		this.config = config;
	}

	abstract render(): Promise<HTMLElement>;

	/**
	 * Returns elements or strings for rendering all values of a note's
	 * attribute with separators between each value.
	 */
	async renderAttributeValues(
		note: NoteShort,
		attributeConfig: AttributeConfig
	): Promise<Array<HTMLElement | Text>> {
		const attributes = await getAttributesByPath(
			note,
			attributeConfig.path
		);
		if (attributeConfig.boolean && !attributes.length) {
			attributes.push({ type: "label", value: "false" });
		}

		let denominator: string | null = null;
		if (attributeConfig.denominatorPath) {
			denominator = await getLabelValueByPath(
				note,
				attributeConfig.denominatorPath
			);
		}

		const $values = await Promise.all(
			attributes.map((attribute) =>
				this.renderAttributeValue(
					attribute,
					denominator,
					attributeConfig
				)
			)
		);

		const $separated: Array<HTMLElement | Text> = [];
		const separable = !($values[0]?.[0] instanceof HTMLDivElement);
		for (let i = 0; i < $values.length; i++) {
			let $separator;
			if (i && separable) {
				$separator = attributeConfig.getSeparator();
			}
			if ($separator) {
				$separated.push($separator);
			}

			$separated.push(...$values[i]);
		}
		return $separated;
	}

	/**
	 * Returns elements or strings for rendering an attribute's value.
	 *
	 * If a denominator value is given, the attribute's value will be rendered
	 * as a progress bar.
	 */
	async renderAttributeValue(
		attribute: Attribute,
		denominator: string | null,
		attributeConfig: AttributeConfig
	): Promise<Array<HTMLElement | Text>> {
		let relatedNote: NoteShort | null = null;
		if (attribute.type === "relation") {
			relatedNote = await api.getNote(attribute.value);
		}

		let value = relatedNote ? relatedNote.title : attribute.value;

		if (denominator) {
			const $progressBar = this.renderProgressBar(
				value,
				denominator,
				attributeConfig
			);
			if ($progressBar) {
				return [$progressBar];
			}
		}

		return this.renderValue(value, attributeConfig, relatedNote);
	}

	/**
	 * Returns an element or string for rendering some string value formatted
	 * according to the given attribute configuration.
	 *
	 * Styling for badges, if enabled, are taken from the given note.
	 */
	renderValue(
		value: string,
		attributeConfig: AttributeConfig,
		relatedNote: NoteShort | null
	): Array<HTMLElement | Text> {
		if (attributeConfig.boolean) {
			return this.renderBoolean(value, attributeConfig);
		}

		if (attributeConfig.repeat.trim()) {
			value = this.formatRepeat(value, attributeConfig);
		} else if (attributeConfig.number) {
			value = this.formatNumber(value, attributeConfig);
		}

		value = attributeConfig.affix(value);

		if (attributeConfig.badge) {
			return [this.renderBadge(value, attributeConfig, relatedNote)];
		}

		return [document.createTextNode(value)];
	}

	/**
	 * Returns an element for rendering an attribute value as a checkbox.
	 */
	renderBoolean(
		value: string,
		attributeConfig: AttributeConfig
	): Array<HTMLElement | Text> {
		const $checkbox = document.createElement("input");
		$checkbox.className = "collection-view-checkbox";
		$checkbox.type = "checkbox";
		$checkbox.checked = isTruthy(value);
		$checkbox.disabled = true;
		return attributeConfig.affixNodes($checkbox);
	}

	/**
	 * Returns an element for rendering an attribute value as a badge.
	 *
	 * Badge styles are taken from the given note (optional, its badgeBackground
	 * and badgeColor attributes), then the given attribute configuration, then
	 * Bootstrap's default.
	 */
	renderBadge(
		value: string,
		attributeConfig: AttributeConfig,
		note: NoteShort | null
	): HTMLElement {
		let background = attributeConfig.badgeBackground;
		let color = attributeConfig.badgeColor;
		if (note) {
			background = note.getLabelValue("badgeBackground") || background;
			color = note.getLabelValue("badgeColor") || color;
		}

		const $badge = document.createElement("span");
		$badge.classList.add("badge", "badge-secondary");
		$badge.appendChild(document.createTextNode(value));
		if (background) {
			$badge.style.background = background;
		}
		if (color) {
			$badge.style.color = color;
		}
		return $badge;
	}

	/**
	 * Returns an element for rendering a pair of attribute values as a progress
	 * bar or undefined if any value is not numeric.
	 */
	renderProgressBar(
		numerator: string,
		denominator: string,
		attributeConfig: AttributeConfig
	): HTMLElement | undefined {
		const numeratorFloat = parseFloat(numerator);
		const denominatorFloat = parseFloat(denominator);
		if (isNaN(numeratorFloat) || isNaN(denominatorFloat)) {
			return undefined;
		}

		let percent = 0;
		if (denominatorFloat !== 0) {
			percent = (100 * numeratorFloat) / denominatorFloat;
		}

		const $fraction = document.createElement("div");
		$fraction.className = "collection-view-progress-fraction";
		appendChildren(
			$fraction,
			attributeConfig.affixNodes(
				this.renderProgressBarNumber(numeratorFloat),
				document.createTextNode(" / "),
				this.renderProgressBarNumber(denominatorFloat)
			)
		);

		const $bar = document.createElement("div");
		$bar.className = "progress-bar";
		$bar.style.width = `${clamp(percent, 0, 100)}%`;
		if (percent >= 1) {
			$bar.appendChild(
				document.createTextNode(`${Math.round(percent)}%`)
			);
		}
		if (percent >= 100) {
			$bar.classList.add("bg-success");
		}

		const $progress = document.createElement("div");
		$progress.className = "progress";
		$progress.appendChild($bar);

		const $container = document.createElement("div");
		$container.className = "collection-view-progress";
		appendChildren($container, [$fraction, $progress]);
		return $container;
	}

	/**
	 * Returns an element for rendering a formatted number in a progress bar's
	 * fraction.
	 */
	renderProgressBarNumber(number: number): HTMLElement {
		const $text = document.createTextNode(numberFormat.format(number));

		const $number = document.createElement("span");
		$number.className = "collection-view-progress-number";
		$number.appendChild($text);
		return $number;
	}

	/**
	 * Returns a string repeated based on the given value or the value as is if
	 * it is not a non-negative number.
	 */
	formatRepeat(value: string, attributeConfig: AttributeConfig): string {
		const int = parseInt(value, 10);
		if (isNaN(int) || int < 0) {
			return value;
		}

		return attributeConfig.repeat.repeat(clamp(int, 0, 1000));
	}

	/**
	 * Returns the given value formatted as a number or the value as is if it is
	 * not numeric.
	 */
	formatNumber(value: string, attributeConfig: AttributeConfig): string {
		const float = parseFloat(value);
		if (isNaN(float)) {
			return value;
		}

		const options: Intl.NumberFormatOptions = {};
		if (attributeConfig.precision !== undefined) {
			options.minimumFractionDigits = options.maximumFractionDigits =
				attributeConfig.precision;
		}

		return new Intl.NumberFormat(undefined, options).format(float);
	}
}
