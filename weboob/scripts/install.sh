#!/bin/bash

cd weboob
rm -rf env

# Let's find out if Python's virtualenv is installed and, if so, what name its binary has
pyvenv=$(which virtualenv || which virtualenv2 || echo "")
if [[ -z $pyvenv ]]; then
    # Virtualenv isn't installed, we abort the installation
    echo "Virtualenv is not installed"
    return 1;
fi

mkdir -p ./env && $pyvenv ./env && source ./env/bin/activate && pip install -r requirements.txt && cd .. && ./weboob/scripts/test.sh
