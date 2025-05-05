#!/bin/bash

npm run build
rm ../backend/static -rf
mkdir ../backend/static
cp -r build/* ../backend/static
