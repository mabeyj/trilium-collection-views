import { AttributeConfig } from "collection-views/config";

describe("AttributeConfig", () => {
	describe("constructor", () => {
		test.each([
			["", ""],
			["name,options", "name"],
		])("%p sets name to %p", (value, expected) => {
			const config = new AttributeConfig(value);
			expect(config.name).toBe(expected);
		});

		test("sets denominator name from progressBar option", () => {
			const config = new AttributeConfig("name,progressBar=total");
			expect(config.denominatorName).toBe("total");
		});

		test("sets align", () => {
			const config = new AttributeConfig("name,align=  left  ");
			expect(config.align).toBe("left");
		});

		test.each([
			["name,truncate", 1],
			["name,truncate=0", 1],
			["name,truncate=10.9", 10],
			["name,truncate=9999", 1000],
			["name,truncate=bad", undefined],
		])("%p sets truncate to %p", (value, expected) => {
			const config = new AttributeConfig(value);
			expect(config.truncate).toBe(expected);
			expect(config.wrap).toBe(true);
		});

		test.each([
			["name,width", undefined],
			["name,width=-1", 0],
			["name,width=0", 0],
			["name,width=10.9", 10],
			["name,width=9999", 1000],
			["name,width=bad", undefined],
		])("%p sets width to %p", (value, expected) => {
			const config = new AttributeConfig(value);
			expect(config.width).toBe(expected);
		});

		test.each(["name,wrap", "name,wrap=anything"])(
			"%p sets wrap to true",
			(value) => {
				const config = new AttributeConfig(value);
				expect(config.wrap).toBe(true);
			}
		);

		test("sets header", () => {
			const config = new AttributeConfig("name,header=  Text  ");
			expect(config.header).toBe("Text");
		});

		test.each(["name,badge", "name,badge=anything"])(
			"%p sets badge to true",
			(value) => {
				const config = new AttributeConfig(value);
				expect(config.badge).toBe(true);
			}
		);

		test("sets badgeBackground", () => {
			const config = new AttributeConfig("name,badgeBackground=  red  ");
			expect(config.badge).toBe(true);
			expect(config.badgeBackground).toBe("red");
		});

		test("sets badgeColor", () => {
			const config = new AttributeConfig("name,badgeColor=  red  ");
			expect(config.badge).toBe(true);
			expect(config.badgeColor).toBe("red");
		});

		test.each(["name,boolean", "name,boolean=anything"])(
			"%p sets boolean to true",
			(value) => {
				const config = new AttributeConfig(value);
				expect(config.boolean).toBe(true);
			}
		);

		test.each(["name,number", "name,number=anything"])(
			"%p sets number to true",
			(value) => {
				const config = new AttributeConfig(value);
				expect(config.number).toBe(true);
			}
		);

		test.each([
			["name,precision", undefined],
			["name,precision=-1", 0],
			["name,precision=0", 0],
			["name,precision=10.9", 10],
			["name,precision=99", 20],
		])("%p sets precision to %p", (value, expected) => {
			const config = new AttributeConfig(value);
			expect(config.number).toBe(true);
			expect(config.precision).toBe(expected);
		});

		test("sets prefix", () => {
			const config = new AttributeConfig("name,prefix=  Text  ");
			expect(config.prefix).toBe("  Text  ");
		});

		test("sets suffix", () => {
			const config = new AttributeConfig("name,suffix=  Text  ");
			expect(config.suffix).toBe("  Text  ");
		});

		test("sets repeat", () => {
			const config = new AttributeConfig("name,repeat=  Text  ");
			expect(config.repeat).toBe("Text");
		});
	});

	describe("affix", () => {
		test("returns affixed string", () => {
			const config = new AttributeConfig(
				"name,prefix=Prefix,suffix=Suffix"
			);
			expect(config.affix("Text")).toBe("PrefixTextSuffix");
		});
	});

	describe("affixNodes", () => {
		const nodes = [
			document.createElement("div"),
			document.createElement("span"),
			document.createTextNode("Text"),
		];

		test.each([
			["returns nodes as is if no affix", "", "", nodes],
			[
				"returns nodes with prefix",
				"Prefix",
				"",
				[document.createTextNode("Prefix"), ...nodes],
			],
			[
				"returns nodes with suffix",
				"",
				"Suffix",
				[...nodes, document.createTextNode("Suffix")],
			],
		])("%s", (_, prefix, suffix, expected) => {
			const config = new AttributeConfig(
				`name,prefix=${prefix},suffix=${suffix}`
			);
			expect(config.affixNodes(...nodes)).toEqual(expected);
		});
	});

	describe("makeSeparator", () => {
		test.each([
			[
				"returns space for badges",
				"name,badge",
				document.createTextNode(" "),
			],
			["returns <br> otherwise", "name", document.createElement("br")],
		])("%s", (_, value, expected) => {
			const config = new AttributeConfig(value);
			expect(config.makeSeparator()).toEqual(expected);
		});
	});
});
