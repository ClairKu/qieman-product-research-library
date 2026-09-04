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
  node "$REPO/scripts/sync-oap-live-metrics.mjs" --push 2>&1
  code=$?
  case $code in
    0)
      echo "ok"
      rm -f "$MARKER"
      ;;
    2)
      # off-VPN precheck skip: quiet, no notification, keep the marker state
      echo "skipped (off intranet)"
      ;;
    3)
      # data synced and committed locally, GitHub unreachable; next run pushes
      echo "push deferred"
      ;;
    *)
      echo "FAILED"
      if [ ! -f "$MARKER" ] || [ -n "$(find "$MARKER" -mtime +1 2>/dev/null)" ]; then
        touch "$MARKER"
        osascript -e 'display notification "OAP 实时数据同步失败，请检查 ~/Library/Logs/oap-metrics-sync.log（常见原因：ontology 登录过期 / 数据源异常）" with title "OAP Metrics Sync"' 2>/dev/null || true
      fi
      ;;
  esac
} >> "$LOG" 2>&1
