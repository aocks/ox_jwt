
# Simple docker file to build exmaple of NGINX using JWT authentication.


# Version 1.21.4 works well. If you upgrade to 1.22, you may
# have problmes with NGINX njs script being overly picky about
# variable redefinitions ins ome libraries.
FROM nginx:1.21.4


# Copy files into /app directory of container
COPY conf.d /app/
COPY ojwt/ojwt.js /app/
COPY start.sh /app/start.sh

# Set start script
RUN chmod -R ugo+rx /app/start.sh
CMD ["/app/start.sh"]