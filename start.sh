#!/bin/bash
# The server starts FIRST. IndexNow used to run to completion before the
# server, which delayed listening by every external HTTP round-trip it makes -
# on an autoscale cold start the promote healthchecks hit during that gap and
# the deploy failed with "built successfully but failed to start". Submission
# now runs in the background once the server is already accepting requests.
(sleep 5 && node scripts/submit-indexnow.mjs) &
HOSTNAME=0.0.0.0 node .next/standalone/server.js
