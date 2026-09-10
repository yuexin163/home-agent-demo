#!/usr/bin/env python3
"""Minimal Tencent ASR signing service for the production Nginx host."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import signal
import threading
import time
import uuid
from collections import defaultdict, deque
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import quote


PORT = int(os.environ.get("ASR_SIGNING_PORT", "3100"))
APP_ID = os.environ.get("TENCENT_ASR_APP_ID", "")
SECRET_ID = os.environ.get("TENCENT_ASR_SECRET_ID", "")
SECRET_KEY = os.environ.get("TENCENT_ASR_SECRET_KEY", "")
ALLOWED_ORIGINS = {
    origin.strip()
    for origin in os.environ.get(
        "ASR_ALLOWED_ORIGINS",
        "https://yipin-ai.cn,https://www.yipin-ai.cn",
    ).split(",")
    if origin.strip()
}

REQUESTS_BY_ADDRESS: dict[str, deque[float]] = defaultdict(deque)
REQUEST_LOCK = threading.Lock()


def create_signed_url() -> dict[str, object]:
    timestamp = int(time.time())
    expired = timestamp + 90
    params = {
        "convert_num_mode": "1",
        "engine_model_type": "16k_zh",
        "expired": str(expired),
        "filter_dirty": "0",
        "filter_empty_result": "1",
        "filter_modal": "1",
        "filter_punc": "0",
        "max_speak_time": "15000",
        "needvad": "1",
        "nonce": str(secrets.randbelow(1_000_000_000) + 1_000_000_000),
        "secretid": SECRET_ID,
        "timestamp": str(timestamp),
        "vad_silence_time": "1000",
        "voice_format": "1",
        "voice_id": str(uuid.uuid4()),
    }
    query = "&".join(f"{key}={params[key]}" for key in sorted(params))
    signing_text = f"asr.cloud.tencent.com/asr/v2/{APP_ID}?{query}"
    signature = base64.b64encode(
        hmac.new(SECRET_KEY.encode(), signing_text.encode(), hashlib.sha1).digest()
    ).decode()
    return {
        "url": f"wss://{signing_text}&signature={quote(signature, safe='')}",
        "expiresAt": expired,
    }


def is_rate_limited(address: str) -> bool:
    now = time.monotonic()
    with REQUEST_LOCK:
        requests = REQUESTS_BY_ADDRESS[address]
        while requests and requests[0] < now - 60:
            requests.popleft()
        requests.append(now)
        return len(requests) > 30


class SigningHandler(BaseHTTPRequestHandler):
    server_version = "YipinASR/1.0"

    def log_message(self, message: str, *args: object) -> None:
        print(f"{self.address_string()} - {message % args}", flush=True)

    def send_json(self, status: int, payload: dict[str, object]) -> None:
        body = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode()
        origin = self.headers.get("Origin", "")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        if origin in ALLOWED_ORIGINS:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        if self.path != "/health":
            self.send_json(404, {"error": "not-found"})
            return
        configured = bool(APP_ID and SECRET_ID and SECRET_KEY)
        self.send_json(200 if configured else 503, {"status": "ok" if configured else "missing-credentials"})

    def do_POST(self) -> None:  # noqa: N802
        if self.path != "/api/asr/sign":
            self.send_json(404, {"error": "not-found"})
            return
        origin = self.headers.get("Origin", "")
        if origin not in ALLOWED_ORIGINS:
            self.send_json(403, {"error": "origin-not-allowed"})
            return
        forwarded = self.headers.get("X-Forwarded-For", "").split(",", 1)[0].strip()
        address = forwarded or self.client_address[0]
        if is_rate_limited(address):
            self.send_json(429, {"error": "too-many-requests"})
            return
        if not APP_ID or not SECRET_ID or not SECRET_KEY:
            self.send_json(503, {"error": "service-not-configured"})
            return
        self.send_json(200, create_signed_url())


def main() -> None:
    server = ThreadingHTTPServer(("127.0.0.1", PORT), SigningHandler)
    server.daemon_threads = True

    def shutdown(_signum: int, _frame: object) -> None:
        threading.Thread(target=server.shutdown, daemon=True).start()

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)
    print(f"Yipin ASR signing service is listening on 127.0.0.1:{PORT}", flush=True)
    server.serve_forever()
    server.server_close()


if __name__ == "__main__":
    main()
