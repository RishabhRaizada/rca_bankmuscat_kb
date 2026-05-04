import streamlit as st
import pandas as pd
import requests
from io import BytesIO
import matplotlib.pyplot as plt

st.set_page_config(page_title="AI Complaint RCA", layout="wide")

st.title("🏦 AI Customer Intelligence System")

tab1, tab2 = st.tabs(["💬 Single Message", "📊 Bulk Processing"])


# --------------------------
# TAB 1: SINGLE MESSAGE
# --------------------------
with tab1:

    st.subheader("Analyze Message")

    user_input = st.text_area("Enter message:")

    if st.button("Analyze"):

        if not user_input.strip():
            st.warning("Please enter a message")
            st.stop()

        files = {"file": ("input.csv", f"complaint_text\n{user_input}")}
        response = requests.post("http://localhost:8000/process", files=files)

        try:
            response_json = response.json()
        except Exception:
            st.error(f"Backend error ❌\n{response.text}")
            st.stop()

        data = response_json.get("results", [])
        if not data:
            st.warning("No result returned")
            st.stop()

        result = data[0]
        st.success("Done ✅")

        col1, col2 = st.columns(2)

        with col1:
            st.subheader("📂 Message Type")
            st.write(result.get("message_type", "N/A"))

            st.subheader("😠 Sentiment")
            st.write(result.get("sentiment", "N/A"))

            st.subheader("🏷️ Taxonomy")
            st.write(
                f"**{result.get('category', 'N/A')}** → "
                f"{result.get('sub_category', 'N/A')} → "
                f"*{result.get('issue', 'N/A')}*"
            )

            st.subheader("📌 Summary")
            st.write(result.get("complaint_summary", "N/A"))

        with col2:
            st.subheader("🧠 Root Cause")
            st.write(result.get("root_cause", "N/A"))

            st.subheader("🔍 All Possible Causes")
            causes = result.get("possible_causes", [])
            if causes:
                for c in causes:
                    st.write(f"• {c}")
            else:
                st.write("N/A")

            st.subheader("⚡ Next Steps / Remedial Actions")
            steps = result.get("next_steps", [])
            if steps:
                for i, s in enumerate(steps, 1):
                    st.write(f"{i}. {s}")
            else:
                st.write(result.get("recommended_action", "N/A"))

        st.subheader("📝 RCA Summary")
        st.info(result.get("rca_summary", "N/A"))

        st.subheader("💬 Original Message")
        st.write(result.get("original_text", user_input))


# --------------------------
# TAB 2: BULK PROCESSING
# --------------------------
with tab2:

    uploaded_file = st.file_uploader("Upload CSV / Excel")

    if uploaded_file:

        if st.button("Process File"):

            response = requests.post(
                "http://localhost:8000/process",
                files={"file": uploaded_file},
            )

            try:
                response_json = response.json()
            except Exception:
                st.error(f"Backend error ❌\n{response.text}")
                st.stop()

            data = response_json.get("results", [])
            report = response_json.get("report", {})

            if not data:
                st.warning("No data returned")
                st.stop()

            df = pd.DataFrame(data)
            df.columns = df.columns.str.strip().str.lower()

            # Convert list columns to readable strings for display
            for list_col in ("next_steps", "possible_causes"):
                if list_col in df.columns:
                    df[list_col] = df[list_col].apply(
                        lambda v: "; ".join(v) if isinstance(v, list) else (v or "")
                    )

            st.success("Processed ✅")

            # --------------------------
            # REPORT SUMMARY
            # --------------------------
            if report:
                st.subheader("📊 Overall Report")
                col1, col2, col3 = st.columns(3)
                with col1:
                    st.metric("Total Records", report.get("total_records", 0))
                with col2:
                    st.metric("Mapped", report.get("mapped_records", 0))
                with col3:
                    st.metric("Accuracy", report.get("mapping_accuracy", 0))

                st.subheader("🧠 Collective Summary")
                st.write(report.get("collective_summary", ""))

                if report.get("insights"):
                    st.subheader("💡 Insights")
                    for insight in report["insights"]:
                        st.write(f"• {insight}")

            # --------------------------
            # COLUMN ORDER (new fields included)
            # --------------------------
            priority_cols = [
                "original_text",
                "translated_text",
                "message_type",
                "sentiment",
                "is_mapped",
                "category",
                "sub_category",
                "issue",
                "possible_causes",
                "root_cause",
                "rca_summary",
                "next_steps",
                "recommended_action",
                "confidence_score",
            ]

            df = df[
                [c for c in priority_cols if c in df.columns]
                + [c for c in df.columns if c not in priority_cols]
            ]

            # --------------------------
            # METRICS
            # --------------------------
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Total", len(df))
            with col2:
                complaints = (df["message_type"] == "Complaint").sum() if "message_type" in df else 0
                st.metric("Complaints", int(complaints))
            with col3:
                inquiries = (df["message_type"] == "Inquiry").sum() if "message_type" in df else 0
                st.metric("Inquiries", int(inquiries))

            # --------------------------
            # MESSAGE TYPE CHART
            # --------------------------
            if "message_type" in df.columns:
                type_counts = (
                    df["message_type"]
                    .value_counts()
                    .reindex(["Complaint", "Inquiry", "Statement"], fill_value=0)
                    .reset_index()
                )
                type_counts.columns = ["type", "count"]

                st.subheader("📊 Message Type Distribution")
                fig, ax = plt.subplots()
                ax.bar(type_counts["type"], type_counts["count"])
                st.pyplot(fig)
                plt.close(fig)

            # --------------------------
            # SENTIMENT CHART
            # --------------------------
            if "sentiment" in df.columns:
                sent_counts = (
                    df["sentiment"]
                    .value_counts()
                    .reindex(["Negative", "Neutral", "Positive"], fill_value=0)
                    .reset_index()
                )
                sent_counts.columns = ["sentiment", "count"]

                st.subheader("😠 Sentiment Distribution")
                fig2, ax2 = plt.subplots()
                ax2.bar(sent_counts["sentiment"], sent_counts["count"])
                st.pyplot(fig2)
                plt.close(fig2)

            # --------------------------
            # CATEGORY DISTRIBUTION
            # --------------------------
            if report.get("category_summary"):
                cat_df = pd.DataFrame(report["category_summary"])
                cat_df.columns = cat_df.columns.str.lower()
                if "category" in cat_df.columns and "count" in cat_df.columns:
                    st.subheader("📊 Category Distribution")
                    fig3, ax3 = plt.subplots()
                    ax3.bar(cat_df["category"], cat_df["count"])
                    plt.xticks(rotation=45, ha="right")
                    plt.tight_layout()
                    st.pyplot(fig3)
                    plt.close(fig3)

            # --------------------------
            # TOP ISSUES
            # --------------------------
            if all(c in df.columns for c in ["category", "sub_category", "issue"]):
                filtered = df[df["message_type"] == "Complaint"] if "message_type" in df.columns else df
                top_issues = (
                    filtered.groupby(["category", "sub_category", "issue"])
                    .size()
                    .reset_index(name="count")
                    .sort_values("count", ascending=False)
                )
                st.subheader("🔥 Top Issues")
                st.dataframe(top_issues.head(10))

            # --------------------------
            # DATA TABLE
            # --------------------------
            st.subheader("📄 Data")
            st.dataframe(df)

            # --------------------------
            # EXPORT
            # --------------------------
            output = BytesIO()
            with pd.ExcelWriter(output, engine="openpyxl") as writer:
                df.to_excel(writer, index=False)
            output.seek(0)

            st.download_button("Download Excel", output, "output.xlsx")
