#!/bin/bash
set -e

SCRIPT_PATH="$(cd "$(dirname "$0")" && pwd)/send-daily-summary.js"
NODE_PATH="$(which node 2>/dev/null || echo '/usr/local/bin/node')"

if [ ! -f "$SCRIPT_PATH" ]; then
  echo "Error: send-daily-summary.js not found at $SCRIPT_PATH"
  exit 1
fi

# Try to read sendTime from the data file via email-config.json
SEND_HOUR=18
CONFIG_FILE="$(dirname "$0")/../email-config.json"

if [ -f "$CONFIG_FILE" ]; then
  DATA_FILE=$(node -e "try{const c=require('$CONFIG_FILE');console.log(c.dataFilePath||'')}catch(e){}" 2>/dev/null)
  if [ -f "$DATA_FILE" ]; then
    SEND_TIME=$(node -e "try{const d=require('$DATA_FILE');const t=(d.emailSettings||{}).sendTime||'18:00';console.log(t.split(':')[0])}catch(e){console.log('18')}" 2>/dev/null)
    SEND_HOUR=${SEND_TIME:-18}
    echo "Using send time from data file: ${SEND_HOUR}:00"
  fi
fi

CRON_LINE="${SEND_HOUR} * * * * $NODE_PATH $SCRIPT_PATH >> /tmp/pv-summary.log 2>&1"
# Actually use correct cron format: minute hour * * *
CRON_LINE="0 ${SEND_HOUR} * * * $NODE_PATH $SCRIPT_PATH >> /tmp/pv-summary.log 2>&1"

# Remove any existing PriorityViz summary cron, then add the new one
(crontab -l 2>/dev/null | grep -v "send-daily-summary"; echo "$CRON_LINE") | crontab -

echo "Cron job installed: daily summary at ${SEND_HOUR}:00"
echo "Log output goes to: /tmp/pv-summary.log"
echo ""
echo "To update the time: change it in the app (gear icon), save, then re-run this script"
echo "To test right now:  node $SCRIPT_PATH"
