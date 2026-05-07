# Subagent-Driven Development (with WBS Binding)

## Overview

Execute implementation plan by dispatching a fresh subagent per task. Each subagent must update the WBS ledger upon completion. After each task: spec compliance review → code quality review.

**WBS Binding Rule:** Every subagent dispatch MUST update the WBS ledger status. Every subagent return MUST update WBS status + attach evidence.

## The Process

```
For each task from WBS ledger:
  1. Update WBS: status=doing
  2. Dispatch implementer subagent with full task text
  3. Implementer asks questions? Answer them.
  4. Implementer completes → reports DONE/DONE_WITH_CONCERNS/BLOCKED
  5. Update WBS: attach evidence output, status=done (or blocked)
  6. Dispatch spec compliance reviewer
  7. Issues? → Implementer fixes → Re-review
  8. Dispatch code quality reviewer
  9. Issues? → Implementer fixes → Re-review
  10. Mark task complete in WBS ledger
```

## Implementer Subagent Prompt

```
You are implementing WBS Task [ID]: [task name]

## Task Description
[FULL TEXT from plan — provide directly, don't make subagent read file]

## Your Job
1. Implement exactly what the task specifies
2. Write tests (TDD: RED → GREEN → REFACTOR)
3. Verify implementation works
4. Commit your work
5. Self-review
6. Report back

Work from: [directory]

## Report Format
- Status: DONE | DONE_WITH_CONCERNS | BLOCKED | NEEDS_CONTEXT
- What you implemented
- What you tested and test results
- Files changed
- Evidence (command output, test results)
```

## Spec Reviewer Prompt

```
You are reviewing WBS Task [ID] for spec compliance.

1. Does code do EXACTLY what the spec requires?
2. Any YAGNI violations (features NOT in spec)?
3. Are all acceptance criteria met?

Output: ✅ or ❌ with file/line references
```

## Code Quality Reviewer Prompt

```
You are reviewing WBS Task [ID] for code quality.

1. Clean Code: Clear names, no leftovers, focused functions
2. Testing: Real tests, edge cases, proper assertions
3. Security: No hardcoded secrets, SQL, unsafe evals
4. Design: Single responsibility, follows patterns

Severity: Critical / Important / Minor
```
