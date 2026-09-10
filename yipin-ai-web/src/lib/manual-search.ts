import manualSearchData from "@/src/data/manual-search-index.json";
import { manualLibrary } from "@/src/lib/data";
import type { ManualDocument, ManualSearchPage } from "@/src/types/content";

const searchPages = manualSearchData as ManualSearchPage[];
const deviceTerms = ["净水器", "烟机", "冷藏箱", "冷冻箱", "冰箱", "烤箱", "燃气灶", "灶具", "洗碗机", "热水器", "浴霸", "浴缸", "空调", "新风", "电子锁", "门锁"];
const houseTerms = ["入住手册", "住宅使用", "使用说明书", "质量保证书", "质量保证", "保修", "交付"];
const contentTerms = ["清洁", "保养", "维护", "故障", "安装", "使用", "操作", "温度", "滤芯", "滤网", "安全", "密码", "电池", "换气", "取暖", "点火", "程序", "联网", "互联", "开锁", "首次"];

export interface ManualSearchMatch {
  document: ManualDocument;
  page: number | null;
  snippet: string | null;
}

function normalized(value: string) {
  return value.toLocaleLowerCase("zh-CN").replace(/[\s，。！？、,.!?：:；;（）()]/g, "");
}

function scoreDocument(document: ManualDocument, query: string) {
  const haystack = normalized([document.title, document.deviceName, document.model, document.zone, document.sourceFile, ...document.keywords].filter(Boolean).join(" "));
  const normalizedQuery = normalized(query);
  let score = haystack.includes(normalizedQuery) ? 80 : 0;
  for (const term of [...deviceTerms, ...houseTerms]) {
    const normalizedTerm = normalized(term);
    if (normalizedQuery.includes(normalizedTerm) && haystack.includes(normalizedTerm)) score += normalizedTerm.length * 8;
  }
  if (document.model && normalizedQuery.includes(normalized(document.model))) score += 100;
  return score;
}

function findBestPage(documentId: string, query: string) {
  const requestedTerms = contentTerms.filter((term) => query.includes(term));
  if (requestedTerms.length === 0) return null;
  let best: { page: number; text: string; score: number; term: string } | null = null;
  for (const item of searchPages) {
    if (item.documentId !== documentId || !item.text) continue;
    const term = requestedTerms.find((candidate) => item.text.includes(candidate));
    if (!term) continue;
    const score = requestedTerms.reduce((sum, candidate) => {
      const occurrences = item.text.split(candidate).length - 1;
      const headingBonus = item.text.includes(`${candidate}和保养`) || item.text.includes(`${candidate}与保养`) ? 24 : 0;
      return sum + occurrences * candidate.length + headingBonus;
    }, item.text.includes("........") ? -30 : 0);
    if (!best || score > best.score) best = { page: item.page, text: item.text, score, term };
  }
  if (!best) return null;
  const index = best.text.indexOf(best.term);
  const start = Math.max(0, index - 45);
  const snippet = best.text.slice(start, start + 130).trim();
  return { page: best.page, snippet: `${start > 0 ? "…" : ""}${snippet}${start + 130 < best.text.length ? "…" : ""}` };
}

export function findManualMatch(query: string): ManualSearchMatch | null {
  const ranked = manualLibrary.documents.map((document) => ({ document, score: scoreDocument(document, query) })).filter((item) => item.score > 0).sort((a, b) => b.score - a.score);
  const top = ranked[0]?.document;
  if (!top) return null;
  const pageMatch = findBestPage(top.id, query);
  return { document: top, page: pageMatch?.page ?? null, snippet: pageMatch?.snippet ?? null };
}
