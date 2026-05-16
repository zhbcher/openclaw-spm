# Preemptive Compaction — 上下文预压缩

> 借鉴 OMO 的 Preemptive Compaction。长会话中自动监控上下文窗口用量，逼近上限时主动压缩防 OOM。

## 触发条件

- 每个子代理任务完成后检查
- 每 3 轮对话后自检
- 执行 Phase 3 并行任务前

## 压缩策略

### Level 1: 轻度压缩（用量 > 60%）

- 清除已完成的工具调用输出（保留错误输出）
- 移除重复的 WBS 状态片段（只保留最新一条）
- 精简 heartbeat 日志（合并连续无变化条目）

### Level 2: 中度压缩（用量 > 80%）

- 缩写已完成的子代理输出（只保留结论 + evidence）
- 移除已解决的中间讨论（保留最终决策）
- 压缩文件读取记录（只记录文件名+行数，不保留全文）

### Level 3: 重度压缩（用量 > 90%）

- 将所有已完成任务归档为 3 行摘要（任务ID + 结果 + 证据链接）
- 启动新的子会话继续未完成任务
- 在 WBS 中写入完整的恢复上下文（Cold-Start Context Brief）

## 执行流程

```
每个检查点:
  1. 估算当前上下文用量（token 数 ≈ 字符数 / 4）
  2. 对照模型上下文窗口
  3. 选择对应压缩等级
  4. 执行压缩操作
  5. 确认压缩后用量
  6. 更新 WBS 的 Active State（确保中断后可恢复）

压缩后:
  → 用量 < 50%: 继续
  → 用量 50-70%: 警告 + 预加载下一任务的 Context Brief
  → 用量 > 70%: 优先完成当前任务 → 归档 → 新会话
```

## 关键原则

1. **先归档再压缩** — WBS Active State 必须包含完整的 Resume Point
2. **证据不丢失** — 测试输出、diff、验证结果保留原始引用路径
3. **用户可见的决策不压缩** — 用户的明确指示、偏好、否决始终保留
4. **不压缩 Iron Laws** — 5 条铁律在任意压缩级别下都完整保留

## WBS 恢复上下文格式

压缩后必须在 WBS 中写入：

```markdown
## Active State (Compacted at HH:MM)
- Current task: ID 3 — Core feature A
- Last completed: ID 2 — Setup scaffold (npm test passed)
- Session resumed from: 2026-05-16 14:30
- Context window: 62% → 38% after compaction
- Resume point: File src/routes/api.ts L45-120 need modification
- Pending decisions: None
```

## 与现有流程的关系

本 workflow 作为 **Tracking Layer** 的一部分，与 Heartbeat、Session Recovery 协同工作。
