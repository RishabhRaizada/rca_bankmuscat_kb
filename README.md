# RCA Bank Muscat
---

## Backend

```bash
# From the project root
pip install -r requirements.txt

cd backend
uvicorn main:app --reload --port 8000
```

API runs at `http://localhost:8000`

**Environment variables** (optional — defaults shown):

| Variable | Default | Description |
|---|---|---|
| `GOOGLE_APPLICATION_CREDENTIALS` | `./key.json` | Path to GCP service account key |
| `VERTEX_LOCATION` | `us-east5` | Vertex AI region |
| `VERTEX_MODEL` | `claude-sonnet-4-5` | Model ID |

---

## Frontend

```bash
cd frontend

# Install dependencies (first time only)
npm install

# Start dev server
npm run dev
```

App runs at `http://localhost:5173`

---

## Knowledge Graph Scripts

Run these from the project root when updating the knowledge base:

```bash
# Rebuild graph from taxonomy + lookup table
python backend/scripts/build_knowledge_graph.py

# Enrich graph with LLM deduplication + edge weights (run after build)
python backend/scripts/enrich_knowledge_graph.py
```
