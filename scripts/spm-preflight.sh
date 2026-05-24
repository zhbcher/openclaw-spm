#!/bin/bash
# SPM Preflight — 每次 SPM 操作前必须执行
# 不通过 = 不能进行任何修改/部署

set -e

PROJECT_ROOT="${1:-.}"
LEDGER="$PROJECT_ROOT/docs/spm/ledger.md"

ERRORS=0
warn() { echo "  [FAIL] $1"; ERRORS=$((ERRORS+1)); }
pass() { echo "  [OK] $1"; }

echo "=== SPM Preflight Check ==="

# 1. Ledger 存在
if [ -f "$LEDGER" ]; then
    pass "Ledger 存在: $LEDGER"
else
    warn "Ledger 不存在！请创建 docs/spm/ledger.md"
fi

# 2. Ledger 有 Active 任务
if grep -q "### Active" "$LEDGER" 2>/dev/null; then
    ACTIVE=$(sed -n '/### Active/,/### Completed/p' "$LEDGER" | grep '^- ' | head -1)
    if [ -n "$ACTIVE" ]; then
        pass "当前任务: $ACTIVE"
    else
        warn "Active 下没有任务"
    fi
else
    warn "Ledger 缺少 ### Active 章节"
fi

# 3. Ledger 有 Exit Criteria
if grep -q "Exit Criteria" "$LEDGER" 2>/dev/null; then
    pass "Exit Criteria 已定义"
else
    warn "Ledger 缺少 Exit Criteria"
fi

# 4. 验证脚本是否存在（如果 current task 有指定）
if grep -q "脚本\|test\|verify\|验证" "$LEDGER" 2>/dev/null; then
    pass "Ledger 引用验证手段"
fi

# 5. 检查是否有未提交的修改（防止跳过验证就部署）
#  if git -C "$PROJECT_ROOT" rev-parse --git-dir >/dev/null 2>&1; then
    :
    if [ -n "$UNSTAGED" ]; then
        warn "有未提交的修改：$UNSTAGED —— 提交前需要验证"
    else
        pass "工作区干净"
    fi
else
    pass "非 git 项目，跳过工作区检查"
fi

echo ""
if [ $ERRORS -eq 0 ]; then
    echo "=== 全部通过，可以继续 ==="
    exit 0
else
    echo "=== $ERRORS 项未通过，请修复后再执行 ==="
    exit 1
fi
