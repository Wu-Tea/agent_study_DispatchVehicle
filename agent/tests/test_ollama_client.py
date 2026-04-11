import pytest

from app.services import ollama_client
from app.services.ollama_client import OllamaClient


@pytest.mark.asyncio
async def test_cleanup_transcript_posts_local_cleanup_prompt_with_keep_alive(monkeypatch):
    captured = {}

    class FakeResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {"response": "\u6211\u660e\u5929\u4e2d\u5348\u5341\u4e8c\u70b9\u8fd4\u56de\u3002"}

    class FakeAsyncClient:
        def __init__(self, timeout):
            captured["timeout"] = timeout

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def post(self, url, json):
            captured["url"] = url
            captured["json"] = json
            return FakeResponse()

    monkeypatch.setattr(ollama_client.httpx, "AsyncClient", FakeAsyncClient)

    client = OllamaClient(
        base_url="http://127.0.0.1:11434",
        model="gemma4:e4b",
        timeout_ms=1800,
    )

    result = await client.cleanup_transcript("\u90a3\u4e2a \u6211\u660e\u5929\u4e2d\u5348\u5341\u4e8c\u70b9\u8fd4\u56de")

    assert result == "\u6211\u660e\u5929\u4e2d\u5348\u5341\u4e8c\u70b9\u8fd4\u56de\u3002"
    assert captured["url"] == "http://127.0.0.1:11434/api/generate"
    assert captured["timeout"] == 1.8
    assert captured["json"]["model"] == "gemma4:e4b"
    assert captured["json"]["stream"] is False
    assert captured["json"]["keep_alive"] == "10m"
    assert captured["json"]["options"]["temperature"] == 0
    assert "\u8bf7\u53ea\u5bf9" in captured["json"]["prompt"]
    assert "\u4e0d\u8981\u6539\u53d8\u65e5\u671f\u3001\u65f6\u95f4" in captured["json"]["prompt"]
    assert "\u7535\u8bdd\u53f7\u7801" in captured["json"]["prompt"]
    assert "\u53ea\u8fd4\u56de\u6e05\u6d17\u540e\u7684\u6587\u672c\u672c\u8eab" in captured["json"]["prompt"]
