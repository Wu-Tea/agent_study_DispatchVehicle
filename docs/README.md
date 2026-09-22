# 项目资料索引

更新时间：2026-09-22。

## 当前维护资料

| 文档 | 用途 |
| --- | --- |
| [根 README](../README.md) | 项目范围、依赖、环境变量、启动与验证命令 |
| [模块导航](MODULES.md) | 目录职责、后端 / 前端模块、接口与数据流 |
| [当前状态](CURRENT_STATUS.md) | 最近验证结果、已知限制、后续工作 |
| [Agent 入口](AGENT_ENTRY.md) | 恢复开发上下文与现有技术边界 |
| [前端说明](../web/README.md) | 前端开发与代理配置 |

## 设计资料

| 文档 | 阅读说明 |
| --- | --- |
| [MVP 原始方案](../agent.md) | 目标、职责、字段边界；其中自动解析步骤已由后续 cleanup / submit 设计调整 |
| [Cleanup / Submit 设计](superpowers/specs/2026-04-09-voice-cleanup-submit-flow-design.md) | 停止录音自动清洗、手动 Submit 解析的交互设计 |

## 历史记录

以下保留用于追溯，不作为当前验证结果。

- [2026-04-08 进度](2026-04-08-voice-agent-progress.md)
- [2026-04-09 会话与清洗实现](2026-04-09-voice-history-cleanup-implemented.md)
- [2026-04-09 实现计划](superpowers/plans/2026-04-09-voice-cleanup-submit-flow.md)

文档冲突时先核对当前代码与测试，再参考当前状态；历史记录中的本机模型安装情况不能代表现时环境。
