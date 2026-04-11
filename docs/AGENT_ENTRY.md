# 派车语音 Agent 入口

本文件是新 session 的唯一入口。

如果要恢复上下文，先只读本文件；只有在需要细节时，再按本文档给出的索引跳转到对应模块文档。

## 1. 项目一句话目标

为派车表单做一个语音辅助填写 MVP：

- 用户说中文
- 系统先做语音转文字
- 再抽取可写入的表单字段
- 最后由用户确认后写入表单

## 2. 当前 MVP 范围

当前范围已经锁定，只做：

- 表单状态：`TASK0`
- 操作：`HANDLE`
- 不处理：`FLAG_BB`
- ASR：FunASR
- 语义提取：DeepSeek
- 前端负责联动字段、缺失项提示、最终写回
- 用户确认后才允许写入表单

## 3. 当前真实链路

当前链路应按下面理解：

1. 前端通过 Web Audio 采集 PCM
2. 前端通过 `WS /ws/asr` 把音频流发给 Python 后端
3. 后端对接 FunASR，返回 `partial_transcript` 和 `final_transcript`
4. 前端停止录音后，将最终文本发给 `POST /api/agent/cleanup`
5. 后端先做规则清洗，再按条件调用本地 Ollama `gemma4:e4b` 做轻量 cleanup
6. 前端用 `cleanedTranscript` 替换当前文本，供用户继续确认、重置或提交
7. 用户点击 `Submit` 后，前端把 cleanup 后文本发给 `POST /api/agent/parse`
8. 后端基于 DeepSeek 返回：
   - `respMessage`
   - `updates`
   - `overwriteFields`
   - `rawTranscript`
   - `cleanedTranscript`
   - `cleanupMeta`
9. 前端生成一条会话记录，并弹出确认框
10. 用户确认后，前端把 `updates` 写回表单
11. 前端自己处理表单联动和缺失项提示

## 4. 当前已完成

已打通的部分：

- FunASR 流式识别链路可用
- 前端录音、停止、实时转写展示可用
- partial transcript 已做累计显示，不再直接覆写
- 末尾尾音丢失问题做过一轮缓解
- cleanup 接口已独立拆出
- parse 接口已接入 DeepSeek
- 前端确认框已接上
- 前端 `Reset / Submit` 当前文本交互已接上
- 前端右侧抽屉会话记录已接上，并已落地 `sessionStorage` 持久化与恢复
- cleanup 后文本会替换当前文本，并作为 parse 输入
- parse 成功后才会生成一条会话记录
- 后端 cleanup 已接入“规则清洗 + 可选 Ollama cleanup”链路
- Ollama cleanup 默认带 `keep_alive=10m`
- parse 响应继续包含 `rawTranscript / cleanedTranscript / cleanupMeta`
- 后端测试当前通过，最新验证结果为 `20 passed`
- 前端测试当前通过，最新验证结果为 `28 passed`
- 前端构建当前通过

## 5. 当前代码状态判断

### 已验证通过

- 后端测试当前通过：
  - `D:\work\AI\DispatchVehicle\agent\tests`
- 最新一次验证结果：
  - `20 passed`
- 前端测试当前通过：
  - `D:\work\AI\DispatchVehicle\web`
- 最新一次验证结果：
  - `28 passed`
- 前端构建当前通过：
  - `npm run build`

### 当前需要特别注意

- 旧文档里部分中文在当前 shell 输出下会乱码
- 这主要是显示问题，不代表文件一定不可用
- 如果文档描述和代码冲突，以代码现状为准
- `parse_service.py` 里的系统 prompt 当前仍是 `\uXXXX` 转义形式保存中文，需要后续再决定是否改回字面中文
- `VehicleDispatchForm.vue` 里仍有旧的 `handleVoiceStart / handleVoiceStop` 遗留代码

## 6. 当前技术决策

### 已确认

- 只做 `TASK0 + HANDLE`
- 使用对话框确认写入
- 支持分段录入
- 允许 AI 判断覆写
- 本地模型只用于“cleanup / 润色 final transcript”
- 本地模型不参与结构化字段提取
- cleanup 和 parse 是两个独立功能
- 结束录音后自动 cleanup，但不自动 parse
- `Submit` 时才调用 parse，且只提交 cleanup 后文本
- `Reset` 只清空当前文本，不清空会话历史
- 会话记录只在 parse 成功后生成
- 润色/识别结果要记录到当前 web session
- session 方案先用 `sessionStorage`

### 当前关于 Ollama 的真实状态

- 本机已安装 `ollama`
- 本机已有模型：
  - `gemma4:e4b`
- Python 后端代码里已经有 Ollama 接入点
- 当前 cleanup 只有满足以下条件才会真正调用 Ollama：
  - `OLLAMA_ENABLED=true`
  - `OLLAMA_MODEL` 已配置
  - transcript 长度达到阈值
- Ollama cleanup 请求默认会带：
  - `keep_alive=10m`

## 7. 启动方式

### FunASR

- FunASR 监听：`127.0.0.1:10095`
- 不要用 `run_server_2pass.sh` 作为容器入口
- 完整启动命令见 [CURRENT_STATUS.md](D:\work\AI\DispatchVehicle\docs\CURRENT_STATUS.md)

### Python 后端

```powershell
cd D:\work\AI\DispatchVehicle\agent
.\.venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8010 --reload
```

### 若要启用 Ollama 润色

在启动 Python 后端前设置：

```powershell
$env:OLLAMA_ENABLED="true"
$env:OLLAMA_MODEL="gemma4:e4b"
$env:OLLAMA_BASE_URL="http://127.0.0.1:11434"
$env:OLLAMA_TIMEOUT_MS="2000"
$env:OLLAMA_MIN_TRANSCRIPT_LENGTH="12"
$env:OLLAMA_KEEP_ALIVE="10m"
```

### 前端

在 `web` 目录正常启动 Vite dev server。

当前 dev proxy 已配置 `/agent-api -> http://127.0.0.1:8010`。

## 8. 当前重点文件

### 后端主线

- [app/main.py](D:\work\AI\DispatchVehicle\agent\app\main.py)
- [parse.py](D:\work\AI\DispatchVehicle\agent\app\api\parse.py)
- [parse_service.py](D:\work\AI\DispatchVehicle\agent\app\services\parse_service.py)
- [deepseek_client.py](D:\work\AI\DispatchVehicle\agent\app\services\deepseek_client.py)
- [transcript_cleanup.py](D:\work\AI\DispatchVehicle\agent\app\services\transcript_cleanup.py)
- [ollama_client.py](D:\work\AI\DispatchVehicle\agent\app\services\ollama_client.py)
- [asr_ws.py](D:\work\AI\DispatchVehicle\agent\app\api\asr_ws.py)
- [funasr_stream.py](D:\work\AI\DispatchVehicle\agent\app\services\funasr_stream.py)

### 前端主线

- [VehicleDispatchForm.vue](D:\work\AI\DispatchVehicle\web\src\views\VehicleDispatchForm.vue)
- [useVoiceAgent.js](D:\work\AI\DispatchVehicle\web\src\composables\useVoiceAgent.js)
- [VoiceRecorderPanel.vue](D:\work\AI\DispatchVehicle\web\src\components\VoiceRecorderPanel.vue)
- [VoiceConversationDrawer.vue](D:\work\AI\DispatchVehicle\web\src\components\VoiceConversationDrawer.vue)
- [asrSocket.js](D:\work\AI\DispatchVehicle\web\src\api\asrSocket.js)
- [agentApi.js](D:\work\AI\DispatchVehicle\web\src\api\agentApi.js)
- [pcmAudio.js](D:\work\AI\DispatchVehicle\web\src\utils\pcmAudio.js)
- [voiceConversationSession.js](D:\work\AI\DispatchVehicle\web\src\utils\voiceConversationSession.js)

### 核心测试

- [test_cleanup_api.py](D:\work\AI\DispatchVehicle\agent\tests\test_cleanup_api.py)
- [test_parse_service.py](D:\work\AI\DispatchVehicle\agent\tests\test_parse_service.py)
- [test_transcript_cleanup.py](D:\work\AI\DispatchVehicle\agent\tests\test_transcript_cleanup.py)
- [test_ollama_client.py](D:\work\AI\DispatchVehicle\agent\tests\test_ollama_client.py)
- [useVoiceAgent.test.js](D:\work\AI\DispatchVehicle\web\src\composables\__tests__\useVoiceAgent.test.js)
- [VehicleDispatchForm.test.js](D:\work\AI\DispatchVehicle\web\src\views\__tests__\VehicleDispatchForm.test.js)

## 9. 已知问题与风险

### 业务体验侧

- 识别能用，但整体顺滑度还需要继续磨
- 多轮补录体验还可以继续优化
- 确认框表达还可以更贴近真实业务使用

### 代码侧

- `VehicleDispatchForm.vue` 里仍有旧的 `handleVoiceStart / handleVoiceStop` 遗留代码
- 某些文档/终端显示存在中文乱码
- cleanup / parse 新链路还未完成实机联调验证

### 模型侧

- DeepSeek 仍是结构化提取主模型
- Ollama 只应该做 final transcript 轻量 cleanup / 润色
- 不应让 Ollama 直接负责字段抽取
- `parse_service.py` prompt 的中文写法当前偏实现规避，不是产品方案的一部分

## 10. 下一步优先级

建议按这个顺序继续：

1. 做一次真实端到端：
   - 说话
   - ASR
   - transcript cleanup
   - Submit
   - DeepSeek parse
   - confirm
   - write back
2. 验证 Ollama cleanup 在真实链路中是否按预期启用并保热
3. 清理 `VehicleDispatchForm.vue` 的遗留录音逻辑
4. 视编码策略决定是否把 `parse_service.py` prompt 改回字面中文
5. 再继续打磨业务顺滑度

## 11. 详细文档索引

### 项目方案总说明

- [agent.md](D:\work\AI\DispatchVehicle\agent.md)

### 当前状态与启动命令

- [CURRENT_STATUS.md](D:\work\AI\DispatchVehicle\docs\CURRENT_STATUS.md)

### 已实现说明

- [2026-04-09-voice-history-cleanup-implemented.md](D:\work\AI\DispatchVehicle\docs\2026-04-09-voice-history-cleanup-implemented.md)

### 当前 cleanup / submit 流设计

- [2026-04-09-voice-cleanup-submit-flow-design.md](D:\work\AI\DispatchVehicle\docs\superpowers\specs\2026-04-09-voice-cleanup-submit-flow-design.md)

### 历史实现计划

- [2026-04-09-voice-cleanup-submit-flow.md](D:\work\AI\DispatchVehicle\docs\superpowers\plans\2026-04-09-voice-cleanup-submit-flow.md)
  - 说明：这是当前 cleanup / submit 链路的实现计划，主要用于追溯拆分，不作为当前状态依据

### 历史进度快照

- [2026-04-08-voice-agent-progress.md](D:\work\AI\DispatchVehicle\docs\2026-04-08-voice-agent-progress.md)
  - 说明：这是历史进度快照，不作为当前状态依据

## 12. 新 Session 建议开场语

建议在新 session 里直接这样说：

```text
先读 D:\work\AI\DispatchVehicle\docs\AGENT_ENTRY.md ，按其中索引恢复上下文，然后继续开发。
```
