PRETTIER := node_modules/.bin/prettier
WEBPACK := node_modules/.bin/webpack

TYPESCRIPT_FILES := $(shell find src -name "*.ts")

.PHONY: build
build: dist/index.css dist/index.js

.PHONY: clean
clean:
	rm -rf dist

.PHONY: format
format:
	$(PRETTIER) --write src "*.{js,json,md}"

dist/index.css: node_modules src/index.css
	cp src/index.css dist/index.css

dist/index.js: node_modules $(TYPESCRIPT_FILES)
	$(WEBPACK)

node_modules: package.json package-lock.json
	npm install
