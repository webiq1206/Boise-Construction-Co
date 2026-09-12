#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."

# Never prune the editor workspace. The publishing service supplies the marker.
node scripts/package-deployment.mjs --check-context
bash build.sh
node scripts/package-deployment.mjs --apply