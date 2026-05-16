# Todo 强制执行 — 任务完成硬件拦截

> 借鉴 OMO 的 Todo Enforcement。子代理结束时强制执行 WBS 完整性检查，不满足条件不允许推进到下一阶段。

## 触发条件

- 每个子代理任务返回后（Phase 3 结束点）
- Phase 4 启动前
- 用户说「完成」「下一个」「继续」等推进指令时

## 拦截检查清单

子代理返回后，主代理必须逐项检查：

```
□ 1. WBS 状态已更新
     → 该任务行 status 必须是 done / blocked / skipped 之一（不能是 todo / doing）

□ 2. 有可验证的 evidence
     → evidence 列不能为空
     → evidence 必须是可追溯的（文件路径、命令输出、diff 片段）
     → "done" / "完成" 等裸文本不算 evidence

□ 3. evidence 与任务 exit criteria 匹配
     → 任务要求 "API returns correct data" → evidence 必须有 curl 输出或测试结果
     → 任务要求 "build passes" → evidence 必须有编译输出
     → 不匹配 → 标记为 blocked，说明缺失项

□ 4. 没有悬空引用
     → 新代码的文件引用（import/require）都能解析
     → 文档中引用的路径都存在

□ 5.（仅 Phase 4 前）全部 completed 行 ≥ 全部非 skipped 行
     → 有 blocked 任务 → 不允许进 Phase 4
     → blocked 任务必须先执行 Mutation Protocol（拆分/跳过/放弃）
```

## 拦截后的处理

| 缺失项 | 操作 |
|--------|------|
| 缺 WBS 状态 | 自动补写 status（根据子代理输出判断） |
| 缺 evidence | 从子代理输出提取，无法提取则要求子代理补充 |
| evidence 不匹配 exit criteria | 标记 blocked + 触发 Ralph Loop 重试 |
| 悬空引用 | 自动修复或标记 blocked |
| 有 blocked 任务未处理 | 强制执行 Mutation Protocol，不跳入下一阶段 |

## 用户可见提示

拦截发生时输出结构化信息：

```
⚠️ 任务 [ID 3] 未通过完成检查：

  缺失项:
  - WBS 状态仍为 "doing"（已自动修正为 "done"）
  - evidence 为空（已从子代理输出提取: "test passed, 8/8"）

  验证通过后可继续。
```

或：

```
🚫 无法推进到 Phase 4：

  阻塞项:
  - 任务 [ID 5] status=blocked (理由: API key 未配置)
  - 任务 [ID 7] status=doing (未完成)

  必须先解决以上阻塞项才能进入质量验证阶段。
```

## 与 Iron Laws 的关系

本 workflow 是以下铁律的执行层保障：
- **Iron Law 3**: No completion claims without fresh verification evidence
- **Iron Law 5**: No WBS `done` without evidence
