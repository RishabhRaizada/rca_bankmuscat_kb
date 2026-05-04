// Lightweight in-memory + sessionStorage store for analysis payload
import type { AnalysisPayload, SummarizePayload } from "./types";

const KEY = "cip:analysis";
const SUMMARY_KEY = "cip:summary";

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

export function saveSummary(p: SummarizePayload) {
  try {
    sessionStorage.setItem(SUMMARY_KEY, JSON.stringify(p));
  } catch {}
}

export function loadSummary(): SummarizePayload | null {
  try {
    const raw = sessionStorage.getItem(SUMMARY_KEY);
    return raw ? (JSON.parse(raw) as SummarizePayload) : null;
  } catch {
    return null;
  }
}

export function clearSummary() {
  try {
    sessionStorage.removeItem(SUMMARY_KEY);
  } catch {}
}
