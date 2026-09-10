"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { askAssistant } from "@/src/services/assistant";
import type { AssistantResult } from "@/src/types/assistant";
import { openPropertyRepair } from "@/src/components/PropertyRepair";
import { TencentAsrSession, type TencentAsrError } from "@/src/lib/tencent-asr";

function getVoiceScore(voice: SpeechSynthesisVoice) {
  const language = voice.lang.toLocaleLowerCase("zh-CN");
  const name = voice.name.toLocaleLowerCase("zh-CN");
  let score = language === "zh-cn" ? 1000 : language.startsWith("zh") ? 700 : 0;
  if (/(natural|neural|premium|enhanced|自然)/.test(name)) score += 420;
  if (/(xiaoxiao|xiaoyi|tingting|ting-ting|tian-tian)/.test(name)) score += 300;
  if (/(yunxi|普通话|mandarin)/.test(name)) score += 180;
  if (/(google|microsoft|apple)/.test(name)) score += 40;
  return score;
}

function getPreferredMandarinVoice(voices: SpeechSynthesisVoice[]) {
  return voices
    .filter((voice) => voice.lang.toLocaleLowerCase("zh-CN").startsWith("zh"))
    .sort((first, second) => getVoiceScore(second) - getVoiceScore(first))[0];
}

function getSpokenReply(reply: string) {
  const normalizedReply = reply
    .replace(/商品 ID 为 [^，。]+[，。]?/g, "")
    .replace(/\bPDF\b/gi, "文档")
    .replace(/\bmm\b/gi, "毫米")
    .replace(/(\d(?:\.\d+)?)m\b/gi, "$1米")
    .replace(/×/g, "乘")
    .replace(/\s+[A-Z]\d{3,}(?=组合|[，。；、\s])/g, "")
    .replace(/[：:]/g, "，")
    .replace(/；/g, "。")
    .replace(/、/g, "，")
    .replace(/\s+/g, " ")
    .trim();
  const sourceIndex = normalizedReply.indexOf("相关原文片段，");
  if (sourceIndex >= 0) {
    return `${normalizedReply.slice(0, sourceIndex)}我已找到相关原文，您可以在页面中查看完整内容。`;
  }
  if (normalizedReply.length <= 180) return normalizedReply;
  const shortened = normalizedReply.slice(0, 160);
  const sentenceEnd = Math.max(shortened.lastIndexOf("。"), shortened.lastIndexOf("；"), shortened.lastIndexOf("，"));
  return `${shortened.slice(0, sentenceEnd > 70 ? sentenceEnd + 1 : 160)}更多内容已显示在页面中。`;
}

const quickQuestions = [
  "我要报事报修",
  "净水器如何更换滤芯",
  "衣柜0094的尺寸",
  "主卧有哪些产品",
  "验房报告有多少问题",
  "房屋建筑面积是多少",
  "厨房有哪些产品",
];

export function SmartAssistant({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [reply, setReply] = useState("您好，我是小壹管家。房屋、设备、装修和质检问题，都可以直接问我。");
  const [results, setResults] = useState<AssistantResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState("");
  const recognitionRef = useRef<TencentAsrSession | null>(null);
  const voiceTranscriptRef = useRef("");
  const voiceSubmittedRef = useRef(false);
  const voiceCancelledRef = useRef(false);
  const voiceNoSpeechTimerRef = useRef<number | null>(null);
  const voiceMaxTimerRef = useRef<number | null>(null);
  const voiceFinalizeTimerRef = useRef<number | null>(null);
  const isLongReply = !isLoading && reply.length > 88;

  useEffect(() => () => {
    recognitionRef.current?.abort();
    if (voiceNoSpeechTimerRef.current !== null) window.clearTimeout(voiceNoSpeechTimerRef.current);
    if (voiceMaxTimerRef.current !== null) window.clearTimeout(voiceMaxTimerRef.current);
    if (voiceFinalizeTimerRef.current !== null) window.clearTimeout(voiceFinalizeTimerRef.current);
    window.speechSynthesis?.cancel();
  }, []);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const speech = window.speechSynthesis;
    const refreshVoices = () => {
      const voices = speech.getVoices()
        .filter((voice) => voice.lang.toLocaleLowerCase("zh-CN").startsWith("zh"))
        .sort((first, second) => getVoiceScore(second) - getVoiceScore(first));
      setAvailableVoices(voices);
      setSelectedVoiceUri((currentVoiceUri) => currentVoiceUri || getPreferredMandarinVoice(voices)?.voiceURI || "");
    };
    refreshVoices();
    speech.addEventListener("voiceschanged", refreshVoices);
    return () => speech.removeEventListener("voiceschanged", refreshVoices);
  }, []);

  function stopSpeaking() {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }

  function speakReply(replyText: string) {
    if (!("speechSynthesis" in window)) {
      setIsSpeechEnabled(false);
      setReply("当前浏览器暂不支持语音播报，您仍可继续查看文字回答。");
      return;
    }

    const speech = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(getSpokenReply(replyText));
    const voices = speech.getVoices();
    const preferredVoice = voices.find((voice) => voice.voiceURI === selectedVoiceUri) ?? getPreferredMandarinVoice(voices);
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.lang = preferredVoice?.lang ?? "zh-CN";
    utterance.rate = 0.9;
    utterance.pitch = 0.98;
    utterance.volume = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    speech.cancel();
    speech.speak(utterance);
  }

  function toggleSpeechPlayback() {
    if (isSpeechEnabled) {
      stopSpeaking();
      setIsSpeechEnabled(false);
      return;
    }
    setIsSpeechEnabled(true);
    speakReply(reply);
  }

  async function runQuery(normalizedQuery: string) {
    stopSpeaking();
    setIsLoading(true);
    try {
      const response = await askAssistant({ query: normalizedQuery });
      setReply(response.reply);
      setResults(response.results);
      if (isSpeechEnabled) speakReply(response.reply);
      if (response.success && response.action.type === "OPEN_REPAIR") {
        window.setTimeout(openPropertyRepair, 280);
      }
      if (response.success && response.action.targetUrl && response.action.type !== "ANSWER_ONLY") {
        window.setTimeout(() => router.push(response.action.targetUrl as string), 450);
      }
    } catch {
      const errorReply = "小壹暂时无法完成查询，您可以先通过下方三个入口继续浏览。";
      setReply(errorReply);
      setResults([]);
      if (isSpeechEnabled) speakReply(errorReply);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      setReply("请告诉小壹您想了解什么，例如“查看客餐厅”。");
      setResults([]);
      return;
    }

    await runQuery(normalizedQuery);
  }

  function handleQuickQuestion(question: string) {
    setQuery(question);
    void runQuery(question);
  }

  function clearVoiceTimers() {
    if (voiceNoSpeechTimerRef.current !== null) window.clearTimeout(voiceNoSpeechTimerRef.current);
    if (voiceMaxTimerRef.current !== null) window.clearTimeout(voiceMaxTimerRef.current);
    if (voiceFinalizeTimerRef.current !== null) window.clearTimeout(voiceFinalizeTimerRef.current);
    voiceNoSpeechTimerRef.current = null;
    voiceMaxTimerRef.current = null;
    voiceFinalizeTimerRef.current = null;
  }

  function resetVoiceSession() {
    clearVoiceTimers();
    recognitionRef.current = null;
    setIsListening(false);
  }

  function cancelVoiceQuery(message = "已停止聆听，您可以重新语音输入或直接输入文字。") {
    voiceCancelledRef.current = true;
    voiceSubmittedRef.current = true;
    voiceTranscriptRef.current = "";
    const activeRecognition = recognitionRef.current;
    resetVoiceSession();
    activeRecognition?.abort();
    setReply(message);
    setResults([]);
  }

  function submitVoiceQuery(transcript: string) {
    const normalizedTranscript = transcript.trim();
    if (!normalizedTranscript || voiceSubmittedRef.current || voiceCancelledRef.current) return;
    voiceSubmittedRef.current = true;
    clearVoiceTimers();
    const activeRecognition = recognitionRef.current;
    recognitionRef.current = null;
    setIsListening(false);
    activeRecognition?.finish();
    setQuery(normalizedTranscript);
    void runQuery(normalizedTranscript);
  }

  function getTencentAsrErrorReply(error: TencentAsrError) {
    const errorReplies: Record<string, string> = {
      "4002": "语音服务鉴权失败，请联系管理员检查服务配置。",
      "4003": "腾讯云实时语音识别尚未开通，请联系管理员处理。",
      "4004": "本月语音识别额度已用完，您可以继续使用文字输入。",
      "4005": "腾讯云语音服务当前不可用，请联系管理员检查账户状态。",
      "4006": "当前使用语音查询的人较多，请稍后再试。",
      "rate-limited": "语音查询操作较频繁，请稍后再试。",
      "signing-unavailable": "语音服务正在准备中，请稍后再试或使用文字输入。",
      network: "语音识别网络暂时不可用，请稍后重试或使用文字输入。",
    };
    return errorReplies[error.code] ?? "语音识别暂时没有完成，请再试一次或使用文字输入。";
  }

  async function startVoiceQuery() {
    voiceTranscriptRef.current = "";
    voiceSubmittedRef.current = false;
    voiceCancelledRef.current = false;
    clearVoiceTimers();
    setIsListening(true);
    setReply("正在连接小壹语音服务…");
    setResults([]);

    const recognition = new TencentAsrSession({
      onReady: () => {
        if (voiceCancelledRef.current) return;
        setReply("小壹正在聆听，请说出您的问题…");
        voiceNoSpeechTimerRef.current = window.setTimeout(() => {
          if (!voiceTranscriptRef.current.trim()) cancelVoiceQuery("小壹没有听清，请靠近麦克风再说一次。");
        }, 6_000);
        voiceMaxTimerRef.current = window.setTimeout(() => {
          const transcript = voiceTranscriptRef.current.trim();
          if (transcript) submitVoiceQuery(transcript);
          else cancelVoiceQuery("本次语音输入已结束，请再试一次或使用文字输入。");
        }, 15_000);
      },
      onTranscript: (transcript, isStable) => {
        if (voiceCancelledRef.current || voiceSubmittedRef.current) return;
        if (voiceNoSpeechTimerRef.current !== null) {
          window.clearTimeout(voiceNoSpeechTimerRef.current);
          voiceNoSpeechTimerRef.current = null;
        }
        voiceTranscriptRef.current = transcript;
        setQuery(transcript);
        setReply(`已听到：${transcript}`);
        if (voiceFinalizeTimerRef.current !== null) window.clearTimeout(voiceFinalizeTimerRef.current);
        // Tencent usually marks a finished sentence with slice_type=2. In noisy
        // browser environments that stable marker can be delayed, so unchanged
        // interim text also acts as a short end-of-speech signal.
        voiceFinalizeTimerRef.current = window.setTimeout(
          () => submitVoiceQuery(voiceTranscriptRef.current),
          isStable ? 350 : 1_400,
        );
      },
      onEnded: (transcript) => {
        if (voiceCancelledRef.current || voiceSubmittedRef.current) return;
        if (transcript.trim()) submitVoiceQuery(transcript);
        else cancelVoiceQuery("小壹没有听清，请靠近麦克风再说一次。");
      },
      onError: (error) => {
        if (voiceCancelledRef.current || voiceSubmittedRef.current) return;
        voiceSubmittedRef.current = true;
        resetVoiceSession();
        setResults([]);
        setReply(getTencentAsrErrorReply(error));
      },
    });
    recognitionRef.current = recognition;

    try {
      await recognition.start();
    } catch (error) {
      if (voiceCancelledRef.current) return;
      voiceSubmittedRef.current = true;
      recognition.abort();
      resetVoiceSession();
      setResults([]);
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setReply("麦克风权限未开启，请允许浏览器使用麦克风后再试。");
      } else if (error instanceof DOMException && error.name === "NotFoundError") {
        setReply("暂时没有检测到可用麦克风，请检查设备连接。");
      } else if (error instanceof Error && error.message === "unsupported") {
        setReply("当前浏览器暂不支持语音查询，请使用最新版 Chrome 或 Edge。");
      } else if (error instanceof Error && error.message === "rate-limited") {
        setReply("语音查询操作较频繁，请稍后再试。");
      } else {
        setReply("语音服务正在准备中，请稍后再试或使用文字输入。");
      }
    }
  }

  function handleVoiceQuery() {
    if (isListening || recognitionRef.current) {
      cancelVoiceQuery();
      return;
    }
    void startVoiceQuery();
  }

  return (
    <div className={compact ? "home-assistant-compact" : "mt-6"}>
      <div
        key={isLoading ? "assistant-loading" : reply}
        className={`assistant-reply-card control-stat min-h-20 rounded-[12px] p-4 text-sm leading-6 text-emerald-50${isLoading ? " is-loading" : " is-updated"}`}
        aria-live="polite"
      >
        <div className="assistant-reply-toolbar">
          <span className="assistant-reply-identity"><i aria-hidden="true" /><span>小壹管家 回复</span><em>{isLoading ? "正在检索" : "回答已更新"}</em></span>
          <div>
            <button type="button" aria-label={isSpeechEnabled ? "关闭语音播报" : "开启语音播报"} aria-pressed={isSpeechEnabled} onClick={toggleSpeechPlayback} className={isSpeechEnabled ? "is-active" : undefined}>
              <span aria-hidden="true">●</span>{isSpeechEnabled ? "播报 开" : "播报 关"}
            </button>
            {isSpeechEnabled ? (
              <>
                {availableVoices.length > 1 ? (
                  <select
                    aria-label="选择播报音色"
                    title="选择播报音色"
                    value={selectedVoiceUri}
                    style={{ width: "6.5rem", maxWidth: "100%" }}
                    onChange={(event) => {
                      stopSpeaking();
                      setSelectedVoiceUri(event.target.value);
                    }}
                  >
                    {availableVoices.map((voice, index) => (
                      <option key={voice.voiceURI} value={voice.voiceURI}>
                        {index === 0 ? "智能优选" : `普通话 ${index + 1}`} · {voice.name}
                      </option>
                    ))}
                  </select>
                ) : null}
                <button type="button" onClick={() => isSpeaking ? stopSpeaking() : speakReply(reply)}>
                  {isSpeaking ? "停止" : "重播"}
                </button>
              </>
            ) : null}
          </div>
        </div>
        <div className="assistant-reply-body">
          <div className={`assistant-reply-content${isLongReply ? " is-scrollable" : ""}`} tabIndex={isLongReply ? 0 : undefined} aria-label={isLongReply ? "小壹管家完整回复，可在此区域内滚动查看" : undefined}>
            {isLoading ? <><span className="assistant-thinking-bars" aria-hidden="true"><i /><i /><i /></span><span>小壹正在为您查找答案…</span></> : <span>{reply}</span>}
          </div>
          {isLongReply ? <span className="assistant-reply-scroll-hint" aria-hidden="true">上下滚动查看全文</span> : null}
        </div>
        {!isLoading && results.length > 0 ? (
          <div className="assistant-result-links">
            {results.map((result) => <Link key={`${result.type}-${result.id}`} href={result.url} className="rounded-full border border-emerald-700 px-3 py-1.5 text-[11px] text-emerald-100 hover:border-emerald-300">{result.title} →</Link>)}
          </div>
        ) : null}
      </div>
      <form onSubmit={handleSubmit} className={`assistant-query-form mt-3 flex gap-2${isListening ? " is-listening" : ""}`}>
        <label className="sr-only" htmlFor="assistant-query">智能交互输入</label>
        <input
          id="assistant-query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={isListening ? "正在接收您的问题…" : "问问小壹，例如：净水器如何更换滤芯"}
          className="min-w-0 flex-1 rounded-[10px] border border-emerald-800 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-emerald-100/45 focus:border-emerald-300"
        />
        <button
          type="button"
          onClick={handleVoiceQuery}
          title={isListening ? "结束语音输入" : "开始语音查询"}
          aria-label={isListening ? "结束语音输入" : "开始语音查询"}
          aria-pressed={isListening}
          className={`assistant-query-action assistant-voice-button shrink-0 rounded-[10px]${isListening ? " is-listening" : ""}`}
        >
          <span className="assistant-voice-wave" aria-hidden="true"><i /><i /><i /></span>
          <span className="assistant-voice-label">{isListening ? "正在聆听" : "语音"}</span>
        </button>
        <button disabled={isLoading} type="submit" className="assistant-query-action assistant-query-submit action-primary shrink-0 rounded-[10px] disabled:opacity-50">
          问小壹
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {quickQuestions.map((example) => (
          <button key={example} type="button" disabled={isLoading} onClick={() => handleQuickQuestion(example)} className="rounded-full border border-emerald-800 px-3 py-1.5 text-xs text-emerald-200 hover:border-emerald-400 disabled:cursor-wait disabled:opacity-50">
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
