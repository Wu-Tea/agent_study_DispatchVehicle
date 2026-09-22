# 派车表单 Demo 前端

基于 Vue 3、Vite、Element Plus，提供派车表单、语音录入、AI 字段确认和当前 tab 会话记录。语音 MVP 仅覆盖 `TASK0 + HANDLE`。

## 启动与验证

在本目录执行：

```powershell
npm ci
npm run dev
```

依赖清单和版本锁分别为 `package.json`、`package-lock.json`。开发服务器访问地址以 Vite 终端输出为准。

```powershell
npm test
npm run build
```

## 后端连接

`vite.config.js` 将 `/agent-api` 下的 HTTP 和 WebSocket 请求代理到 `http://127.0.0.1:8010`，并去掉路径中的 `/agent-api` 前缀。先按 [根 README](../README.md) 启动 Python 后端与 FunASR。

如果后端地址不同，在启动 Vite 前设置：

```powershell
$env:VITE_AGENT_PROXY_TARGET="http://127.0.0.1:8010"
npm run dev
```

此代理属于开发服务器配置；构建后的静态文件需要部署环境另行提供对应 API 路由。

## 使用与模块

1. 开始录音，实时查看转写。
2. 结束录音，等待文本清洗。
3. 点击 Submit 提取字段并展示确认框。
4. 确认后回填表单；Reset 只清空当前文本。

核心流程在 `src/composables/useVoiceAgent.js`，表单在 `src/views/VehicleDispatchForm.vue`，业务规则在 `src/config/`。会话记录保存在当前 tab 的 `sessionStorage` 中。

完整职责说明见 [模块导航](../docs/MODULES.md)，验证结果见 [当前状态](../docs/CURRENT_STATUS.md)。
