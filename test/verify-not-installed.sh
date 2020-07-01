#!/bin/bash

set -e

apps=$1

if [ -z "$apps" ]; then
  echo "Error: specify apps to check"
  exit 1
fi

for app in "${apps[@]}"
do 
  if [ -x "$(command -v $app)" ]; then
    echo "Error: expected $app to not be installed."
    exit 1
  else
    echo "Verified $app isn't installed"
  fi
done
