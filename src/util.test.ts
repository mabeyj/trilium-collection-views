import { isEnumValue } from "collection-views/util";

enum Direction {
	North = "north",
	South = "south",
}

describe("isEnumValue", () => {
	test.each([
		["", false],
		["bad", false],
		["North", false],
		["north", true],
		["south", true],
	])("%p returns %p", (value, expected) => {
		expect(isEnumValue(Direction, value)).toBe(expected);
	});
});
