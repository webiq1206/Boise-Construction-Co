#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."

# Publishing may build in the editor's mount namespace. Never delete recovery
# archives or caches from this command. Archive bulky development evidence in
# verified private storage before publishing, independently of the app build.
bash build.sh
