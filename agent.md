# 派车表单语音 Agent MVP 设计说明

更新时间：2026-04-09

## 1. 目标

在当前项目中，为 `web` 目录下的派车表单 Demo 增加一条可用的语音填报链路，用于支持用户通过语音输入申报行程信息，并在确认后写入表单。

本期只做 MVP，重点是打通以下闭环：

- 用户手动开启和结束语音输入
- 前端实时展示中文转写结果
- `agent` 基于最终转写文本抽取表单字段
- 前端弹出确认对话框展示 AI 识别结果
- 用户确认后写入表单
- 前端基于现有表单配置检查仍缺的必要信息
- 前端用一句自然语言继续引导用户补录

本期不追求完整流程，也不追求正式后端集成，只先验证“语音识别 + 表单回填 + 缺失追问”的交互和识别效果。

## 2. MVP 范围

### 2.1 仅覆盖当前表单状态

- `TaskKeys.TASK0`
- `ButtonKeys.HANDLE`

明确不处理：

- `FLAG_BB` 补报分支
- 审批、调度、司机确认、费用、行车日志等后续节点

### 2.2 仅覆盖语音申报场景

第一版只解决“用车申请”场景下的分段语音录入，不做整张表单一次性全填完，也不做常驻监听。

### 2.3 本期不做

- 不落库
- 不对接正式业务提交接口
- 不做全流程状态机
- 不做补报全表单填充
- 不做复杂人名重名消歧
- 不做浏览器本地跑 ASR 模型

## 3. 总体方案

本期采用方案 C：

- 前端负责录音开关、音频流上传、确认对话框和表单写入
- 服务端 ASR 层负责与 FunASR 对接，输出实时转写和最终转写
- 服务端 Agent Core 负责 final transcript 清洗、字段抽取、覆写判断和响应文案生成
- Agent Core 的语义理解模型默认采用 DeepSeek
- final transcript 在进入 DeepSeek 前，先做本地规则清洗；必要时再调用本地 Ollama 做轻量润色
- 前端继续复用现有联动和校验逻辑

核心原则：

- `agent` 只返回直接更新字段，不负责联动字段
- 联动字段由前端现有 watcher / linkage 逻辑处理
- 表单最终写入动作必须由用户确认后触发
- 缺失项判断优先复用前端配置
- Ollama 只用于润色 final transcript，不参与结构化字段提取

## 4. 用户交互流程

### 4.1 单轮交互

1. 用户点击“开始语音”
2. 前端建立 WebSocket，持续上传音频分片
3. ASR 服务持续返回实时转写文本
4. 前端在语音面板中实时显示转写内容
5. 用户点击“结束语音”
6. ASR 服务返回本轮最终转写文本
7. 前端将最终转写文本、当前表单状态、当前任务态发送给 Agent Core
8. Agent Core 先清洗最终转写，再返回本轮 AI 响应和字段更新建议
9. 前端弹出确认对话框
10. 用户确认后，前端把字段写入表单
11. 前端执行本地联动和必填检查
12. 如果仍有缺失字段，界面显示一句自然语言提示，引导用户继续下一轮补录

### 4.2 交互特点

- 需要录音开关，不做常驻监听
- 语音输入支持分段补录
- 默认不显示原始转写详情到确认对话框
- 对话框只展示 AI 的结构化响应
- 如果存在对旧值的修改，必须展示“原值 -> 新值”后再确认

## 5. 系统结构

### 5.1 前端 `web`

负责：

- 麦克风权限和录音开关
- 音频 chunk 采集和 WebSocket 上传
- 实时转写文本展示
- 调用 Agent Core 解析最终文本
- 展示确认对话框
- 确认后写入表单
- 执行现有联动逻辑
- 复用前端配置做缺失项判断

不负责：

- ASR 模型推理
- LLM 语义解析

### 5.2 服务端 `agent/asr adapter`

负责：

- 接收前端 WebSocket 音频流
- 调用 FunASR 做中文实时识别
- 返回实时文本和最终文本

不负责：

- 表单字段提取
- 业务规则判断

### 5.3 服务端 `agent/core`

负责：

- 接收最终转写文本
- 对最终转写文本做本地清洗
- 根据当前表单状态识别本轮新增字段
- 判断是否为覆写场景
- 生成面向用户的 AI 响应文案

不负责：

- 联动字段计算
- 必填项最终裁定
- 表单实际写入

### 5.4 前端页面级会话记录

负责：

- 将当前 tab 的语音轮次记录到 `sessionStorage`
- 记录本轮 `rawTranscript`、`cleanedTranscript`、`respMessage`、`updates`
- 刷新后恢复最近一轮上下文，便于继续补录和排查

不负责：

- 跨 tab 同步
- 后端落库
- 持久历史归档

## 6. 接口建议

### 6.1 ASR 流式接口

建议使用 WebSocket，例如：

- `WS /ws/asr`

前端发送：

- 音频分片
- 会话标识
- 采样率等基础参数

服务端返回事件：

- `partial_transcript`
- `final_transcript`
- `error`

### 6.2 Agent 解析接口

建议使用 HTTP JSON，例如：

- `POST /api/agent/parse`

请求体建议包含：

```json
{
  "taskKey": "UserTask_0",
  "buttonKey": "HANDLE",
  "transcript": "明天上午九点从南山去宝安开会，两个人，联系人张三",
  "formData": {},
  "supportedFields": [
    "startAddress",
    "endAddress",
    "startTime",
    "endTime",
    "useCarMatter",
    "contacts",
    "useCarPersonNum"
  ]
}
```

响应体建议包含：

```json
{
  "respMessage": "已识别出出发地、目的地、出车时间、用车事由、联系人和乘车人数。确认后可写入表单。",
  "updates": [
    { "fieldName": "startAddress", "fieldValue": "南山" },
    { "fieldName": "endAddress", "fieldValue": "宝安" },
    { "fieldName": "startTime", "fieldValue": "2026-04-09 09:00:00" },
    { "fieldName": "useCarMatter", "fieldValue": 5100 },
    { "fieldName": "contacts", "fieldValue": "张三" },
    { "fieldName": "useCarPersonNum", "fieldValue": 2 }
  ],
  "overwriteFields": [],
  "confirmRequired": true,
  "rawTranscript": "明天上午九点从南山去宝安开会，两个人，联系人张三",
  "cleanedTranscript": "明天上午九点从南山去宝安开会，两个人，联系人张三。",
  "cleanupMeta": {
    "ruleApplied": true,
    "ollamaAttempted": false,
    "ollamaUsed": false,
    "fallbackToRuleCleaned": false
  }
}
```

说明：

- `respMessage` 用于对话框和界面提示
- `updates` 支持一次返回多个字段
- `overwriteFields` 用于提示覆盖旧值
- `rawTranscript / cleanedTranscript / cleanupMeta` 用于前端调试、展示和会话记录
- 不再使用单个 `updateFieldName` / `updateFieldValue`

## 7. 字段边界

### 7.1 Agent 直接支持的 MVP 字段

本期 Agent 只直接识别并返回以下字段：

- `startAddress`
- `endAddress`
- `startTime`
- `endTime`
- `useCarMatter`
- `contacts`
- `useCarPersonNum`

### 7.2 前端衍生或联动字段

以下字段不要求 Agent 直接返回，由前端现有逻辑处理：

- `contactsPhone`
- `useCarTripType`
- `useCarJgTimeHour`
- `useCarJgTimeMinute`
- 其他因联动自动变化的字段

说明：

- `contactsPhone` 在 MVP 中不作为语音直接识别字段
- 若前端能根据联系人唯一匹配到手机号，则自动补齐
- 若联系人无法唯一匹配，前端可先保留空值，后续版本再处理重名和候选选择

### 7.3 用车性质处理

`useCarNature` 暂不作为 MVP 语音必填字段。

原因：

- 当前主要验证申报语音链路
- `useCarMatter` 的业务语义价值更高
- `useCarMatter` 与 `useCarNature` 之间存在一对多和多对多关系，强行反推容易出错

后续若需要将缺失项检查扩展到更完整的 `TASK0` 规则，可再补上 `useCarNature` 的识别和确认流程。

## 8. 缺失项判断

### 8.1 判断位置

缺失项判断放在前端执行，不放在 Agent Core。

原因：

- 前端已有 [formFieldConfig.js](/D:/work/AI/DispatchVehicle/web/src/config/formFieldConfig.js)
- 前端已有联动规则和校验规则
- 复用现有配置比在 Agent 里重复实现一套规则更稳

### 8.2 判断方法

前端收到 `updates` 后，按以下顺序处理：

1. 克隆当前 `formData`
2. 把 `updates` 应用到草稿表单
3. 触发已有联动逻辑，得到联动后的草稿状态
4. 基于 `TASK0 + HANDLE` 配置检查必填字段
5. 只针对“MVP 支持字段白名单”计算缺失项
6. 生成一句自然语言提示

### 8.3 为什么要加白名单

当前 `TASK0` 的完整表单规则远大于 MVP 支持范围。如果直接按完整 `TASK0` 必填集计算，系统会持续提示当前版本根本不打算处理的字段，交互会失真。

因此本期缺失项判断应按以下逻辑执行：

- 先取 `TASK0 + HANDLE` 的规则集合
- 再与“MVP 支持字段集合 + 前端可衍生字段集合”取交集
- 最终只提示当前版本实际有能力完成的缺失项

### 8.4 缺失项提示方式

缺失项不一次性弹完整清单，只输出一句自然语言提示，例如：

- `还缺出发地和出车时间，请继续补充。`
- `联系人已经识别到，还缺目的地，请继续补充。`

## 9. 覆写策略

如果本轮识别到的字段与当前表单已有值冲突：

- Agent Core 标记为覆写项
- 前端确认对话框展示 `原值 -> 新值`
- 用户再次确认后才允许覆盖写入

例如：

- `乘车人数：2 -> 3`
- `出车时间：2026-04-09 14:00:00 -> 2026-04-10 09:00:00`

Agent 不得直接绕过确认流程写入旧字段。

## 10. 确认对话框

### 10.1 展示内容

对话框只展示 AI 响应信息，不展示原始转写文本。

建议包含：

- AI 响应摘要
- 将写入的字段列表
- 将覆盖的字段列表
- 当前仍需补充的字段提示

### 10.2 操作按钮

- `确认写入`
- `取消`

取消后：

- 本轮不写入表单
- 保留当前表单状态不变
- 用户可重新说一轮

## 11. 异常处理

以下情况不应进入 `updates`，而应通过 `respMessage` 提示用户补充或重说：

- 语义不清，无法稳定识别字段
- 时间表达不完整，无法转成标准时间
- 枚举值无法归一到合法选项
- 联系人无法识别或无法匹配

示例：

- `明天下午去宝安`：缺少更具体出发时间
- `去办点事`：用车事由无法归一
- `联系人老王`：无法确认具体联系人

## 12. 技术实现建议

### 12.1 ASR

- 本地中文语音识别优先使用 FunASR
- 第一版采用流式识别
- 录音交互为“点击开始，点击结束”

### 12.2 Agent Core

建议使用 Python 实现，原因：

- 与 FunASR 接入更自然
- 便于后续扩展 LLM 和文本处理逻辑

语义模型约束：

- 默认采用 DeepSeek 作为文本语义解析模型
- 可选接入本地 Ollama，但只允许用于 final transcript 轻量润色
- DeepSeek 负责从最终转写文本中抽取字段更新、覆写意图和面向用户的响应文案
- 具体模型名在实现时做成可配置项，但当前方案默认模型供应方固定为 DeepSeek

### 12.3 前端

继续基于当前 Vue 3 + Vite + Element Plus Demo 演进，不额外重建表单系统。

当前版本建议：

- 语音轮次先记录到 `sessionStorage`
- 仅恢复当前 tab 最近一轮上下文
- 不做后端落库和跨页面持久化

## 13. MVP 完成标准

满足以下条件即可认为 MVP 可用：

- 用户可手动开启和结束语音输入
- 前端可实时显示中文转写
- 结束语音后可得到 Agent 返回的 `respMessage` 和 `updates`
- 对话框可展示待写入字段和覆写字段
- 用户确认后字段可写入现有表单
- 前端联动逻辑仍正常生效
- 前端可对 MVP 字段范围内的缺失项给出一句自然语言提示

## 14. 后续扩展方向

在 MVP 跑通后，再逐步扩展：

- 扩展到完整 `TASK0` 字段范围
- 扩展 `FLAG_BB` 补报模式
- 增加候选联系人和重名消歧
- 增加更多任务节点
- 增加正式落库和业务提交
- 视体验再评估是否需要原始转写展示、历史会话、流式 Agent 响应等能力
