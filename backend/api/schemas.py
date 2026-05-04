from pydantic import BaseModel


class SummarizeRequest(BaseModel):
    results: list
