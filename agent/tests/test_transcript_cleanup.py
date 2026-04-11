import pytest

from app.services.transcript_cleanup import TranscriptCleanupService


class FakeOllamaClient:
    def __init__(self, cleaned_text=None, error=None):
        self.cleaned_text = cleaned_text
        self.error = error
        self.calls = []

    async def cleanup_transcript(self, transcript: str) -> str:
        self.calls.append(transcript)
        if self.error:
            raise self.error
        return self.cleaned_text


@pytest.mark.asyncio
async def test_cleanup_service_removes_fillers_without_ollama():
    service = TranscriptCleanupService(ollama_client=None, ollama_enabled=False)
    source = "\u5443 \u6211\u660e\u5929\u4e0b\u5348\u56db\u70b9 \u53bb\u5317\u4eac"

    result = await service.cleanup(source)

    assert result["rawTranscript"] == source
    assert result["cleanedTranscript"] == "\u6211\u660e\u5929\u4e0b\u5348\u56db\u70b9\u53bb\u5317\u4eac"
    assert result["cleanupMeta"]["ollamaAttempted"] is False
    assert result["cleanupMeta"]["ollamaUsed"] is False


@pytest.mark.asyncio
async def test_cleanup_service_falls_back_to_rule_cleaned_when_ollama_fails():
    service = TranscriptCleanupService(
        ollama_client=FakeOllamaClient(error=RuntimeError("timeout")),
        ollama_enabled=True,
        min_transcript_length=1,
    )
    source = "\u90a3\u4e2a \u6211\u660e\u5929\u4e2d\u5348\u5341\u4e8c\u70b9\u8fd4\u56de"

    result = await service.cleanup(source)

    assert result["rawTranscript"] == source
    assert result["cleanedTranscript"] == "\u6211\u660e\u5929\u4e2d\u5348\u5341\u4e8c\u70b9\u8fd4\u56de"
    assert result["cleanupMeta"]["ollamaAttempted"] is True
    assert result["cleanupMeta"]["fallbackToRuleCleaned"] is True


@pytest.mark.asyncio
async def test_cleanup_service_uses_ollama_for_long_transcripts_when_enabled():
    ollama_client = FakeOllamaClient(cleaned_text="\u6211\u660e\u5929\u4e2d\u5348\u5341\u4e8c\u70b9\u8fd4\u56de\u3002")
    service = TranscriptCleanupService(
        ollama_client=ollama_client,
        ollama_enabled=True,
        min_transcript_length=1,
    )

    result = await service.cleanup("\u90a3\u4e2a \u6211\u660e\u5929\u4e2d\u5348\u5341\u4e8c\u70b9\u8fd4\u56de")

    assert ollama_client.calls == ["\u6211\u660e\u5929\u4e2d\u5348\u5341\u4e8c\u70b9\u8fd4\u56de"]
    assert result["cleanedTranscript"] == "\u6211\u660e\u5929\u4e2d\u5348\u5341\u4e8c\u70b9\u8fd4\u56de\u3002"
    assert result["cleanupMeta"]["ollamaAttempted"] is True
    assert result["cleanupMeta"]["ollamaUsed"] is True
