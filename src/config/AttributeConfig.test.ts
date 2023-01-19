import { AttributeConfig } from "collection-views/config";

describe("AttributeConfig", () => {
	describe("constructor", () => {
		test.each([
			["", ""],
			["path,options", "path"],
		])("%p sets path to %p", (value, expected) => {
			const config = new AttributeConfig(value);
			expect(config.path).toBe(expected);
		});

		test("sets denominator path from progressBar option", () => {
			const config = new AttributeConfig("path,progressBar=total");
			expect(config.denominatorPath).toBe("total");
		});

		test("sets align", () => {
			const config = new AttributeConfig("path,align=  left  ");
			expect(config.align).toBe("left");
		});

		test.each([
			["path,truncate", 1],
			["path,truncate=0", 1],
			["path,truncate=10.9", 10],
			["path,truncate=9999", 1000],
			["path,truncate=bad", undefined],
		])("%p sets truncate to %p", (value, expected) => {
			const config = new AttributeConfig(value);
			expect(config.truncate).toBe(expected);
			expect(config.wrap).toBe(true);
		});

		test.each([
			["path,width", undefined],
			["path,width=-1", 0],
			["path,width=0", 0],
			["path,width=10.9", 10],
			["path,width=9999", 1000],
			["path,width=bad", undefined],
		])("%p sets width to %p", (value, expected) => {
			const config = new AttributeConfig(value);
			expect(config.width).toBe(expected);
		});

		test.each(["path,wrap", "path,wrap=anything"])(
			"%p sets wrap to true",
			(value) => {
				const config = new AttributeConfig(value);
				expect(config.wrap).toBe(true);
			}
		);

		test("sets header", () => {
			const config = new AttributeConfig("path,header=  Text  ");
			expect(config.header).toBe("Text");
		});

		test.each(["path,badge", "path,badge=anything"])(
			"%p sets badge to true",
			(value) => {
				const config = new AttributeConfig(value);
				expect(config.badge).toBe(true);
			}
		);

		test("sets badgeBackground", () => {
			const config = new AttributeConfig("path,badgeBackground=  red  ");
			expect(config.badge).toBe(true);
			expect(config.badgeBackground).toBe("red");
		});

		test("sets badgeColor", () => {
			const config = new AttributeConfig("path,badgeColor=  red  ");
			expect(config.badge).toBe(true);
			expect(config.badgeColor).toBe("red");
		});

		test.each(["path,boolean", "path,boolean=anything"])(
			"%p sets boolean to true",
			(value) => {
				const config = new AttributeConfig(value);
				expect(config.boolean).toBe(true);
			}
		);

		test.each(["path,number", "path,number=anything"])(
			"%p sets number to true",
			(value) => {
				const config = new AttributeConfig(value);
				expect(config.number).toBe(true);
			}
		);

		test.each([
			["path,precision", undefined],
			["path,precision=-1", 0],
			["path,precision=0", 0],
			["path,precision=10.9", 10],
			["path,precision=99", 20],
		])("%p sets precision to %p", (value, expected) => {
			const config = new AttributeConfig(value);
			expect(config.number).toBe(true);
			expect(config.precision).toBe(expected);
		});

		test("sets prefix", () => {
			const config = new AttributeConfig("path,prefix=  Text  ");
			expect(config.prefix).toBe("  Text  ");
		});

		test("sets repeat", () => {
			const config = new AttributeConfig("path,repeat=  Text  ");
			expect(config.repeat).toBe("Text");
		});

		test("sets separator", () => {
			const config = new AttributeConfig("path,separator=  |  ");
			expect(config.separator).toBe("  |  ");
		});

		test("sets suffix", () => {
			const config = new AttributeConfig("path,suffix=  Text  ");
			expect(config.suffix).toBe("  Text  ");
		});

		test("handles escape sequences in setting values", () => {
			const config = new AttributeConfig("path,header=`` `, `x `");
			expect(config.header).toEqual("` , `x `");
		});
	});

	describe("affix", () => {
		test("returns affixed string", () => {
			const config = new AttributeConfig(
				"path,prefix=Prefix,suffix=Suffix"
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
				`path,prefix=${prefix},suffix=${suffix}`
			);
			expect(config.affixNodes(...nodes)).toEqual(expected);
		});
	});

	describe("getSeparator", () => {
		test.each([
			[
				"returns comma by default for non-badge/Boolean values",
				"path",
				document.createTextNode(", "),
			],
			[
				"returns space by default for badges",
				"path,badge",
				document.createTextNode(" "),
			],
			[
				"returns space by default for Boolean values",
				"path,boolean",
				document.createTextNode(" "),
			],
			[
				"returns undefined for empty separator",
				"path,separator=",
				undefined,
			],
			[
				"returns comma for comma alias",
				"path,separator=comma",
				document.createTextNode(", "),
			],
			[
				"returns space for space alias",
				"path,separator=space",
				document.createTextNode(" "),
			],
			[
				"returns <br> for newline alias",
				"path,separator=newline",
				document.createElement("br"),
			],
			[
				"returns custom separator",
				"path,separator= | ",
				document.createTextNode(" | "),
			],
		])("%s", (_, value, expected) => {
			const config = new AttributeConfig(value);
			const $separator = config.getSeparator();
			expect($separator).toEqual(expected);
		});
	});
});
