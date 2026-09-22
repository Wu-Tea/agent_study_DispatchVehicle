# 模块与代码导航

核对日期：2026-09-22。以下根据当前代码整理；历史方案中的建议不代表已实现功能。

## 目录职责

| 目录 / 文件 | 职责 | 运行关系 |
| --- | --- | --- |
| `agent/` | FastAPI 后端：ASR 转接、文本清洗、字段提取 | 独立 Python 服务，默认端口 `8010` |
| `web/` | Vue 3 派车表单 Demo：录音、确认、回填、联动、会话记录 | 独立 Vite 项目，通过 `/agent-api` 代理访问后端 |
| `vehicleDispatch/` | 原业务 PC / 移动端页面、初始化链、草稿、校验和联动代码 | 引用了外部业务工程模块；不是当前可独立运行的 Demo |
| `funasr-runtime-resources/` | 本地 FunASR 模型资源 | 被 Git 忽略，需自行准备 |
| `docs/` | 当前状态、模块导航、设计与历史资料 | 资料索引见 [README](README.md) |
| `agent.md` | MVP 原始方案与字段边界 | 当前交互以实现及 cleanup / submit 设计为准 |

## 后端模块

路径相对于 `agent/`。

| 模块 | 主要文件 | 职责 |
| --- | --- | --- |
| 启动与组装 | `main.py`、`app/main.py` | Uvicorn 开发入口、FastAPI 应用、服务实例与路由注册 |
| API | `app/api/parse.py`、`app/api/asr_ws.py` | cleanup / parse HTTP 接口、ASR WebSocket 事件转发 |
| 数据契约 | `app/schemas/agent.py` | 请求、字段更新、覆写信息、清洗元数据的 Pydantic 模型 |
| ASR 适配 | `app/services/funasr_stream.py` | 与 FunASR 建立流式连接，处理音频和转写文本 |
| 文本清洗 | `app/services/transcript_cleanup.py`、`ollama_client.py` | 规则清洗；满足配置条件时调用 Ollama 润色 |
| 字段提取 | `app/services/parse_service.py`、`deepseek_client.py` | 消费清洗后的文本，调用 DeepSeek，归一化字段和覆写信息 |
| 测试 | `tests/` | 健康检查、API、客户端、清洗、字段解析、ASR 行为 |

| 接口 | 用途 |
| --- | --- |
| `GET /healthz` | 服务健康检查 |
| `WS /ws/asr` | 接收 `start / audio / stop`，返回 partial / final transcript |
| `POST /api/agent/cleanup` | 返回清洗后的文本和清洗元数据 |
| `POST /api/agent/parse` | 返回字段更新、覆写提示、确认要求和文本元数据 |

## 前端模块

路径相对于 `web/src/`。

| 模块 | 主要文件 | 职责 |
| --- | --- | --- |
| 应用与表单 | `App.vue`、`views/VehicleDispatchForm.vue` | 组装页面、录音采集、确认回填与表单联动 |
| 语音流程 | `composables/useVoiceAgent.js` | 转写累计、自动 cleanup、手动 Submit 解析、Reset 当前文本 |
| 通信 | `api/agentApi.js`、`api/asrSocket.js` | HTTP 请求与 ASR WebSocket 客户端 |
| 交互组件 | `components/VoiceRecorderPanel.vue`、`AgentConfirmDialog.vue`、`VoiceConversationDrawer.vue` | 录音面板、写入确认、历史会话抽屉 |
| 音频处理 | `utils/pcmAudio.js` | 重采样、PCM 编码、音频分片转换 |
| 字段与草稿 | `utils/agentPayload.js`、`agentFieldMeta.js`、`agentDraft.js`、`task0MvpMissingFields.js` | 构造请求、限制 MVP 字段、覆写预览、缺失项提示 |
| 会话存储 | `utils/voiceConversationSession.js` | 当前 tab 的 `sessionStorage` 保存与恢复 |
| 业务配置 | `config/formFieldConfig.js`、`enumData.js`、`linkageConfig.js`、`rulesConfig.js`、`TaskParamFactory.js` | 可见性 / 必填 / 禁用、枚举、联动、校验、任务参数 |
| 测试 | 各模块的 `__tests__/` | API、语音流程、组件、表单和工具函数 |

## 当前数据流与边界

```text
麦克风 → PCM → WebSocket → FastAPI → FunASR
                      ← partial / final transcript
final transcript → cleanup（规则 + 可选 Ollama）→ 当前文本
用户点击 Submit → parse（DeepSeek）→ 会话记录 + 确认框
用户确认 → 表单回填 → 前端联动与缺失项提示
```

- MVP 仅覆盖 `TASK0 + HANDLE`，不处理 `FLAG_BB`。
- 直接支持 `startAddress`、`endAddress`、`startTime`、`endTime`、`useCarMatter`、`contacts`、`useCarPersonNum`。
- 停止录音后只自动清洗；字段提取由 Submit 触发，写入由用户确认触发。
- Ollama 只负责轻量文本润色；DeepSeek 负责结构化字段提取。
- 联动字段、必填判断、最终回填由前端负责；当前没有正式业务提交和后端落库。
- `vehicleDispatch/` 保留原业务参考代码；日常 MVP 修改应从 `web/` 与 `agent/` 的对应模块进入。

## 维护入口

- 修改录音、清洗、Submit 行为：先看 `useVoiceAgent.js` 与对应测试，再看表单页面。
- 修改字段提取：先看 `parse_service.py`、请求模型及前端 `agentPayload.js` / `agentFieldMeta.js`。
- 修改联动或必填规则：看 `web/src/config/` 和 `task0MvpMissingFields.js`，避免在模型服务重复实现。
- 修改 ASR：看 `asrSocket.js`、`asr_ws.py` 与 `funasr_stream.py`。
- 修改启动端口：同步核对 `agent/main.py`、`web/vite.config.js` 和根 README。

启动命令见 [根 README](../README.md)，验证记录及未完成项见 [当前状态](CURRENT_STATUS.md)。
