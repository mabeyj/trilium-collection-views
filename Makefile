TYPESCRIPT_FILES := $(shell find src -name "*.ts")

.PHONY: build
build: dist/index.js

.PHONY: clean
clean:
	rm -rf dist

dist/index.js: node_modules $(TYPESCRIPT_FILES)
	node_modules/.bin/webpack
	cp src/index.css dist/index.css

node_modules: package.json
	npm install
