<p align="center">
  <img src="https://img.shields.io/badge/SPM-v3.0.0-76B900?style=for-the-badge" alt="Version" />
  <img src="https://img.shields.io/badge/OpenClaw-Skill-6366f1?style=for-the-badge" alt="OpenClaw Skill" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License" />
  <img src="https://img.shields.io/badge/ClawHub-spm-oklch(62%_0.22_260)?style=for-the-badge" alt="ClawHub" />
</p>

# SPM — Super Project Manager

> **Production-grade project management skill for AI coding agents.**
>
> Structured WBS tracking · hash attestation security · auto context injection · 5-phase lifecycle · 13 workflows · multi-agent orchestration.
>
> 生产级 AI 编程项目管理技能 — WBS 任务台账 · 哈希完整性保护 · 上下文自动注入 · 五阶段生命周期 · 子代理编排。

---

## Why SPM?

AI coding agents are powerful but easily lose context in long sessions. **SPM solves this** by introducing a structured task ledger (WBS) as the single source of truth, protected by hash attestation, and automatically injected into every tool call.

| Without SPM | With SPM |
|-------------|----------|
| "Where did I stop last time?" | 📋 WBS ledger: precise breakpoint recovery |
| Merge conflicts everywhere | 🌿 Git worktree isolation |
| "It works on my machine" | ✅ Every report includes fresh verification evidence |
| Random debugging attempts | 🔍 Systematic 4-step debugging |
| Write code first, think later | 📐 Design → review → implement |
| "Did we test this?" | 🛡️ Three-tier quality gates |

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
  1. Soul-searching: stateless or stateful? Refresh tokens?
  2. Design doc: architecture, API contract, data model
  3. You approve → WBS plan generated
  4. You say "go" → auto-execution:
     ├─ Git worktree isolation
     ├─ Agent 1: Database schema + migrations
     ├─ Agent 2: JWT middleware
     ├─ Agent 3: Auth routes (TDD)
     ├─ Agent 4: Tests
     ├─ Parallel dispatch for independent tasks
     ├─ Code review + quality gates
     └─ Delivery summary
  5. Done → merge to main
```

---

## Core Architecture

```
                      SPM ORCHESTRATOR
         Requirement → Planning → Execution → Quality → Delivery
              │            │           │          │          │
         Human Review  Human Review  Automated  Automated  Human Decision
```

### Five-Phase Lifecycle

| Phase | Key Activities | Gate |
|-------|---------------|------|
| **1. Requirement** | Soul-searching protocol, brainstorming, design doc | Human approval |
| **2. Planning** | WBS decomposition, file mapping, task ledger | Human confirmation |
| **3. Execution** | Git worktree, subagent dispatch, TDD, heartbeat logging | Automated |
| **4. Quality** | Verification gate, 3-stage code review, quality gates | Automated |
| **5. Delivery** | Branch merge, deploy (opt), delivery summary, ledger closeout | Human decision |

---

## Key Features

### 🔒 Security
- **WBS Hash Attestation** — SHA-256 integrity protection. Tampered ledgers auto-detected and blocked.
- **Delimiter Encapsulation** — `---BEGIN/END WBS DATA---` markers prevent prompt injection.
- **Verification-first** — `verify-wbs.sh` runs before every context injection.

### 🤖 Automation
- **Hook Auto-Injection** — Active WBS tasks automatically injected into agent context before every tool call. No more "forgetting the plan."
- **Session Recovery** — `session-recovery.py` generates a recovery report from heartbeat logs in one command.
- **Heartbeat Logging** — Every 10 minutes: what's active, what's done, evidence, resume point.

### 📂 Multi-Task Support
- **Parallel Task Pointers** — `.active_ledger` symlink + `switch-ledger.sh` for conflict-free multi-task isolation.
- **Git Worktree Isolation** — Physical environment separation for parallel work.
- **WBS Mutation Protocol** — Formalized split/insert/skip/reorder/abandon operations with audit trail.

### 🎯 Quality
- **Three-Tier Quality Gates** — Always required / Ask first / Never allowed.
- **Evidence Requirement** — No task marked `done` without verifiable evidence (git diff, test output, command result).
- **13 Workflows** — Brainstorming, TDD, subagent-driven development, code review, systematic debugging, git worktrees, and more.

### 🏃 Adoption Path
- **Full Mode** — Complete 5-phase lifecycle with all gates and workflows.
- **Minimal Mode** — 5 rules for small projects (<10 tasks). Upgrade to full mode when complexity grows.

---

## Installation

**Requirements:** OpenClaw 2026.4+, Node.js, npm, git

```bash
# Option 1: ClawHub (recommended)
clawhub install spm

# Option 2: Git clone
git clone https://github.com/zhbcher/openclaw-spm.git ~/.openclaw/skills/spm
```

```json
// openclaw.json
{
  "SPM": {
    "enabled": true,
    "config": {
      "heartbeat_interval": "10m",
      "auto_checkpoint": true,
      "quality_gates_enabled": true,
      "wbs_ledger_path": "docs/spm/ledger.md",
      "parallel_subagents": true
    }
  }
}
```

---

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `init-spm.sh` | Initialize project structure |
| `attest-wbs.sh` | Generate WBS integrity hash |
| `verify-wbs.sh` | Verify WBS hasn't been tampered |
| `inject-wbs-context.py` | Auto-inject active tasks into agent context |
| `session-recovery.py` | Generate interruption recovery report |
| `switch-ledger.sh` | Switch between parallel task ledgers |

---

## WBS Task Ledger

The **single source of truth**. Every task tracked with exit criteria, evidence, and mutation audit trail.

```markdown
| ID | Work Package | Dependencies | Exit Criteria | Evidence | Status |
|----|-------------|--------------|---------------|----------|--------|
| 1  | Project setup | - | Structure + deps | `npm ls` ✅ | done |
| 2  | Core feature A | 1 | API returns correct data | `curl` output | doing |
| 3  | Integration test | 1,2 | All flows pass | `npm test` | todo |
```

---

## Five Iron Laws

1. **No code without approved design**
2. **No production code without a failing test** (TDD)
3. **No completion report without fresh verification**
4. **No fix without root cause analysis**
5. **No `done` without evidence**

---

## Project Structure

```
spm/
├── SKILL.md                   # Skill definition
├── UPGRADE.md                  # Migration guide
├── CHANGELOG.md
├── COMMUNITY.md
├── workflows/                  # 13 workflow references
├── subagents/                  # 4 subagent prompt templates
├── templates/                  # ✂️ Copy to your project
├── scripts/                    # ▶️ Run or auto-trigger
├── references/                 # 📖 Best practices, recovery patterns
├── CHECKPOINTS/                # Phase hard-gate templates
├── CHECKLISTS/                 # Completion checklists
├── schemas/                    # JSON schema definitions
├── skills/                     # 16 specialized sub-skills
└── docs/                       # Design references, guides
```

---

## Acknowledgments

SPM builds upon and extends the **Superpowers** skill suite's workflow patterns — brainstorming, TDD, subagent development, code review, systematic debugging, and git worktrees. On top of this foundation, SPM adds:

- PM-grade project management (soul-searching, assumption docs, safe sandbox)
- WBS task ledger with exit criteria and evidence tracking
- Three-tier quality gates (Always / Ask / Never)
- Heartbeat-based interruption recovery
- Complete delivery pipeline

Security design inspired by **[planning-with-files](https://github.com/lgdy88/planning-with-files)** — hash attestation, delimiter encapsulation, and hook-based context injection.

---

## License

MIT © SPM Contributors. See [LICENSE](LICENSE) for details.

---

<p align="center">
  <sub>Built with ❤️ for the OpenClaw community</sub>
</p>
