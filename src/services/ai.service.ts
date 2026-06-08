import { callEdgeFunction } from "./supabase.service";

export interface AITokenUsage {
  org_id: string;
  used_tokens: number;
  limit_tokens: number;
  period_start: string;
  period_end: string;
}

export interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIChatOptions {
  messages: AIMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  org_id?: string;
}

export interface AIChatResponse {
  content: string;
  tokens_used?: number;
  model?: string;
}

export const AIService = {
  async chat(options: AIChatOptions): Promise<AIChatResponse> {
    return callEdgeFunction<AIChatResponse>("sales-copilot", options);
  },

  async generateInsights(payload: unknown): Promise<unknown> {
    return callEdgeFunction("generate-insights", payload);
  },

  async transcribeAudio(audioBlob: Blob): Promise<{ text: string }> {
    const formData = new FormData();
    formData.append("audio", audioBlob);
    return callEdgeFunction<{ text: string }>("transcribe-audio", formData);
  },

  async generateObjections(payload: unknown): Promise<unknown> {
    return callEdgeFunction("generate-objections", payload);
  },
};
