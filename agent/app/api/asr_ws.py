from uuid import uuid4

from fastapi import APIRouter, WebSocket

router = APIRouter()
import logging

logger = logging.getLogger("uvicorn.error")


@router.websocket("/ws/asr")
async def asr_socket(websocket: WebSocket):
    await websocket.accept()
    session_id = uuid4().hex[:8]
    session = websocket.app.state.asr_session_factory()
    logger.info("ASR websocket accepted session_id=%s", session_id)

    try:
        while True:
            logger.info("ASR waiting for client event session_id=%s", session_id)
            payload = await websocket.receive_json()
            event = payload["event"]

            if event == "start":
                logger.info(
                    "ASR start event received session_id=%s sample_rate=%s",
                    session_id,
                    payload["sampleRate"],
                )
                await session.start(payload["sampleRate"])
            elif event == "audio":
                chunk = payload["chunk"]
                logger.info(
                    "ASR audio event received session_id=%s chunk_length=%s",
                    session_id,
                    len(chunk),
                )
                partial = await session.feed(payload["chunk"])
                if partial:
                    logger.info(
                        "ASR partial transcript sent session_id=%s text_length=%s",
                        session_id,
                        len(partial.get("text", "")),
                    )
                    await websocket.send_json(partial)
                else:
                    logger.info("ASR partial transcript empty session_id=%s", session_id)
            elif event == "stop":
                logger.info("ASR stop event received session_id=%s", session_id)
                final = await session.stop()
                logger.info(
                    "ASR final transcript sent session_id=%s text_length=%s",
                    session_id,
                    len(final.get("text", "")),
                )
                await websocket.send_json(final)
                break
            else:
                logger.warning("ASR unknown event session_id=%s event=%s", session_id, event)
    except Exception:
        logger.exception("ASR websocket session failed session_id=%s", session_id)
        raise
    finally:
        logger.info("ASR websocket session closed session_id=%s", session_id)
        await session.close()
