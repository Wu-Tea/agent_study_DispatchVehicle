# 对话记录与 Cleanup 已实现说明

更新时间：2026-04-09

## 1. 本次已实现范围

本次已完成两块能力：

- 前端对话记录持久化与展示
- 录音结束后 cleanup、提交时 parse 的拆分链路

## 2. 当前真实交互

当前 Task0 语音交互应按下面理解：

1. 用户点击 `开始录音`
2. 前端实时展示 ASR 累积文本
3. 用户点击 `结束录音`
4. 前端将最终文本发给 `POST /api/agent/cleanup`
5. 后端先做规则清洗，再按条件调用 Ollama `gemma4:e4b`
6. 前端用 `cleanedTranscript` 替换当前文本
7. 用户可点击：
   - `Reset`：只清空当前文本
   - `Submit`：将 cleanup 后文本发给 `POST /api/agent/parse`
8. parse 成功后生成一条对话记录
9. 前端弹确认框
10. 用户确认后写回表单

## 3. 前端已实现内容

### 3.1 会话记录

- 已新增右侧抽屉会话记录面板
- 会话记录采用聊天式布局：
  - 右侧显示用户提交文本
  - 左侧显示 AI 响应、识别结果、缺失内容、状态
- 已落地 `sessionStorage` 持久化
- 同一 tab 刷新后可恢复历史记录
- 会话记录只在 parse 成功后生成

### 3.2 当前文本区

- 已支持 `开始录音 / 结束录音`
- 已支持 `Reset / Submit`
- `Reset` 只清空当前文本，不清空历史
- `Submit` 会先判断空字符串，空文本不触发 parse

## 4. 后端已实现内容

### 4.1 Cleanup

- 已新增独立接口：`POST /api/agent/cleanup`
- cleanup 包含两层：
  - 本地规则清洗
  - 可选 Ollama cleanup
- Ollama 默认模型：`gemma4:e4b`
- 默认保热：`keep_alive=10m`

### 4.2 Parse

- `POST /api/agent/parse` 仍负责结构化提取
- parse 当前直接消费 cleanup 后文本
- `ParseService` 不再自动再次 cleanup
- DeepSeek 仍是结构化提取主模型

## 5. Prompt 约束

当前 Ollama cleanup prompt 已明确约束：

- 只删除语气词
- 只补必要标点
- 只合并明显重复片段
- 不得改日期、时间、人名、地名、人数、数量、电话号码
- 不得补充原文没有的信息
- 不确定时保留原文
- 只返回 cleanup 后文本本身

## 6. 关键文件

### 后端

- [parse.py](D:\work\AI\DispatchVehicle\agent\app\api\parse.py)
- [parse_service.py](D:\work\AI\DispatchVehicle\agent\app\services\parse_service.py)
- [transcript_cleanup.py](D:\work\AI\DispatchVehicle\agent\app\services\transcript_cleanup.py)
- [ollama_client.py](D:\work\AI\DispatchVehicle\agent\app\services\ollama_client.py)

### 前端

- [VehicleDispatchForm.vue](D:\work\AI\DispatchVehicle\web\src\views\VehicleDispatchForm.vue)
- [useVoiceAgent.js](D:\work\AI\DispatchVehicle\web\src\composables\useVoiceAgent.js)
- [VoiceRecorderPanel.vue](D:\work\AI\DispatchVehicle\web\src\components\VoiceRecorderPanel.vue)
- [VoiceConversationDrawer.vue](D:\work\AI\DispatchVehicle\web\src\components\VoiceConversationDrawer.vue)
- [voiceConversationSession.js](D:\work\AI\DispatchVehicle\web\src\utils\voiceConversationSession.js)

## 7. 当前验证结果

- 后端测试：`20 passed`
- 前端测试：`28 passed`
- 前端构建：通过

## 8. 当前仍未完成

- 尚未做完整实机端到端联调
- `VehicleDispatchForm.vue` 里仍有旧录音逻辑遗留
- cleanup 实际效果还需要结合真实语音样本继续校准

## 9. 文档清理结果

本轮已将以下文档视为过时实现草稿并删除：

- `docs/superpowers/specs/2026-04-09-transcript-cleanup-session-design.md`
- `docs/superpowers/plans/2026-04-09-transcript-cleanup-session.md`
- `docs/superpowers/plans/2026-04-08-voice-agent-mvp.md`

当前建议优先查看的文档为：

- `docs/AGENT_ENTRY.md`
- `docs/CURRENT_STATUS.md`
- 本文档
