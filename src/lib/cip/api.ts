// Backend API client for the Customer Intelligence Platform
import type { AnalysisPayload } from "./types";

// Configurable base URL — defaults to localhost FastAPI, overridable via Vite env
export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:8000";

export async function processFile(file: File, signal?: AbortSignal): Promise<AnalysisPayload> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE_URL}/process`, {
    method: "POST",
    body: form,
    headers: { accept: "application/json" },
    signal,
  });

  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      if (body?.detail) detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    } catch {
      // ignore
    }
    throw new Error(`Backend error: ${detail}`);
  }

  const data = (await res.json()) as AnalysisPayload;
  if (!data?.results || !data?.report) {
    throw new Error("Invalid response shape from backend");
  }
  return data;
}
