#!/bin/zsh

set -euo pipefail

PROJECT_DIR="${0:A:h:h}"
NODE_BIN="${NODE_BIN:-$(command -v node)}"
DATE_STAMP="${1:-$(date +%y%m%d)}"
OUTPUT_DIR="${2:-$PROJECT_DIR/outputs/competition-$DATE_STAMP}"
SERVER_ARCHIVE="$OUTPUT_DIR/壹品居家智能体_服务器部署包_$DATE_STAMP.tar.gz"
SOURCE_ARCHIVE="$OUTPUT_DIR/壹品居家智能体_完整源码_$DATE_STAMP.zip"
BUILD_ROOT="$(/usr/bin/mktemp -d /private/tmp/yipin-competition-package.XXXXXX)"
BUILD_PROJECT="$BUILD_ROOT/build-project"
SERVER_STAGE="$BUILD_ROOT/server-stage"
SOURCE_STAGE="$BUILD_ROOT/source-stage"

cleanup() {
  /bin/rm -rf "$BUILD_ROOT"
}
trap cleanup EXIT

if [[ ! -d "$PROJECT_DIR/node_modules" ]]; then
  echo "未找到 node_modules，请先在项目目录完成 npm install。"
  exit 1
fi

/bin/mkdir -p "$OUTPUT_DIR" "$SERVER_STAGE/site" "$SERVER_STAGE/asr-service" "$SERVER_STAGE/config" "$SOURCE_STAGE/yipin-ai-web"

# 使用隔离副本构建，避免静态导出影响当前开发目录。
/usr/bin/rsync -a \
  --exclude='.git' \
  --exclude='.next' \
  --exclude='node_modules' \
  --exclude='out' \
  --exclude='outputs' \
  --exclude='tmp' \
  --exclude='dist' \
  --exclude='.wrangler' \
  --exclude='.vinext' \
  --exclude='.openai' \
  --exclude='.env*' \
  --exclude='.yipin-dev.log' \
  --exclude='.DS_Store' \
  "$PROJECT_DIR/" "$BUILD_PROJECT/"
/bin/ln -s "$PROJECT_DIR/node_modules" "$BUILD_PROJECT/node_modules"
/bin/rm -rf "$BUILD_PROJECT/app/api"

cd "$BUILD_PROJECT"
STATIC_EXPORT=1 \
NEXT_PUBLIC_STATIC_PREVIEW=1 \
NEXT_PUBLIC_SITE_URL=https://yipin-ai.cn \
"$NODE_BIN" node_modules/next/dist/bin/next build --webpack

if [[ ! -f "$BUILD_PROJECT/out/index.html" ]]; then
  echo "静态构建失败：未找到 out/index.html。"
  exit 1
fi

# 服务器部署包：静态站点、ASR服务、运维配置与说明，不含任何密钥。
/usr/bin/rsync -a "$BUILD_PROJECT/out/" "$SERVER_STAGE/site/"
/bin/cp "$PROJECT_DIR/server/asr_signing_service.py" "$SERVER_STAGE/asr-service/asr_signing_service.py"
/bin/cp "$PROJECT_DIR/deploy/server/yipin-asr-signing.service" "$SERVER_STAGE/config/yipin-asr-signing.service"
/bin/cp "$PROJECT_DIR/deploy/server/nginx-production.conf" "$SERVER_STAGE/config/nginx-production.conf"
/bin/cp "$PROJECT_DIR/deploy/server/nginx-asr-location.conf" "$SERVER_STAGE/config/nginx-asr-location.conf"
/bin/cp "$PROJECT_DIR/deploy/server/DEPLOYMENT.md" "$SERVER_STAGE/DEPLOYMENT.md"
/usr/bin/find "$SERVER_STAGE" -name '.DS_Store' -delete
/usr/bin/find "$SERVER_STAGE" -type d -exec chmod 0755 {} +
/usr/bin/find "$SERVER_STAGE" -type f -exec chmod 0644 {} +
/bin/chmod 0755 "$SERVER_STAGE/asr-service/asr_signing_service.py"

cd "$SERVER_STAGE"
/usr/bin/find . -type f ! -name 'SHA256SUMS.txt' -print0 | /usr/bin/xargs -0 shasum -a 256 > SHA256SUMS.txt
/usr/bin/tar -czf "$SERVER_ARCHIVE" .

# 完整源码包：保留可复现构建所需代码和锁文件，排除依赖、构建缓存、密钥与临时文件。
/usr/bin/rsync -a \
  --exclude='.git' \
  --exclude='.next' \
  --exclude='node_modules' \
  --exclude='out' \
  --exclude='outputs' \
  --exclude='tmp' \
  --exclude='dist' \
  --exclude='.wrangler' \
  --exclude='.vinext' \
  --exclude='.openai' \
  --exclude='.env*' \
  --exclude='.yipin-dev.log' \
  --exclude='.DS_Store' \
  "$PROJECT_DIR/" "$SOURCE_STAGE/yipin-ai-web/"
/bin/cp "$PROJECT_DIR/.env.example" "$SOURCE_STAGE/yipin-ai-web/.env.example"
python3 "$PROJECT_DIR/scripts/create-windows-compatible-zip.py" \
  "$SOURCE_STAGE/yipin-ai-web" \
  "$SOURCE_ARCHIVE" \
  --root-name 'yipin-ai-web'

cd "$OUTPUT_DIR"
shasum -a 256 "${SERVER_ARCHIVE:t}" "${SOURCE_ARCHIVE:t}" > "SHA256SUMS_$DATE_STAMP.txt"

echo "源码包：$SOURCE_ARCHIVE"
echo "部署包：$SERVER_ARCHIVE"
echo "校验文件：$OUTPUT_DIR/SHA256SUMS_$DATE_STAMP.txt"
