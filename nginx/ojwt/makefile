
#
# Simple makefile to help managing ojwt easier.
#

# Show help if no target provided (i.e., if user just types "make").
.DEFAULT_GOAL := help

# Indicate targets which are not files but commands
.PHONY: clean help lint


# Create a simple python script to show help
define PRINT_HELP_PYSCRIPT
import re, sys

for line in sys.stdin:
	my_re = re.compile(r'^(.+):'
	                   '*.*?## (.*)$$')
	match = my_re.search(line)
	if match:
		target, help = match.groups()
		print("%-25s %s" % (target, help))
endef
export PRINT_HELP_PYSCRIPT


# Show help for anything which starts with two pound signs
help:   ## Show help for makefile targets
	@python3 -c "$$PRINT_HELP_PYSCRIPT" < $(MAKEFILE_LIST)


node_modules:  ## Create node_modules if they do not exist.
	npm install

private_key.pem: ## Make private key using otools.js
	node otools.js make_priv_key -o $@

## Make public key from private key via otools.js
public_key.pem: node_modules private_key.pem
	node otools.js make_pub_key -o $@ -i private_key.pem

test_priv_key.pem:  ## Make test private key using otools.js
	node otools.js make_priv_key -o $@

## Make test public key using otools.js
test_pub_key.pem: node_modules test_priv_key.pem
	node otools.js make_pub_key -o $@ -i test_priv_key.pem

## Put keys into my_keys.js
my_keys.js: node_modules public_key.pem test_pub_key.pem
	node otools.js make_keys

## Make production JWT for testing.
prod_test_jwt.txt:  node_modules private_key.pem my_keys.js
	node otools encode -k private_key.pem -m "test key" \
           --host example.com -exp `date --date=tomorrow` -o $@

test:   ## Run tests (generating required keys and things first if necessary)
	$(MAKE) run_jest

run_jest: node_modules public_key.pem test_pub_key.pem test_priv_key.pem \
          my_keys.js prod_test_jwt.txt
	npm test

main.js:  ## Build main.js bundled file used to produce final ojwt.js package.
	$(MAKE) do_main.js

ojwt.js:  ## Build final ojwt.js single file to deploy to NGINX.
	$(MAKE) do_ojwt.js

do_ojwt.js: node_modules main.js
	node otools.js package -i main.js -o ojwt.js

do_main.js: node_modules my_keys.js
	npm run main.js

clean:  ## Clean out intermediate files which we can auto-generate.
	rm -f ojwt.js main.js public_key.pem test_*_key.pem my_keys.js \
              *test_jwt.txt *\~
