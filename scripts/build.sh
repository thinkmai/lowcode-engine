#!/usr/bin/env bash

set -e

rush build \
  --to @alilc/lowcode-engine

rush build:umd \
  --to @alilc/lowcode-engine \
  --to @alilc/lowcode-react-simulator-renderer \
  --to @alilc/lowcode-react-renderer

cp ./packages/react-simulator-renderer/dist/js/* ./packages/engine/dist/js/
cp ./packages/react-simulator-renderer/dist/css/* ./packages/engine/dist/css/
