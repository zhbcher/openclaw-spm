# AST-Grep & LSP — 代码级精准操作

> 借鉴 OMO 的 tools/ast-grep 和 tools/lsp。SPM 现有 grep/read 只能做文本匹配，AST-Grep 能做**结构化搜索和重写**，大幅提升子代理调试和重构的精度。

## AST-Grep 安装

```bash
# 系统安装（推荐）
npm install -g @ast-grep/cli

# 验证
sg --version
```

如未安装，首次使用时会自动提示安装。

## AST-Grep 能做什么（grep 做不到的）

| 场景 | grep 做法 | AST-Grep 做法 |
|------|---------|-------------|
| 找所有 `useState` 调用 | grep "useState"（可能匹配注释/字符串） | `sg -p "useState($VAR)"` 只匹配 AST 节点 |
| 重命名变量 | sed 全局替换（危险） | `sg -p "$OLD" -r "$NEW" -U` 只改标识符 |
| 找特定模式的函数 | 正则（脆弱） | `sg -p "function $NAME($$$): Promise<$TYPE>"` |
| 检查是否用了废弃 API | grep + 人工判断 | `sg -p "deprecatedMethod($$$)"` 精准匹配 |

## SPM 中使用 AST-Grep 的时机

### Phase 3 — 执行阶段

```
实现完成后自检:
  sg -p "console.log($$$)" --json        # 检查遗留的 debug 日志
  sg -p "any" -l ts                      # 检查 TypeScript any 滥用
```

### Phase 4 — 系统调试

```
Phase 1: Error Capture
  → 定位报错行后:
  sg -p "function $FUNC_NAME($$$) { $$$ }" -l ts --json
  → 找出所有调用 $FUNC_NAME 的位置:
  sg -p "$FUNC_NAME($$$)" -l ts --json
```

### Phase 4 — Code Review

```
Stage 2: Engineering Quality
  # 检查反模式
  sg -p "as $$$" -l tsx                 # 查找 as 类型断言
  sg -p "var $X = $_" -l ts             # 查找 var 声明
  sg -p "TODO|FIXME|HACK"               # 查找遗留标记
```

## AST-Grep 命令速查

| 命令 | 用途 |
|------|------|
| `sg -p "pattern"` | 搜索 AST 模式 |
| `sg -p "old" -r "new" -U` | 重写（dry-run） |
| `sg -p "old" -r "new" -U --update` | 重写（实际修改文件） |
| `sg scan` | 用 YAML 规则文件扫描项目 |
| `sg -p "pattern" --json` | JSON 输出（可程序化处理） |
| `sg -p "pattern" -l ts` | 限制语言 |

## LSP 参考

OMO 内部集成了 LSP（语言服务器协议）用于工作区级别的符号查找和重命名。SPM 环境下 LSP 依赖 IDE/编辑器，不直接集成。**替代方案：**

- 符号查找 → `sg -p "pattern" --json` + grep 配合
- 跳转定义 → `read` 文件 + `grep` 定位
- 重命名 → AST-Grep 的 `-r` 重写模式

---

## 与现有 SPM 流程的关系

- **不改变 SPM 的工具白名单**（仍用 read/write/edit/exec）
- AST-Grep 通过 `exec("sg ...")` 调用
- 子代理在以下场景**强烈建议**使用 AST-Grep：
  - 重构已有代码
  - 排查 bug（找所有引用点）
  - 代码审查（检查反模式）
