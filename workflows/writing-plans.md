# Writing Plans — Implementation Plan + WBS Ledger

## Overview

Transform approved design into bite-sized implementation tasks. Each task is 2-5 minutes of work with exact file paths, complete code, and verification commands. Simultaneously create the WBS task ledger.

## Step 1: Scope Check

If the spec covers multiple independent subsystems, suggest splitting into separate plans.

## Step 2: Map File Structure

Before defining tasks, document which files will be created/modified and each file's responsibility.

## Step 3: Create Bite-Sized Tasks

Each step is one action (2-5 min):

```
Task 1: Write the failing test → Run → Implement → Run → Commit
Task 2: (same pattern)
```

Each task step must contain:
- Exact file paths (Create/Modify/Test)
- Complete code blocks (no placeholders)
- Exact commands with expected output

## Step 4: Create WBS Ledger

Simultaneously create the WBS ledger at `docs/spm/ledger.md`:

```markdown
## WBS
| ID | Work Package | Dependencies | Exit Criteria | Evidence | Status |
|----|-------------|---------|---------------|----------|--------|
| 1  | [Task name]  | -        | [exit criteria] | - | todo |
```

## Step 5: Self-Review Plan

1. **Spec coverage:** Every spec requirement has at least one task
2. **Placeholder scan:** No "TBD", "TODO", "implement later"
3. **Type consistency:** Function signatures match across tasks

## Step 6: Execution Handoff

Present 2 options to user:
1. **Subagent-Driven** (recommended) — fresh subagent per task + WBS binding
2. **Inline Execution** — execute in this session

## Outputs

- `docs/spm/plans/YYYY-MM-DD-feature-plan.md` — detailed plan
- `docs/spm/ledger.md` — WBS ledger with all tasks
- User-approved execution mode
