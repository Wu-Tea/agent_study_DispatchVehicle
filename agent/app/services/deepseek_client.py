import os

import httpx


class DeepSeekClient:
    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        model: str | None = None,
        max_tokens: int | None = None,
    ):
        self.api_key = api_key if api_key is not None else os.getenv("DEEPSEEK_API_KEY", "sk-7b206366371645b4ae82dcc43bf35337")
        self.base_url = base_url or os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
        self.model = model or os.getenv("DEEPSEEK_MODEL", "deepseek-chat")
        self.max_tokens = max_tokens or int(os.getenv("DEEPSEEK_MAX_TOKENS", "800"))

    async def complete_json(self, messages: list[dict]) -> dict:
        if not self.api_key:
            raise RuntimeError("DEEPSEEK_API_KEY is not configured")

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "model": self.model,
                    "messages": messages,
                    "response_format": {"type": "json_object"},
                    "temperature": 0,
                    "max_tokens": self.max_tokens,
                },
            )
            response.raise_for_status()
            body = response.json()
            return body["choices"][0]["message"]["content"]
