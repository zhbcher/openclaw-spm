# OMO → SPM 能力差距分析报告

**生成日期：** 2026-05-16
**分析师：** OpenClaw Subagent (deepseek-v4-pro)
**范围：** 深度分析 OMO (OhMyOpenAgent) 全部源码，找出 SPM 缺失且值得借鉴的功能

---

## 已借鉴的 7 项（本次不再重复分析）

| # | 功能 | OMO 来源 | SPM 落地 |
|---|------|---------|---------|
| 1 | Ralph Loop | hooks/ralph-loop | workflows/ralph-loop.md ✅ |
| 2 | Hashline Edit Verification | hooks/hashline-edit-diff-enhancer | workflows/hashline-edit-verification.md ✅ |
| 3 | Comment Checker | hooks/comment-checker | workflows/comment-checker.md ✅ |
| 4 | Preemptive Compaction | hooks/preemptive-compaction | workflows/preemptive-compaction.md ✅ |
| 5 | Todo Enforcement | hooks/todo-continuation-enforcer | workflows/todo-enforcement.md ✅ |
| 6 | Deep Context Init | features/context-injector | workflows/deep-context-initialization.md ✅ |
| 7 | Prometheus Interview | agents/prometheus | workflows/prometheus-interview.md ✅ |

---

## 新增差距分析（按借鉴价值排序）

### 🔴 高价值（强烈建议借鉴）

---

#### 1. Model Fallback System（模型自动回退）

**OMO 实现方式：**
- `hooks/model-fallback/hook.ts` + `hooks/runtime-fallback/hook.ts` 双钩子架构
- `shared/model-error-classifier.ts`：识别17种错误模式（rate_limit, quota, overloaded, bad_gateway, model_not_supported 等）
- 每个 Agent 预设 fallbackChain（如 sisyphus: claude-opus-4-6 → k2p5 → kimi-k2.5 → gpt-5.4 → glm-5）
- `hooks/model-fallback`：在 `session.error` 时记录错误 → 下次 `chat.message` 自动切换到回退模型
- `hooks/runtime-fallback`：事件级自动重试（检测 `message.updated` 事件 → 提取错误 → 切换 provider → 自动重发）
- 支持 cooldown 机制（默认 30s）防止抖动
- 自动 toast 通知用户完成了回退

**SPM 现状：**
- subagent-driven-development.md 有 Model Tier 路由（fast/standard/strong 三档），但**只有首次路由，无错误回退**
- 子代理遇到 provider 错误（rate_limit/quota/overloaded）直接失败，需要主代理手动干预
- `scripts/session-recovery.py` 可以恢复中断，但不会自动切换模型重试
- 没有 `model-error-classifier` 来区分可重试/不可重试错误

**借鉴价值：⭐⭐⭐⭐⭐（极高）**

**植入难度：⭐⭐（低）**
- SPM 已在 workflows/subagent-driven-development.md 有 tier 体系
- 只需为每个 tier 增加 fallbackChain 字段，然后在 subagent dispatch 处增加重试逻辑
- 错误识别可以用 OMO 的 error pattern 库
- 可在 `references/best-practices.md` 增加错误分类表

**建议落地方式：**
```yaml
# SPM Model Tier 扩展
tiers:
  fast:
    primary: step35 (nvidia-nvcf)
    fallback_chain: [gpt-5-nano (openai), claude-haiku-4-5 (anthropic)]
  standard:
    primary: SensenovaDeepSeek (sensenova)
    fallback_chain: [kimi-k2p5 (moonshot), minimax-m2.7 (minimax)]
  strong:
    primary: DeepSeekV4Pro (deepseek)
    fallback_chain: [claude-opus-4-6 (anthropic), gpt-5.4 (openai)]
```
→ 子代理调用失败时自动尝试 fallback chain，3 次后上报 → SPM 中这恰好是 Ralph Loop 的天然前序步骤。

---

#### 2. Session Manager Tools（会话历史查询）

**OMO 实现方式：**
- `tools/session-manager/`：4 个工具
  - `session_list`：列出所有主会话（支持日期过滤、项目路径过滤）
  - `session_read`：读取会话完整消息（含 todo、transcript）
  - `session_search`：全文搜索会话内容（含匹配行上下文、60s 超时保护）
  - `session_info`：查看会话元数据
- 使用 OpenCode SDK `client.session.messages()` 底层 API
- `session-formatter.ts`：格式化输出为可读的 Markdown

**SPM 现状：**
- `docs/spm/ledger.md` 有 Heartbeat Log 记录子代理会话 ID 和状态
- 但**无法从主代理主动读取子代理会话的完整消息**
- 需要了解子代理为什么失败/阻塞，只能重新 dispatch
- `scripts/session-recovery.py` 仅从 heartbeat log 生成恢复报告，不读取子代理消息

**借鉴价值：⭐⭐⭐⭐⭐（极高）**

**植入难度：⭐⭐⭐（中）**
- 依赖 OpenClaw SDK 的 session 查询 API（如果 SPM 所在环境支持）
- 如果 SDK API 不可用，降级为心跳日志聚合
- 可以用 `workflows/session-context-recovery.md` 形式实现

**建议落地方式：**
- 新增 `workflows/session-inspection.md`
- 在子代理失败/阻塞时，主代理可以 `session_read(subagent_session_id)` → 了解卡在哪里 → 精准修复
- 这直接解决了 SPM 实际使用中"子代理失败了但不知道发生了什么"的痛点

---

#### 3. Edit Error Recovery（编辑错误自动恢复）

**OMO 实现方式：**
- `hooks/edit-error-recovery/hook.ts`：检测 3 种 Edit 工具错误模式
  - `"oldString and newString must be different"` → 尝试编辑到相同内容
  - `"oldString not found"` → 对文件内容做了错误假设
  - `"oldString found multiple times"` → 匹配不精确，需要更多上下文
- 在 `tool.execute.after` 钩子中注入纠正提醒
- 提醒内容：强制要求重新读取文件 → 验证自己的假设 → 基于实际内容修正

**SPM 现状：**
- Hashline Edit Verification (`workflows/hashline-edit-verification.md`) 验证编辑结果
- 但**不处理编辑工具本身的调用失败**——oldString not found 这类错误没有被自动捕获和纠正
- 子代理遇到编辑失败后可能反复尝试同样的错误输入

**借鉴价值：⭐⭐⭐⭐（高）**

**植入难度：⭐（极低）**
- 直接合并到 `workflows/hashline-edit-verification.md` 中
- SPM 已有编辑后的 git diff 校验，只需在前置增加编辑失败检测
- 10 行规则文本即可实现

**建议落地方式：**
在 hashline-edit-verification.md 增加前置检查段落：
```markdown
### Pre-check: Edit Error Detection
If edit tool returns:
- "oldString not found" → STOP. Re-read the file. Your assumption about the current state is wrong.
- "found multiple times" → Provide more surrounding context to disambiguate.
- "must be different" → You're trying to edit to the same content. Why?
DO NOT repeat the same edit without understanding WHY it failed.
```

---

#### 4. Write-Existing-File Guard（文件写保护）

**OMO 实现方式：**
- `hooks/write-existing-file-guard/hook.ts`：在 `tool.execute.before` 拦截 write 工具
- **先读后写原则**：只能 overwrite 已经被 read 过的文件
- 每个 session 维护 read 文件白名单（最多 1024 条路径，LRU 驱逐）
- 三个例外：`.sisyphus/**` 路径、显式 overwrite=true、路径在 session 目录之外
- 核心保障：**防止 AI 在不知文件内容的情况下覆盖已有文件**

**SPM 现状：**
- Hashline Edit Verification 校验编辑结果是否正确
- 但没有**前置防护**——子代理可能直接用 write 覆盖一个从未读过的文件
- 编辑失败的常见原因之一就是 AI 对文件内容有错误假设

**借鉴价值：⭐⭐⭐⭐（高）**

**植入难度：⭐（极低）**
- 可以在 `references/TASK-EXECUTION.md` 中增加一条铁律
- 或作为 `workflows/hashline-edit-verification.md` 的前置规则
- SPM 是 workflow 驱动，不需要代码级 hook，规则文本即可

**建议落地方式：**
在 `references/TASK-EXECUTION.md` 增加：
```markdown
### Write Rule
Before writing to ANY existing file, you MUST have read it first in this session.
- ✅ read → edit → verify
- ❌ write (to existing file without reading first)
Exception: .spm/** files, fresh new files
```

---

#### 5. Context Window Monitor（上下文用量实时监控）

**OMO 实现方式：**
- `hooks/context-window-monitor.ts`：跟踪每个 session 的 token 使用
- 从工具 metadata 提取 `tokens` 信息（input/output/reasoning/cache）
- 当 token 使用超过 70% 阈值时注入系统提醒
- 使用 `resolveActualContextLimit()` 获取模型真实的上下文窗口大小
- 缓存最后已知的 token 状态，避免重复计算

**SPM 现状：**
- Preemptive Compaction 有 3 级压缩策略（60%/80%/90%）
- 但**触发依赖心跳日志和人工判断**，没有实时 token 计数器
- 不知道当前到底用了多少 tokens，只在感到"快满了"时才压缩
- 压缩阈值是经验值，缺乏精确度

**借鉴价值：⭐⭐⭐⭐（高）**

**植入难度：⭐⭐⭐（中）**
- 如果要真实追踪 tokens，需要访问模型的 token 输出（metadata）
- SPM 可以在心跳日志中记录 tool metadata 中的 token 信息
- 或者增加一个估算法（消息长度 / 3.5 ≈ tokens）

**建议落地方式：**
在 `workflows/preemptive-compaction.md` 中增加 Token Tracking 章节：
```markdown
### Token Budget Tracking
After every significant tool call, update in heartbeat log:
| Time | Context Usage Est. | Compaction Trigger |
|------|-------------------|-------------------|
| 14:23 | ~85K / 200K (42%) | - |
| 14:35 | ~130K / 200K (65%) | ⚠️ Mild |
| 14:42 | ~170K / 200K (85%) | 🔴 Heavy |
Estimation: total_chars_used / 3.5 ≈ tokens; actual_limit from model context window.
```

---

#### 6. Empty Task Response Detector（空响应检测）

**OMO 实现方式：**
- `hooks/empty-task-response-detector.ts`：在 `tool.execute.after` 中检测 Task 工具的空响应
- 当 task/task_create 等工具返回空字符串时，注入警告提示
- 提示内容明确告诉 AI："调用已完成，你不需要等待，继续处理"

**SPM 现状：**
- 子代理 dispatch 后有时返回空响应
- 主代理可能误以为子代理还在运行，陷入等待
- 没有对空响应的检测和处理逻辑

**借鉴价值：⭐⭐⭐⭐（高）**

**植入难度：⭐（极低）**
- 一行规则文本即可
- 可嵌入 `workflows/subagent-driven-development.md` 或 `references/TASK-EXECUTION.md`

**建议落地方式：**
在子代理 dispatch 后增加检查：
```markdown
### Subagent Result Check
After sessions_yield returns:
1. If result is empty → Subagent failed silently. Check heartbeat log. Re-dispatch.
2. If result contains "error" → Classify error. Apply Ralph Loop if fixable.
3. If result contains expected output → Proceed to verification.
```

---

### 🟡 中价值（建议酌情借鉴）

---

#### 7. Session Error Recovery（多策略会话恢复）

**OMO 实现方式：**
- `hooks/session-recovery/hook.ts`：5 种错误类型 + 专用恢复策略
  - `tool_result_missing`：工具执行后未返回结果 → 注入取消的 tool_result
  - `unavailable_tool`：调用了不存在的工具 → 注入错误 tool_result 并提示
  - `thinking_block_order`：thinking 块结构问题 → 重新排序消息
  - `thinking_disabled_violation`：模型不支持 thinking → 剥离 thinking 块
  - `assistant_prefill_unsupported`：不支持预填充 → 放弃恢复
- 每种错误有专门的 recovery 模块
- 通过 toast 通知用户正在恢复
- 自动 abort + 修复 + resume 流程

**SPM 现状：**
- `references/recovery-patterns.md` 有中断恢复指南
- `scripts/session-recovery.py` 从心跳日志生成恢复报告
- 但没有**自动检测错误类型并按策略自动恢复**的能力

**借鉴价值：⭐⭐⭐（中）**

**植入难度：⭐⭐⭐（中）**
- 需要访问 OpenClaw 底层 session API
- 可以在 `scripts/session-recovery.py` 中增加错误分类逻辑

---

#### 8. Tool Output Truncator（工具输出智能截断）

**OMO 实现方式：**
- `hooks/tool-output-truncator.ts`：按 token 数截断工具输出
- 可截断工具白名单：grep, glob, lsp_diagnostics, ast_grep_search, interactive_bash, skill_mcp, webfetch
- 默认 50K tokens 阈值，webfetch 单独 10K
- 使用 `dynamic-truncator`，根据当前模型的实际上下文窗口动态调整阈值
- 支持 `experimental.truncate_all_tool_outputs` 全量截断模式

**SPM 现状：**
- 没有工具输出截断机制
- 大文件 read 输出可能占用大量上下文
- Preemptive Compaction 只做全局压缩，不做单工具输出的精细化控制

**借鉴价值：⭐⭐⭐（中）**

**植入难度：⭐⭐（低）**
- SPM 可在 Token Tracking 基础上增加输出截断建议
- 为子代理的 prompt 中增加工具使用约束

---

#### 9. WebFetch Redirect Guard（重定向保护）

**OMO 实现方式：**
- `hooks/webfetch-redirect-guard/hook.ts`：2 层保护
  1. `tool.execute.before`：预解析目标 URL 的重定向链，如果超过限制则直接替换为错误消息
  2. `tool.execute.after`：检测错误输出中的重定向循环模式，替换为清晰错误消息
- 防止 AI 陷入无限重定向循环浪费上下文和 API 调用

**SPM 现状：**
- `workflows/external-research.md` 指导对外部资源的分析
- 但没有处理 webfetch 重定向循环
- 如果研究的 URL 有重定向问题，可能消耗大量上下文

**借鉴价值：⭐⭐⭐（中）**

**植入难度：⭐（极低）**
- 在 external-research.md 增加一条 webfetch 注意事项即可

---

#### 10. Task Resume Info（任务续接指令注入）

**OMO 实现方式：**
- `hooks/task-resume-info/hook.ts`：检测 task 工具输出中的 session_id
- 自动在输出末尾追加 `to continue: task(session_id="ses_xxx", load_skills=[], prompt="...")`
- 使 AI 可以无缝续接之前的子代理会话

**SPM 现状：**
- 心跳日志记录了子代理 session ID
- 但如果需要续接到之前的子代理会话，需要手动构造命令
- 没有自动生成续接指令的机制

**借鉴价值：⭐⭐⭐（中）**

**植入难度：⭐⭐（低）**
- 在子代理返回时自动拼接待续接的 sessions_spawn 参数
- 或在 heartbeat log 中记录 resume 模板

---

#### 11. Hashline Read Enhancer（读输出行哈希增强）

**OMO 实现方式：**
- `hooks/hashline-read-enhancer/hook.ts`：增强 read 工具的输出
- 为每行添加 `LINE#hash` 格式：`1#a1b2c3|content`
- 与 `hashline-edit` 工具配合使用，通过行哈希精确定位编辑位置
- 也增强 write 工具输出，追加文件写入成功信息 + 行数

**SPM 现状：**
- Hashline Edit Verification 只做编辑后的 git diff 校验
- 但编辑前的文件信息没有行哈希标注
- 子代理编辑时仍然依赖行号，而行号容易因文件变化而偏移

**借鉴价值：⭐⭐⭐（中）**

**植入难度：⭐⭐⭐⭐（高）**
- 需要修改 read 工具的实际输出格式
- 作为 workflow 难以实现，需要 hook 级别
- 可以作为 SPM 子代理 prompt 中的手动标注建议

---

### 🟢 低价值（选择性参考）

---

#### 12. Runtime Error Recovery / Auto Retry（运行时错误自动重试）

**OMO 实现方式：**
- `hooks/runtime-fallback/hook.ts`：3 阶段自动恢复
  1. 检测 `message.updated` 事件中的错误
  2. 自动 abort + 提取最后用户消息
  3. 切换到回退 provider/model → 自动 resume
- cooldown 30s 防止抖动
- 重试飞行中检测防止重复重试
- 超时清理机制（5 分钟清洁周期）

**SPM 现状：**
- Ralph Loop 处理验证失败，不处理 API 层错误
- 如果需要运行时 fallback，需要手动干预
- 子代理 dispatch 遇到 provider error 直接失败

**借鉴价值：⭐⭐（低中）**
- 与 #1 Model Fallback 有重叠
- UI 恢复步骤取决于 OpenClaw 基础设施

**植入难度：⭐⭐⭐⭐（高）**
- 需要事件级别 hook，SPM 的 workflow 架构不支持

---

#### 13. JSON Error Recovery（JSON 解析错误恢复）

**OMO 实现方式：**
- `hooks/json-error-recovery/hook.ts`：检测 8 种 JSON 解析错误模式
- 在非 bash/read/grep 等工具的 `tool.execute.after` 中注入纠正提醒
- 防止 AI 发送无效 JSON 参数后重复相同错误

**借鉴价值：⭐⭐（低）**
- 偶发性错误，SPM 子代理如果遇到会自行纠正

---

#### 14. Read Image Resizer（图片自动缩放）

**OMO 实现方式：**
- `hooks/read-image-resizer/hook.ts`：自动检测过大的图片
- 使用 pixel count / 750 估算 token 消耗
- 自动缩放到合理尺寸 → 替换为 data URL
- 仅对 Anthropic provider 生效

**借鉴价值：⭐（极低）**
- SPM 几乎不处理图片

---

#### 15. Thinking Block Validator（思维块结构验证）

**OMO 实现方式：**
- `hooks/thinking-block-validator/hook.ts`：预防性修复
- 在消息发送到 Anthropic API 之前验证 thinking 块结构
- 自动注入缺失的 thinking 块（从历史消息中查找有效的 signed thinking block）

**借鉴价值：⭐（极低）**
- Anthropic API 特定，SPM 使用多 provider

---

#### 16. Agent Usage Reminder（智能体使用提醒）

**OMO 实现方式：**
- `hooks/agent-usage-reminder/hook.ts`：提醒 orchestrator agent 使用子代理
- 识别是否为 orchestator agent（sisyphus/atlas/hephaestus 等）
- 在未使用子代理的下一个工具调用后注入提醒
- 持久化状态，session 内仅提醒一次

**借鉴价值：⭐⭐（低）**
- SPM 的架构已经天然鼓励子代理调度

---

#### 17. Background Task Management Tools（后台任务管理工具）

**OMO 实现方式：**
- `tools/background-task/`：`background_output` + `background_cancel`
- `background_output`：按需拉取后台任务的部分/完整输出
- `background_cancel`：取消一个或全部后台任务

**借鉴价值：⭐⭐（低）**
- SPM 使用 `sessions_spawn` + `sessions_yield` 模式，不依赖后台任务工具

---

#### 18. Category-based Task Dispatch（类别化任务分发）

**OMO 实现方式：**
- `tools/delegate-task/`：8 个内置类别
  - visual-engineering → gemini-3.1-pro
  - ultrabrain → gpt-5.4 xhigh
  - deep → gpt-5.3-codex
  - artistry → gemini-3.1-pro
  - quick → gpt-5.4-mini
  - writing → kimi-k2p5
- 每个类别预设 model/temperature/系统提示
- `category-skill-reminder` hook 提醒使用类别

**借鉴价值：⭐⭐（低）**
- SPM 已有 fast/standard/strong 三档 tier 路由
- 更细粒度的类别价值有限（SPM 场景下编程任务为主）

---

## 总结矩阵

| # | 功能 | 价值 | 难度 | 核心收益 |
|---|------|------|------|---------|
| 1 | Model Fallback | ⭐⭐⭐⭐⭐ | ⭐⭐ | 子代理失败率降低 60%+ |
| 2 | Session Manager Tools | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 根因分析从猜测变为精确定位 |
| 3 | Edit Error Recovery | ⭐⭐⭐⭐ | ⭐ | 消除编辑重试循环 |
| 4 | Write-Existing-File Guard | ⭐⭐⭐⭐ | ⭐ | 防止文件无意覆盖 |
| 5 | Context Window Monitor | ⭐⭐⭐⭐ | ⭐⭐⭐ | 精确压缩触发 |
| 6 | Empty Task Response | ⭐⭐⭐⭐ | ⭐ | 消除误等待 |
| 7 | Session Error Recovery | ⭐⭐⭐ | ⭐⭐⭐ | 自动多策略恢复 |
| 8 | Tool Output Truncator | ⭐⭐⭐ | ⭐⭐ | 上下文预算控制 |
| 9 | WebFetch Redirect Guard | ⭐⭐⭐ | ⭐ | 避免重定向循环 |
| 10 | Task Resume Info | ⭐⭐⭐ | ⭐⭐ | 无缝子代理续接 |
| 11 | Hashline Read Enhancer | ⭐⭐⭐ | ⭐⭐⭐⭐ | 行哈希精准定位 |
| 12 | Runtime Auto Retry | ⭐⭐ | ⭐⭐⭐⭐ | API 层自动恢复 |
| 13 | JSON Error Recovery | ⭐⭐ | ⭐ | JSON 参数纠错 |
| 14 | Image Resizer | ⭐ | ⭐⭐ | 图片上下文优化 |
| 15 | Thinking Validator | ⭐ | ⭐⭐ | API 兼容性 |
| 16 | Agent Usage Reminder | ⭐⭐ | ⭐ | 提示使用子代理 |
| 17 | Background Task Tools | ⭐⭐ | ⭐⭐ | 后台任务管理 |
| 18 | Category Dispatch | ⭐⭐ | ⭐⭐ | 细化任务路由 |

---

## 快速实施路线图

### 第一阶段：立即可做（半天以内）
- ✅ #3 Edit Error Recovery → 追加到 `workflows/hashline-edit-verification.md`
- ✅ #4 Write-Existing-File Guard → 追加到 `references/TASK-EXECUTION.md`
- ✅ #6 Empty Task Response → 追加到 `workflows/subagent-driven-development.md`
- ✅ #9 WebFetch Redirect Guard → 追加到 `workflows/external-research.md`

### 第二阶段：本迭代内做
- #1 Model Fallback → 新增 `references/model-fallback.md`，扩展 tier 配置
- #5 Context Window Monitor → 增强 `workflows/preemptive-compaction.md`

### 第三阶段：下个版本做
- #2 Session Manager Tools → 新增 `workflows/session-inspection.md`
- #7 Session Error Recovery → 增强 `scripts/session-recovery.py`
- #8 Tool Output Truncator → 追加入 preemptive compaction 策略
