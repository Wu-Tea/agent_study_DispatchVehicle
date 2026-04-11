from fastapi import FastAPI

from app.api.asr_ws import router as asr_router
from app.api.parse import router as parse_router
from app.services.deepseek_client import DeepSeekClient
from app.services.funasr_stream import FunASRStreamSession
from app.services.ollama_client import OllamaClient
from app.services.parse_service import ParseService
from app.services.transcript_cleanup import TranscriptCleanupService


class MissingParseService:
    async def parse(self, payload):
        raise RuntimeError("parse_service not configured")


def create_app() -> FastAPI:
    app = FastAPI(title="Dispatch Voice Agent")
    app.state.cleanup_service = TranscriptCleanupService(ollama_client=OllamaClient())
    app.state.parse_service = ParseService(llm_client=DeepSeekClient())
    app.state.asr_session_factory = FunASRStreamSession
    app.include_router(parse_router)
    app.include_router(asr_router)

    @app.get("/healthz")
    async def healthz() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
