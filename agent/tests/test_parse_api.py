from fastapi.testclient import TestClient

from app.main import create_app


class FakeParseService:
    async def parse(self, payload):
        return {
            "respMessage": "已识别出出发地和乘车人数。",
            "updates": [
                {"fieldName": "startAddress", "fieldValue": "南山"},
                {"fieldName": "useCarPersonNum", "fieldValue": 2},
            ],
            "overwriteFields": [],
            "confirmRequired": True,
        }


class FailingParseService:
    async def parse(self, payload):
        raise RuntimeError("DEEPSEEK_API_KEY is not configured")


def test_parse_endpoint_returns_agent_payload():
    app = create_app()
    app.state.parse_service = FakeParseService()
    client = TestClient(app)

    response = client.post(
        "/api/agent/parse",
        json={
            "taskKey": "UserTask_0",
            "buttonKey": "HANDLE",
            "transcript": "明天从南山出发，两个人",
            "formData": {},
            "supportedFields": ["startAddress", "useCarPersonNum"],
            "fieldOptions": {"useCarMatter": []},
        },
    )

    assert response.status_code == 200
    assert response.json()["updates"][0]["fieldName"] == "startAddress"
    assert response.json()["confirmRequired"] is True


def test_parse_endpoint_returns_clear_service_unavailable_error():
    app = create_app()
    app.state.parse_service = FailingParseService()
    client = TestClient(app)

    response = client.post(
        "/api/agent/parse",
        json={
            "taskKey": "UserTask_0",
            "buttonKey": "HANDLE",
            "transcript": "明天从南山出发，两个人",
            "formData": {},
            "supportedFields": ["startAddress", "useCarPersonNum"],
            "fieldOptions": {"useCarMatter": []},
        },
    )

    assert response.status_code == 503
    assert response.json() == {"detail": "DEEPSEEK_API_KEY is not configured"}
