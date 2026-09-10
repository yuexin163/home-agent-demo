#!/bin/zsh

cd "$(dirname "$0")" || exit 1

preview_port=4173
preview_url="http://127.0.0.1:${preview_port}"

if command -v python3 >/dev/null 2>&1; then
  (sleep 1; open "$preview_url") &
  echo "壹品居家智能体已启动：$preview_url"
  echo "请保持此窗口开启；关闭窗口即可停止预览。"
  exec python3 -m http.server "$preview_port" --bind 127.0.0.1
fi

if command -v node >/dev/null 2>&1; then
  (sleep 1; open "$preview_url") &
  echo "壹品居家智能体已启动：$preview_url"
  echo "请保持此窗口开启；关闭窗口即可停止预览。"
  exec node preview-server.mjs
fi

if command -v ruby >/dev/null 2>&1; then
  (sleep 1; open "$preview_url") &
  echo "壹品居家智能体已启动：$preview_url"
  echo "请保持此窗口开启；关闭窗口即可停止预览。"
  exec ruby -run -e httpd . -p "$preview_port" -b 127.0.0.1
fi

echo "当前电脑缺少可用的本地预览运行环境，请联系项目人员协助启动。"
read "?按回车键关闭窗口。"
