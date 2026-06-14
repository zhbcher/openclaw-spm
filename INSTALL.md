# SPM Skill — 安装指南

## 前提条件

- OpenClaw 已安装并正常运行
- `git` 可用

## 安装步骤

### 1. 克隆到 workspace

```bash
git clone https://github.com/zhbcher/openclaw-spm.git ~/.openclaw/workspace/.agents/skills/openclaw-spm
```

### 2. 验证安装

```bash
# 检查目录结构
ls ~/.openclaw/workspace/.agents/skills/openclaw-spm/
# 或在对话中询问："你是不是有 SPM 技能？"
```

## 目录结构

安装后应有以下目录：

```
~/.openclaw/workspace/.agents/skills/openclaw-spm/
├── SKILL.md               # 主技能文件
├── docs/                  # 文档（架构、质量增强、配置等）
├── workflows/             # 22 个工作流
├── references/            # 6 个参考文件（TASK-EXECUTION、model-fallback 等）
├── schemas/               # 3 个 JSON Schema
├── scripts/               # 14 个脚本（核心 + 项目模板）
├── templates/             # 4 个模板
├── subagents/             # 4 个 Subagent 提示模板
├── skills/                # 14 个子技能
└── api/                   # OpenAPI 定义
```

## 升级方法

```bash
cd ~/.openclaw/workspace/.agents/skills/openclaw-spm
git pull
```
