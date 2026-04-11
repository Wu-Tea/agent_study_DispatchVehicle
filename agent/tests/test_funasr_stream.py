import asyncio
import base64
import json

import pytest

from app.services import funasr_stream
from app.services.funasr_stream import FunASRStreamSession


class FakeConnection:
    def __init__(self, messages=None):
        self.sent = []
        self.closed = False
        self._messages = asyncio.Queue()
        for message in messages or []:
            self._messages.put_nowait(json.dumps(message))

    async def send(self, data):
        self.sent.append(data)

    async def recv(self):
        return await self._messages.get()

    async def close(self):
        self.closed = True


@pytest.mark.asyncio
async def test_start_uses_official_funasr_handshake(monkeypatch):
    fake_connection = FakeConnection()
    connect_args = {}

    async def fake_connect(url, **kwargs):
        connect_args["url"] = url
        connect_args["kwargs"] = kwargs
        return fake_connection

    monkeypatch.setattr(funasr_stream, "connect", fake_connect)

    session = FunASRStreamSession(server_url="ws://funasr.test")
    await session.start(16000)

    assert connect_args["url"] == "ws://funasr.test"
    assert connect_args["kwargs"]["subprotocols"] == ["binary"]
    handshake = json.loads(fake_connection.sent[0])
    assert handshake["mode"] == "2pass"
    assert handshake["audio_fs"] == 16000
    assert handshake["wav_format"] == "pcm"
    assert handshake["chunk_interval"] == 10

    await session.close()


@pytest.mark.asyncio
async def test_feed_sends_binary_audio_and_returns_partial(monkeypatch):
    fake_connection = FakeConnection(messages=[{"mode": "2pass-online", "text": "南山"}])

    async def fake_connect(url, **kwargs):
        return fake_connection

    monkeypatch.setattr(funasr_stream, "connect", fake_connect)

    session = FunASRStreamSession(server_url="ws://funasr.test")
    await session.start(16000)
    await asyncio.sleep(0)

    result = await session.feed(base64.b64encode(b"\x01\x02\x03\x04").decode())

    assert fake_connection.sent[1] == b"\x01\x02\x03\x04"
    assert result == {"event": "partial_transcript", "text": "南山"}

    await session.close()


@pytest.mark.asyncio
async def test_stop_waits_for_final_message(monkeypatch):
    fake_connection = FakeConnection(
        messages=[
            {"mode": "2pass-online", "text": "南山"},
            {"mode": "2pass-offline", "text": "明天上午九点从南山出发", "is_final": True},
        ]
    )

    async def fake_connect(url, **kwargs):
        return fake_connection

    monkeypatch.setattr(funasr_stream, "connect", fake_connect)

    session = FunASRStreamSession(server_url="ws://funasr.test")
    await session.start(16000)
    await asyncio.sleep(0)

    result = await session.stop()

    assert json.loads(fake_connection.sent[1]) == {"is_speaking": False}
    assert result == {"event": "final_transcript", "text": "明天上午九点从南山出发"}

    await session.close()
