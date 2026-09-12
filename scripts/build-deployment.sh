#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."

# The configured publishing command supplies an explicit build-only opt-in.
# The independent namespace check still refuses the original editor workspace.
node scripts/package-deployment.mjs --check-context
bash build.sh
node scripts/package-deployment.mjs --apply