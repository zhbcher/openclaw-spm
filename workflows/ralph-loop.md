# Ralph Loop — 任务自动闭环

> 借鉴 Oh My OpenAgent 的 Ralph Loop 机制。验证失败时自动重试，不到 100% 完成不停止。

## 触发条件

- Phase 4 验证门任一检查项失败
- 子代理返回 DONE_WITH_CONCERNS
- WBS 任务 status=done 但 evidence 为空

## 核心规则

**最多循环 3 次。** 3 次后仍失败 → 上报用户决策，不陷入死循环。

**每次循环必须改变策略。** 不能盲目重试同样的操作。

## 执行流程

```
FOR 每个失败的任务（最多 3 轮）:
  1. 读取失败原因（测试输出 / lint 报错 / 编译错误）
  2. 选择修复策略（不可与上一轮相同）:
     - Strategy A: 直接定位报错行 + 精准修复
     - Strategy B: 回滚本次改动 + 换实现方案
     - Strategy C: 拆分任务为更小子任务
  3. 派发修复子代理（含失败上下文 + 选定策略）
  4. 子代理完成后重新验证
  5. 验证通过 → 标记 done + evidence → 退出循环
  6. 验证仍失败 → 轮次+1 → 回到步骤1

IF 3轮后仍失败:
  → 暂停，整理「失败根因 + 已尝试策略 + 建议」→ 请求用户决策
```

## 策略选择规则

| 失败类型 | 优先策略 |
|---------|---------|
| 编译/语法错误 | Strategy A（精准修复） |
| 测试失败 | Strategy A（修代码）或 Strategy C（拆任务） |
| 多个不相关文件冲突 | Strategy B（回滚+换方案） |
| 外部依赖/环境问题 | 立即上报用户，不进循环 |

## 证据记录

每轮尝试结果写入 WBS Mutation Log：

```markdown
| Time | Mutation Type | Affected IDs | Reason | New IDs |
|------|--------------|-------------|--------|---------|
| HH:MM | ralph-retry-1 | 3 | Test failed: expected 200 got 500 | 3 (retry with Strategy A) |
| HH:MM | ralph-retry-2 | 3 | Still failing: assertion mismatch | 3 (retry with Strategy C, split) |
| HH:MM | ralph-resolved | 3 | Split into 3.1 + 3.2, both pass | 3.1, 3.2 |
```

## 与 SPM 现有流程的关系

- 替代 Phase 4 中「验证失败 → 人工决策」的手动环节
- 不改变 TDD 流程，只在 TDD 验证失败后触发
- 兼容子代理调度：重试时仍然用 WBS 绑定（status=doing → done）
