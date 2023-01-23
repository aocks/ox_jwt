
#
# Simple makefile to help manage docker stuff
#

# Show help if no target provided (i.e., if user just types "make").
.DEFAULT_GOAL := help

NGINX_PORT := 8089

# By default we run docker with -d but you can pass something
# else (e.g., D_RUN_FLAGS="-it" if you want).
ifndef D_RUN_FLAGS
export D_RUN_FLAGS=-d
endif


# Indicate targets which are not files but commands
.PHONY: clean help lint ojwt

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

build_ojwt_nginx:    ## Build nginx docker image
	@$(MAKE) do_build_ojwt_nginx

do_build_ojwt_nginx:  ojwt
	docker build --tag ojwt_nginx .

ojwt:   ## Make dependancies in ojwt subdirectory
	$(MAKE) -C ojwt ojwt.js prod_test_jwt.txt

run_ojwt_nginx:  ## Build and run nginx docker image in container
	$(MAKE) do_build_ojwt_nginx
	@echo "Using NGINX_PORT=${NGINX_PORT}"
	docker run --rm --name ojwt_nginx_1 -p ${NGINX_PORT}:80 \
          ${D_RUN_FLAGS} ojwt_nginx

stop_ojwt_nginx:  ## Stop docker container
	@echo "Stopping container"
	docker stop ojwt_nginx_1

test_ojwt_nginx:  ## Test building ojwt/ojwt.js and dependancies (TRY THIS FIRST)
	@if [ ! -z "`docker ps -a -q -f name=ojwt_nginx_1`" ] ; then \
		@$(MAKE) stop_ojwt_nginx ;  \
        fi
	@$(MAKE) run_ojwt_nginx
	@echo "Sleep 2 seconds to wait for container to start."
	sleep 2
	@echo "******************************************************************"
	@echo "****************    Using curl to check token    *****************"
	@echo " "
	curl -H Host:example.com "localhost:${NGINX_PORT}/token-health-check?jwt=`cat ojwt/prod_test_jwt.txt`"
	@echo " "
	@echo "*** You should see the message 'token validated' if it worked. ***"
	@echo "******************************************************************"
	@echo " "
	@echo " "
	@echo "******************************************************************"
	@echo "************    Using curl to GET hello_world.txt    *************"
	@echo " "
	curl -H Host:example.com "localhost:${NGINX_PORT}/protected/hello_world.txt?jwt=`cat ojwt/prod_test_jwt.txt`"
	@echo " "
	@echo "*** You should see the message 'Hello world.' if it worked.    ***"
	@echo "******************************************************************"
	@$(MAKE) stop_ojwt_nginx

exec_nginx:  ## Use docker exec to get a shell on the nginx container
	docker exec -it ojwt_nginx_1 /bin/bash

clean:  ## Clean out intermediate files which we can auto-generate.
	$(MAKE) -C ojwt clean
