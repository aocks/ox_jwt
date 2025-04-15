
#
# Simple makefile to help manage JWT tools
#

# Show help if no target provided (i.e., if user just types "make").
.DEFAULT_GOAL := help

# Indicate targets which are not files but commands
.PHONY: clean help test pylint

# The stuff below implements an auto help feature
define PRINT_HELP_PYSCRIPT
import re, sys

for line in sys.stdin:
	match = re.match(r'^([.a-zA-Z_-]+):.*?## (.*)$$', line)
	if match:
		target, help = match.groups()
		print("%-20s %s" % (target, help))
endef
export PRINT_HELP_PYSCRIPT

help:   ## Show help for avaiable targets.
	@python -c "$$PRINT_HELP_PYSCRIPT" < $(MAKEFILE_LIST)


README.md: README.org  ## Create markdown README file.
	pandoc --from=org --to=markdown -o $@ $<

pylint:  ## Run pylint on python files.
	pylint src/ox_jwt

test:   ## Test nginx.
	$(MAKE) -C nginx test_ojwt_nginx

clean:  ## Clean up generated files.
	$(MAKE) -C nginx clean
