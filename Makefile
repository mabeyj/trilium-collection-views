PRETTIER := node_modules/.bin/prettier
WEBPACK := node_modules/.bin/webpack

SCSS_FILES := $(shell find src -name "*.scss")
TYPESCRIPT_FILES := $(shell find src -name "*.ts")

.PHONY: build
build: dist

.PHONY: clean
clean:
	rm -rf dist

.PHONY: format
format:
	$(PRETTIER) --write src "*.{js,json,md}"

dist: node_modules $(SCSS_FILES) $(TYPESCRIPT_FILES)
	$(WEBPACK)
	touch $@

node_modules: package.json package-lock.json
	npm install
