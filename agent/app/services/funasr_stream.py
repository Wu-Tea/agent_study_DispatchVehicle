import asyncio
import base64
import json
import logging
import os

from websockets.client import connect

logger = logging.getLogger("uvicorn.error")

PARTIAL_MODES = {"online", "2pass-online"}
FINAL_MODES = {"offline", "2pass-offline"}


class FunASRStreamSession:
    def __init__(self, server_url: str | None = None):
        self.server_url = server_url or os.getenv("FUNASR_SERVER_URL", "ws://127.0.0.1:10095")
        self.connection = None
        self.message_queue = asyncio.Queue()
        self.reader_task = None

    async def start(self, sample_rate: int):
        logger.info("FunASR session connecting server_url=%s sample_rate=%s", self.server_url, sample_rate)
        self.connection = await connect(
            self.server_url,
            max_size=8 * 1024 * 1024,
            ping_interval=None,
            subprotocols=["binary"],
        )
        self.reader_task = asyncio.create_task(self._reader_loop())
        await self.connection.send(
            json.dumps(
                {
                    "mode": "2pass",
                    "chunk_size": [5, 10, 5],
                    "chunk_interval": 10,
                    "encoder_chunk_look_back": 4,
                    "decoder_chunk_look_back": 0,
                    "audio_fs": sample_rate,
                    "wav_name": "dispatch-session",
                    "wav_format": "pcm",
                    "is_speaking": True,
                    "itn": True,
                }
            )
        )
        logger.info("FunASR session started server_url=%s", self.server_url)

    async def _reader_loop(self):
        try:
            while True:
                message = json.loads(await self.connection.recv())
                logger.info(
                    "FunASR message received mode=%s text_length=%s text_preview=%s",
                    message.get("mode", ""),
                    len(message.get("text", "")),
                    (message.get("text", "") or "")[:120],
                )
                await self.message_queue.put(message)
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("FunASR reader loop failed server_url=%s", self.server_url)
            raise

    async def feed(self, chunk: str):
        audio_bytes = base64.b64decode(chunk)
        logger.info("FunASR audio chunk sent chunk_length=%s", len(audio_bytes))
        await self.connection.send(audio_bytes)

        latest_partial = None
        while not self.message_queue.empty():
            message = self.message_queue.get_nowait()
            if message.get("mode") in PARTIAL_MODES and message.get("text"):
                latest_partial = message["text"]

        if latest_partial:
            logger.info(
                "FunASR partial response received text_length=%s text_preview=%s",
                len(latest_partial),
                latest_partial[:80],
            )
            return {"event": "partial_transcript", "text": latest_partial}

        return None

    async def stop(self):
        logger.info("FunASR stop signal sent")
        await self.connection.send(json.dumps({"is_speaking": False}))

        final_text = ""
        while True:
            message = await self.message_queue.get()
            mode = message.get("mode")
            text = message.get("text", "")
            if text:
                final_text = text
            if message.get("is_final") or mode in FINAL_MODES:
                logger.info(
                    "FunASR final response received text_length=%s text_preview=%s",
                    len(final_text),
                    final_text[:120],
                )
                return {"event": "final_transcript", "text": final_text}

    async def close(self):
        if self.reader_task is not None:
            self.reader_task.cancel()
            try:
                await self.reader_task
            except asyncio.CancelledError:
                pass
            self.reader_task = None

        if self.connection is not None:
            logger.info("FunASR websocket closing server_url=%s", self.server_url)
            await self.connection.close()
            self.connection = None
