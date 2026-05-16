<p align="center">
  <img src="https://img.shields.io/badge/SPM-v3.1.0-76B900?style=for-the-badge" alt="Version" />
  <img src="https://img.shields.io/badge/OpenClaw-Skill-6366f1?style=for-the-badge" alt="OpenClaw Skill" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License" />
  <img src="https://img.shields.io/badge/ClawHub-spm-oklch(62%_0.22_260)?style=for-the-badge" alt="ClawHub" />
</p>

# SPM — Super Project Manager

> **Production-grade project management skill for AI coding agents.**
>
> Structured WBS tracking · hash attestation security · auto context injection · 6-phase lifecycle · 22 workflows · multi-agent orchestration.
>
> 生产级 AI 编程项目管理技能 — WBS 任务台账 · 哈希完整性保护 · 上下文自动注入 · 六阶段生命周期 · 子代理编排。

---

## Why SPM?

AI coding agents are powerful but easily lose context in long sessions. **SPM solves this** by introducing a structured task ledger (WBS) as the single source of truth, protected by hash attestation, and automatically injected into every tool call.

| Without SPM | With SPM |
|-------------|----------|
| "Where did I stop last time?" | 📋 WBS ledger: precise breakpoint recovery |
| Merge conflicts everywhere | 🌿 Git worktree isolation |
| "It works on my machine" | ✅ Every report includes fresh verification evidence |
| Random debugging attempts | 🔍 Systematic 4-step debugging + AST-Grep |
| Write code first, think later | 📐 IntentGate → Design → review → implement |
| "Did we test this?" | 🛡️ Three-tier quality gates + auto-retry |
| Agent stuck on error | 🔄 Model fallback + Ralph Loop auto-recovery |
| Context window overload | 📊 Preemptive compaction with token tracking |

---

## Quick Start

```bash
# Install via ClawHub
clawhub install spm

# Or clone from GitHub
git clone https://github.com/zhbcher/openclaw-spm.git

# Initialize your project
bash scripts/init-spm.sh

# Secure your WBS ledger
bash scripts/attest-wbs.sh
```

Then start coding:

```
You: "Build a JWT auth system"

SPM auto-triggers →
  0. Deep context scan → project map generated
  1. Prometheus-style interview: intent classify → research first → scope lock
  2. You approve design → WBS plan generated
  3. You say "go" → auto-execution:
     ├─ Git worktree isolation
     ├─ Agent 1: Database schema + migrations
     ├─ Agent 2: JWT middleware
     ├─ Agent 3: Auth routes (TDD)
     ├─ Agent 4: Tests
     ├─ Parallel dispatch for independent tasks
     ├─ Model fallback on provider errors
     ├─ Hashline edit verification after every change
     ├─ Todo enforcement gate before quality phase
     ├─ 3-stage code review + comment checker
     └─ Ralph Loop auto-retry on verification failure
  4. Quality gates pass → merge to main
  5. Delivery summary with full evidence package
```

---

## Core Architecture

```
                      SPM ORCHESTRATOR
    Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
   Context    Require    Planning  Execute   Quality   Delivery
     │           │          │         │         │         │
   Auto       Human      Human    Auto +    Auto      Human
             Review     Review   Enforce           Decision
```

### Six-Phase Lifecycle

| Phase | Key Activities | Gate |
|-------|---------------|------|
| **0. Context Init** | Project scan, context-map generation, hash protection | Auto |
| **1. Requirement** | Intent classification, research-first, scope lock, design doc | Human approval |
| **2. Planning** | WBS decomposition, file mapping, task ledger, adversarial review | Human confirmation |
| **3. Execution** | Git worktree, subagent dispatch, TDD, hashline verification, parallel tasks | Todo enforcement gate |
| **4. Quality** | Verification gate, Ralph Loop auto-retry, 3-stage review, comment checker | Auto + Model fallback |
| **5. Delivery** | Branch merge, deploy (opt), delivery summary, ledger closeout | Human decision |

---

## Key Features

### 🔒 Security & Precision
- **WBS Hash Attestation** — SHA-256 integrity protection. Tampered ledgers auto-detected and blocked.
- **Hashline Edit Verification** — Every `edit`/`write` git-diff validated after execution. OldText removed, newText present, no side effects.
- **Edit Error Recovery** — Auto-detect `oldString not found` / `found multiple times` patterns → force re-read → correct retry.
- **Write-First-Read Guard** — Cannot overwrite a file you haven't read in this session.
- **IntentGate** — Confirm understanding before any action. "I understand this as X, delivering Y, not touching Z."

### 🤖 Automation & Resilience
- **Hook Auto-Injection** — Active WBS tasks automatically injected into agent context before every tool call.
- **Session Recovery** — `session-recovery.py` generates a recovery report from heartbeat logs.
- **Heartbeat Logging** — Every 10 minutes: what's active, what's done, evidence, resume point.
- **Model Fallback** — Provider error (rate_limit/quota/overloaded) → auto-switch through fallback chain. 17 error types classified.
- **Ralph Loop** — Verification failure → auto-retry with strategy change. 3 rounds max, then escalate.
- **Todo Enforcement** — WBS status, evidence, criteria triple-check before advancing to quality phase.

### 📊 Intelligence
- **Prometheus Interview Mode** — Intent classification (6 types) → research codebase first → ask user only what's needed → scope lock.
- **Deep Context Initialization** — Auto-scan entire project → generate context-map.md → phase-specific section injection.
- **Preemptive Compaction** — Real-time token budget tracking. Auto-compress at 60%/80%/90% thresholds with recovery point preservation.
- **AST-Grep Integration** — Structured code search and rewrite (replace fragile grep/sed). Pattern-based refactoring and anti-pattern detection.

### 🎯 Quality
- **Three-Tier Quality Gates** — Always required / Ask first / Never allowed.
- **Comment Checker** — Auto-detect and flag AI-flavored redundant comments. 7 detection patterns, auto-clean at threshold.
- **3-Stage Code Review** — Spec compliance → Engineering quality → Final integration verification.
- **Evidence Requirement** — No task marked `done` without verifiable evidence.

### 📂 Parallel & Scale
- **Parallel Task Pointers** — `.active_ledger` symlink + `switch-ledger.sh` for multi-task isolation.
- **Git Worktree Isolation** — Physical environment separation for parallel work.
- **WBS Mutation Protocol** — Formalized split/insert/skip/reorder/abandon operations with audit trail.
- **Task Resume Info** — Auto-record subagent session IDs for seamless continuation.

---

## Six Iron Laws

| # | Law | Enforcement |
|---|------|------------|
| 0 | **先读后写** — 覆盖已有文件前必须读过它 | Write Guard |
| 1 | **无批准设计不写代码** | Phase 1/2 gate |
| 2 | **无失败测试不写生产代码** | TDD workflow |
| 3 | **无新鲜验证不报完成** | Ralph Loop + Todo Enforcement |
| 4 | **无根因分析不行修复** | Systematic Debugging |
| 5 | **无证据不标 done** | Hashline Verification + Todo Enforcement |

---

## Project Structure

```
spm/
├── SKILL.md                   # Skill definition (22 workflows)
├── README.md                  # This file
├── CHANGELOG.md
├── workflows/                 # 22 workflow references
│   ├── prometheus-interview.md       # Deep requirement interview
│   ├── deep-context-initialization.md # Phase 0 project scan
│   ├── ralph-loop.md                 # Auto-retry on failure
│   ├── hashline-edit-verification.md # Post-edit validation
│   ├── comment-checker.md            # AI-comment detection
│   ├── preemptive-compaction.md      # Context window management
│   ├── todo-enforcement.md           # Completion gate
│   ├── model-fallback.md             # Provider error recovery
│   ├── ast-grep-lsp.md               # Structured code search
│   └── ... (+13 more)
├── subagents/                 # Subagent prompt templates
├── references/                # Best practices, model-fallback, recovery patterns
├── templates/                 # Copy to your project
├── scripts/                   # Run or auto-trigger
├── CHECKPOINTS/               # Phase hard-gate templates
├── CHECKLISTS/                # Completion checklists
├── schemas/                   # JSON schema definitions
└── docs/                      # Design references, guides
```

---

## License

MIT © SPM Contributors. See [LICENSE](LICENSE) for details.

---

<p align="center">
  <sub>Built with ❤️ for the OpenClaw community</sub>
</p>
