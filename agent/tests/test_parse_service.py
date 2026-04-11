from datetime import date

import pytest

from app.schemas.agent import ParseRequest
from app.services.parse_service import ParseService


class FakeDeepSeekClient:
    def __init__(self, payload):
        self.payload = payload
        self.messages = None

    async def complete_json(self, messages):
        self.messages = messages
        return self.payload


class FakeCleanupService:
    def __init__(self, result):
        self.result = result
        self.calls = []

    async def cleanup(self, transcript):
        self.calls.append(transcript)
        return self.result


@pytest.mark.asyncio
async def test_parse_service_normalizes_enum_and_overwrite_fields():
    service = ParseService(
        llm_client=FakeDeepSeekClient(
            {
                "respMessage": "已将乘车人数从 2 改为 3。",
                "updates": [
                    {"fieldName": "useCarMatter", "fieldValue": "会议用车"},
                    {"fieldName": "useCarPersonNum", "fieldValue": 3},
                ],
            }
        )
    )

    payload = ParseRequest.model_validate(
        {
            "taskKey": "UserTask_0",
            "buttonKey": "HANDLE",
            "transcript": "不是两个人，是三个人，去开会",
            "formData": {"useCarPersonNum": 2},
            "supportedFields": ["useCarMatter", "useCarPersonNum"],
            "fieldOptions": {
                "useCarMatter": [
                    {"key": 5100, "label": "会议用车"},
                    {"key": 5200, "label": "出差用车"},
                ]
            },
        }
    )

    result = await service.parse(payload)

    assert result["updates"][0] == {"fieldName": "useCarMatter", "fieldValue": 5100}
    assert result["overwriteFields"] == [
        {"fieldName": "useCarPersonNum", "oldValue": 2, "newValue": 3}
    ]


@pytest.mark.asyncio
async def test_parse_service_normalizes_enum_string_key_values():
    service = ParseService(
        llm_client=FakeDeepSeekClient(
            {
                "respMessage": "已识别出用车事由。",
                "updates": [
                    {"fieldName": "useCarMatter", "fieldValue": "5100"},
                ],
            }
        )
    )

    payload = ParseRequest.model_validate(
        {
            "taskKey": "UserTask_0",
            "buttonKey": "HANDLE",
            "transcript": "去开会",
            "formData": {},
            "supportedFields": ["useCarMatter"],
            "fieldOptions": {
                "useCarMatter": [
                    {"key": 5100, "label": "会议用车"},
                    {"key": 5200, "label": "出差用车"},
                ]
            },
        }
    )

    result = await service.parse(payload)

    assert result["updates"] == [{"fieldName": "useCarMatter", "fieldValue": 5100}]


@pytest.mark.asyncio
async def test_parse_service_filters_unknown_fields():
    service = ParseService(
        llm_client=FakeDeepSeekClient(
            {
                "respMessage": "只保留白名单字段。",
                "updates": [
                    {"fieldName": "startAddress", "fieldValue": "南山"},
                    {"fieldName": "contactsPhone", "fieldValue": "13800138000"},
                ],
            }
        )
    )

    payload = ParseRequest.model_validate(
        {
            "taskKey": "UserTask_0",
            "buttonKey": "HANDLE",
            "transcript": "从南山出发",
            "formData": {},
            "supportedFields": ["startAddress"],
            "fieldOptions": {},
        }
    )

    result = await service.parse(payload)

    assert result["updates"] == [{"fieldName": "startAddress", "fieldValue": "南山"}]


@pytest.mark.asyncio
async def test_parse_service_builds_prompt_with_date_and_output_constraints():
    client = FakeDeepSeekClient(
        {
            "respMessage": "已识别出出发地和出车时间。",
            "updates": [
                {"fieldName": "startAddress", "fieldValue": "南山"},
                {"fieldName": "startTime", "fieldValue": "2026-04-10 09:00:00"},
            ],
        }
    )
    service = ParseService(
        llm_client=client,
        current_date_provider=lambda: date(2026, 4, 9),
    )

    payload = ParseRequest.model_validate(
        {
            "taskKey": "UserTask_0",
            "buttonKey": "HANDLE",
            "transcript": "明天早上九点从南山出发",
            "formData": {},
            "supportedFields": ["startAddress", "startTime"],
            "fieldOptions": {},
        }
    )

    await service.parse(payload)

    assert client.messages is not None
    assert client.messages[0]["role"] == "system"
    assert "你是“派车申请单 UserTask_0 / HANDLE”的中文语义提取服务。" in client.messages[0]["content"]
    assert "今天是 2026-04-09。" in client.messages[0]["content"]
    assert "YYYY-MM-DD HH:mm:ss" in client.messages[0]["content"]
    assert "supportedFields" in client.messages[0]["content"]
    assert "contactsPhone" in client.messages[0]["content"]
    assert "updates 中同一个 fieldName 只能出现一次。" in client.messages[0]["content"]
    assert "不要把拜访对象、接待对象、客户姓名当作 contacts" in client.messages[0]["content"]
    assert "只有“日期 + 明确时刻”同时具备时，才能输出 startTime 或 endTime。" in client.messages[0]["content"]
    assert "如果只出现一个明确时间点，默认优先理解为 startTime，不要臆造 endTime。" in client.messages[0]["content"]


@pytest.mark.asyncio
async def test_parse_service_deduplicates_duplicate_fields_using_last_value():
    service = ParseService(
        llm_client=FakeDeepSeekClient(
            {
                "respMessage": "已将乘车人数更新为 3。",
                "updates": [
                    {"fieldName": "useCarPersonNum", "fieldValue": 2},
                    {"fieldName": "useCarPersonNum", "fieldValue": 3},
                ],
            }
        )
    )

    payload = ParseRequest.model_validate(
        {
            "taskKey": "UserTask_0",
            "buttonKey": "HANDLE",
            "transcript": "不是两个人，是三个人。",
            "formData": {"useCarPersonNum": 1},
            "supportedFields": ["useCarPersonNum"],
            "fieldOptions": {},
        }
    )

    result = await service.parse(payload)

    assert result["updates"] == [{"fieldName": "useCarPersonNum", "fieldValue": 3}]
    assert result["overwriteFields"] == [
        {"fieldName": "useCarPersonNum", "oldValue": 1, "newValue": 3}
    ]


@pytest.mark.asyncio
async def test_parse_service_uses_provided_cleaned_transcript_without_running_cleanup():
    client = FakeDeepSeekClient(
        {
            "respMessage": "已识别出返回时间。",
            "updates": [
                {"fieldName": "endTime", "fieldValue": "2026-04-10 12:00:00"},
            ],
        }
    )
    cleanup_service = FakeCleanupService(
        {
            "rawTranscript": "那个 我明天中午十二点返回",
            "cleanedTranscript": "我明天中午十二点返回",
            "cleanupMeta": {
                "ruleApplied": True,
                "ollamaAttempted": False,
                "ollamaUsed": False,
                "fallbackToRuleCleaned": False,
            },
        }
    )
    service = ParseService(
        llm_client=client,
        cleanup_service=cleanup_service,
        current_date_provider=lambda: date(2026, 4, 9),
    )

    payload = ParseRequest.model_validate(
        {
            "taskKey": "UserTask_0",
            "buttonKey": "HANDLE",
            "transcript": "那个 我明天中午十二点返回",
            "formData": {},
            "supportedFields": ["endTime"],
            "fieldOptions": {},
        }
    )

    result = await service.parse(payload)

    assert cleanup_service.calls == []
    assert result["rawTranscript"] == "那个 我明天中午十二点返回"
    assert result["cleanedTranscript"] == "那个 我明天中午十二点返回"
    assert result["cleanupMeta"]["ruleApplied"] is False
    assert "那个 我明天中午十二点返回" in client.messages[1]["content"]
