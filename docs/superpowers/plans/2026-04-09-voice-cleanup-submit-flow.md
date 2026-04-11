# Voice Cleanup And Submit Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split transcript cleanup and semantic parse into two explicit steps so that ending recording performs cleanup, submit parses the cleaned text, and parse no longer re-cleans the transcript.

**Architecture:** Frontend keeps separate live and current transcript states, calls a dedicated cleanup endpoint after recording ends, and only calls parse from the explicit submit action. Backend exposes cleanup as its own API/service path, strengthens the Ollama prompt and keep-alive contract, and simplifies parse so it consumes already-cleaned transcript input.

**Tech Stack:** Vue 3, Element Plus, Vitest, FastAPI, Pydantic, httpx, Ollama, DeepSeek

---

### Task 1: Add backend cleanup API contract

**Files:**
- Modify: `D:\work\AI\DispatchVehicle\agent\app\schemas\agent.py`
- Modify: `D:\work\AI\DispatchVehicle\agent\app\api\parse.py`
- Modify: `D:\work\AI\DispatchVehicle\agent\app\main.py`
- Test: `D:\work\AI\DispatchVehicle\agent\tests\test_cleanup_api.py`

- [ ] **Step 1: Write the failing test**

```python
from fastapi.testclient import TestClient

from app.main import create_app


def test_cleanup_endpoint_returns_cleaned_text():
    app = create_app()

    class FakeCleanupService:
        async def cleanup(self, transcript: str):
            return {
                "rawTranscript": transcript,
                "cleanedTranscript": "我明天中午十二点返回。",
                "cleanupMeta": {
                    "ruleApplied": True,
                    "ollamaAttempted": True,
                    "ollamaUsed": True,
                    "fallbackToRuleCleaned": False,
                },
            }

    app.state.cleanup_service = FakeCleanupService()
    client = TestClient(app)

    response = client.post("/api/agent/cleanup", json={"transcript": "那个 我明天中午十二点返回"})

    assert response.status_code == 200
    assert response.json()["cleanedTranscript"] == "我明天中午十二点返回。"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `.\.venv\Scripts\python -m pytest agent\tests\test_cleanup_api.py -v`
Expected: FAIL because `/api/agent/cleanup` or schema does not exist yet

- [ ] **Step 3: Write minimal implementation**

```python
class CleanupRequest(BaseModel):
    transcript: str = Field(min_length=1)


class CleanupResponse(BaseModel):
    rawTranscript: str = ""
    cleanedTranscript: str = ""
    cleanupMeta: CleanupMeta = Field(default_factory=CleanupMeta)
```

```python
@router.post("/api/agent/cleanup", response_model=CleanupResponse)
async def cleanup_agent(payload: CleanupRequest, request: Request) -> CleanupResponse:
    service = request.app.state.cleanup_service
    result = await service.cleanup(payload.transcript)
    return CleanupResponse.model_validate(result)
```

```python
app.state.cleanup_service = TranscriptCleanupService(ollama_client=OllamaClient())
app.state.parse_service = ParseService(llm_client=DeepSeekClient())
```

- [ ] **Step 4: Run test to verify it passes**

Run: `.\.venv\Scripts\python -m pytest agent\tests\test_cleanup_api.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add agent/app/schemas/agent.py agent/app/api/parse.py agent/app/main.py agent/tests/test_cleanup_api.py
git commit -m "feat: add cleanup api endpoint"
```

### Task 2: Make parse consume cleaned transcript without re-cleaning

**Files:**
- Modify: `D:\work\AI\DispatchVehicle\agent\app\services\parse_service.py`
- Modify: `D:\work\AI\DispatchVehicle\agent\tests\test_parse_service.py`

- [ ] **Step 1: Write the failing test**

```python
@pytest.mark.asyncio
async def test_parse_service_does_not_call_cleanup_service():
    cleanup_service = FakeCleanupService(
        {
            "rawTranscript": "不应被调用",
            "cleanedTranscript": "不应被调用",
            "cleanupMeta": {},
        }
    )
    client = FakeDeepSeekClient(
        {
            "respMessage": "已识别出出发地。",
            "updates": [{"fieldName": "startAddress", "fieldValue": "南山"}],
        }
    )
    service = ParseService(llm_client=client, cleanup_service=cleanup_service)
    payload = ParseRequest.model_validate(
        {
            "taskKey": "UserTask_0",
            "buttonKey": "HANDLE",
            "transcript": "从南山出发。",
            "formData": {},
            "supportedFields": ["startAddress"],
            "fieldOptions": {},
        }
    )

    result = await service.parse(payload)

    assert cleanup_service.calls == []
    assert result["rawTranscript"] == "从南山出发。"
    assert result["cleanedTranscript"] == "从南山出发。"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `.\.venv\Scripts\python -m pytest agent\tests\test_parse_service.py -k does_not_call_cleanup_service -v`
Expected: FAIL because `ParseService.parse()` currently always calls cleanup

- [ ] **Step 3: Write minimal implementation**

```python
async def parse(self, payload: ParseRequest) -> dict:
    transcript = payload.transcript.strip()
    raw = await self.llm_client.complete_json(self._build_messages(payload, transcript))
    parsed = json.loads(raw) if isinstance(raw, str) else raw

    return {
        "respMessage": parsed.get("respMessage", "已完成本轮识别。"),
        "updates": updates,
        "overwriteFields": overwrite_fields,
        "confirmRequired": True,
        "rawTranscript": transcript,
        "cleanedTranscript": transcript,
        "cleanupMeta": {
            "ruleApplied": False,
            "ollamaAttempted": False,
            "ollamaUsed": False,
            "fallbackToRuleCleaned": False,
        },
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `.\.venv\Scripts\python -m pytest agent\tests\test_parse_service.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add agent/app/services/parse_service.py agent/tests/test_parse_service.py
git commit -m "refactor: parse cleaned transcript directly"
```

### Task 3: Strengthen Ollama cleanup prompt and keep-alive

**Files:**
- Modify: `D:\work\AI\DispatchVehicle\agent\app\services\ollama_client.py`
- Modify: `D:\work\AI\DispatchVehicle\agent\tests\test_ollama_client.py`

- [ ] **Step 1: Write the failing test**

```python
@pytest.mark.asyncio
async def test_cleanup_transcript_posts_keep_alive_and_strict_preservation_prompt(monkeypatch):
    captured = {}

    class FakeResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {"response": "我明天中午十二点返回。"}

    class FakeAsyncClient:
        def __init__(self, timeout):
            captured["timeout"] = timeout

        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            return False

        async def post(self, url, json):
            captured["json"] = json
            return FakeResponse()
```

Assertions:

```python
assert captured["json"]["keep_alive"] == "10m"
assert "不要改变人名" in captured["json"]["prompt"]
assert "不要改变电话号码" in captured["json"]["prompt"]
assert "只返回清洗后的文本本身" in captured["json"]["prompt"]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `.\.venv\Scripts\python -m pytest agent\tests\test_ollama_client.py -v`
Expected: FAIL because `keep_alive` and stricter prompt constraints are missing

- [ ] **Step 3: Write minimal implementation**

```python
class OllamaClient:
    def __init__(..., keep_alive: str | None = None):
        self.keep_alive = keep_alive or os.getenv("OLLAMA_KEEP_ALIVE", "10m")
```

```python
json={
    "model": self.model,
    "stream": False,
    "keep_alive": self.keep_alive,
    "options": {"temperature": 0},
    "prompt": prompt,
}
```

Prompt additions:

```text
不要改变日期、时间、人名、地名、人数、数量、电话号码。
不要补充原文没有的信息。
如果不确定，保留原文。
只返回清洗后的文本本身。
```

- [ ] **Step 4: Run test to verify it passes**

Run: `.\.venv\Scripts\python -m pytest agent\tests\test_ollama_client.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add agent/app/services/ollama_client.py agent/tests/test_ollama_client.py
git commit -m "feat: keep ollama cleanup warm"
```

### Task 4: Add frontend cleanup API client and transcript state split

**Files:**
- Modify: `D:\work\AI\DispatchVehicle\web\src\api\agentApi.js`
- Modify: `D:\work\AI\DispatchVehicle\web\src\composables\useVoiceAgent.js`
- Test: `D:\work\AI\DispatchVehicle\web\src\composables\__tests__\useVoiceAgent.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
it('runs cleanup after final transcript and submits the cleaned transcript later', async () => {
  const cleanupTranscript = vi.fn().mockResolvedValue({
    rawTranscript: '那个 我明天中午十二点返回',
    cleanedTranscript: '我明天中午十二点返回。',
    cleanupMeta: {
      ruleApplied: true,
      ollamaAttempted: true,
      ollamaUsed: true,
      fallbackToRuleCleaned: false
    }
  })
  const parseTranscript = vi.fn().mockResolvedValue({
    respMessage: '已识别出返回时间。',
    updates: [{ fieldName: 'endTime', fieldValue: '2026-04-10 12:00:00' }],
    overwriteFields: [],
    confirmRequired: true
  })
```

Assertions:

```javascript
expect(cleanupTranscript).toHaveBeenCalledTimes(1)
expect(voiceAgent.currentTranscript.value).toBe('我明天中午十二点返回。')
await voiceAgent.submitCurrentTranscript({ endTime: '' })
expect(parseTranscript.mock.calls[0][0].transcript).toBe('我明天中午十二点返回。')
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/composables/__tests__/useVoiceAgent.test.js`
Expected: FAIL because there is no cleanup action or current transcript submit path yet

- [ ] **Step 3: Write minimal implementation**

```javascript
export async function cleanupTranscript(payload) {
  const response = await fetch('/agent-api/api/agent/cleanup', {...})
  return response.json()
}
```

```javascript
const liveTranscript = ref('')
const currentTranscript = ref('')
const cleanupResult = ref(null)

async function handleFinalTranscript(transcript) {
  const resolvedTranscript = resolveTranscriptForParse(transcript, liveTranscript.value)
  if (!resolvedTranscript) {
    currentTranscript.value = ''
    return
  }

  cleanupResult.value = await cleanupTranscript({ transcript: resolvedTranscript })
  currentTranscript.value = cleanupResult.value.cleanedTranscript || resolvedTranscript
  liveTranscript.value = ''
}

async function submitCurrentTranscript(formData) {
  const transcript = currentTranscript.value.trim()
  if (!transcript) {
    return null
  }

  const payload = buildAgentParsePayload({ transcript, formData })
  agentResult.value = await parseTranscript(payload)
  return agentResult.value
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/composables/__tests__/useVoiceAgent.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/src/api/agentApi.js web/src/composables/useVoiceAgent.js web/src/composables/__tests__/useVoiceAgent.test.js
git commit -m "feat: split cleanup from parse in voice agent"
```

### Task 5: Update frontend panel controls to Reset and Submit

**Files:**
- Modify: `D:\work\AI\DispatchVehicle\web\src\components\VoiceRecorderPanel.vue`
- Modify: `D:\work\AI\DispatchVehicle\web\src\views\VehicleDispatchForm.vue`
- Test: `D:\work\AI\DispatchVehicle\web\src\views\__tests__\VehicleDispatchForm.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
it('resets current transcript and blocks submit when cleaned text is empty', async () => {
  voiceAgentState.currentTranscript.value = '   '
  const wrapper = mountForm()

  await wrapper.get('[data-testid="submit-current-transcript"]').trigger('click')

  expect(voiceAgentState.submitCurrentTranscript).not.toHaveBeenCalled()
  expect(ElMessage.warning).toHaveBeenCalledWith('当前没有可提交的语音文字')
})
```

Second assertion set:

```javascript
await wrapper.get('[data-testid="reset-current-transcript"]').trigger('click')
expect(voiceAgentState.resetCurrentTranscript).toHaveBeenCalled()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/views/__tests__/VehicleDispatchForm.test.js`
Expected: FAIL because reset/submit buttons and handlers do not exist

- [ ] **Step 3: Write minimal implementation**

```vue
<el-button data-testid="reset-current-transcript" @click="emit('reset-current')">Reset</el-button>
<el-button data-testid="submit-current-transcript" type="primary" @click="emit('submit-current')">Submit</el-button>
```

```javascript
async function handleSubmitCurrentTranscript() {
  if (!currentTranscript.value.trim()) {
    ElMessage.warning('当前没有可提交的语音文字')
    return
  }

  await submitCurrentTranscript({ ...formData })
}

function handleResetCurrentTranscript() {
  resetCurrentTranscript()
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/views/__tests__/VehicleDispatchForm.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/src/components/VoiceRecorderPanel.vue web/src/views/VehicleDispatchForm.vue web/src/views/__tests__/VehicleDispatchForm.test.js
git commit -m "feat: add reset and submit transcript actions"
```

### Task 6: Align history creation with submit success only

**Files:**
- Modify: `D:\work\AI\DispatchVehicle\web\src\views\VehicleDispatchForm.vue`
- Modify: `D:\work\AI\DispatchVehicle\web\src\components\VoiceConversationDrawer.vue`
- Modify: `D:\work\AI\DispatchVehicle\web\src\views\__tests__\VehicleDispatchForm.test.js`

- [ ] **Step 1: Write the failing test**

```javascript
it('creates history only after submit parse succeeds', async () => {
  voiceAgentState.currentTranscript.value = '我明天中午十二点返回。'
  voiceAgentState.agentResult.value = null
  const wrapper = mountForm()
  const storageKey = buildVoiceConversationStorageKey({
    taskKey: 'UserTask_0',
    buttonKey: 'HANDLE',
    formNum: 'VD-2026-AUTO-001'
  })

  expect(JSON.parse(window.sessionStorage.getItem(storageKey)).rounds).toHaveLength(0)

  await wrapper.get('[data-testid="submit-current-transcript"]').trigger('click')

  expect(JSON.parse(window.sessionStorage.getItem(storageKey)).rounds).toHaveLength(1)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/views/__tests__/VehicleDispatchForm.test.js`
Expected: FAIL because history is currently driven by transcript arrival instead of submit success

- [ ] **Step 3: Write minimal implementation**

```javascript
watch(finalTranscript, ...) // remove history creation from here

async function handleSubmitCurrentTranscript() {
  const result = await submitCurrentTranscript({ ...formData })
  if (!result) {
    return
  }

  appendVoiceRound({
    userTranscript: currentTranscript.value,
    rawTranscript: cleanupResult.value?.rawTranscript || currentTranscript.value,
    cleanedTranscript: cleanupResult.value?.cleanedTranscript || currentTranscript.value,
    ...
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/views/__tests__/VehicleDispatchForm.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/src/views/VehicleDispatchForm.vue web/src/components/VoiceConversationDrawer.vue web/src/views/__tests__/VehicleDispatchForm.test.js
git commit -m "refactor: create conversation history on submit success"
```

### Task 7: Verify end-to-end affected suites

**Files:**
- Modify: `D:\work\AI\DispatchVehicle\agent\tests\test_parse_service.py`
- Modify: `D:\work\AI\DispatchVehicle\agent\tests\test_ollama_client.py`
- Modify: `D:\work\AI\DispatchVehicle\web\src\composables\__tests__\useVoiceAgent.test.js`
- Modify: `D:\work\AI\DispatchVehicle\web\src\views\__tests__\VehicleDispatchForm.test.js`

- [ ] **Step 1: Run backend targeted tests**

Run: `.\.venv\Scripts\python -m pytest agent\tests\test_cleanup_api.py agent\tests\test_parse_service.py agent\tests\test_ollama_client.py -v`
Expected: PASS

- [ ] **Step 2: Run frontend tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 3: Run frontend build**

Run: `npm run build`
Expected: PASS with no build errors; existing chunk-size warnings may remain

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add cleanup-first voice submit flow"
```
