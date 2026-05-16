# Deep Context Initialization — 深度上下文扫描

> 借鉴 OMO `/init-deep`。在 SPM Phase 1 之前可选执行，自动扫描项目全貌并生成结构化说明书，补强 WBS 拆解和 Cold-Start Context Brief 的盲区。

## 何时触发

- 首次进入项目（无 `docs/spm/context-map.md`）
- 项目结构发生重大变化（新增模块、重构目录）
- 用户说「先扫描项目」「了解项目全貌」
- Phase 1 需求阶段启动时，检查 `context-map.md` 是否存在且哈希未失效

## 输出物

**单一输出文件**：`docs/spm/context-map.md`

> 注意：不像 OMO 那样生成多层 AGENTS.md。SPM 只需要一份项目级上下文说明书，避免污染项目原有文件结构。

---

## 执行流程

### Step 1: 结构扫描

```bash
# 目录深度与文件分布
find . -type d -not -path '*/\.*' -not -path '*/node_modules/*' -not -path '*/dist/*' -not -path '*/build/*' | awk -F/ '{print NF-1}' | sort -n | uniq -c | tail -10

# 代码密集目录 Top 20
find . -type f \( -name "*.ts" -o -name "*.py" -o -name "*.js" -o -name "*.go" -o -name "*.rs" -o -name "*.md" \) -not -path '*/node_modules/*' | sed 's|/[^/]*$||' | sort | uniq -c | sort -rn | head -20

# 入口文件
find . -maxdepth 3 -type f \( -name "index.ts" -o -name "main.py" -o -name "main.go" -o -name "App.tsx" -o -name "index.js" \) -not -path '*/node_modules/*'

# 配置文件
find . -maxdepth 2 -type f \( -name "*.json" -o -name "*.yaml" -o -name "*.toml" -o -name "*.config.*" -o -name "Makefile" -o -name "Dockerfile" \) -not -path '*/node_modules/*' -not -path '*/.git/*'

# 已有文档
find . -type f \( -name "README.md" -o -name "AGENTS.md" -o -name "CLAUDE.md" -o -name "CONTRIBUTING.md" -o -name "ARCHITECTURE.md" \) -not -path '*/node_modules/*'
```

### Step 2: 关键文件读取

读取以下文件（如果存在），提取关键信息：
- `package.json` / `pyproject.toml` / `go.mod` → 依赖、脚本、项目元数据
- `README.md` → 项目简介
- 已有的 `AGENTS.md` / `CLAUDE.md` → 已有约定
- 入口文件（index.ts / main.py 等）→ 模块导出结构
- 顶层配置（tsconfig、eslint、prettier）→ 编码规范

### Step 3: 生成 context-map.md

按以下模板生成（50-150 行，禁止通用废话）：

```markdown
# Project Context Map — [项目名]

> 自动生成于 {TIMESTAMP} · SPM Deep Context Init
> 基准提交: {SHORT_SHA} · 分支: {BRANCH}

## 项目概要
{1-2 句话：做什么 + 核心技术栈}

## 目录结构
```
{root}/
├── src/           # 主源码
│   ├── index.ts   # 入口
│   ├── routes/    # API 路由
│   └── lib/       # 共享工具
├── tests/         # 测试
└── docs/          # 文档
```

## 模块职责地图
| 目录 | 职责 | 依赖 | 文件数 |
|------|------|------|--------|
| src/routes | API 路由定义 | src/lib, src/types | 12 |
| src/lib | 共享工具函数 | — | 8 |
| tests | 集成测试 | src/routes | 15 |

## 入口与关键符号
| 符号 | 类型 | 位置 | 用途 |
|------|------|------|------|
| App | Class | src/index.ts:15 | Express 应用初始化 |

## 项目约定
{从配置文件、现有 AGENTS.md、代码模式中提取}

## 反模式（本项目禁止的）
{从注释中的 DON'T / NEVER / DEPRECATED 提取，或从现有代码模式推断}

## 开发命令
```bash
npm run dev      # 启动开发服务器
npm test         # 运行测试
npm run build    # 生产构建
```

## 注意事项
{陷阱、已知限制、特殊配置}

## 文件完整性
- 生成时间: {TIMESTAMP}
- 扫描文件数: {N}
- SHA-256: {HASH}
```

### Step 4: 哈希保护

```bash
sha256sum docs/spm/context-map.md > docs/spm/.context-map.hash
```

后续每次使用 context-map.md 前，验证哈希是否匹配。不匹配 → 标记过期 → 提示重新扫描。

---

## 上下文注入规则

**注入时机**：
- Phase 1（需求）启动时，注入「项目概要」「目录结构」「项目约定」三个 section
- Phase 2（计划）生成 WBS 时，注入「模块职责地图」「入口与关键符号」
- 子代理 Cold-Start Context Brief 中，注入「注意事项」「反模式」

**注入方式**：
- 不重复注入全量内容
- 每次只注入与该阶段相关的 section
- 注入后在 WBS Heartbeat Log 中记录注入的 section 列表

---

## 与 SPM 现有流程的关系

```
Phase 0 [NEW]            Phase 1                   Phase 2
┌──────────────┐        ┌──────────────┐        ┌──────────────┐
│ Deep Context │──→    │ Requirement  │──→    │ Planning     │
│ Init         │        │              │        │              │
│              │        │ context-map  │        │ context-map  │
│ context-map  │        │ §概要+约定   │        │ §模块+入口   │
│ .md          │        │              │        │              │
└──────────────┘        └──────────────┘        └──────────────┘
```

---

## 触发粒度

| 项目规模 | 扫描深度 | 预计耗时 |
|---------|---------|---------|
| <50 文件 | 全量扫描 | <1 分钟 |
| 50-200 文件 | 扫描至 depth 3 | 2-3 分钟 |
| 200-1000 文件 | 扫描至 depth 2 + 入口文件 | 3-5 分钟 |
| >1000 文件 | 只扫一级目录 + 入口 | 5-8 分钟 |

---

## 与 OMO `/init-deep` 的核心差异

| 维度 | OMO `/init-deep` | SPM Deep Context Init |
|------|-----------------|----------------------|
| 输出 | 多层 AGENTS.md（根 + 子目录） | 单文件 context-map.md |
| 调度 | 后台 explore agent + 并行 | 主会话内串行 |
| 工具依赖 | LSP + AST-Grep | 纯 bash + read |
| 触发 | 手动命令 `/init-deep` | SPM Phase 1 自动检查 |
| 用途 | 全局知识注入 | SPM 流程上下文增强 |
