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
		it("returns empty array for non-Boolean attribute with no values", async () => {
			const elements = await view.renderAttributeValues(
				new MockNoteShort(),
				new AttributeConfig("test")
			);

			expect(elements).toHaveLength(0);
		});

		it("returns unchecked checkbox for Boolean attribute with no values", async () => {
			const elements = await view.renderAttributeValues(
				new MockNoteShort(),
				new AttributeConfig("test,boolean")
			);

			expect(elements).toHaveLength(1);
			expect(elements[0][0]).not.toBeChecked();
		});

		it("returns elements for multiple values", async () => {
			new MockApi({
				notes: [new MockNoteShort({ noteId: "id", title: "2" })],
			});

			const elements = await view.renderAttributeValues(
				new MockNoteShort({
					attributes: [
						{ type: "label", name: "test", value: "1" },
						{ type: "relation", name: "test", value: "id" },
						{ type: "label", name: "other", value: "3" },
					],
				}),
				new AttributeConfig("test")
			);

			expect(elements).toHaveLength(2);
			expect(elements[0][0]).toHaveTextContent("1");
			expect(elements[1][0]).toHaveTextContent("2");
		});

		it("returns progress bar for progressBar attribute", async () => {
			const elements = await view.renderAttributeValues(
				new MockNoteShort({
					attributes: [
						{ type: "label", name: "count", value: "1" },
						{ type: "label", name: "total", value: "2" },
					],
				}),
				new AttributeConfig("count,progressBar=total")
			);

			expect(elements).toHaveLength(1);
			expect(elements[0][0]).toHaveClass("collection-view-progress");
		});
	});

	describe("renderAttributeValue", () => {
		const config = new AttributeConfig("name");

		test.each([
			["returns text for label's value", "label", "Value"],
			["returns text for related note's title", "relation", "Title"],
		])("%s", async (_, type, expected) => {
			new MockApi({
				notes: [new MockNoteShort({ noteId: "Value", title: "Title" })],
			});

			const elements = await view.renderAttributeValue(
				{ type, value: "Value" },
				null,
				config
			);

			expect(elements).toHaveLength(1);
			expect(elements[0]).toHaveTextContent(expected);
		});

		test.each([
			["returns text for value with null denominator", null],
			["returns text for value with empty denominator", ""],
			["returns text for value with non-numeric denominator", "bad"],
		])("%s", async (_, denominator) => {
			const elements = await view.renderAttributeValue(
				{ type: "label", value: "1" },
				denominator,
				config
			);

			expect(elements).toHaveLength(1);
			expect(elements[0]).toBeInstanceOf(Text);
		});

		test("returns progress bar for value with numeric denominator", async () => {
			const elements = await view.renderAttributeValue(
				{ type: "label", value: "1" },
				"2",
				config
			);

			expect(elements).toHaveLength(1);
			expect(elements[0]).toHaveClass("collection-view-progress");
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
				"name,boolean,repeat=*,number,badge"
			);

			const elements = view.renderValue("true", config, null);
			expect(elements).toHaveLength(1);
			expect(elements[0]).toBeChecked();
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
				`name,prefix=Prefix,suffix=Suffix,${options}`
			);

			const elements = view.renderValue(value, config, null);
			expect(elements).toHaveLength(1);
			expect(elements[0]).toHaveTextContent(`Prefix${expected}Suffix`);
		});

		test.each([
			[
				"returns elements for badge with repeated string",
				"3",
				"repeat=*",
				"***",
			],
			[
				"returns elements for badge with formatted number",
				"1000",
				"number",
				"1,000",
			],
			["returns elements for badge with defaults", "value", "", "value"],
		])("%s", (_, value, options, expected) => {
			const config = new AttributeConfig(
				`name,badge,prefix=Prefix,suffix=Suffix,${options}`
			);

			const elements = view.renderValue(value, config, note);
			expect(elements).toHaveLength(1);
			expect(elements[0]).toHaveClass("badge");
			expect(elements[0]).toHaveStyle({ background: "red" });
			expect(elements[0]).toHaveTextContent(`Prefix${expected}Suffix`);
		});
	});

	describe("renderBoolean", () => {
		test("returns checked checkbox for truthy value", () => {
			const config = new AttributeConfig("name");
			const elements = view.renderBoolean("true", config);
			expect(elements).toHaveLength(1);
			expect(elements[0]).toBeChecked();
		});

		test("returns unchecked checkbox for falsy value", () => {
			const config = new AttributeConfig("name");
			const elements = view.renderBoolean("false", config);
			expect(elements).toHaveLength(1);
			expect(elements[0]).not.toBeChecked();
		});

		test("returns affixed checkbox", () => {
			const config = new AttributeConfig(
				"name,prefix=Prefix,suffix=Suffix"
			);
			const elements = view.renderBoolean("true", config);
			expect(elements).toHaveLength(3);
			expect(elements[0]).toHaveTextContent("Prefix");
			expect(elements[1]).toBeChecked();
			expect(elements[2]).toHaveTextContent("Suffix");
		});
	});

	describe("renderBadge", () => {
		test.each([
			["returns badge with default styles", "", null, undefined],
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
			const config = new AttributeConfig(`name,${options}`);
			const $badge = view.renderBadge("value", config, note);
			expect($badge).toHaveTextContent("value");

			if (styles) {
				expect($badge).toHaveStyle(styles);
			}
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
			const config = new AttributeConfig(`name,${options}`);
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
		test("returns element with a formatted number", () => {
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
			const config = new AttributeConfig("name,repeat=<>");
			expect(view.formatRepeat(value, config)).toBe(expected);
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
			const config = new AttributeConfig(`name,${options}`);
			expect(view.formatNumber(value, config)).toBe(expected);
		});
	});
});
