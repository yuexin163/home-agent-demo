#!/bin/zsh

set -e

project_root="${0:A:h:h}"
node_bin="${NODE_BIN:-$(command -v node)}"
deliverable_root="$project_root/../交付文件"
date_stamp="${1:-$(date +%Y%m%d)}"
package_name="壹品居家智能体-同事预览静态包-$date_stamp"
package_dir="$deliverable_root/$package_name"
archive_path="$deliverable_root/$package_name.zip"
windows_archive_path="$deliverable_root/yipin-smart-home-preview-windows-$date_stamp.zip"
build_root="$(mktemp -d /private/tmp/yipin-static-package.XXXXXX)"
build_project="$build_root/project"

cleanup() {
  rm -rf "$build_root"
}
trap cleanup EXIT

mkdir -p "$deliverable_root"
rm -rf "$package_dir" "$archive_path" "$windows_archive_path"

rsync -a \
  --exclude='.git' \
  --exclude='.next' \
  --exclude='node_modules' \
  --exclude='out' \
  --exclude='outputs' \
  --exclude='tmp' \
  --exclude='dist' \
  --exclude='.wrangler' \
  --exclude='.vinext' \
  --exclude='.env*' \
  --exclude='deploy/server-package' \
  "$project_root/" "$build_project/"

ln -s "$project_root/node_modules" "$build_project/node_modules"
rm -rf "$build_project/app/api"

cd "$build_project"
STATIC_EXPORT=1 NEXT_PUBLIC_STATIC_PREVIEW=1 "$node_bin" node_modules/next/dist/bin/next build --webpack

mkdir -p "$package_dir"
rsync -a "$build_project/out/" "$package_dir/"
rsync -a "$project_root/deploy/static-preview/" "$package_dir/"
/usr/bin/find "$package_dir" -type d -exec chmod 755 {} +
/usr/bin/find "$package_dir" -type f -exec chmod 644 {} +
chmod +x "$package_dir/启动预览.command"
/usr/bin/find "$package_dir" -name ".DS_Store" -delete

cd "$deliverable_root"
/usr/bin/zip -qry "$archive_path" "$package_name"
python3 "$project_root/scripts/create-windows-compatible-zip.py" \
  "$package_dir" \
  "$windows_archive_path" \
  --root-name "yipin-smart-home-preview"

echo "$archive_path"
echo "$windows_archive_path"
