export interface AnalysisResult {
  message_type: string;
  is_complaint: boolean;
  complaint_summary: string;
  sentiment: "Positive" | "Neutral" | "Negative" | string;
  category: string;
  sub_category: string;
  issue: string;
  is_mapped: boolean;
  root_cause: string;
  recommended_action: string;
  confidence_score: number;
  source_language: string;
  translated_text: string;
  rca_source: string;
  urgency: string;
  flag: string;
  original_text: string;
}

export interface AnalysisReport {
  total_records: number;
  mapped_records: number;
  mapping_accuracy: number;
  category_summary: { category: string; count: number }[];
  subcategory_summary: { sub_category: string; count: number }[];
  top_issues: { issue: string; count: number }[];
  sentiment_summary: Record<string, number>;
  flag_summary: Record<string, number>;
  collective_summary: string;
  insights: string[];
}

export interface AnalysisPayload {
  results: AnalysisResult[];
  report: AnalysisReport;
}
