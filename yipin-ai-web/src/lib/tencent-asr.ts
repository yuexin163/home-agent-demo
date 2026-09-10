"use client";

const TARGET_SAMPLE_RATE = 16_000;
const PCM_PACKET_BYTES = 6_400;

export interface TencentAsrError {
  code: string;
  message: string;
}

interface TencentAsrResult {
  index: number;
  slice_type: number;
  voice_text_str: string;
}

interface TencentAsrMessage {
  code?: number;
  message?: string;
  final?: number;
  result?: TencentAsrResult;
}

interface TencentAsrSessionOptions {
  onReady: () => void;
  onTranscript: (transcript: string, isStable: boolean) => void;
  onEnded: (transcript: string) => void;
  onError: (error: TencentAsrError) => void;
}

class StreamingResampler {
  private readonly ratio: number;
  private carry = new Float32Array(0);
  private readIndex = 0;

  constructor(inputSampleRate: number) {
    this.ratio = inputSampleRate / TARGET_SAMPLE_RATE;
  }

  push(input: Float32Array) {
    const combined = new Float32Array(this.carry.length + input.length);
    combined.set(this.carry);
    combined.set(input, this.carry.length);

    const output: number[] = [];
    while (this.readIndex + 1 < combined.length) {
      const baseIndex = Math.floor(this.readIndex);
      const fraction = this.readIndex - baseIndex;
      const sample = combined[baseIndex] * (1 - fraction) + combined[baseIndex + 1] * fraction;
      output.push(sample);
      this.readIndex += this.ratio;
    }

    const consumed = Math.floor(this.readIndex);
    this.carry = combined.slice(consumed);
    this.readIndex -= consumed;
    return floatToPcm16(output);
  }
}

function floatToPcm16(samples: number[]) {
  const bytes = new Uint8Array(samples.length * 2);
  const view = new DataView(bytes.buffer);
  samples.forEach((sample, index) => {
    const clamped = Math.max(-1, Math.min(1, sample));
    const value = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    view.setInt16(index * 2, Math.round(value), true);
  });
  return bytes;
}

function combineBytes(first: Uint8Array, second: Uint8Array) {
  const combined = new Uint8Array(first.length + second.length);
  combined.set(first);
  combined.set(second, first.length);
  return combined;
}

function getTranscript(segments: Map<number, string>) {
  return [...segments.entries()]
    .sort(([firstIndex], [secondIndex]) => firstIndex - secondIndex)
    .map(([, text]) => text)
    .join("")
    .trim();
}

export class TencentAsrSession {
  private readonly options: TencentAsrSessionOptions;
  private socket: WebSocket | null = null;
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private recorderNode: AudioWorkletNode | null = null;
  private muteNode: GainNode | null = null;
  private resampler: StreamingResampler | null = null;
  private pendingPcm = new Uint8Array(0);
  private segments = new Map<number, string>();
  private ready = false;
  private finishing = false;
  private cancelled = false;
  private fallbackCloseTimer: number | null = null;

  constructor(options: TencentAsrSessionOptions) {
    this.options = options;
  }

  async start() {
    if (!navigator.mediaDevices?.getUserMedia || !("AudioContext" in window) || !("WebSocket" in window)) {
      throw new Error("unsupported");
    }

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });
    if (this.cancelled) {
      await this.releaseAudio();
      throw new Error("cancelled");
    }

    try {
      const signResponse = await fetch("/api/asr/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
        cache: "no-store",
      });
      if (!signResponse.ok) throw new Error(signResponse.status === 429 ? "rate-limited" : "signing-unavailable");
      const signed = (await signResponse.json()) as { url?: string };
      if (!signed.url?.startsWith("wss://asr.cloud.tencent.com/")) throw new Error("invalid-signature-response");
      if (this.cancelled) throw new Error("cancelled");

      this.audioContext = new AudioContext({ latencyHint: "interactive" });
      await this.audioContext.audioWorklet.addModule("/audio/pcm-recorder.worklet.js");
      await this.audioContext.resume();
      this.resampler = new StreamingResampler(this.audioContext.sampleRate);

      this.socket = new WebSocket(signed.url);
      this.socket.binaryType = "arraybuffer";
      this.socket.addEventListener("message", this.handleMessage);
      this.socket.addEventListener("error", this.handleSocketError);
      this.socket.addEventListener("close", this.handleSocketClose);
    } catch (error) {
      await this.releaseAudio();
      throw error;
    }
  }

  finish() {
    if (this.finishing || this.cancelled) return;
    this.finishing = true;
    void this.stopCapture();

    if (this.socket?.readyState === WebSocket.OPEN) {
      this.sendRemainingPcm();
      this.socket.send(JSON.stringify({ type: "end" }));
      this.fallbackCloseTimer = window.setTimeout(() => this.closeSocket(), 3_000);
      return;
    }

    this.closeSocket();
  }

  abort() {
    if (this.cancelled) return;
    this.cancelled = true;
    this.finishing = true;
    void this.stopCapture();
    this.closeSocket();
  }

  private handleMessage = (event: MessageEvent<string>) => {
    let message: TencentAsrMessage;
    try {
      message = JSON.parse(event.data) as TencentAsrMessage;
    } catch {
      this.fail("invalid-response", "语音服务返回了无法解析的数据。");
      return;
    }

    if (typeof message.code === "number" && message.code !== 0) {
      this.fail(String(message.code), message.message || "腾讯云语音识别暂时不可用。");
      return;
    }

    if (!this.ready) {
      this.ready = true;
      this.startCapture();
      this.options.onReady();
    }

    if (message.result) {
      this.segments.set(message.result.index, message.result.voice_text_str || "");
      const transcript = getTranscript(this.segments);
      if (transcript) this.options.onTranscript(transcript, message.result.slice_type === 2);
    }

    if (message.final === 1) {
      const transcript = getTranscript(this.segments);
      this.options.onEnded(transcript);
      this.closeSocket();
    }
  };

  private handleSocketError = () => {
    if (!this.cancelled && !this.finishing) this.fail("network", "无法连接腾讯云语音识别服务。");
  };

  private handleSocketClose = () => {
    if (!this.cancelled && !this.finishing && this.ready) {
      this.fail("network", "腾讯云语音识别连接意外中断。");
    }
    void this.stopCapture();
  };

  private startCapture() {
    if (!this.audioContext || !this.stream || !this.resampler) return;
    this.sourceNode = this.audioContext.createMediaStreamSource(this.stream);
    this.recorderNode = new AudioWorkletNode(this.audioContext, "yipin-pcm-recorder");
    this.muteNode = this.audioContext.createGain();
    this.muteNode.gain.value = 0;
    this.recorderNode.port.onmessage = (event: MessageEvent<Float32Array>) => {
      if (!this.ready || this.finishing || !this.resampler) return;
      const pcm = this.resampler.push(new Float32Array(event.data));
      this.pendingPcm = combineBytes(this.pendingPcm, pcm);
      this.sendCompletePackets();
    };
    this.sourceNode.connect(this.recorderNode);
    this.recorderNode.connect(this.muteNode);
    this.muteNode.connect(this.audioContext.destination);
  }

  private sendCompletePackets() {
    while (this.pendingPcm.length >= PCM_PACKET_BYTES && this.socket?.readyState === WebSocket.OPEN) {
      const packet = this.pendingPcm.slice(0, PCM_PACKET_BYTES);
      this.pendingPcm = this.pendingPcm.slice(PCM_PACKET_BYTES);
      this.socket.send(packet);
    }
  }

  private sendRemainingPcm() {
    this.sendCompletePackets();
    if (this.pendingPcm.length > 0 && this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(this.pendingPcm);
      this.pendingPcm = new Uint8Array(0);
    }
  }

  private async stopCapture() {
    this.recorderNode?.disconnect();
    this.sourceNode?.disconnect();
    this.muteNode?.disconnect();
    this.recorderNode = null;
    this.sourceNode = null;
    this.muteNode = null;
    await this.releaseAudio();
  }

  private async releaseAudio() {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    const context = this.audioContext;
    this.audioContext = null;
    if (context && context.state !== "closed") {
      try {
        await context.close();
      } catch {
        // The browser may have already closed the audio context.
      }
    }
  }

  private fail(code: string, message: string) {
    if (this.cancelled) return;
    this.finishing = true;
    this.options.onError({ code, message });
    void this.stopCapture();
    this.closeSocket();
  }

  private closeSocket() {
    if (this.fallbackCloseTimer !== null) {
      window.clearTimeout(this.fallbackCloseTimer);
      this.fallbackCloseTimer = null;
    }
    const socket = this.socket;
    this.socket = null;
    if (socket) {
      socket.removeEventListener("message", this.handleMessage);
      socket.removeEventListener("error", this.handleSocketError);
      socket.removeEventListener("close", this.handleSocketClose);
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) socket.close();
    }
  }
}
