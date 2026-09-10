# AI 助手接口约定

## 入口

`POST /api/assistant`

请求：

```json
{ "query": "查看客餐厅" }
```

成功响应：

```json
{
  "success": true,
  "reply": "已为您打开客餐厅装修方案。",
  "action": {
    "type": "OPEN_SPACE",
    "targetId": "living-dining",
    "targetUrl": "/spaces/living-dining"
  },
  "results": []
}
```

## 动作类型

- `OPEN_SPACE`：打开空间详情
- `OPEN_MATERIAL`：打开材料详情
- `OPEN_DOCUMENT`：打开资料或资料中心
- `SHOW_SEARCH_RESULTS`：显示结构化搜索结果
- `ANSWER_ONLY`：仅显示回复，不跳转

TypeScript 定义位于 `src/types/assistant.ts`。所有动作均包含 `targetId` 与 `targetUrl`；不适用时值为 `null`。前端只读取 `action` 决定跳转，不分析 `reply` 文本。

## 当前模拟规则

- 同时包含“客餐厅”和“地板” → `OPEN_MATERIAL`
- 包含“客餐厅” → `OPEN_SPACE`
- 包含“文档”或“资料” → `OPEN_DOCUMENT`
- 包含“物料库”“产品库”或“商品库” → `OPEN_MATERIAL` 并进入 `/materials`
- 其他内容 → `ANSWER_ONLY`
- 空输入 → HTTP 400 与结构化错误响应

## 替换真实服务

前端调用封装位于 `src/services/assistant.ts`。真实服务接入推荐保留同一响应契约，并选择以下方式之一：

1. 在 `app/api/assistant/route.ts` 中将请求代理到真实 AI 服务；前端无需修改。
2. 调整服务层的请求地址，同时保持返回类型一致。

服务端使用 `AI_API_BASE_URL` 和 `AI_API_KEY`；不得通过 `NEXT_PUBLIC_` 暴露密钥，也不得将真实密钥写入仓库。
