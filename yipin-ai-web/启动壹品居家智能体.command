#!/bin/zsh

set -u

PROJECT_DIR="${0:A:h}"
SITE_URL="http://127.0.0.1:3000"
LOG_FILE="$PROJECT_DIR/.yipin-dev.log"
BUNDLED_NODE="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"

cd "$PROJECT_DIR" || exit 1

if [[ -x "$BUNDLED_NODE" ]]; then
  NODE_BIN="$BUNDLED_NODE"
elif command -v node >/dev/null 2>&1; then
  NODE_BIN="$(command -v node)"
else
  osascript -e 'display alert "无法启动壹品居家智能体" message "未找到网页运行环境，请联系技术人员检查。" as critical'
  exit 1
fi

if /usr/bin/curl -fsS --max-time 3 "$SITE_URL" 2>/dev/null | /usr/bin/grep -q "壹品居家智能体"; then
  /usr/bin/open "$SITE_URL"
  exit 0
fi

PORT_PID="$(/usr/sbin/lsof -tiTCP:3000 -sTCP:LISTEN 2>/dev/null | /usr/bin/head -n 1)"
if [[ -n "$PORT_PID" ]]; then
  PROCESS_DIR="$(/usr/sbin/lsof -a -p "$PORT_PID" -d cwd -Fn 2>/dev/null | /usr/bin/sed -n 's/^n//p')"
  if [[ "$PROCESS_DIR" == "$PROJECT_DIR" ]]; then
    /bin/kill -9 "$PORT_PID" 2>/dev/null
    /bin/sleep 1
  else
    /usr/bin/osascript -e 'display alert "无法启动壹品居家智能体" message "本机 3000 端口正被其他程序占用，请联系技术人员处理。" as critical'
    exit 1
  fi
fi

echo ""
echo "壹品居家智能体正在启动……"
echo "网页运行期间请勿关闭此窗口。"
echo ""

(
  for attempt in {1..30}; do
    if /usr/bin/curl -fsS --max-time 2 "$SITE_URL" 2>/dev/null | /usr/bin/grep -q "壹品居家智能体"; then
      /usr/bin/open "$SITE_URL"
      exit 0
    fi
    /bin/sleep 1
  done
  /usr/bin/osascript -e 'display alert "网页启动未完成" message "请稍后再试；如仍无法访问，请联系技术人员查看启动记录。" as critical'
) &

exec "$NODE_BIN" node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1 --port 3000 2>&1 | /usr/bin/tee "$LOG_FILE"
