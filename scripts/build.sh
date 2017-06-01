#!/bin/bash

# Default to developement
if [ "$NODE_ENV" = "" ]
then
    NODE_ENV="developement"
fi

rm -rf ./build/

echo "Copying static files..."
mkdir -p ./build/client
cp -r ./static/* ./build/client

echo "Creating banks icons sprite..."
mkdir -p ./build/client/images
mkdir -p ./build/client/css
./scripts/sprite.sh ./build/client/images/sprite.svg ./build/client/css/sprite.css

echo "Concatening and copying CSS..."
./scripts/build-css.sh

echo "Concatening and copying vendor JS..."
mkdir -p ./build/client/js
./scripts/build-vendor-js.sh

echo "Building client JS..."

# Only remove developement imports and long package ids on production
if [ "$NODE_ENV" = "production" ]
then
    SUPP_PRODUCTION_BUILD_ARGS="-g uglifyify \
                                -p bundle-collapser/plugin"
fi

./node_modules/browserify/bin/cmd.js ./client/main.js -v \
    -t [ babelify --presets es2015,react --plugins transform-runtime ] \
    -g [ envify --NODE_ENV $NODE_ENV ] \
    $SUPP_PRODUCTION_BUILD_ARGS \
    -o ./build/client/js/main.js

echo "Copying shared files..."
mkdir -p ./build/server/shared
cp -r ./shared/*.json ./build/server/shared

echo "Building server JS..."
mkdir -p ./build/server
./node_modules/babel-cli/bin/babel.js \
    --presets es2015,stage-0 \
    --plugins transform-runtime \
    ./server/ \
    -d ./build/server

echo "Copying Weboob endpoint..."
mkdir -p ./build/server/weboob
cp ./server/weboob/main.py ./build/server/weboob/ && chmod +x ./build/server/weboob/main.py

echo "Done!"
