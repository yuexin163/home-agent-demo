import { createHmac, randomInt, randomUUID } from "node:crypto";
import { createServer } from "node:http";

const port = Number.parseInt(process.env.ASR_SIGNING_PORT || "3100", 10);
const appId = process.env.TENCENT_ASR_APP_ID;
const secretId = process.env.TENCENT_ASR_SECRET_ID;
const secretKey = process.env.TENCENT_ASR_SECRET_KEY;
const allowedOrigins = new Set(
  (process.env.ASR_ALLOWED_ORIGINS || "https://yipin-ai.cn,https://www.yipin-ai.cn,http://127.0.0.1:3000,http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);
const requestsByAddress = new Map();

function json(response, statusCode, payload, origin) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...(origin && allowedOrigins.has(origin) ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {}),
  });
  response.end(JSON.stringify(payload));
}

function getClientAddress(request) {
  const forwarded = request.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded) return forwarded.split(",")[0].trim();
  return request.socket.remoteAddress || "unknown";
}

function isRateLimited(request) {
  const address = getClientAddress(request);
  const now = Date.now();
  const windowStart = now - 60_000;
  const recent = (requestsByAddress.get(address) || []).filter((time) => time >= windowStart);
  recent.push(now);
  requestsByAddress.set(address, recent);
  return recent.length > 30;
}

function createSignedUrl() {
  const timestamp = Math.floor(Date.now() / 1000);
  const expired = timestamp + 90;
  const params = {
    convert_num_mode: "1",
    engine_model_type: "16k_zh",
    expired: String(expired),
    filter_dirty: "0",
    filter_empty_result: "1",
    filter_modal: "1",
    filter_punc: "0",
    max_speak_time: "15000",
    needvad: "1",
    nonce: String(randomInt(1_000_000_000, 2_000_000_000)),
    secretid: secretId,
    timestamp: String(timestamp),
    vad_silence_time: "1000",
    voice_format: "1",
    voice_id: randomUUID(),
  };
  const query = Object.entries(params)
    .sort(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  const signingText = `asr.cloud.tencent.com/asr/v2/${appId}?${query}`;
  const signature = createHmac("sha1", secretKey).update(signingText).digest("base64");
  return {
    url: `wss://${signingText}&signature=${encodeURIComponent(signature)}`,
    expiresAt: expired,
  };
}

const server = createServer((request, response) => {
  const origin = request.headers.origin;

  if (request.method === "GET" && request.url === "/health") {
    json(response, appId && secretId && secretKey ? 200 : 503, { status: appId && secretId && secretKey ? "ok" : "missing-credentials" });
    return;
  }

  if (request.method === "OPTIONS" && request.url === "/api/asr/sign") {
    if (!origin || !allowedOrigins.has(origin)) {
      json(response, 403, { error: "origin-not-allowed" });
      return;
    }
    response.writeHead(204, {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "600",
      Vary: "Origin",
    });
    response.end();
    return;
  }

  if (request.method !== "POST" || request.url !== "/api/asr/sign") {
    json(response, 404, { error: "not-found" }, origin);
    return;
  }

  if (!origin || !allowedOrigins.has(origin)) {
    json(response, 403, { error: "origin-not-allowed" });
    return;
  }
  if (isRateLimited(request)) {
    json(response, 429, { error: "too-many-requests" }, origin);
    return;
  }
  if (!appId || !secretId || !secretKey) {
    json(response, 503, { error: "service-not-configured" }, origin);
    return;
  }

  json(response, 200, createSignedUrl(), origin);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Yipin ASR signing service is listening on 127.0.0.1:${port}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
