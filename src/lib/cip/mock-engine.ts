// Mock AI classification engine — used until backend is wired in.
import type { AnalysisPayload, AnalysisResult } from "./types";
import { sampleAnalysis } from "./sample";

const NEG_WORDS = ["not","no","never","problem","issue","fail","declined","stolen","wrong","reject","error","cant","can't","unable","missing","late","delay"];
const POS_WORDS = ["thanks","thank","great","good","resolved","appreciate","love"];

function detectSentiment(text: string): "Negative" | "Neutral" | "Positive" {
  const t = text.toLowerCase();
  let neg = 0, pos = 0;
  NEG_WORDS.forEach((w) => { if (t.includes(w)) neg++; });
  POS_WORDS.forEach((w) => { if (t.includes(w)) pos++; });
  if (neg > pos && neg > 0) return "Negative";
  if (pos > neg && pos > 0) return "Positive";
  return "Neutral";
}

function detectCategory(text: string): { category: string; sub_category: string; issue: string } {
  const t = text.toLowerCase();
  if (/(card|pin|atm)/.test(t)) {
    if (/credit/.test(t)) return { category: "Cards", sub_category: "Credit Card", issue: "Credit Card Related Enquiry" };
    if (/prepaid|virtual/.test(t)) return { category: "Cards", sub_category: "Prepaid Card", issue: "Request" };
    return { category: "Cards", sub_category: "Debit Card", issue: "Card Status" };
  }
  if (/(transfer|funds|deposit)/.test(t)) return { category: "Funds Transfer", sub_category: "Other Accounts Within Bank", issue: "Incoming Funds Transfer" };
  if (/(account|balance|withdraw)/.test(t)) return { category: "Accounts", sub_category: "Current Account", issue: "Account transactions" };
  if (/(app|mobile|login|sync)/.test(t)) return { category: "BM Apps", sub_category: "Mobile Banking", issue: "Registration / log in Issues" };
  return { category: "Query", sub_category: "Customer Inquiry", issue: "Information Request" };
}

const ARABIC_RE = /[\u0600-\u06FF]/;

export function analyzeText(text: string): AnalysisResult {
  const isArabic = ARABIC_RE.test(text);
  const sentiment = detectSentiment(text);
  const cat = detectCategory(text);
  const isComplaint = sentiment === "Negative";
  return {
    message_type: isComplaint ? "Complaint" : "Question",
    is_complaint: isComplaint,
    complaint_summary: text.slice(0, 140),
    sentiment,
    category: cat.category,
    sub_category: cat.sub_category,
    issue: cat.issue,
    is_mapped: true,
    root_cause: isComplaint ? "Human Error" : "Enquiry",
    recommended_action: isComplaint ? "Contact Customer And Reprocess" : "Contact Customer And Inform Accordingly",
    confidence_score: 0.78 + Math.random() * 0.2,
    source_language: isArabic ? "Arabic" : "English",
    translated_text: text,
    rca_source: "knowledge_base",
    urgency: isComplaint ? "High" : "",
    flag: "OK",
    original_text: text,
  };
}

function buildReport(results: AnalysisResult[]): AnalysisPayload["report"] {
  const total = results.length;
  const mapped = results.filter((r) => r.is_mapped).length;
  const acc = total ? mapped / total : 0;
  const tally = <K extends string>(arr: string[]) => {
    const m = new Map<string, number>();
    arr.forEach((k) => m.set(k, (m.get(k) ?? 0) + 1));
    return Array.from(m.entries()).map(([k, count]) => ({ key: k as K, count })).sort((a, b) => b.count - a.count);
  };
  const cats = tally(results.map((r) => r.category)).map((x) => ({ category: x.key, count: x.count }));
  const subs = tally(results.map((r) => r.sub_category)).map((x) => ({ sub_category: x.key, count: x.count }));
  const issues = tally(results.map((r) => r.issue)).slice(0, 8).map((x) => ({ issue: x.key, count: x.count }));
  const sent: Record<string, number> = {};
  results.forEach((r) => { sent[r.sentiment] = (sent[r.sentiment] ?? 0) + 1; });
  const flags: Record<string, number> = {};
  results.forEach((r) => { flags[r.flag || "OK"] = (flags[r.flag || "OK"] ?? 0) + 1; });
  const topCat = cats[0]?.category ?? "—";
  const topIssue = issues[0]?.issue ?? "—";
  return {
    total_records: total,
    mapped_records: mapped,
    mapping_accuracy: acc,
    category_summary: cats,
    subcategory_summary: subs,
    top_issues: issues,
    sentiment_summary: sent,
    flag_summary: flags,
    collective_summary: `Processed ${total} records. ${mapped} mapped successfully. Top category: ${topCat}. Top issue: ${topIssue}.`,
    insights: [
      `Majority of messages are in '${topCat}' category.`,
      `Most frequent issue is '${topIssue}'.`,
      sent.Negative && sent.Negative > (sent.Neutral ?? 0)
        ? "Negative sentiment dominates, indicating dissatisfaction."
        : "Neutral sentiment dominates, indicating mostly enquiries.",
    ],
  };
}

export function analyzeRows(rows: string[]): AnalysisPayload {
  const results = rows.filter((r) => r && r.trim()).map(analyzeText);
  if (results.length === 0) return sampleAnalysis;
  return { results, report: buildReport(results) };
}
