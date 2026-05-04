export interface AnalysisResult {
  original_text: string;
  translated_text: string;
  message_type: string;
  sentiment: "Positive" | "Neutral" | "Negative" | string;
  is_mapped: boolean;
  category: string;
  sub_category: string;
  issue: string;
  possible_causes: string[];
  root_cause: string;
  rca_summary: string;
  next_steps: string[];
  confidence_score: number;
}

export interface AnalysisReport {
  total_records: number;
  mapped_records: number;
  mapping_accuracy: number;
  category_summary: { category: string; count: number }[];
  subcategory_summary: { sub_category: string; count: number }[];
  top_issues: { issue: string; count: number }[];
  sentiment_summary: Record<string, number>;
  collective_summary: string;
  insights: string[];
}

export interface AnalysisPayload {
  results: AnalysisResult[];
  report: AnalysisReport;
}

export interface Action {
  action: string;
  owner: string;
}

export interface ClusterSummary {
  category: string;
  count: number;
  message_type_counts: Record<string, number>;
  issues: string[];
  case_summary: string;
  executive_summary: string;
  symptoms: string[];
  root_cause_analysis: string;
  root_causes: string[];
  deep_analysis: string;
  severity_tier: "Critical" | "High" | "Medium" | "Low";
  severity_justification: string;
  immediate_actions: Action[];
  short_term_actions: Action[];
  strategic_actions: Action[];
}

export interface SummarizePayload {
  clusters: ClusterSummary[];
}
