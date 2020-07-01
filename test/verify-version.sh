#!/bin/bash

set -e

app=$1
version=$2

if [ -z "$app" ]; then
  echo "Error: specify app to check"
  exit 1
fi

if [ -z "$version" ]; then
  echo "Error: specify version to check"
  exit 1
fi

info=$($app version)
if [[ $info == *"$app version $version"* ]]; then
  echo "Verified $app version is $version"
else
  echo "Error: expected $app version to be $version, was $info"
  exit 1
fi
