#!/bin/bash
 cat ./node_modules/jquery/dist/jquery.js \
     ./node_modules/jquery.cookie/jquery.cookie.js \
     ./node_modules/jquery-minicolors/jquery.minicolors.js \
     ./client/vendor/*.js \
     ./node_modules/bootstrap-kresus/js/bootstrap.js > ./build/client/js/vendor.js
