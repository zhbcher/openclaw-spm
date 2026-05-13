<p align="center">
  <img src="https://img.shields.io/badge/SPM-v3.0.0-76B900?style=for-the-badge" alt="Version" />
  <img src="https://img.shields.io/badge/OpenClaw-Skill-6366f1?style=for-the-badge" alt="OpenClaw Skill" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License" />
  <img src="https://img.shields.io/badge/ClawHub-spm-oklch(62%_0.22_260)?style=for-the-badge" alt="ClawHub" />
</p>

# SPM — Super Project Manager

> **Production-grade project management for AI coding agents.**
>
> WBS task ledger · Hash attestation · Auto context injection · 5-phase lifecycle · Multi-agent orchestration.

📖 *[中文版 → README.md](README.md)*

---

## Why SPM?

AI coding agents are powerful but lose context in long sessions. SPM introduces a structured **WBS task ledger** as the single source of truth — protected by SHA-256 hash attestation and automatically injected into every tool call.

| Without SPM | With SPM |
|-------------|----------|
| "Where did I stop?" | 📋 WBS ledger: precise breakpoint recovery |
| Merge conflicts everywhere | 🌿 Git worktree isolation |
| No verification | ✅ Fresh evidence with every report |
| Random debugging | 🔍 Systematic 4-step method |
| Code-first mindset | 📐 Design → review → implement |
| Untested changes | 🛡️ Three-tier quality gates |

---

## Quick Start

```bash
clawhub install spm            # Install via ClawHub
git clone https://github.com/zhbcher/openclaw-spm.git  # Or clone
bash scripts/init-spm.sh       # Initialize project
bash scripts/attest-wbs.sh     # Secure WBS ledger
```

---

## Architecture

```
Requirement → Planning → Execution → Quality → Delivery
     │            │           │          │          │
Human Review  Human Review  Automated  Automated  Human Decision
```

| Phase | Activities | Gate |
|-------|-----------|------|
| **1. Requirement** | Soul-searching, brainstorming, design doc | Human approval |
| **2. Planning** | WBS decomposition, file mapping, ledger | Human confirmation |
| **3. Execution** | Worktrees, subagents, TDD, heartbeat | Automated |
| **4. Quality** | Verification, 3-stage review, gates | Automated |
| **5. Delivery** | Merge, deploy, summary, closeout | Human decision |

---

## Key Features

### 🔒 Security
- **WBS Hash Attestation** — SHA-256 integrity; tampered ledgers auto-blocked
- **Delimiter Encapsulation** — Prevents prompt injection
- **Verification-first** — Integrity check before every context injection

### 🤖 Automation
- **Hook Auto-Injection** — Active tasks in context every tool call
- **Session Recovery** — One-command recovery from heartbeat logs
- **Heartbeat Logging** — Active/completed/evidence/resume every 10min

### 📂 Multi-Task
- **Parallel Pointers** — `.active_ledger` symlink for conflict-free isolation
- **Git Worktrees** — Physical environment separation
- **Mutation Protocol** — Formal split/insert/skip/reorder with audit trail

### 🎯 Quality
- **Three-Tier Gates** — Always / Ask / Never
- **Evidence Required** — No `done` without verifiable proof
- **13 Workflows** — TDD, code review, debugging, deployment

### 🏃 Adoption
- **Full Mode** — Complete lifecycle
- **Minimal Mode** — 5 rules for small projects

---

## Scripts

| Script | Purpose |
|--------|---------|
| `init-spm.sh` | Initialize project structure |
| `attest-wbs.sh` | Generate WBS integrity hash |
| `verify-wbs.sh` | Verify WBS hasn't been tampered |
| `inject-wbs-context.py` | Auto-inject tasks into context |
| `session-recovery.py` | Generate recovery report |
| `switch-ledger.sh` | Switch between task ledgers |

---

## Iron Laws

1. No code without approved design
2. No production code without a failing test
3. No completion report without fresh verification
4. No fix without root cause analysis
5. No `done` without evidence

---

## License

MIT © SPM Contributors. See [LICENSE](LICENSE).

---

## Acknowledgments

Built on **Superpowers** workflow patterns. Security design inspired by **[planning-with-files](https://github.com/lgdy88/planning-with-files)**.
