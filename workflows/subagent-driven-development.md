# Subagent-Driven Development (with WBS Binding)

## Overview

Execute implementation plan by dispatching a fresh subagent per task. Each subagent receives a **cold-start context brief** and a **model tier recommendation**. After each task: spec compliance review → code quality review. All WBS changes tracked via Mutation Log.

**WBS Binding Rule:** Every subagent dispatch MUST update the WBS ledger status. Every subagent return MUST update WBS status + attach evidence.

**Cold-Start Rule:** Every subagent receives the task's Context Brief — they must be able to execute without reading any other task's details.

**Model Routing Rule:** Dispatch subagent at the task's `model_tier` — each tier maps to a different provider to avoid rate-limit contention during parallel dispatch.

| Tier | Model | Provider | Use Case |
|------|-------|----------|----------|
| fast | `step35` | nvidia-nvcf | boilerplate, config, simple refactor |
| standard | `SensenovaDeepSeek` | sensenova | regular implementation, tests |
| strong | `DeepSeekV4Pro` | deepseek | architecture, root-cause, invariants |

**Sub-Skill Auto-Discovery:** Before dispatching any subagent, scan `skills/` directory for applicable sub-skills:

```
1. Detect project tech stack (package.json → React/Vue/Next, go.mod → Go, Cargo.toml → Rust)
2. Check skills/ directory for matching sub-skills:
   - React/Vue/Next project → auto-include skills/spm-frontend/SKILL.md
   - (future: API project → spm-api, testing focus → spm-testing, design focus → spm-design-system)
3. If match found → prepend to subagent prompt:
   "Before implementing, read ~/.openclaw/workspace/spm/skills/spm-frontend/SKILL.md for frontend coding standards."
```

**Sub-skills never block execution** — if a sub-skill file is missing, the task continues normally. Sub-skills are quality enhancers, not gates.

```
# Tier-based dispatch example:
sessions_spawn(task="...", model=get_model_for_tier(task.model_tier))
```

## Heartbeat

Subagent execution can run for extended periods without visible progress. To support session recovery and progress tracking:

**Every subagent dispatch → MUST:** update heartbeat log with subagent session ID and expected model.
**Every subagent return → MUST:** update heartbeat log with completion status and evidence.
**Idle wait > 5 min →** write a heartbeat entry noting what we're waiting for.

Heartbeat table format:
```
| Time | Active | Completed | Evidence | Resume Point |
|------|--------|-----------|----------|-------------|
| HH:MM | Subagent T2 (step35) | T1 spec review done | review passed | T2 subagent session |
```

## The Process

```
For each task from WBS ledger:
  1. Read task: ID, Context Brief, exit_criteria, model_tier
  2. Update WBS: status=doing
  3. **Heartbeat: log subagent dispatch**
  4. Build dispatch prompt = Context Brief + full task description + model tier
  5. Dispatch implementer subagent with context_brief (cold-start compatible)
  6. **sessions_yield — wait with heartbeat:** if wait > 5 min without return, write heartbeat entry
  7. Implementer asks questions? Answer them.
  8. Implementer completes → reports DONE/DONE_WITH_CONCERNS/BLOCKED
  9. BLOCKED? → Check plan-mutation.md for appropriate mutation (split/insert/skip)
  10. **Heartbeat: log subagent return + evidence**
  11. Update WBS: attach evidence output, status=done (or blocked)
  12. Dispatch spec compliance reviewer (standard model)
  13. Issues? → Implementer fixes → Re-review
  14. Dispatch code quality reviewer (standard model)
  15. Issues? → Implementer fixes → Re-review
  16. **Heartbeat: log review results**
  17. Mark task complete in WBS ledger
```

### Handling BLOCKED Status

When a subagent returns BLOCKED:

1. Analyze the blocker against `references/plan-mutation.md`
2. If task is too large → **split** mutation
3. If prerequisite missing → **insert** mutation
4. If task no longer needed → **skip** mutation
5. Record all mutations in WBS Mutation Log
6. If major mutation (split/insert/abandon) → re-trigger adversarial plan review

## Dispatch Prompt Template

Use `subagents/implementer-prompt.md` as the base, and prepend the task's Context Brief:

```
## Cold-Start Context

{task.context_brief}

---

{rest of implementer-prompt.md}
```

The implementer gets:
- **Context Brief** (self-contained cold-start info)
- **Full task description** (from plan)
- **Exit criteria** (from WBS)
- **Model tier** (routing hint for the subagent dispatch)
- **Work directory** (from project root)

## Review Workflow

After implementation completes:

```
1. Spec Reviewer (standard model)
   - Check code matches spec exactly
   - Scan for YAGNI violations
   - Verify all acceptance criteria
   - Template: subagents/spec-reviewer-prompt.md

2. Code Quality Reviewer (standard model)
   - Clean code, testing, security, design
   - Severity: Critical / Important / Minor
   - Template: subagents/quality-reviewer-prompt.md
```

Each reviewer gets the task's Context Brief + implementation report.

## Mutation During Execution

If plan needs to change mid-execution:

```bash
# After mutation recorded in WBS Mutation Log
./scripts/checkpoint.sh phase-2  # Re-validate plan

# For major mutations (split/insert/abandon):
# Re-trigger adversarial plan review
```

See `references/plan-mutation.md` for complete mutation protocols.

## Parallel Dispatch

For independent tasks (no shared files, no dependency chains), dispatch simultaneously. See `workflows/dispatching-parallel-agents.md`.

**Cold-start compatibility makes parallel dispatch safer** — each agent gets everything it needs in Context Brief.
