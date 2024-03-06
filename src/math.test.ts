import {
	clamp,
	parseFloatStrict,
	parseOptionalInt,
} from "collection-views/math";

describe("parseOptionalInt", () => {
	test.each([
		[undefined, undefined],
		[null, undefined],
		[1.9, 1],
		["", undefined],
		["-11", -10],
		["5", 5],
		["5.9", 5],
		["11", 10],
		["+1", 1],
		["-1", -1],
		["  1  ", 1],
		["bad", undefined],
	])("%p clamped to (-10, 10) returns %p", (value, expected) => {
		expect(parseOptionalInt(value, -10, 10)).toBe(expected);
	});
});

describe("parseFloatStrict", () => {
	test.each([
		[undefined, NaN],
		[null, NaN],
		[1.5, 1.5],
		["", NaN],
		["123", 123],
		["123.456", 123.456],
		["+1", 1],
		["-1", -1],
		["  1  ", 1],
		["bad", NaN],
		["2022-01-01", NaN],
	])("%p returns %d", (value, expected) => {
		expect(parseFloatStrict(value)).toBe(expected);
	});
});

describe("clamp", () => {
	test.each([
		[0.5, 1],
		[1, 1],
		[5.5, 5.5],
		[10, 10],
		[10.5, 10],
	])("%d clamped to (1, 10) returns %d", (value, expected) => {
		expect(clamp(value, 1, 10)).toBe(expected);
	});
});
