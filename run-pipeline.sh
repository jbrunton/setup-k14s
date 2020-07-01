#!/bin/bash

set -e

# Build and run the test pipeline with act: https://github.com/nektos/act
npm run build && npm run pack && act -s GITHUB_TOKEN
