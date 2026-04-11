# DispatchVehicle

派车语音辅助填写 MVP。

当前目标是跑通一条最小可用链路：

- 用户说中文
- FunASR 做流式语音转文字
- Python 后端先做 transcript cleanup，再用 DeepSeek 做结构化字段提取
- 前端展示确认结果
- 用户确认后写回派车表单

当前 MVP 范围固定为 `TASK0 + HANDLE`，不处理 `FLAG_BB`。

## 项目结构

```text
DispatchVehicle/
├─ agent/                  Python 后端，负责 ASR websocket 接入、cleanup、parse
├─ web/                    Vue 3 + Vite 前端 Demo
├─ vehicleDispatch/        原表单相关配置和页面文件
├─ docs/                   当前状态、设计文档、历史说明
└─ funasr-runtime-resources/  本地 FunASR 模型目录（未提交到 Git）
```

## 技术栈

### ASR

- FunASR Runtime WebSocket Server
- Docker 运行
- 默认监听：`ws://127.0.0.1:10095`

### Python 后端

- Python `>= 3.11`
- FastAPI
- Uvicorn
- Pydantic v2
- httpx
- websockets

### Web 前端

- Node.js
- Vue 3
- Vite
- Element Plus
- Vitest

### 模型

- 结构化提取：DeepSeek
- 可选 transcript cleanup：Ollama `gemma4:e4b`

## 依赖准备

### 1. ASR 依赖

需要本地准备：

- Docker
- FunASR 运行镜像
- FunASR 模型目录

仓库里的 `.gitignore` 已排除 `funasr-runtime-resources/`，所以模型资源不会随代码一起提交。默认目录约定是：

```text
D:\work\AI\DispatchVehicle\funasr-runtime-resources\models
```

### 2. Python 后端依赖

在 PowerShell 中执行：

```powershell
cd D:\work\AI\DispatchVehicle\agent
python -m venv .venv
.\.venv\Scripts\python -m pip install --upgrade pip
.\.venv\Scripts\python -m pip install -e ".[dev]"
```

当前 `agent/pyproject.toml` 中声明的核心依赖：

- `fastapi>=0.115,<1.0`
- `uvicorn[standard]>=0.30,<1.0`
- `pydantic>=2.8,<3.0`
- `httpx>=0.27,<1.0`
- `websockets>=12,<13`

测试依赖：

- `pytest>=8.2,<9.0`
- `pytest-asyncio>=0.23,<1.0`

### 3. Web 前端依赖

在 PowerShell 中执行：

```powershell
cd D:\work\AI\DispatchVehicle\web
npm install
```

当前前端核心依赖：

- `vue`
- `element-plus`

当前前端开发依赖：

- `vite`
- `@vitejs/plugin-vue`
- `vitest`
- `@vue/test-utils`
- `jsdom`

## 环境变量

### DeepSeek

后端 parse 依赖 DeepSeek。建议在启动 Python 后端前设置：

```powershell
$env:DEEPSEEK_API_KEY="your-api-key"
$env:DEEPSEEK_BASE_URL="https://api.deepseek.com"
$env:DEEPSEEK_MODEL="deepseek-chat"
$env:DEEPSEEK_MAX_TOKENS="800"
```

如果不显式设置，代码里仍有默认值/默认地址，但分享给同事时不建议依赖本地默认配置。

### Ollama 可选 cleanup

如果要启用 transcript cleanup 的本地润色，再设置：

```powershell
$env:OLLAMA_ENABLED="true"
$env:OLLAMA_MODEL="gemma4:e4b"
$env:OLLAMA_BASE_URL="http://127.0.0.1:11434"
$env:OLLAMA_TIMEOUT_MS="2000"
$env:OLLAMA_MIN_TRANSCRIPT_LENGTH="12"
$env:OLLAMA_KEEP_ALIVE="10m"
```

本地模型只用于 final transcript 的轻量 cleanup，不参与结构化字段提取。

## 启动顺序

建议按下面顺序启动。

### 1. 启动 FunASR

```powershell
docker run --rm -it `
  --name funasr-online `
  -p 10095:10095 `
  -v "D:\work\AI\DispatchVehicle\funasr-runtime-resources\models:/workspace/models" `
  registry.cn-hangzhou.aliyuncs.com/funasr_repo/funasr:funasr-runtime-sdk-online-cpu-0.1.13 `
  /bin/bash -lc "/workspace/FunASR/runtime/websocket/build/bin/funasr-wss-server-2pass --download-model-dir /workspace/models --vad-dir damo/speech_fsmn_vad_zh-cn-16k-common-onnx --model-dir damo/speech_paraformer-large-vad-punc_asr_nat-zh-cn-16k-common-vocab8404-onnx --online-model-dir damo/speech_paraformer-large_asr_nat-zh-cn-16k-common-vocab8404-online-onnx --punc-dir damo/punc_ct-transformer_zh-cn-common-vad_realtime-vocab272727-onnx --lm-dir damo/speech_ngram_lm_zh-cn-ai-wesp-fst --itn-dir thuduj12/fst_itn_zh --certfile 0"
```

注意：

- 不要用 `run_server_2pass.sh` 作为容器入口
- 这个脚本会把服务放到后台，容器会直接退出

### 2. 启动 Python 后端

```powershell
cd D:\work\AI\DispatchVehicle\agent
.\.venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8010 --reload
```

启动后默认地址：

- HTTP：`http://127.0.0.1:8010`
- ASR websocket：`ws://127.0.0.1:8010/ws/asr`

### 3. 启动 Web 前端

```powershell
cd D:\work\AI\DispatchVehicle\web
npm run dev
```

当前前端通过 Vite dev proxy 把请求转发到 Python 后端：

- `/agent-api -> http://127.0.0.1:8010`
- `/agent-api/ws/asr -> ws://127.0.0.1:8010/ws/asr`

## 可选：预热 Ollama

如果本机已经安装 Ollama 并拉好了 `gemma4:e4b`，可以先预热一次：

```powershell
ollama run gemma4:e4b "请只回复 ok"
```

## 当前链路说明

当前真实链路是：

1. 前端采集 PCM
2. 前端通过 websocket 把音频流发给后端
3. 后端对接 FunASR，返回 `partial_transcript` 和 `final_transcript`
4. 结束录音后，前端调用 `POST /api/agent/cleanup`
5. 后端先做规则清洗，再按条件调用 Ollama 做轻量 cleanup
6. 前端用 `cleanedTranscript` 替换当前文本
7. 用户点击 `Submit` 后，前端再调用 `POST /api/agent/parse`
8. 后端调用 DeepSeek 返回 `respMessage / updates / overwriteFields / rawTranscript / cleanedTranscript / cleanupMeta`
9. 前端生成会话记录并弹确认框
10. 用户确认后写回表单

## 常用命令

### 后端测试

```powershell
cd D:\work\AI\DispatchVehicle\agent
.\.venv\Scripts\python -m pytest -q
```

### 前端测试

```powershell
cd D:\work\AI\DispatchVehicle\web
npm test
```

### 前端构建

```powershell
cd D:\work\AI\DispatchVehicle\web
npm run build
```

## 当前验证状态

最近一次本地验证结果：

- 后端测试：`21 passed`
- 前端测试：`28 passed`
- 前端构建：通过

## 已知注意事项

- `funasr-runtime-resources/` 没有提交到仓库，需要各自准备
- `parse` 依赖 DeepSeek，可选的 cleanup 依赖 Ollama
- `VehicleDispatchForm.vue` 里还有旧录音逻辑遗留，主链路目前仍可正常工作
- 如果文档和代码冲突，以代码现状为准

## 进一步阅读

- [入口文档](./docs/AGENT_ENTRY.md)
- [当前状态](./docs/CURRENT_STATUS.md)
- [Cleanup / Submit 设计](./docs/superpowers/specs/2026-04-09-voice-cleanup-submit-flow-design.md)
