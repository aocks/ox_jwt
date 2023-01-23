#!/bin/bash

# Simple script used for nginx docker container.

export CONF_DIR=/etc/nginx/conf.d
for file in `ls /app/*.conf` /app/ojwt.js
do
    export CONF_FILE="${CONF_DIR}/`basename $file`"
    if [ -e "${CONF_FILE}" ] ;
    then
	echo "Moving ${CONF_FILE} to ${CONF_FILE}.old"
	mv ${CONF_FILE} ${CONF_FILE}.old
    fi
    echo "Copying ${file} to ${CONF_FILE}"
    cp ${file} ${CONF_FILE}
done

export HW_FILE=/var/www/example.com/protected/hello_world.txt
if [ ! -e "${HW_FILE}" ]
then
    echo "Creating test file at ${HW_FILE}"
    mkdir -p `dirname ${HW_FILE}`
    cat > ${HW_FILE} <<EOF
Hello world.
EOF
fi


# First remove any load modules for ngx_ stuff.
sed -i '/^load_module modules.ngx_/d' /etc/nginx/nginx.conf

# Then insert load_module for using javascript into nginx.conf
sed -i '/^events .*/i load_module modules/ngx_http_js_module.so;' \
    /etc/nginx/nginx.conf
sed -i '/^events .*/i load_module modules/ngx_stream_js_module.so;' \
    /etc/nginx/nginx.conf


# Now start nginx
nginx -g 'daemon off;'
