ESLINT := node_modules/.bin/eslint
JEST := node_modules/.bin/jest
PRETTIER := node_modules/.bin/prettier
WEBPACK := node_modules/.bin/webpack

PRETTIER_ARGS := .github src "*.{js,json,md,mjs}"

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
	-$(PRETTIER) --write $(PRETTIER_ARGS)

.PHONY: check-format
check-format: node_modules
	$(PRETTIER) --check $(PRETTIER_ARGS)

.PHONY: lint
lint: node_modules
	$(ESLINT) src

.PHONY: test
test: node_modules
	$(JEST)

dist: node_modules $(SCSS_FILES) $(TYPESCRIPT_FILES)
	$(WEBPACK)
	touch $@

node_modules: package.json package-lock.json
	npm install
	touch $@
