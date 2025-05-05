#!/bin/bash

npm run build
rm -rf ../backend/static 
mkdir -p ../backend/static 
cp -r out/* ../backend/static
