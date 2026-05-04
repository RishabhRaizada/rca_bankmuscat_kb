import logging
from collections import Counter

import pandas as pd
from fastapi import APIRouter, File, Request, UploadFile

from api.schemas import SummarizeRequest
from core.cluster import generate_cluster_summary
from core.pipeline import process_complaint

logger = logging.getLogger(__name__)

router = APIRouter()


def _extract_text(row) -> str | None:
    text = row.get("complaint_text")

    if pd.isna(text) or not str(text).strip():
        text = (
            row.get("english translation")
            or row.get("arabic text")
            or row.iloc[0]
        )

    if pd.isna(text):
        return None

    text = str(text).strip()
    return text if len(text) >= 5 else None


def process_row(row) -> dict | None:
    text = _extract_text(row)
    if text is None:
        return None

    try:
        result = process_complaint(text)
    except Exception as e:
        result = {"is_complaint": False, "error": str(e)}

    if not isinstance(result, dict):
        result = {"is_complaint": False, "error": "Invalid LLM output", "raw_response": str(result)}

    result.setdefault("original_text", text)
    result.setdefault("translated_text", "")
    result.setdefault("message_type", "")
    result.setdefault("sentiment", "")
    result.setdefault("is_mapped", False)
    result.setdefault("category", "")
    result.setdefault("sub_category", "")
    result.setdefault("issue", "")
    result.setdefault("possible_causes", [])
    result.setdefault("root_cause", "")
    result.setdefault("rca_summary", "")
    result.setdefault("next_steps", [])
    result.setdefault("confidence_score", 0)

    return result


def _build_report(df_results: pd.DataFrame) -> dict:
    total = len(df_results)
    mapped = df_results.get("is_mapped", pd.Series([0] * total)).sum()

    category_summary = (
        df_results["category"]
        .value_counts()
        .rename_axis("category")
        .reset_index(name="count")
        .to_dict(orient="records")
        if "category" in df_results.columns
        else []
    )

    subcategory_summary = (
        df_results["sub_category"]
        .value_counts()
        .rename_axis("sub_category")
        .reset_index(name="count")
        .to_dict(orient="records")
        if "sub_category" in df_results.columns
        else []
    )

    issue_counts = Counter(df_results.get("issue", []))
    top_issues = [{"issue": k, "count": v} for k, v in issue_counts.most_common(5)]
    sentiment_summary = df_results.get("sentiment", pd.Series()).value_counts().to_dict()

    insights = []
    top_cat = (
        category_summary[0].get("category")
        if category_summary and isinstance(category_summary[0], dict)
        else None
    )

    if top_cat:
        insights.append(f"Majority complaints are in '{top_cat}' category.")
    if top_issues:
        insights.append(f"Most frequent issue is '{top_issues[0]['issue']}'.")
    if sentiment_summary.get("Negative", 0) > sentiment_summary.get("Positive", 0):
        insights.append("Negative sentiment dominates, indicating dissatisfaction.")

    top_issue_safe = top_issues[0]["issue"] if top_issues else "N/A"
    collective_summary = (
        f"Processed {total} records. "
        f"{mapped} mapped successfully. "
        f"Top category: {top_cat or 'N/A'}. "
        f"Top issue: {top_issue_safe}."
    )

    return {
        "total_records": total,
        "mapped_records": int(mapped),
        "mapping_accuracy": round(mapped / total, 2) if total else 0,
        "category_summary": category_summary,
        "subcategory_summary": subcategory_summary,
        "top_issues": top_issues,
        "sentiment_summary": sentiment_summary,
        "collective_summary": collective_summary,
        "insights": insights,
    }


@router.post("/process")
async def process_file(file: UploadFile = File(...), request: Request = None):
    executor = request.app.state.executor

    try:
        if file.filename.endswith(".csv"):
            try:
                df = pd.read_csv(file.file, encoding="utf-8-sig")
            except Exception:
                file.file.seek(0)
                df = pd.read_csv(file.file, encoding="latin-1")
        elif file.filename.endswith(".xlsx"):
            df = pd.read_excel(file.file)
        else:
            return {"error": "Unsupported file format"}
    except Exception as e:
        return {"error": f"File reading error: {str(e)}"}

    df.columns = df.columns.str.strip().str.lower()
    df = df.loc[:, ~df.columns.duplicated()]

    logger.info("File columns: %s", list(df.columns))

    rows = [row for _, row in df.iterrows()]
    results = list(executor.map(process_row, rows))
    results = [r for r in results if r is not None]

    logger.info("Total processed: %d", len(results))

    df_results = pd.DataFrame(results)
    df_results = df_results.drop(
        columns=[col for col in ["error", "raw_response"] if col in df_results.columns]
    )

    if df_results.empty:
        return {"results": results, "report": {}}

    df_results.columns = df_results.columns.str.strip().str.lower()
    df_results = df_results.loc[:, ~df_results.columns.duplicated()]

    return {"results": results, "report": _build_report(df_results)}


@router.post("/summarize")
async def summarize_clusters(req: SummarizeRequest, request: Request = None):
    executor = request.app.state.executor

    _skip_cats = {"statement", "unclassified", ""}

    groups: dict[str, list] = {}
    for r in req.results:
        cat = (r.get("category") or "").strip()
        if cat.lower() in _skip_cats:
            continue
        groups.setdefault(cat, []).append(r)

    if not groups:
        return {"clusters": []}

    def _summarize(item):
        cat, records = item
        return generate_cluster_summary(cat, records)

    clusters = list(executor.map(_summarize, groups.items()))
    clusters.sort(key=lambda c: c["count"], reverse=True)

    return {"clusters": clusters}
