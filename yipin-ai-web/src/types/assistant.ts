export const ASSISTANT_ACTION_TYPES = [
  "OPEN_SPACE",
  "OPEN_MATERIAL",
  "OPEN_DOCUMENT",
  "OPEN_MANUAL",
  "OPEN_INSPECTION",
  "OPEN_REPAIR",
  "SHOW_SEARCH_RESULTS",
  "ANSWER_ONLY",
] as const;

export type AssistantActionType = (typeof ASSISTANT_ACTION_TYPES)[number];

export interface AssistantRequest {
  query: string;
}

export interface AssistantAction {
  type: AssistantActionType;
  targetId: string | null;
  targetUrl: string | null;
}

export interface AssistantResult {
  id: string;
  title: string;
  type: "space" | "material" | "product" | "document" | "manual" | "inspection";
  url: string;
}

export interface AssistantResponse {
  success: boolean;
  reply: string;
  action: AssistantAction;
  results: AssistantResult[];
}
