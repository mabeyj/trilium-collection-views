import { AttributeConfig, ViewConfig } from "collection-views/config";
import { clamp, numberFormat } from "collection-views/math";
import { isFalsy } from "collection-views/boolean";

/**
 * Base view implementing common rendering of attributes.
 */
export abstract class View {
	config: ViewConfig;

	constructor(config: ViewConfig) {
		this.config = config;
	}

	abstract render(): Promise<JQuery>;

	/**
	 * Returns elements or strings for rendering all values of a note's
	 * attributes of a certain name.
	 */
	async renderAttributeValues(
		note: NoteShort,
		attributeConfig: AttributeConfig
	): Promise<Array<JQuery | string>> {
		const attributes = note.getAttributes(undefined, attributeConfig.name);

		let denominator: string | null = null;
		if (attributeConfig.denominatorName) {
			denominator = note.getLabelValue(attributeConfig.denominatorName);
		}

		const promises = attributes.map((attribute) =>
			this.renderAttributeValue(attribute, denominator, attributeConfig)
		);
		return await Promise.all(promises);
	}

	/**
	 * Returns an element or string for rendering an attribute's value.
	 *
	 * If a denominator value is given, the attribute's value will be rendered
	 * as a progress bar.
	 */
	async renderAttributeValue(
		attribute: Attribute,
		denominator: string | null,
		attributeConfig: AttributeConfig
	): Promise<JQuery | string> {
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
				return $progressBar;
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
	): JQuery | string {
		if (attributeConfig.boolean) {
			return this.renderBoolean(value);
		}

		if (attributeConfig.repeat.trim()) {
			value = this.formatRepeat(value, attributeConfig);
		} else if (attributeConfig.number) {
			value = this.formatNumber(value, attributeConfig);
		}

		value = attributeConfig.affix(value);

		if (attributeConfig.badge) {
			return this.renderBadge(value, attributeConfig, relatedNote);
		}

		return value;
	}

	/**
	 * Returns an element for rendering an attribute value as a checkbox.
	 */
	renderBoolean(value: string): JQuery {
		const $checkbox = $(
			"<input class='collection-view-checkbox' type='checkbox' disabled>"
		);
		if (!isFalsy(value)) {
			$checkbox.attr("checked", "true");
		}
		return $checkbox;
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
	): JQuery {
		let background = attributeConfig.badgeBackground;
		let color = attributeConfig.badgeColor;
		if (note) {
			background = note.getLabelValue("badgeBackground") || background;
			color = note.getLabelValue("badgeColor") || color;
		}

		const $badge = $("<span class='badge badge-secondary'>").text(value);
		if (background) {
			$badge.css("background", background);
		}
		if (color) {
			$badge.css("color", color);
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
	): JQuery | undefined {
		const numeratorFloat = parseFloat(numerator);
		const denominatorFloat = parseFloat(denominator);
		if (isNaN(numeratorFloat) || isNaN(denominatorFloat)) {
			return undefined;
		}

		let percent = 0;
		if (denominatorFloat !== 0) {
			percent = (100 * numeratorFloat) / denominatorFloat;
		}

		const $fraction = $("<div class='collection-view-progress-fraction'>");
		if (attributeConfig.prefix) {
			$fraction.append(attributeConfig.prefix);
		}
		$fraction.append(
			this.renderProgressBarNumber(numeratorFloat),
			" / ",
			this.renderProgressBarNumber(denominatorFloat)
		);
		if (attributeConfig.suffix) {
			$fraction.append(attributeConfig.suffix);
		}

		const $bar = $("<div class='progress-bar'>")
			.width(`${clamp(percent, 0, 100)}%`)
			.text(`${Math.round(percent)}%`);
		if (percent >= 100) {
			$bar.addClass("bg-success");
		}

		return $("<div class='collection-view-progress'>").append(
			$fraction,
			$("<div class='progress'>").append($bar)
		);
	}

	/**
	 * Returns an element for rendering a formatted number in a progress bar's
	 * fraction.
	 */
	renderProgressBarNumber(number: number): JQuery {
		return $("<span class='collection-view-progress-number'>").text(
			numberFormat.format(number)
		);
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
