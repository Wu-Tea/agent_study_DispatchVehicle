import logging

from fastapi.testclient import TestClient

from app.main import create_app


class FakeAsrSession:
    async def start(self, sample_rate):
        return None

    async def feed(self, chunk):
        return {"event": "partial_transcript", "text": "nanshan"}

    async def stop(self):
        return {"event": "final_transcript", "text": "tomorrow 9am from nanshan"}

    async def close(self):
        return None


def test_asr_websocket_streams_partial_and_final_events():
    app = create_app()
    app.state.asr_session_factory = lambda: FakeAsrSession()
    client = TestClient(app)

    with client.websocket_connect("/ws/asr") as websocket:
        websocket.send_json({"event": "start", "sampleRate": 16000})
        websocket.send_json({"event": "audio", "chunk": "AAAA"})
        partial = websocket.receive_json()
        assert partial == {"event": "partial_transcript", "text": "nanshan"}

        websocket.send_json({"event": "stop"})
        final = websocket.receive_json()
        assert final == {"event": "final_transcript", "text": "tomorrow 9am from nanshan"}


def test_asr_websocket_logs_key_lifecycle_events(caplog):
    app = create_app()
    app.state.asr_session_factory = lambda: FakeAsrSession()
    client = TestClient(app)

    with caplog.at_level(logging.INFO, logger="uvicorn.error"):
        with client.websocket_connect("/ws/asr") as websocket:
            websocket.send_json({"event": "start", "sampleRate": 16000})
            websocket.send_json({"event": "audio", "chunk": "AAAA"})
            websocket.receive_json()
            websocket.send_json({"event": "stop"})
            websocket.receive_json()

    assert "ASR websocket accepted" in caplog.text
    assert "ASR start event received" in caplog.text
    assert "ASR audio event received" in caplog.text
    assert "ASR partial transcript sent" in caplog.text
    assert "ASR stop event received" in caplog.text
    assert "ASR final transcript sent" in caplog.text
    assert "ASR websocket session closed" in caplog.text
