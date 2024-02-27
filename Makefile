ESLINT := node_modules/.bin/eslint
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
format: node_modules
	-$(ESLINT) --fix src
	-$(PRETTIER) --write src "*.{js,json,md,mjs}"

.PHONY: lint
lint: node_modules
	$(ESLINT) src

.PHONY: test
test: node_modules
	npx jest

dist: node_modules $(SCSS_FILES) $(TYPESCRIPT_FILES)
	$(WEBPACK)
	touch $@

node_modules: package.json package-lock.json
	npm install
	touch $@
