# 当前状态

更新时间：2026-09-22。

模块职责见 [模块导航](MODULES.md)，全部资料见 [资料索引](README.md)。

本次仓库核对：已有历史提交；整理前 `main` 与远端 `main` 均为 `0f6eb25`，唯一未提交代码修改是 `agent/main.py` 的默认端口从 `8000` 改为 `8010`，与前端代理及启动文档一致。本次提交保留该修改，并整理文档；没有迁移业务目录或调整业务流程。

## 1. 项目目标

当前目标是做一个只覆盖 `TASK0` 的派车语音辅助填写 MVP：

- 用户说中文
- 系统先做语音转文字
- 再抽取可直接写入的表单字段
- 前端展示 AI 确认对话框
- 用户确认后才写入表单

## 2. 已锁定范围

当前范围已经锁定为：

- 表单状态：`TASK0`
- 操作：`HANDLE`
- 不处理：`FLAG_BB`
- ASR：FunASR
- 结构化提取：DeepSeek
- 前端负责联动字段、缺失项提示和最终写回

## 3. 当前已打通

### 语音链路

- 前端通过 Web Audio 录制 PCM
- 前端通过 `WS /ws/asr` 向后端流式发送 PCM
- 后端对接 FunASR
- partial transcript 已按累计方式展示
- final transcript 已能返回并进入 cleanup 链路

### 解析链路

- 前端先调用 `POST /api/agent/cleanup`
- cleanup 后文本会替换当前文本
- 用户点击 `Submit` 后，前端再调用 `POST /api/agent/parse`
- 后端基于 DeepSeek 做结构化提取
- 后端当前返回：
  - `respMessage`
  - `updates`
  - `overwriteFields`
  - `confirmRequired`
  - `rawTranscript`
  - `cleanedTranscript`
  - `cleanupMeta`
- 前端确认框已接上，确认后可写回字段

### 文本清洗链路

- cleanup 已从 parse 中独立拆出为单独接口
- cleanup 当前包含两层：
  - 本地规则清洗
  - 可选的本地 Ollama 轻量润色
- Ollama 代码链路已接入，且默认发送 `keep_alive=10m`
- parse 现在直接消费 cleanup 后文本，不再自行重复 cleanup

## 4. 代码现状

### 后端

- 已新增独立 cleanup API
- `ParseService` 现在直接消费前端提交的 cleanup 后文本
- parse 响应已包含 `rawTranscript`、`cleanedTranscript`、`cleanupMeta`
- transcript cleanup、Ollama client、DeepSeek client、ASR websocket 相关测试当前通过

### 前端

- 录音开始 / 结束可用
- partial transcript 累积展示可用
- 结束录音后会自动 cleanup 当前文本
- 当前文本区域已支持 `Reset` / `Submit`
- `Submit` 会判空，空字符串不会触发 parse
- 确认框展示和确认写回链路可用
- 右侧会话记录抽屉已接入
- `sessionStorage` 持久化与刷新恢复已接入

### 当前未完成

- `VehicleDispatchForm.vue` 里仍保留旧的 `handleVoiceStart / handleVoiceStop` 遗留逻辑
- Ollama cleanup 启用后的真实 cleanup / parse 链路还没有做完整实机验证

### 已验证（2026-09-22 本次实跑）

| 验证 | 执行目录 | 命令 | 结果 |
| --- | --- | --- | --- |
| 后端测试 | `agent/` | `.\.venv\Scripts\python -m pytest -q` | `21 passed` |
| 前端测试 | `web/` | `npm test` | 10 个测试文件，`28 passed` |
| 前端构建 | `web/` | `npm run build` | 通过；JS chunk 约 1,037 kB，有大于 500 kB 的提示 |

以上为自动化测试和构建结果，不代表真实麦克风、FunASR、Ollama、DeepSeek 端到端验证通过。

## 5. 运行预期

### FunASR

- 地址：`ws://127.0.0.1:10095`

### Python 后端

- 地址：`http://127.0.0.1:8010`

### 前端

- dev proxy 已将 `/agent-api` 转发到后端
- websocket `/agent-api/ws/asr` 已代理到后端 ASR websocket

## 6. 启动命令

### FunASR Docker

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
- 该脚本会把服务放到后台，容器会立即退出

### Python 后端

```powershell
cd D:\work\AI\DispatchVehicle\agent
.\.venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8010 --reload
```

### 启用 Ollama 润色后再启动后端

```powershell
$env:OLLAMA_ENABLED="true"
$env:OLLAMA_MODEL="gemma4:e4b"
$env:OLLAMA_BASE_URL="http://127.0.0.1:11434"
$env:OLLAMA_TIMEOUT_MS="2000"
$env:OLLAMA_MIN_TRANSCRIPT_LENGTH="12"
$env:OLLAMA_KEEP_ALIVE="10m"

cd D:\work\AI\DispatchVehicle\agent
.\.venv\Scripts\python -m uvicorn app.main:app --host 127.0.0.1 --port 8010 --reload
```

### 可选的本地模型预热

```powershell
ollama run gemma4:e4b "请只回复 ok"
```

### 前端

在 `D:\work\AI\DispatchVehicle\web` 启动 Vite dev server。

## 7. 历史环境记录

2026-04-09 的文档曾记录以下环境；本次未重新确认安装与运行状态：

- `ollama` 已安装
- 本地模型 `gemma4:e4b` 已存在
- 该模型只计划用于 final transcript 轻量润色，不参与结构化字段提取

## 8. 当前风险与注意事项

- `deepseek_client.py` 存在历史遗留的硬编码默认 API 凭据；本次没有更改密钥或重写历史。后续应移除默认凭据并轮换，文档与日志不得复制凭据内容。
- 前端构建有大文件提示，后续可评估组件按需加载或拆包。
- Ollama cleanup 代码已接入，但真实 cleanup / submit / parse 链路尚未完成端到端验证
- `parse_service.py` 的系统 prompt 目前仍使用 `\\uXXXX` 转义形式保存中文字符串；这是编码规避手段，不是产品需求，后续可以再改回字面中文
- 旧文档和终端输出仍可能出现中文乱码；如果文档和代码冲突，以代码为准

## 9. 下一步优先级

建议按这个顺序继续：

1. 做一次完整端到端实机验证
2. 验证 Ollama cleanup 在真实链路中的启用情况
3. 清理 `VehicleDispatchForm.vue` 里的旧录音处理逻辑
4. 视编码稳定性再决定是否把 `parse_service.py` prompt 改回字面中文
5. 继续打磨整体业务顺滑度

## 10. 文档优先级

当文档与实现冲突时，按以下顺序判断：

1. 当前代码
2. 本文件
3. `docs/AGENT_ENTRY.md`
4. 设计文档、历史计划、历史进度快照
