#!/bin/bash
# IndexNow submission runs on startup, then the dev server starts.
node scripts/submit-indexnow.mjs
npm run dev
