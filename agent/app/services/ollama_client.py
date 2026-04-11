import os

import httpx


class OllamaClient:
    def __init__(
        self,
        base_url: str | None = None,
        model: str | None = None,
        timeout_ms: int | None = None,
        keep_alive: str | None = None,
    ):
        self.base_url = (base_url or os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")).rstrip("/")
        self.model = model or os.getenv("OLLAMA_MODEL", "")
        self.timeout_ms = timeout_ms or int(os.getenv("OLLAMA_TIMEOUT_MS", "2000"))
        self.keep_alive = keep_alive or os.getenv("OLLAMA_KEEP_ALIVE", "10m")

    async def cleanup_transcript(self, transcript: str) -> str:
        if not self.model:
            raise RuntimeError("OLLAMA_MODEL is not configured")

        prompt = (
            "\u8bf7\u53ea\u5bf9\u4ee5\u4e0b\u4e2d\u6587\u8bed\u97f3\u8f6c\u5199\u6587\u672c\u505a\u8f7b\u91cf\u6da6\u8272\uff1a"
            "\u5220\u9664\u8bed\u6c14\u8bcd\u3001\u8865\u5fc5\u8981\u6807\u70b9\u3001\u5408\u5e76\u660e\u663e\u91cd\u590d\u7247\u6bb5\u3002"
            "\u4e0d\u8981\u6539\u53d8\u65e5\u671f\u3001\u65f6\u95f4\u3001\u4eba\u540d\u3001\u5730\u540d\u3001\u4eba\u6570\u3001\u6570\u91cf\u3001\u7535\u8bdd\u53f7\u7801\u3002"
            "\u4e0d\u8981\u8865\u5145\u539f\u6587\u6ca1\u6709\u7684\u4fe1\u606f\u3002"
            "\u5982\u679c\u4e0d\u786e\u5b9a\uff0c\u4fdd\u7559\u539f\u6587\u3002"
            "\u53ea\u8fd4\u56de\u6e05\u6d17\u540e\u7684\u6587\u672c\u672c\u8eab\uff0c\u4e0d\u8981\u8fd4\u56de\u89e3\u91ca\u3001JSON\u6216markdown\u3002\n\n"
            f"\u539f\u6587\uff1a{transcript}"
        )

        async with httpx.AsyncClient(timeout=self.timeout_ms / 1000) as client:
            response = await client.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "stream": False,
                    "keep_alive": self.keep_alive,
                    "options": {"temperature": 0},
                    "prompt": prompt,
                },
            )
            response.raise_for_status()
            return response.json()["response"].strip()
