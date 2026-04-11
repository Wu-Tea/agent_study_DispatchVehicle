import json
from datetime import date
from textwrap import dedent

from app.schemas.agent import ParseRequest
from app.services.transcript_cleanup import TranscriptCleanupService


class ParseService:
    def __init__(self, llm_client, cleanup_service=None, current_date_provider=None):
        self.llm_client = llm_client
        self.cleanup_service = cleanup_service or TranscriptCleanupService()
        self.current_date_provider = current_date_provider or date.today

    async def parse(self, payload: ParseRequest) -> dict:
        cleaned_transcript = payload.transcript.strip()

        raw = await self.llm_client.complete_json(self._build_messages(payload, cleaned_transcript))
        parsed = json.loads(raw) if isinstance(raw, str) else raw

        allowed_fields = set(payload.supportedFields)
        normalized_updates = {}

        for item in parsed.get("updates", []):
            field_name = item["fieldName"]
            if field_name not in allowed_fields:
                continue

            field_value = self._normalize_value(field_name, item["fieldValue"], payload.fieldOptions)
            normalized_updates[field_name] = field_value

        updates = []
        overwrite_fields = []
        for field_name, field_value in normalized_updates.items():
            updates.append({"fieldName": field_name, "fieldValue": field_value})

            old_value = payload.formData.get(field_name)
            if old_value not in ("", None) and old_value != field_value:
                overwrite_fields.append(
                    {"fieldName": field_name, "oldValue": old_value, "newValue": field_value}
                )

        return {
            "respMessage": parsed.get("respMessage", "\u5df2\u5b8c\u6210\u672c\u8f6e\u8bc6\u522b\u3002"),
            "updates": updates,
            "overwriteFields": overwrite_fields,
            "confirmRequired": True,
            "rawTranscript": cleaned_transcript,
            "cleanedTranscript": cleaned_transcript,
            "cleanupMeta": {
                "ruleApplied": False,
                "ollamaAttempted": False,
                "ollamaUsed": False,
                "fallbackToRuleCleaned": False,
            },
        }

    def _normalize_value(self, field_name: str, field_value, field_options: dict):
        if field_name != "useCarMatter":
            return field_value

        normalized_field_value = str(field_value)
        for option in field_options.get("useCarMatter", []):
            if normalized_field_value in {
                str(option.get("key")),
                str(option.get("label")),
            }:
                return option["key"]

        return field_value

    def _build_messages(self, payload: ParseRequest, transcript: str) -> list[dict]:
        today = self.current_date_provider().isoformat()
        system_prompt = dedent(
            f"""
            你是“派车申请单 UserTask_0 / HANDLE”的中文语义提取服务。
            今天是 {today}。

            你的任务：
            从用户的中文语音转写文本中，提取本轮可以明确写入表单的字段更新建议。

            严格要求：
            1. 只返回 JSON 对象，不要输出 markdown、代码块、解释、注释或任何多余文本。
            2. 返回格式固定为：
            {{"respMessage":"...","updates":[{{"fieldName":"...","fieldValue":"..."}}]}}
            3. fieldName 必须且只能来自 supportedFields。
            4. 不要返回 contactsPhone、联动字段、或任何不在 supportedFields 中的字段。
            5. 如果某个字段无法从用户输入中明确确定，就省略，不要猜测。
            6. updates 中同一个 fieldName 只能出现一次。

            字段语义：
            - startAddress：出发地、上车地、起点
            - endAddress：目的地、到达地、终点
            - startTime：出发时间、用车开始时间
            - endTime：结束时间、返回时间；只有用户明确说出结束时间时才返回
            - useCarMatter：用车事由，必须根据 fieldOptions.useCarMatter 选择最匹配项，优先返回 key；无法唯一确定则省略
            - contacts：本次派车申请的联系人或乘车联系人；不要把拜访对象、接待对象、客户姓名当作 contacts，除非用户明确表示“联系人是某人”
            - useCarPersonNum：乘车人数，返回阿拉伯数字

            时间规则：
            1. 根据今天日期解析相对日期表达，例如：今天、明天、后天、本周五、下周一、今天下午。
            2. 所有日期时间值必须使用 YYYY-MM-DD HH:mm:ss 格式。
            3. 只有“日期 + 明确时刻”同时具备时，才能输出 startTime 或 endTime。
            4. “下午四点”表示 16:00:00；“上午九点半”表示 09:30:00。
            5. 如果只有“明天下午、今晚、下周一上午”这类不含具体钟点的表达，不要补默认时间，直接省略对应时间字段，并在 respMessage 中提示用户补充具体时间。
            6. 如果只出现一个明确时间点，默认优先理解为 startTime，不要臆造 endTime。

            口语与修正规则：
            1. 忽略语气词、赘词、停顿词，例如：嗯、啊、那个、呃。
            2. 如果用户有自我修正，以最后一次明确表达为准。例如：“下午四点，不对，五点出发”，应取五点。
            3. 如果同一字段出现多个候选且无法确定，省略该字段，并在 respMessage 中说明需要澄清。

            respMessage 规则：
            1. 用简洁自然的中文说明本轮已识别出的内容。
            2. 如果仍缺少继续填表的重要信息，在 respMessage 中直接提示缺什么。
            3. 如果用户输入与派车申请无关，返回 updates=[]，并在 respMessage 中引导用户描述用车时间、出发地、目的地、事由等。

            输出示例：
            {{"respMessage":"已识别出出发地、目的地和出发时间，还缺联系人信息。","updates":[{{"fieldName":"endAddress","fieldValue":"北京"}},{{"fieldName":"startTime","fieldValue":"2026-04-09 16:00:00"}}]}}
            """
        ).strip()

        return [
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "taskKey": payload.taskKey,
                        "buttonKey": payload.buttonKey,
                        "transcript": transcript,
                        "formData": payload.formData,
                        "supportedFields": payload.supportedFields,
                        "fieldOptions": payload.fieldOptions,
                    },
                    ensure_ascii=False,
                ),
            },
        ]
