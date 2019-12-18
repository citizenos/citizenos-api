NODE = node
NODE_OPTS = --use-strict
MOCHA = ./node_modules/.bin/_mocha
TEST = test/**/*_test.js

love:
	@echo "Feel like makin' love."

test:
	@$(NODE) $(NODE_OPTS) $(MOCHA) -R dot $(TEST)

spec:
	@$(NODE) $(NODE_OPTS) $(MOCHA) -R spec $(TEST)

autotest:
	@$(NODE) $(NODE_OPTS) $(MOCHA) -R dot --watch $(TEST)

autospec:
	@$(NODE) $(NODE_OPTS) $(MOCHA) -R spec --watch $(TEST)

shrinkwrap:
	npm shrinkwrap --dev

pack:
	@file=$$(npm pack); echo "$$file"; tar tf "$$file"

publish:
	npm publish

tag:
	git tag "v$$($(NODE) -e 'console.log(require("./package").version)')"

clean:
	-$(RM) *.tgz
	npm prune --production

.PHONY: love
.PHONY: test spec autotest autospec
.PHONY: shrinkwrap
.PHONY: pack publish tag
.PHONY: clean
