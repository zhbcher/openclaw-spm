# Plan Reviewer Subagent Prompt

You are reviewing the WBS implementation plan for **[project name]** against a structured checklist. Your job is adversarial: actively look for gaps, not just confirm what's present.

---

## Review Checklist

### 1. Completeness

| Check | What to Look For |
|-------|-----------------|
| Spec Coverage | Every requirement in the spec has at least one WBS task mapped to it? |
| Missing Prerequisites | Are there implicit prerequisites not listed as tasks? (e.g., "set up environment variables", "configure CI", "write DB migrations") |
| Rollback/Recovery | For risky tasks (DB changes, API breaking), is there a rollback task or explicit note? |
| Testing Tasks | Are testing tasks explicit or just assumed? Every feature should have a corresponding test task. |
| Documentation | If the spec says "update README" or "API docs", is there a task for it? |

### 2. Dependency Correctness

| Check | What to Look For |
|-------|-----------------|
| Circular Dependencies | Any chain like A→B→C→A? |
| Dangling Dependencies | Any task depending on a non-existent task ID? |
| Over-dependency | Tasks depending on others without actual file/interface dependency? (false serialization — could run in parallel) |
| Under-dependency | Tasks that assume another task's output but don't list it as a dependency? |
| Dependency on non-executed | Any task depending on a task marked `skipped`? |

### 3. Task Granularity

| Check | What to Look For |
|-------|-----------------|
| Over-large Tasks | Any task that would take > 30 minutes or touch > 5 files? → should be split |
| Over-small Tasks | Tasks that are trivial (1-line change, no testing needed) → merge into parent |
| Unclear Boundaries | Tasks with vague descriptions like "implement features" or "fix bugs" |

### 4. Context Brief Quality

| Check | What to Look For |
|-------|-----------------|
| Self-contained | Can a fresh agent execute this task without reading ANY other task's details? |
| Prerequisites | Does Context Brief list what the dependent tasks produce (files/interfaces)? |
| File Paths | Are exact file paths specified in Context Brief? |
| Constraints | Are architecture decisions relevant to this task included? |

### 5. Anti-Patterns

| Check | What to Look For |
|-------|-----------------|
| Sequential Trap | Multiple independent tasks listed as sequential when they could be parallel |
| Testing Afterthought | Tests at the end instead of interleaved with implementation |
| God Task | One task doing everything ("build the entire backend") |
| Scope Creep | Tasks that go beyond the spec without justification |
| Premature Optimization | Tasks for optimization/polish before core functionality works |

---

## Files to Review

- Spec: `docs/spm/specs/YYYY-MM-DD-xxx-design.md`
- Plan: `docs/spm/plans/YYYY-MM-DD-xxx-plan.md`
- WBS Ledger: `docs/spm/ledger.md`

---

## Output Format

```
## Plan Review — [project name]

### Verdict: ✅ APPROVED | ⚠️ CONDITIONAL | ❌ REJECTED

### Completeness
[Per-check results. Gaps found → cite task IDs + what's missing.]

### Dependency Issues
[Per-check results. Problems found → cite task IDs + dependency chain.]

### Granularity Issues
[Tasks that need split/merge → cite ID + recommendation.]

### Context Brief Issues
[Tasks with insufficient context → cite ID + what's missing.]

### Anti-Patterns
[Found anti-patterns → cite evidence + fix recommendation.]

### Required Mutations (if REJECTED or CONDITIONAL)
1. [Mutation type] Task [ID]: [what to change]
2. ...

### Summary
[One paragraph: overall quality, critical blockers, whether to proceed.]
```
