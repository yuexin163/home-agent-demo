import type { AssistantRequest, AssistantResponse } from "@/src/types/assistant";
import { askOfflineAssistant } from "@/src/lib/offline-assistant";

export async function askAssistant(payload: AssistantRequest): Promise<AssistantResponse> {
  if (process.env.NEXT_PUBLIC_STATIC_PREVIEW === "1") {
    return askOfflineAssistant(payload.query);
  }

  const response = await fetch("/api/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Assistant request failed: ${response.status}`);
  }

  return response.json() as Promise<AssistantResponse>;
}
