#!/bin/bash
# IndexNow submission runs once on startup, then the server starts.
# In production, public/ is served by the app so the key file is already available.
node scripts/submit-indexnow.mjs
HOSTNAME=0.0.0.0 node .next/standalone/server.js
