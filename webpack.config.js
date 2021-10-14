const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
	mode: "production",
	entry: {
		index: ["./src/index.ts", "./src/index.scss"],
	},
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "index.js",
	},
	module: {
		rules: [
			{
				test: /\.scss$/,
				use: [
					MiniCssExtractPlugin.loader,
					"css-loader",
					"postcss-loader",
					"sass-loader",
				],
			},
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
	plugins: [new MiniCssExtractPlugin()],
};
