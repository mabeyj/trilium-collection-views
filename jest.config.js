const { pathsToModuleNameMapper } = require("ts-jest");
const { compilerOptions } = require("./tsconfig");

module.exports = {
	preset: "ts-jest",
	testEnvironment: "jsdom",
	moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
		prefix: `<rootDir>/${compilerOptions.baseUrl}/`,
	}),
};
