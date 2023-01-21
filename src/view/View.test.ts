import { AttributeConfig, ViewConfig } from "collection-views/config";
import { View } from "collection-views/view";
import { MockApi, MockNoteShort } from "collection-views/test";

class TestView extends View {
	async render(): Promise<HTMLElement> {
		return document.createElement("div");
	}
}

const view = new TestView(new ViewConfig(new MockNoteShort()));

describe("View", () => {
	describe("renderAttributeValues", () => {
		const note = new MockNoteShort({
			attributes: [
				{ type: "label", name: "test", value: "Label" },
				{ type: "relation", name: "test", value: "1" },
				{ type: "label", name: "count", value: "1" },
				{ type: "label", name: "count", value: "2" },
				{ type: "label", name: "total", value: "2" },
			],
		});
		const relatedNote = new MockNoteShort({
			noteId: "1",
			title: "Title",
			attributes: [
				{ type: "label", name: "label", value: "Related label" },
				{ type: "label", name: "total", value: "3" },
			],
		});

		beforeEach(() => {
			new MockApi({ notes: [relatedNote] });
		});

		test("returns empty array for non-Boolean attribute with no values", async () => {
			const $values = await view.renderAttributeValues(
				note,
				new AttributeConfig("none")
			);
			expect($values).toHaveLength(0);
		});

		test("returns unchecked checkbox for Boolean attribute with no values", async () => {
			const $values = await view.renderAttributeValues(
				note,
				new AttributeConfig("none,boolean")
			);
			expect($values).toHaveLength(1);
			expect($values[0]).not.toBeChecked();
		});

		test("returns values separated", async () => {
			const $values = await view.renderAttributeValues(
				note,
				new AttributeConfig("test")
			);
			expect($values).toHaveLength(3);
			expect($values[0]).toHaveTextContent("Label");
			expect($values[1]).toHaveTextContent(",");
			expect($values[2]).toHaveTextContent("Title");
		});

		test("returns progress bars unseparated", async () => {
			const $values = await view.renderAttributeValues(
				note,
				new AttributeConfig("count,progressBar=total")
			);
			expect($values).toHaveLength(2);
			expect($values[0]).toHaveClass("collection-view-progress");
			expect($values[1]).toHaveClass("collection-view-progress");
			expect($values[0]).toHaveTextContent("1 / 2");
			expect($values[1]).toHaveTextContent("2 / 2");
		});

		test("returns related note's values", async () => {
			const $values = await view.renderAttributeValues(
				note,
				new AttributeConfig("test.label")
			);
			expect($values).toHaveLength(1);
			expect($values[0]).toHaveTextContent("Related label");
		});

		test("returns progress bar using related note's value", async () => {
			const $values = await view.renderAttributeValues(
				note,
				new AttributeConfig("count,progressBar=test.total")
			);
			expect($values).toHaveLength(2);
			expect($values[0]).toHaveClass("collection-view-progress");
			expect($values[0]).toHaveTextContent("1 / 3");
		});
	});

	describe("renderAttributeValue", () => {
		const config = new AttributeConfig("path");

		test.each([
			["returns text for label's value", "label", "Value"],
			["returns text for related note's title", "relation", "Title"],
		])("%s", async (_, type, expected) => {
			new MockApi({
				notes: [new MockNoteShort({ noteId: "Value", title: "Title" })],
			});

			const $value = await view.renderAttributeValue(
				{ type, value: "Value" },
				null,
				config
			);
			expect($value).toHaveLength(1);
			expect($value[0]).toHaveTextContent(expected);
		});

		test.each([
			["returns text for value with null denominator", null],
			["returns text for value with empty denominator", ""],
			["returns text for value with non-numeric denominator", "bad"],
		])("%s", async (_, denominator) => {
			const $value = await view.renderAttributeValue(
				{ type: "label", value: "1" },
				denominator,
				config
			);
			expect($value).toHaveLength(1);
			expect($value[0]).toBeInstanceOf(Text);
		});

		test("returns progress bar for value with numeric denominator", async () => {
			const $value = await view.renderAttributeValue(
				{ type: "label", value: "1" },
				"2",
				config
			);
			expect($value).toHaveLength(1);
			expect($value[0]).toHaveClass("collection-view-progress");
		});
	});

	describe("renderValue", () => {
		const note = new MockNoteShort({
			attributes: [
				{ type: "label", name: "badgeBackground", value: "red" },
			],
		});

		test("returns checkbox for Boolean attribute", () => {
			const config = new AttributeConfig(
				"path,boolean,repeat=*,number,badge"
			);

			const $value = view.renderValue("true", config, null);
			expect($value).toHaveLength(1);
			expect($value[0]).toBeChecked();
		});

		test.each([
			["returns text for repeated string", "3", "repeat=*,number", "***"],
			[
				"returns text for whitespace-only repeated string",
				"3",
				"repeat=  ",
				"3",
			],
			["returns text for formatted number", "1000", "number", "1,000"],
			["returns text by default", "value", "", "value"],
		])("%s", (_, value, options, expected) => {
			const config = new AttributeConfig(
				`path,prefix=Prefix,suffix=Suffix,${options}`
			);

			const $value = view.renderValue(value, config, null);
			expect($value).toHaveLength(1);
			expect($value[0]).toHaveTextContent(`Prefix${expected}Suffix`);
		});

		test.each([
			["returns badge with defaults", "value", "", "value"],
			["returns badge with repeated string", "3", "repeat=*", "***"],
			["returns badge with formatted number", "1000", "number", "1,000"],
		])("%s", (_, value, options, expected) => {
			const config = new AttributeConfig(
				`path,badge,prefix=Prefix,suffix=Suffix,${options}`
			);

			const $value = view.renderValue(value, config, note);
			expect($value).toHaveLength(1);
			expect($value[0]).toHaveClass("badge");
			expect($value[0]).toHaveStyle({ background: "red" });
			expect($value[0]).toHaveTextContent(`Prefix${expected}Suffix`);
		});
	});

	describe("renderBoolean", () => {
		test("returns checked checkbox for truthy value", () => {
			const config = new AttributeConfig("path");
			const $value = view.renderBoolean("true", config);
			expect($value).toHaveLength(1);
			expect($value[0]).toBeChecked();
		});

		test("returns unchecked checkbox for falsy value", () => {
			const config = new AttributeConfig("path");
			const $value = view.renderBoolean("false", config);
			expect($value).toHaveLength(1);
			expect($value[0]).not.toBeChecked();
		});

		test("returns affixed checkbox", () => {
			const config = new AttributeConfig(
				"path,prefix=Prefix,suffix=Suffix"
			);

			const $value = view.renderBoolean("true", config);
			expect($value).toHaveLength(3);
			expect($value[0]).toHaveTextContent("Prefix");
			expect($value[1]).toBeChecked();
			expect($value[2]).toHaveTextContent("Suffix");
		});
	});

	describe("renderBadge", () => {
		test.each([
			[
				"returns badge with default styles",
				"",
				null,
				{ background: "", color: "" },
			],
			[
				"returns badge with background set via attribute option",
				"badgeBackground=red",
				null,
				{ background: "red" },
			],
			[
				"returns badge with background set via related note",
				"badgeBackground=red",
				new MockNoteShort({
					attributes: [
						{
							type: "label",
							name: "badgeBackground",
							value: "yellow",
						},
					],
				}),
				{ background: "yellow" },
			],
			[
				"returns badge with font color set via attribute option",
				"badgeColor=white",
				null,
				{ color: "white" },
			],
			[
				"returns badge with font color set via related note",
				"badgeColor=white",
				new MockNoteShort({
					attributes: [
						{ type: "label", name: "badgeColor", value: "black" },
					],
				}),
				{ color: "black" },
			],
		])("%s", (_, options, note, styles) => {
			const config = new AttributeConfig(`path,${options}`);
			const $badge = view.renderBadge("value", config, note);
			expect($badge).toHaveTextContent("value");
			expect($badge).toHaveStyle(styles);
		});
	});

	describe("renderProgressBar", () => {
		function render(
			numerator: string,
			denominator: string,
			options: string = ""
		): {
			$progress: HTMLElement | undefined;
			$bar: HTMLElement | null | undefined;
		} {
			const config = new AttributeConfig(`path,${options}`);
			const $progress = view.renderProgressBar(
				numerator,
				denominator,
				config
			);
			return {
				$progress,
				$bar: $progress?.querySelector(".progress-bar"),
			};
		}

		test.each([
			["returns undefined if numerator is not numeric", "bad", "1"],
			["returns undefined if denominator is not numeric", "1", "bad"],
		])("%s", (_, numerator, denominator) => {
			const { $progress } = render(numerator, denominator);
			expect($progress).toBeUndefined();
		});

		test.each([
			["returns progress bar with negative progress", "-10", "10"],
			["returns progress bar with zero progress", "0", "10"],
			["returns progress bar with division by zero", "10", "0"],
		])("%s", (_, numerator, denominator) => {
			const { $progress, $bar } = render(numerator, denominator);
			expect($progress).toHaveTextContent(
				`${numerator} / ${denominator}`
			);
			expect($progress).not.toHaveTextContent("%");
			expect($bar).toHaveStyle({ width: "0%" });
		});

		test("returns progress bar with partial progress", () => {
			const { $progress, $bar } = render("599", "1000");
			expect($progress).toHaveTextContent("599 / 1,000");
			expect($progress).toHaveTextContent("60%");
			expect($bar).not.toHaveClass("bg-success");
			expect($bar).toHaveStyle({ width: "59.9%" });
		});

		test.each([
			["returns progress bar with 100% progress", "1", "1", "100%"],
			[
				"returns progress bar with over 100% progress",
				"10",
				"1",
				"1000%",
			],
		])("%s", (_, numerator, denominator, expected) => {
			const { $progress, $bar } = render(numerator, denominator);
			expect($progress).toHaveTextContent(expected);
			expect($bar).toHaveClass("bg-success");
			expect($bar).toHaveStyle({ width: "100%" });
		});

		test("returns affixed fraction", () => {
			const { $progress } = render(
				"1",
				"2",
				"prefix=Prefix,suffix=Suffix"
			);
			expect($progress).toHaveTextContent("Prefix1 / 2Suffix");
		});
	});

	describe("renderProgressBarNumber", () => {
		test("returns formatted number", () => {
			const $number = view.renderProgressBarNumber(1234.5);
			expect($number).toHaveTextContent("1,234.5");
		});
	});

	describe("formatRepeat", () => {
		test.each([
			["returns non-numeric value as is", "bad", "bad"],
			["returns negative value as is", "-10.9", "-10.9"],
			["returns empty string for zero", "0", ""],
			[
				"returns repeated string for positive integer",
				"10",
				"<>".repeat(10),
			],
			[
				"returns repeated string for positive float",
				"5.9",
				"<>".repeat(5),
			],
			[
				"limits repeated string if value is too large",
				"9999",
				"<>".repeat(1000),
			],
		])("%s", (_, value, expected) => {
			const config = new AttributeConfig("path,repeat=<>");
			const $number = view.formatRepeat(value, config);
			expect($number).toBe(expected);
		});
	});

	describe("formatNumber", () => {
		test.each([
			["returns non-numeric value as is", "bad", "", "bad"],
			["returns integer value formatted", "1234", "", "1,234"],
			[
				"returns value formatted with default precision",
				"1234.5",
				"",
				"1,234.5",
			],
			[
				"returns value formatted with explicit precision",
				"1234.567",
				"precision=6",
				"1,234.567000",
			],
		])("%s", (_, value, options, expected) => {
			const config = new AttributeConfig(`path,${options}`);
			const formatted = view.formatNumber(value, config);
			expect(formatted).toBe(expected);
		});
	});
});
