const path = require("path");

module.exports = {
	entry: "./src/index.ts",
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "index.js",
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: "ts-loader",
			},
		],
	},
	resolve: {
		alias: { "collection-views": path.resolve(__dirname, "src") },
		extensions: [".ts", ".js"],
	},
};
