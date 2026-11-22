#!/bin/bash
# The server starts FIRST. IndexNow runs in the background once this process
# is listening. scripts/submit-indexnow.mjs submits only on a published deploy
# (REPLIT_DEPLOYMENT=1), only the URLs written at build time, and only once
# per commit SHA. CI, pull-request builds, and a later cold start of the same
# SHA do not call api.indexnow.org.
(sleep 5 && node scripts/submit-indexnow.mjs) &
HOSTNAME=0.0.0.0 node .next/standalone/server.js
