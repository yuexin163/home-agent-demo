# 壹品居家智能体

面向壹品 AI 比赛的居家资料查询与服务演示项目。正式演示地址：<https://yipin-ai.cn>。

本仓库管理源码、展示图片、结构化数据和部署说明。腾讯云部署与 GitHub 源码同步是两个独立操作；提交代码不会自动更新正式网站。

## 当前功能

- 定制化装修方案：按空间查看效果图、产品、主材与详情。
- 装修质检：查看验房统计、报告入口和隐蔽工程影像。
- 数字房屋说明书：分类查询房屋及设备资料，打开 PDF 原文或指定页。
- 小壹管家：使用本地结构化资料和说明书索引查询，通过结构化动作跳转页面。
- 腾讯云实时语音识别：浏览器录音，独立服务生成短时签名，识别文字后查询。
- 报事报修二维码入口；大屏、电脑、手机响应式展示；本地静态预览打包。

当前问答使用本地规则和资料检索，不包含已接入的大模型或完整 RAG 服务。腾讯云负责语音识别。示意图、模拟资料与待补充内容以页面标记为准。

## 安装和运行

建议 Node.js 22 LTS（最低版本见 `package.json`）及 npm。

```bash
npm ci
npm run dev
```

打开 <http://localhost:3000>。基础页面和文字查询可独立运行。

需要语音时，将 `.env.example` 复制为 `.env.asr.local`，填写自己的腾讯云 AppId、SecretId 和 SecretKey，然后在另一个终端执行：

```bash
npm run dev:asr
```

`/api/asr/sign` 转发到本机 3100 端口。录音需要浏览器麦克风授权；公网访问使用 HTTPS。

## 检查与构建

```bash
npm run lint
npm run build
npm run start
```

`npm run build:server` 使用 webpack 构建 standalone 版本。`build:sites` 保留早期 Sites 构建支持，当前正式网站使用腾讯云部署。

## 腾讯云部署和静态预览

正式架构为 **Nginx 静态站点 + Python 语音签名服务**，不需要数据库或常驻 Next.js 网页进程。语音服务仅监听 `127.0.0.1:3100`，通过 Nginx 提供签名接口。

完整操作见 [部署与运维说明](deploy/server/DEPLOYMENT.md)。安装 zsh、rsync 和 Python 3 后，在 macOS／Linux 生成部署包：

```bash
npm run package:server
```

脚本在临时副本内构建，输出到 `outputs/competition-日期/`。正式密钥在服务器上单独配置。部署前需补齐下述不入库的原始资料。

同事本地预览包：

```bash
npm run package:static
```

静态包支持基础浏览和本地文字查询；语音仍依赖可用的签名服务与腾讯云连接。演示流程见 [两分钟演示路径](deploy/static-preview/两分钟演示路径.txt)。

## 目录

| 目录 | 内容 |
| --- | --- |
| `app/` | 页面、样式和 Next.js API |
| `src/components/` | 共用界面组件 |
| `src/data/` | 空间、产品、材料、说明书和检索数据 |
| `src/lib/` | 资料检索、离线问答和语音客户端 |
| `src/services/` | 助手服务调用入口 |
| `server/` | Node.js 开发用、Python 生产用语音签名服务 |
| `public/` | 网站展示资源 |
| `deploy/` | Nginx、systemd 与静态预览配置 |
| `scripts/` | 打包、资料导入与配置脚本 |
| `docs/` | 范围、数据与维护说明 |

## 资料与凭据边界

公开源码不包含真实 `.env`、PDF／Office 原件、原始产品库、交付压缩包、构建产物或本机 Sites 标识。

PDF 和报告由项目负责人单独提供，按 `src/data/manual-documents.json` 中的 `fileUrl` 放回 `public/` 对应位置；验房报告路径是 `public/inspection/home-inspection-report.pdf`。缺少原件时仍可编译和浏览基础页面，但无法打开对应报告全文，因此源码仓库不等同于完整比赛交付包。

品牌、产品与项目资料不因源码公开而自动授予再分发许可。新增素材先确认来源和公开范围，再加入仓库。

## 后续维护

遵循 [AGENTS.md](AGENTS.md)。修改前获取远端最新代码，在独立分支开发；提交前检查 `git diff --check` 并运行 lint 和 build。不要强制推送覆盖历史。页面数据统一在 `src/data/` 维护，新增空间复用路由，助手导航仅读取结构化 `action`。

`.gitignore` 不会自动取消已跟踪文件；上传前应检查暂存清单，不要提交凭据、原件或交付产物。GitHub 同步与腾讯云部署分别执行，部署前备份并按部署文档验收。

`docs/` 中早期范围与验收记录作为历史资料保留，当前功能和部署以本 README 与部署说明为准。
