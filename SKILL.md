---
name: SPM
description: Production-grade software project development skill for OpenClaw. Use when starting new projects, implementing complex features, or executing multi-step development tasks that require structured end-to-end management. Combines Superpowers workflows, enhanced quality gates, and WBS task ledger tracking.
metadata:
  openclaw:
    emoji: "🚀"
    requires:
      anyBins: ["node", "npm", "git"]
allowed-tools: ["read", "write", "edit", "exec", "process", "sessions_spawn", "subagents", "cron", "memory_search", "memory_get"]
---

# SPM — Super Project Manager

## Overview

SPM is a comprehensive skill for software project development in OpenClaw. It integrates:

- **Superpowers** (12 skills): Design brainstorming, implementation planning, TDD, subagent-driven development, code review, systematic debugging, git worktrees
- **PM enhancements**: Soul-searching protocol, assumption documentation, safe sandbox (/freeze & /guard), three-tier quality gates, project scaffolding, deployment pipeline
- **WBS Executor**: Structured task ledger with exit criteria, evidence tracking, heartbeat logging, interruption recovery, delivery summary

**Core Philosophy:** SPM is an orchestrator, not a monolith. Each phase triggers the right workflow. The WBS task ledger is the single source of truth for tracking.

## When to Use

- Starting a new software project from scratch
- Implementing complex multi-file features
- Any task that spans multiple steps or sessions
- Work that requires quality gates, code review, or TDD

**When NOT to use:**
- Single-line fixes or typo corrections
- Quick one-file changes with obvious scope
- Pure brainstorming without execution intent

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      SPM ORCHESTRATOR                     │
│  SKILL.md — Detects task type → Routes to correct phase  │
└──────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌──────────────────┐
│  REQUIREMENT   │   │   PLANNING    │   │    EXECUTION     │
│ ─────────────  │   │  ──────────   │   │   ────────────   │
│ • Brainstorming│   │ • Write Plan  │   │ • Git Worktree   │
│ • Soul-Search  │   │ • WBS Ledger  │   │ • TDD Cycle      │
│ • Design Doc   │   │ • Review Plan │   │ • Subagent Dev   │
│ • Assumptions  │   │ • Dependencies│   │ • Parallel Tasks │
└───────┬───────┘   └───────┬───────┘   └────────┬─────────┘
        └───────────────────┼────────────────────┘
                            ▼
┌───────────────┐   ┌───────────────┐   ┌──────────────────┐
│    QUALITY     │   │   DELIVERY    │   │  TRACKING (ALL)  │
│ ─────────────  │   │  ──────────   │   │  ──────────────  │
│ • Verification │   │ • Finish Brch │   │ • WBS Ledger     │
│ • Code Review  │   │ • Deploy (opt)│   │ • Heartbeat Log  │
│ • 3-Tier Gates │   │ • Delivery    │   │ • State Tracking │
│ • Debugging    │   │ • Cleanup     │   │ • Recovery       │
└───────┬───────┘   └───────┬───────┘   └──────────────────┘
        └───────────────────┼────────────────────┘
                            ▼
              ┌─────────────────────────┐
              │    SUBAGENT DISPATCH     │
              │  ─────────────────────  │
              │  Impl. Subagent         │
              │  Spec Reviewer          │
              │  Code Quality Reviewer  │
              │  Parallel Subagents     │
              └─────────────────────────┘
```

## The Complete Lifecycle

```
┌────────────────────────────────────────────────────────────────────┐
│  PHASE 1: REQUIREMENT                          PHASE 2: PLANNING  │
│  ┌────────────┐  ┌────────────┐              ┌──────────┐        │
│  │Brainstorm  │→ │Design Doc  │──Manual──▶  │WBS Plan  │         │
│  │(灵魂拷问)  │  │(明确假设)  │  Review     │(任务分解)│         │
│  └────────────┘  └────────────┘              └────┬─────┘        │
└────────────────────────────────────────────────────┼──────────────┘
                                                      │
┌─────────────────────────────────────────────────────┼──────────────┐
│  PHASE 3: EXECUTION (Automated after Manual Start) │              │
│                                                     ▼              │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌─────────────┐    │
│  │Worktree  │→ │Subagent  │→ │Parallel    │→ │TDD + Commit │    │
│  │Setup     │  │Task Exec │  │Subagents   │  │Verify       │    │
│  └──────────┘  └──────────┘  └────────────┘  └──────┬──────┘    │
│                                                      │           │
└──────────────────────────────────────────────────────┼───────────┘
                                                       │
┌──────────────────────────────────────────────────────┼───────────┐
│  PHASE 4: QUALITY                PHASE 5: DELIVERY   │           │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐   │           │
│  │Verify Gate │→ │Code Review │→ │Finish Branch │   │           │
│  │(3-Tier)    │  │(3-Stage)   │  │Deploy (opt)  │   │           │
│  └────────────┘  └────────────┘  └──────┬───────┘   │           │
│                                          │           │           │
│  ┌────────────────────────────────────┐ │           │           │
│  │ DELIVERY SUMMARY + WBS CLOSEOUT    │◀┘           │           │
│  └────────────────────────────────────┘             │           │
└──────────────────────────────────────────────────────┘           │
                                                                    │
┌────────────────────────────────────────────────────────────────────┐
│  TRACKING LAYER (Runs Throughout All Phases)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ WBS Ledger   │  │ Heartbeat    │  │ State Tracking       │   │
│  │ (Single SOT) │  │ (10 min)     │  │ (project-state.json) │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

## Core Artifact: WBS Task Ledger

The WBS task ledger is the **single source of truth** for the entire project. Every phase creates its artifacts AND updates the ledger.

**Ledger location:** `docs/spm/ledger.md`

**Minimal ledger template:**

```markdown
# WBS Task Ledger — [Project Name]

## Task Summary
- Assignment: [one-line]
- Outcome: [what working software looks like]
- Success criteria: [how we verify]

## WBS
| ID | Work Package | Depends | Exit Criteria | Evidence | Status |
|----|-------------|---------|---------------|----------|--------|
| 1  | Setup scaffold | - | Init script runs, tests pass | npm test output | done |
| 1.1| Install deps | 1 | All deps installed | npm ls | done |
| 2  | Core feature A | 1 | API returns correct data | curl output | todo |

## Active State
- Current item:
- Last completed:
- Last checkpoint:
- Resume from here:

## Heartbeat Log
| Time | Active | Completed | Evidence | Resume point |
|------|--------|-----------|----------|-------------|
| HH:MM | Task 2 | Task 1 | build passes | Task 2 subagent |

## Delivery Summary
[Final output mapping back to original assignment]
```

**Allowed statuses:** `todo`, `doing`, `done`, `blocked`, `skipped`

**Rule:** No item marked `done` without evidence (file diff, test output, command result).

---

## Workflow by Phase

### Phase 1: Requirement (Manual — User Review Required)

**Trigger:** User says "build X", "start project", "implement feature"

**Sub-flow: Soul-Searching Protocol**
1. Before any design work, throw back **3 lethal probing questions** about scope/purpose/constraints
2. Surface assumptions explicitly: "I'm assuming X — correct me now or I'll proceed"

**Sub-flow: Brainstorming (see workflows/brainstorming.md)**
1. Explore project context
2. Ask clarifying questions (one at a time)
3. Propose 2-3 approaches with trade-offs
4. Present design in sections, user approves per section
5. Write design doc to `docs/spm/specs/`
6. Spec self-review (placeholder scan, consistency, scope)
7. User reviews written spec

**Outputs:**
- `docs/spm/specs/YYYY-MM-DD-xxx-design.md`
- Updated WBS ledger: "Spec phase complete"

**Phase Gate:** User must approve spec before proceeding.

---

### Phase 2: Planning (Manual — User Review Required)

**Sub-flow: Implementation Plan (see workflows/writing-plans.md)**
1. Decompose spec into bite-sized tasks (2-5 min per step)
2. Each task has: exact file paths, complete code snippets, exact commands
3. Map file structure: which files created/modified
4. Create WBS ledger with all tasks (IDs, dependencies, exit criteria)
5. Self-review plan (spec coverage, placeholder scan, type consistency)

**Outputs:**
- `docs/spm/plans/YYYY-MM-DD-xxx-plan.md`
- Updated WBS ledger with all task rows

**Phase Gate:** User reviews plan, chooses execution mode:
- **Subagent-Driven** (recommended) — each task dispatched to fresh subagent
- **Inline Execution** — execute in current session

---

### Phase 3: Execution (Automated)

**Sub-flow: Git Worktree Setup (see workflows/using-git-worktrees.md)**
1. Create isolated worktree
2. Verify gitignore
3. Run project setup
4. Verify clean test baseline

**Sub-flow: Task Execution**
- For **Subagent-Driven**: see `workflows/subagent-driven-development.md`
- For **Inline**: see `workflows/executing-plans.md`
- For **Parallel Tasks**: see `workflows/dispatching-parallel-agents.md`

**Mandatory: WBS Binding**
Every subagent task MUST update the WBS ledger:
- Before dispatch: set status to `doing`
- On completion: set status to `done` + attach evidence
- On block: set status to `blocked` + describe blocker

**Sub-flow: TDD (see workflows/test-driven-development.md)**
Each implementation slice follows RED → Verify RED → GREEN → Verify GREEN → REFACTOR → Commit

**Heartbeat: Every 10 minutes**
Update the heartbeat log in the WBS ledger.

---

### Phase 4: Quality (Automated)

**Sub-flow: Verification Gate (see workflows/verification-before-completion.md)**
Iron Law: NO completion claims without fresh verification evidence.

**Sub-flow: Three-Stage Code Review (see workflows/code-review.md)**
1. **Stage 1: Spec Compliance** — Code matches spec exactly (no YAGNI)
2. **Stage 2: Engineering Quality** — Tests, security, clean code
3. **Stage 3: Final Review** — Full suite pass, integration verified

**Sub-flow: Three-Tier Quality Gates (see workflows/quality-gates.md)**
- **Always do:** Run tests, follow naming, validate inputs
- **Ask first:** DB changes, new deps, CI changes
- **Never do:** Commit secrets, skip review for complex changes

**Sub-flow: Systematic Debugging** (if tests fail) — see `workflows/systematic-debugging.md`
4-phase root cause tracing: Error Capture → Hypothesis → Evidence → Fix & Verify

**Outputs:**
- Code review report
- Quality gate results (passed/failed per check)
- Updated WBS ledger (tasks moved to done with evidence)

---

### Phase 5: Delivery (Manual Decision)

**Sub-flow: Finish Branch (see workflows/finishing-a-development-branch.md)**
1. Verify all tests pass
2. Determine base branch
3. Present 4 options: Merge / PR / Keep / Discard
4. Execute choice + cleanup worktree

**Sub-flow: Deploy (Optional — see workflows/shipping-and-launch.md)**
If deploying: release plan → rollback plan → monitoring → deploy → verify

**Sub-flow: Delivery Summary**
Write WBS ledger's Delivery Summary section:
- Completed work mapped to original assignment
- Evidence package (test results, file diffs, command outputs)
- Remaining blockers/skipped items
- Residual risks
- Final handoff note

---

## Subagent Strategy

### Task Dispatch (Single)

```
For each task from WBS ledger:
  1. Read task (ID, description, acceptance criteria)
  2. Update WBS: status=doing
  3. Dispatch implementer subagent
     → FULL task text + file context (not "read the file")
  4. Implementer completes → reports DONE/DONE_WITH_CONCERNS/BLOCKED
  5. Update WBS: attach evidence, status=done (or blocked)
```

### Task Dispatch (Parallel - Independent Tasks)

```
For parallel-eligible tasks from WBS ledger:
  1. Identify tasks with NO inter-dependencies
  2. For each: update WBS (status=doing)
  3. Dispatch ALL implementer subagents simultaneously
  4. Wait for ALL to return
  5. For each completed: update WBS (status=done + evidence)
  6. For any blocked: update WBS (status=blocked + reason)
  7. Verify no conflicts between parallel results
```

**Parallel eligibility:** Tasks that touch DIFFERENT files/subsystems with no shared state.

### Review Dispatch

```
After implementation:
  1. Dispatch spec compliance reviewer
  2. Issues found? → Dispatch implementer to fix → Re-review
  3. Dispatch code quality reviewer
  4. Issues found? → Dispatch implementer to fix → Re-review
  5. All clear? → Mark task complete
```

### Prompt Templates

See `subagents/` directory for full prompts:
- `subagents/implementer-prompt.md`
- `subagents/spec-reviewer-prompt.md`
- `subagents/quality-reviewer-prompt.md`

---

## Quality Gates

### Three-Tier System

**Always Do:**
- Run test suite before any commit
- Follow project naming conventions
- Validate all inputs (security baseline)
- Perform code style checks
- Keep documentation in sync

**Ask First:**
- Database schema changes
- Adding new dependencies
- Modifying CI/CD configuration
- Breaking API contracts
- Changing performance-critical paths

**Never Do:**
- Commit secrets or credentials
- Edit vendor directories
- Remove failing tests without approval
- Skip code review for complex changes
- Bypass security checks

### Iron Laws

**Law 1: No code without approved design.** Spec must be written AND user-approved before any implementation.

**Law 2: No production code without a failing test first.** TDD Iron Law — if you wrote code before test, delete it and start over.

**Law 3: No completion claims without fresh verification evidence.** Run the exact verification command this turn. Show output. THEN claim.

**Law 4: No fixes without root cause investigation.** Symptom fixes are failure. Complete Phase 1-3 of Systematic Debugging before any fix.

**Law 5: No WBS `done` without evidence.** File diffs, test output, command results — something verifiable.

---

## Instruction Priority

1. **User's explicit instructions** (AGENTS.md, direct commands) — highest
2. **SPM skill rules** (Iron Laws, workflows) — default process
3. **Default system prompt** — lowest

If user says "skip TDD" or "skip review", follow the user. Iron Laws are defaults, not overrides.

---

## Project Structure

```
project-root/
├── docs/spm/
│   ├── specs/                 # Design documents
│   │   └── YYYY-MM-DD-feature-design.md
│   ├── plans/                 # Implementation plans
│   │   └── YYYY-MM-DD-feature-plan.md
│   └── ledger.md              # WBS task ledger (single source of truth)
├── .worktrees/                # Git worktrees (auto-created)
├── src/                       # Source code
├── tests/                     # Test suite
└── package.json
```

---

## Integration with OpenClaw

Enable SPM in `~/.openclaw/openclaw.json`:

```json
{
  "skills": {
    "entries": {
      "SPM": {
        "enabled": true,
        "config": {
          "heartbeat_interval": "10m",
          "auto_checkpoint": true,
          "quality_gates_enabled": true,
          "wbs_ledger_path": "docs/spm/ledger.md",
          "parallel_subagents": true,
          "deployment_enabled": false
        }
      }
    }
  }
}
```

---

## Quick Start

```
1. User: "Build a user authentication system"
2. SPM triggers brainstorming → 3 soul-searching questions
3. Design doc written → user approves
4. Plan written → WBS ledger created → user reviews
5. User: "Go" → automated execution begins
6. Worktree setup → Subagent dispatch (with WBS binding)
7. Each task: TDD → commit → review → ledger update
8. Parallel tasks if independent (WBS tracks each)
9. All tasks done → Quality gate → Finish branch
10. Delivery summary written to ledger
```

---

## See Also

- `workflows/` — Detailed workflow docs for each phase
- `references/` — Templates, best practices, recovery patterns
- `schemas/` — JSON schemas for project state, ledger, quality gates
- `subagents/` — Subagent dispatch prompt templates
- `scripts/` — Automation scripts (init, quality check, auto-execute)
- `templates/` — PRD, plan, review checklist templates
- `docs/skill-selection-matrix.md` — Design rationale document
