// Lightweight in-memory + sessionStorage store for analysis payload
import type { AnalysisPayload } from "./types";

const KEY = "cip:analysis";

export function saveAnalysis(p: AnalysisPayload) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(p));
  } catch {}
}

export function loadAnalysis(): AnalysisPayload | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as AnalysisPayload) : null;
  } catch {
    return null;
  }
}

export function clearAnalysis() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {}
}
