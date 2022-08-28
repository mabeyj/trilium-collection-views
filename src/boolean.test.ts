import { isTruthy } from "collection-views/boolean";

describe("isTruthy", () => {
	test.each([
		["", true],
		["n", false],
		["no", false],
		["  NO  ", false],
		["f", false],
		["false", false],
		["y", true],
		["yes", true],
		["true", true],
	])("%p returns %s", (value, expected) => {
		expect(isTruthy(value)).toBe(expected);
	});
});
