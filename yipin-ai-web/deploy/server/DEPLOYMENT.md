# 中建壹品居家智能体部署与运维说明

## 1. 当前生产架构

正式网站采用“静态网页 + 独立语音签名服务”方案：

```text
用户浏览器
    ↓ HTTPS 443
Nginx
    ├─ /                    → /var/www/yipin-smart-home 静态网页
    └─ /api/asr/sign       → 127.0.0.1:3100 腾讯云 ASR 签名服务
                                      ↓
                               腾讯云实时语音识别
```

当前正式域名：

```text
https://yipin-ai.cn
```

本方案不需要数据库，也不需要 Node.js 常驻网页服务。图片、PDF、字体和前端代码均由 Nginx 直接提供；Python 签名服务只负责生成短时有效的腾讯云 WebSocket 地址。

## 2. 交付包内容

服务器部署包解压后包含：

```text
site/                         静态网页成品，直接同步到 Nginx 网站目录
asr-service/                  腾讯云实时语音识别签名服务
config/                       Nginx 与 systemd 配置参考文件
DEPLOYMENT.md                 本说明
SHA256SUMS.txt                包内文件校验值
```

部署包不包含腾讯云 SecretId、SecretKey、SSH 私钥、HTTPS 证书或开发环境文件。正式密钥必须由运维人员单独写入服务器私密环境文件。

## 3. 服务器目录

| 用途 | 路径 |
| --- | --- |
| 静态网站 | `/var/www/yipin-smart-home` |
| ASR 签名程序 | `/var/www/yipin-asr-service/asr_signing_service.py` |
| ASR 私密环境变量 | `/home/ubuntu/.config/yipin-smart-home/asr.env` |
| systemd 服务 | `/etc/systemd/system/yipin-asr-signing.service` |
| Nginx 站点配置 | `/etc/nginx/sites-available/yipin-smart-home` |

密钥文件必须保持：

```text
-rw------- ubuntu:ubuntu asr.env
```

密钥不得放入静态网站目录、源码压缩包或 Git。

## 4. 环境要求

- Ubuntu 22.04 LTS；
- Nginx；
- Python 3.10 或更高；
- systemd；
- 有效 HTTPS 证书；
- 公网仅需开放 80、443 和运维使用的 SSH 端口；
- 3100 端口只监听 `127.0.0.1`，不对公网开放。

## 5. 首次部署

以下示例假设部署包已解压到 `/tmp/yipin-release`，服务器基础环境已按企业规范配置完成。

### 5.1 部署静态网站

```bash
sudo mkdir -p /var/www/yipin-smart-home
sudo rsync -a --delete /tmp/yipin-release/site/ /var/www/yipin-smart-home/
sudo find /var/www/yipin-smart-home -type d -exec chmod 0755 {} +
sudo find /var/www/yipin-smart-home -type f -exec chmod 0644 {} +
```

### 5.2 部署 ASR 签名服务

```bash
sudo mkdir -p /var/www/yipin-asr-service
sudo install -o ubuntu -g ubuntu -m 0755 \
  /tmp/yipin-release/asr-service/asr_signing_service.py \
  /var/www/yipin-asr-service/asr_signing_service.py
sudo mkdir -p /home/ubuntu/.config/yipin-smart-home
```

创建 `/home/ubuntu/.config/yipin-smart-home/asr.env`，仅填写本账号实际参数：

```text
TENCENT_ASR_APP_ID=实际AppId
TENCENT_ASR_SECRET_ID=实际SecretId
TENCENT_ASR_SECRET_KEY=实际SecretKey
ASR_SIGNING_PORT=3100
ASR_ALLOWED_ORIGINS=https://yipin-ai.cn,https://www.yipin-ai.cn
```

设置严格权限：

```bash
sudo chown ubuntu:ubuntu /home/ubuntu/.config/yipin-smart-home/asr.env
sudo chmod 0600 /home/ubuntu/.config/yipin-smart-home/asr.env
```

### 5.3 安装服务配置

```bash
sudo install -o root -g root -m 0644 \
  /tmp/yipin-release/config/yipin-asr-signing.service \
  /etc/systemd/system/yipin-asr-signing.service
sudo systemctl daemon-reload
sudo systemctl enable --now yipin-asr-signing.service
```

### 5.4 配置 Nginx 与 HTTPS

`config/nginx-production.conf` 是当前域名的配置参考，包含 HTTP 跳转、HTTPS 静态站点、`/api/asr/sign` 反向代理和必要安全响应头。正式安装前应先核对域名、证书路径与服务器目录，并遵循企业现有 Nginx 管理规范。

```bash
sudo nginx -t
sudo systemctl reload nginx
```

不得在未通过 `nginx -t` 时重载 Nginx。

## 6. ASR 签名服务

环境文件包含以下字段：

```text
TENCENT_ASR_APP_ID=...
TENCENT_ASR_SECRET_ID=...
TENCENT_ASR_SECRET_KEY=...
ASR_SIGNING_PORT=3100
ASR_ALLOWED_ORIGINS=https://yipin-ai.cn,https://www.yipin-ai.cn
```

安装并启动服务：

```bash
sudo install -o root -g root -m 0644 \
  /path/to/yipin-asr-signing.service \
  /etc/systemd/system/yipin-asr-signing.service
sudo systemctl daemon-reload
sudo systemctl enable --now yipin-asr-signing.service
```

本机检查：

```bash
systemctl is-active yipin-asr-signing.service
systemctl is-enabled yipin-asr-signing.service
curl -fsS http://127.0.0.1:3100/health
```

正常结果为：

```json
{"status":"ok"}
```

查看日志：

```bash
sudo journalctl -u yipin-asr-signing.service -n 100 --no-pager
```

## 7. Nginx 关键配置

正式域名的 HTTPS `server` 中需包含：

```nginx
location = /api/asr/sign {
    limit_except POST { deny all; }

    proxy_pass http://127.0.0.1:3100/api/asr/sign;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header Origin $http_origin;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_connect_timeout 3s;
    proxy_read_timeout 5s;
    proxy_send_timeout 5s;
    proxy_hide_header Server;
}

location / {
    try_files $uri $uri/ =404;
}
```

修改后必须先检查再重载：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 8. 静态网页构建

正式静态构建必须设置生产域名：

```bash
STATIC_EXPORT=1 \
NEXT_PUBLIC_STATIC_PREVIEW=1 \
NEXT_PUBLIC_SITE_URL=https://yipin-ai.cn \
node node_modules/next/dist/bin/next build --webpack
```

构建完成后确认：

```bash
test -f out/index.html
test -f out/audio/pcm-recorder.worklet.js
find out -type f -name '*.pdf' | wc -l
```

不得上传：

- `.env*`；
- `.git`；
- `node_modules`；
- 源代码；
- SSH 私钥；
- 开发日志和临时文件。

## 9. 更新静态网页

建议在非演示时间更新，并先备份当前版本：

```bash
tar -czf /安全备份目录/yipin-smart-home-backup.tar.gz \
  -C /var/www/yipin-smart-home .
```

上传前先预演：

```bash
rsync -azn --delete --itemize-changes \
  out/ ubuntu@服务器:/var/www/yipin-smart-home/
```

确认源目录确实是最终 `out/` 后再正式同步：

```bash
rsync -az --delete \
  out/ ubuntu@服务器:/var/www/yipin-smart-home/
```

部分原始 PDF 可能带有仅所有者可读权限。同步后必须统一静态文件权限：

```bash
find /var/www/yipin-smart-home -type d -exec chmod 0755 {} +
find /var/www/yipin-smart-home -type f -exec chmod 0644 {} +
```

该目录不得保存密钥或其他私密文件。

## 10. 上线验收

基础访问：

- [ ] `https://yipin-ai.cn/` 返回 200；
- [ ] HTTP 自动跳转到 HTTPS；
- [ ] 首页、装修方案、装修质检、数字房屋说明书可打开；
- [ ] 产品详情页可打开；
- [ ] 代表性图片、中文路径 PDF、JS、CSS 均返回 200；
- [ ] 浏览器控制台无资源 404。

语音功能：

- [ ] 浏览器允许麦克风；
- [ ] 点击“语音”后显示“正在聆听”；
- [ ] 说完后能够识别文字并自动查询；
- [ ] 再次点击“正在聆听”能够取消收音；
- [ ] 关闭 VPN 后仍可使用；
- [ ] 使用同事电脑完成一次交叉验证。

建议测试问题：

```text
净水器如何更换滤芯
厨房有哪些产品
验房报告有多少问题
我要报事报修
```

## 11. 日常运维

```bash
systemctl is-active nginx
systemctl is-active yipin-asr-signing.service
curl -fsS http://127.0.0.1:3100/health
sudo nginx -t
```

重启签名服务：

```bash
sudo systemctl restart yipin-asr-signing.service
```

签名服务异常时按以下顺序排查：

1. 检查 systemd 状态和日志；
2. 检查本机 `/health`；
3. 检查密钥文件权限及字段是否完整，不输出密钥内容；
4. 检查 Nginx `/api/asr/sign` 转发；
5. 检查腾讯云语音识别服务和额度状态。

## 12. 回滚

若静态网页更新异常，将备份解压回网站目录并重新设置权限：

```bash
tar -xzf /安全备份目录/yipin-smart-home-backup.tar.gz \
  -C /var/www/yipin-smart-home
find /var/www/yipin-smart-home -type d -exec chmod 0755 {} +
find /var/www/yipin-smart-home -type f -exec chmod 0644 {} +
```

若 Nginx 修改异常，恢复修改前备份后执行：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 13. 安全要求

- 腾讯云 SecretId、SecretKey 只保存在服务器私密环境文件；
- 浏览器只获得 90 秒有效的单次签名地址，不获得 SecretKey；
- 签名接口限制来源域名，并按来源地址限流；
- HTTPS 是麦克风功能的必要条件；
- 不在聊天、截图、日志、网页或交付源码中展示密钥；
- 比赛结束后建议轮换曾在截图中出现过的腾讯云密钥。
