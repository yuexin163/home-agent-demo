#!/bin/zsh

set -euo pipefail

project_root="${0:A:h:h}"
env_file="$project_root/.env.asr.local"

read -r "app_id?请输入腾讯云语音 AppId："
read -rs "secret_id?请输入腾讯云语音子用户 SecretId（输入不会显示）："
echo
read -rs "secret_key?请输入腾讯云语音子用户 SecretKey（输入不会显示）："
echo

if [[ ! "$app_id" =~ '^[0-9]+$' || ! "$secret_id" =~ '^[A-Za-z0-9]+$' || ! "$secret_key" =~ '^[A-Za-z0-9]+$' ]]; then
  unset secret_id secret_key
  echo "密钥格式不正确，未写入任何内容。"
  exit 1
fi

umask 077
{
  print -r -- "TENCENT_ASR_APP_ID=$app_id"
  print -r -- "TENCENT_ASR_SECRET_ID=$secret_id"
  print -r -- "TENCENT_ASR_SECRET_KEY=$secret_key"
  print -r -- "ASR_SIGNING_PORT=3100"
  print -r -- "ASR_ALLOWED_ORIGINS=https://yipin-ai.cn,https://www.yipin-ai.cn,http://127.0.0.1:3000,http://localhost:3000"
} > "$env_file"
chmod 600 "$env_file"
unset secret_id secret_key

echo "本地语音配置已安全保存。"
