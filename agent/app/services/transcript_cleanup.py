import os
import re


class TranscriptCleanupService:
    def __init__(
        self,
        ollama_client=None,
        ollama_enabled: bool | None = None,
        min_transcript_length: int | None = None,
    ):
        self.ollama_client = ollama_client
        self.ollama_enabled = (
            ollama_enabled
            if ollama_enabled is not None
            else os.getenv("OLLAMA_ENABLED", "false").lower() == "true"
        )
        self.min_transcript_length = min_transcript_length or int(
            os.getenv("OLLAMA_MIN_TRANSCRIPT_LENGTH", "12")
        )

    async def cleanup(self, transcript: str) -> dict:
        raw_transcript = (transcript or "").strip()
        rule_cleaned = self._apply_rules(raw_transcript)
        cleanup_meta = {
            "ruleApplied": rule_cleaned != raw_transcript,
            "ollamaAttempted": False,
            "ollamaUsed": False,
            "fallbackToRuleCleaned": False,
        }

        if not self._should_use_ollama(rule_cleaned):
            return {
                "rawTranscript": raw_transcript,
                "cleanedTranscript": rule_cleaned,
                "cleanupMeta": cleanup_meta,
            }

        cleanup_meta["ollamaAttempted"] = True
        try:
            ollama_result = (await self.ollama_client.cleanup_transcript(rule_cleaned)).strip()
            if not self._is_safe_candidate(rule_cleaned, ollama_result):
                cleanup_meta["fallbackToRuleCleaned"] = True
                return {
                    "rawTranscript": raw_transcript,
                    "cleanedTranscript": rule_cleaned,
                    "cleanupMeta": cleanup_meta,
                }

            cleanup_meta["ollamaUsed"] = True
            return {
                "rawTranscript": raw_transcript,
                "cleanedTranscript": ollama_result,
                "cleanupMeta": cleanup_meta,
            }
        except Exception:
            cleanup_meta["fallbackToRuleCleaned"] = True
            return {
                "rawTranscript": raw_transcript,
                "cleanedTranscript": rule_cleaned,
                "cleanupMeta": cleanup_meta,
            }

    def _should_use_ollama(self, transcript: str) -> bool:
        return bool(self.ollama_enabled and self.ollama_client and len(transcript) >= self.min_transcript_length)

    def _apply_rules(self, transcript: str) -> str:
        cleaned = re.sub(r"\s+", "", transcript)
        cleaned = re.sub(r"(\u55ef|\u554a|\u5443|\u90a3\u4e2a)", "", cleaned)
        cleaned = re.sub(r"([\uFF0C\u3002\uFF01\uFF1F\u3001,.!?])\1+", r"\1", cleaned)
        return cleaned.strip("\uFF0C\u3002\uFF01\uFF1F\u3001,.!? ")

    def _is_safe_candidate(self, source: str, candidate: str) -> bool:
        if not candidate:
            return False

        if len(candidate) < max(1, len(source) // 2):
            return False

        return re.findall(r"\d+", source) == re.findall(r"\d+", candidate)
