# Hashline Edit 验证 — 编辑后自动校验

> 借鉴 OMO 的 hashline edit 机制。每次 `edit` / `write` 操作后自动验证：改动是否精确生效、其他内容未被意外破坏。

## 触发条件

- 每次 `edit` 工具调用后
- 每次 `write` 覆盖现有文件后
- 子代理声称完成但未附 diff 证据时

## 验证流程

```
edit/write 操作完成
  │
  ├─ Step 1: 存在性检查
  │   → 目标文件是否存在？预期行是否存在？
  │
  ├─ Step 2: 变更确认
  │   → git diff --no-color <file>
  │   → 验证:
  │     (a) oldText 确实已从文件中移除
  │     (b) newText 确实已出现在文件中
  │     (c) 改动行数 ≤ 预期行数 × 1.5（合理容差）
  │
  ├─ Step 3: 副作用检查
  │   → 改动的文件数 = 预期的文件数？
  │   → 非目标区域是否被意外修改？
  │
  └─ Step 4: 语法检查（可选，语言相关）
      → TypeScript/JS: npx tsc --noEmit（仅检查改动文件）
      → Python: python -m py_compile
      → JSON: python -c "import json; json.load(open(...))"
```

## 验证失败时的处理

| 失败类型 | 操作 |
|---------|------|
| 文件不存在 | 立即中止，报告路径错误 |
| oldText 未移除 | 再次执行 edit（可能是格式不匹配） |
| newText 未出现 | 检查 write/edit 返回值，重试 |
| 改动行数异常（>1.5倍预期） | 暂停，展示 diff 请求人工确认 |
| 副作用（意外修改其他区域） | `git checkout <file>` 回滚，重新执行 |
| 语法错误 | 自动回滚 + 报告具体错误行 |

## 与 WBS 的关系

验证结果作为 evidence 写入 WBS：

```markdown
| 3 | Core feature A | 1-2 | ... | API returns correct data | 
  edit validated: 3 files changed, 12 additions, 3 deletions, no side effects |
  done |
```

## 与 SPM 现有 Iron Laws 的关系

本 workflow 是 **Iron Law 5（No WBS done without evidence）** 的执行层实现。
