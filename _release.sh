#!/bin/bash
# npm run build
rm -rf /Users/yunser/app/dms-projects/dms-cli/view/dist/*
scp -r ./dist/* /Users/yunser/app/dms-projects/dms-cli/view/dist
