#!/usr/bin/env bash

rm -rf dist
rm -rf build
mkdir -p dist
mkdir -p build/astrid
cp -r README.md LICENSE images scripts manifest.json options.html ./build/astrid
cd build
zip -r ../dist/astrid.zip astrid
