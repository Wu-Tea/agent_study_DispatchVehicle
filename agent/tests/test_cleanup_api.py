from fastapi.testclient import TestClient

from app.main import create_app


def test_cleanup_endpoint_returns_cleaned_text():
    app = create_app()

    class FakeCleanupService:
        async def cleanup(self, transcript: str):
            return {
                "rawTranscript": transcript,
                "cleanedTranscript": "我明天中午十二点返回。",
                "cleanupMeta": {
                    "ruleApplied": True,
                    "ollamaAttempted": True,
                    "ollamaUsed": True,
                    "fallbackToRuleCleaned": False,
                },
            }

    app.state.cleanup_service = FakeCleanupService()
    client = TestClient(app)

    response = client.post("/api/agent/cleanup", json={"transcript": "那个 我明天中午十二点返回"})

    assert response.status_code == 200
    assert response.json()["cleanedTranscript"] == "我明天中午十二点返回。"
