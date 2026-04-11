import pytest

from app.services import deepseek_client
from app.services.deepseek_client import DeepSeekClient


@pytest.mark.asyncio
async def test_complete_json_raises_clear_error_without_api_key():
    client = DeepSeekClient(api_key="")

    with pytest.raises(RuntimeError, match="DEEPSEEK_API_KEY"):
        await client.complete_json([{"role": "system", "content": "json"}])


@pytest.mark.asyncio
async def test_complete_json_posts_json_mode_request(monkeypatch):
    captured = {}

    class FakeResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {"choices": [{"message": {"content": '{"respMessage":"ok","updates":[]}'}}]}

    class FakeAsyncClient:
        def __init__(self, timeout):
            captured["timeout"] = timeout

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def post(self, url, headers, json):
            captured["url"] = url
            captured["headers"] = headers
            captured["json"] = json
            return FakeResponse()

    monkeypatch.setattr(deepseek_client.httpx, "AsyncClient", FakeAsyncClient)

    client = DeepSeekClient(
        api_key="test-key",
        base_url="https://api.deepseek.test",
        model="deepseek-chat",
        max_tokens=600,
    )

    result = await client.complete_json([{"role": "system", "content": "Return JSON"}])

    assert result == '{"respMessage":"ok","updates":[]}'
    assert captured["url"] == "https://api.deepseek.test/chat/completions"
    assert captured["headers"]["Authorization"] == "Bearer test-key"
    assert captured["json"]["response_format"] == {"type": "json_object"}
    assert captured["json"]["temperature"] == 0
    assert captured["json"]["max_tokens"] == 600
