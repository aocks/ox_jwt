
#
# Simple makefile to help manage JWT tools
#

# Show help if no target provided (i.e., if user just types "make").
.DEFAULT_GOAL := help

# Indicate targets which are not files but commands
.PHONY: clean help test

help:
	@echo " "
	@echo "         The following targets are available:"
	@echo " "
	@echo "test:    Build and test ojwt.js file, JWT, and test with nginx."
	@echo "clean:   Clean out intermediate files which we can auto-generate."
	@echo "help:    Shows this help message."
	@echo " "

test:
	$(MAKE) -C nginx test_ojwt_nginx

clean:
	$(MAKE) -C nginx clean
