# Model Fallback — 模型自动回退系统

> 借鉴 OMO 的 model-fallback + runtime-fallback 双钩子。子代理遇到 provider 错误时自动切换模型重试，消除因 rate_limit/quota/overloaded 导致的无效失败。

## 错误分类表

| 错误关键词 | 类型 | 可重试 | 重试策略 |
|-----------|------|--------|---------|
| `rate_limit` `429` `too many requests` | Rate Limit | ✅ | 切换 provider + 等待 30s |
| `quota` `billing` `insufficient` | Quota | ✅ | 切换 provider（标记当前 provider 不可用） |
| `overloaded` `503` `service unavailable` | Overloaded | ✅ | 等待 30s → 同 provider 重试 1 次 → 仍失败则切换 |
| `timeout` `ETIMEDOUT` `ECONNRESET` | Network | ✅ | 同 provider 重试 1 次 → 仍失败则切换 |
| `model_not_found` `invalid model` | Config Error | ❌ | 直接报错，不重试 |
| `content_filter` `safety` `blocked` | Content Filter | ❌ | 直接报错，提示修改内容 |
| `context_length` `token limit` `too long` | Token Limit | ❌ | 截断输入后重试 |
| `auth` `unauthorized` `key` | Auth Error | ❌ | 直接报错，提示检查 API key |

## Fallback Chain 配置

```
SPM Tier 扩展（在原三档基础上增加 fallback_chain）：

fast:
  primary: step35 (nvidia-nvcf)
  fallback_chain:
    - MiniMaxM27 (blazeai)         # 同样快速便宜
    - GPT54 (custom)               # 最后手段

standard:
  primary: SensenovaDeepSeek (sensenova)
  fallback_chain:
    - DeepSeekV4Pro (deepseek)     # 同能力级
    - Qwen36Plus (blazeai)         # 备选推理模型
    - GPT54 (custom)               # 最后手段

strong:
  primary: DeepSeekV4Pro (deepseek)
  fallback_chain:
    - QwenMaxPreview (blazeai)     # 顶级推理
    - SensenovaDeepSeek (sensenova)# 备选
    - GPT54 (custom)               # 最后手段
```

## 执行流程

```
子代理 dispatch 失败:
  │
  ├─ 1. 分类错误（查上表）
  │     │
  │     ├─ 不可重试错误 → 标记 BLOCKED + 报告给主代理
  │     │
  │     └─ 可重试错误 →
  │           │
  │           ├─ 2. 从 fallback_chain 中取下一个 provider
  │           │     │
  │           │     ├─ 链已耗尽 → 标记 BLOCKED（reason: all_providers_exhausted）
  │           │     │
  │           │     └─ 有可用 provider →
  │           │           │
  │           │           ├─ 3. 等待 cooldown（rate_limit: 30s, 其他: 5s）
  │           │           ├─ 4. 切换到新 provider/model
  │           │           ├─ 5. 重新 dispatch（保持同一 Context Brief）
  │           │           └─ 6. 成功？ → 继续；失败？ → 回到步骤 2
```

## Ralph Loop 配合

Model Fallback 是 Ralph Loop 的前序步骤：

```
子代理失败
  │
  ├─ 是 provider/runtime 错误？
  │     │
  │     └─ YES → Model Fallback（切换模型重试，最多 2 次）
  │           │
  │           ├─ 成功 → 继续
  │           └─ 仍失败 → 转到 Ralph Loop（策略切换重试，最多 3 次）
  │
  └─ 是验证/逻辑错误？
        └─ 直接进 Ralph Loop
```

## 子代理 prompt 增强

在 `subagents/implementer-prompt.md` 中增加：

```markdown
## Model Information
- Primary model: {model_name} ({provider})
- Fallback chain: {fallback_list}
- If you encounter a provider error (rate_limit, quota, overloaded), the orchestrator will automatically retry with a different model. Do not give up — report the error and wait.
```

## 与 SPM 现有系统的关系

- 扩展 `workflows/subagent-driven-development.md` 的 Model Routing Rule
- 兼容 WBS Binding（每次重试都要更新 ledger）
- 失败次数计入 Ralph Loop 的循环计数
