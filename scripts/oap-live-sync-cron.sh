#!/bin/zsh
# launchd wrapper for sync-oap-live-metrics.mjs.
# Prefers Redash direct (REDASH_API_KEY from the login shell rc); falls back
# to the ontology CLI. Logs to ~/Library/Logs/oap-metrics-sync.log and raises
# a macOS notification at most once per day when syncs keep failing.
set -u
source ~/.zshrc >/dev/null 2>&1 || true
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

REPO="$(cd "$(dirname "$0")/.." && pwd)"
LOG=~/Library/Logs/oap-metrics-sync.log
MARKER=~/Library/Logs/.oap-metrics-sync-notified

{
  echo "---- $(date '+%Y-%m-%d %H:%M:%S') start"
  if node "$REPO/scripts/sync-oap-live-metrics.mjs" --push 2>&1; then
    echo "ok"
    rm -f "$MARKER"
  else
    echo "FAILED"
    if [ ! -f "$MARKER" ] || [ -n "$(find "$MARKER" -mtime +1 2>/dev/null)" ]; then
      touch "$MARKER"
      osascript -e 'display notification "OAP 实时数据同步失败，请检查 ~/Library/Logs/oap-metrics-sync.log（常见原因：不在办公网 / ontology 登录过期）" with title "OAP Metrics Sync"' 2>/dev/null || true
    fi
  fi
} >> "$LOG" 2>&1
