/**
 * SPM Token Budget Tracker
 *
 * 借鉴 OpenHands _create_condenser：
 *   LLMSummarizingCondenser(max_size=N, keep_recent=K)
 *   可配置的上下文预算，按用量分三级压缩。
 *
 * SPM 集成：替代 workflows/preemptive-compaction.md 中的硬编码阈值，
 * 从 config 读取阈值和策略参数。
 */
import type { SPMEvent } from './types.js';

// ============================================================
// 模型上下文窗口（自动检测，无需手动维护）
// ============================================================
const MODEL_WINDOWS: Record<string, number> = {
  'deepseek-v4': 1_000_000,
  'deepseek-v3': 200_000,
  'deepseek-chat': 128_000,
  'qwen3': 262_000,
  'minimax-m2': 200_000,
  'gpt-5': 200_000,
  'step-3': 128_000,
  'claude-3.5': 200_000,
  'claude-4': 200_000,
};

/** 从模型名称自动检测上下文窗口大小 */
function detectWindow(model: string): number {
  const lower = model.toLowerCase();
  for (const [key, size] of Object.entries(MODEL_WINDOWS)) {
    if (lower.includes(key)) return size;
  }
  return 200_000; // 保守默认
}

// ============================================================
// TokenBudgets
// ============================================================
export interface TokenBudgetConfig {
  /** 模型标识，用于自动检测上下文窗口 */
  model?: string;
  /** 上下文窗口大小（手动指定，覆盖自动检测） */
  windowSize?: number;
  /** 三级阈值（0-1 之间的比例），默认 0.6 / 0.8 / 0.9 */
  thresholds?: { light: number; medium: number; heavy: number };
  /** 压缩后保留的最近消息数 */
  keepRecent?: number;
  /** 压缩后代币上限 */
  maxSize?: number;
}

export interface BudgetReport {
  tokensUsed: number;
  windowSize: number;
  usagePct: number;
  level: 'none' | 'light' | 'medium' | 'heavy';
  keepRecent: number;
  maxSize: number;
  suggestion: string;
}

// ============================================================
// TokenBudget
// ============================================================
export class TokenBudget {
  private windowSize: number;
  private thresholds: { light: number; medium: number; heavy: number };
  private keepRecent: number;
  private maxSize: number;
  private toolAllocation: Map<string, { weight: number; priority: number }>;

  constructor(config: TokenBudgetConfig = {}, allocations?: Record<string, { weight: number; priority: number }>) {
    this.windowSize = config.windowSize || detectWindow(config.model || '');
    this.thresholds = config.thresholds || { light: 0.6, medium: 0.8, heavy: 0.9 };
    this.keepRecent = config.keepRecent || 4;
    this.maxSize = config.maxSize || this.windowSize;
    // Setup tool allocation map with defaults favoring CodeGraph tools as low-cost high-benefit
    this.toolAllocation = new Map<string, { weight: number; priority: number }>();
    const defaults: Record<string, { weight: number; priority: number }> = {
      'codegraph_context': { weight: 0.2, priority: 0.8 },
      'codegraph_search': { weight: 0.2, priority: 0.8 },
      'codegraph_explore': { weight: 0.5, priority: 0.8 },
      'codegraph_callers': { weight: 0.2, priority: 0.8 },
      'codegraph_callees': { weight: 0.2, priority: 0.8 },
      'codegraph_impact': { weight: 0.1, priority: 0.9 },
    };
    const merged = { ...defaults, ...allocations };
    for (const [tool, alloc] of Object.entries(merged)) {
      this.toolAllocation.set(tool, alloc);
    }
  }

  /** 估算 token 数（chars / ratio） */
  static estimateTokens(text: string, ratio = 3.5): number {
    return Math.ceil(text.length / ratio);
  }

  /** 从事件总数估算（假设每个事件 ~200 tokens） */
  static estimateFromEvents(events: SPMEvent[], avgTokensPerEvent = 200): number {
    return events.length * avgTokensPerEvent;
  }

  /** 检查当前用量并生成报告 */
  check(tokensUsed: number): BudgetReport {
    const usagePct = tokensUsed / this.windowSize;
    let level: BudgetReport['level'] = 'none';

    if (usagePct >= this.thresholds.heavy) level = 'heavy';
    else if (usagePct >= this.thresholds.medium) level = 'medium';
    else if (usagePct >= this.thresholds.light) level = 'light';

    const suggestions: Record<string, string> = {
      none: '无需压缩，剩余空间充足',
      light: `轻度压缩：清除已完成工具输出，合并重复 WBS 片段，保留最近 ${this.keepRecent} 条`,
      medium: `中度压缩：缩写子代理输出为结论+evidence，移除非关键讨论，目标 ≤ ${this.maxSize} tokens`,
      heavy: '重度压缩：所有已完成任务归档为 3 行摘要，启动新子会话，写入 Cold-Start Context Brief',
    };

    return {
      tokensUsed,
      windowSize: this.windowSize,
      usagePct: Math.round(usagePct * 10000) / 100,
      level,
      keepRecent: this.keepRecent,
      maxSize: this.maxSize,
      suggestion: suggestions[level],
    };
  }

  /** 轻量检查：仅返回是否需要压缩 */
  needsCompaction(tokensUsed: number): boolean {
    return tokensUsed / this.windowSize >= this.thresholds.light;
  }

  /** 格式化输出（兼容 Heartbeat Log 格式） */
  format(report: BudgetReport): string {
    const emoji: Record<string, string> = {
      none: '✅',
      light: '⚠️',
      medium: '🔶',
      heavy: '🔴',
    };
    return `${emoji[report.level]} ${report.usagePct}% (${report.tokensUsed}/${report.windowSize}) → ${report.suggestion}`;
  }

  /** 更新参数（运行时动态调整） */
  configure(patch: Partial<TokenBudgetConfig>) {
    if (patch.windowSize) this.windowSize = patch.windowSize;
    if (patch.thresholds) this.thresholds = { ...this.thresholds, ...patch.thresholds };
    if (patch.keepRecent !== undefined) this.keepRecent = patch.keepRecent;
    if (patch.maxSize !== undefined) this.maxSize = patch.maxSize;
  }

  // CodeGraph integration: get weight and priority for tool calls
  getWeight(toolName: string): number {
    return this.toolAllocation.get(toolName)?.weight ?? 1.0;
  }

  getPriority(toolName: string): number {
    return this.toolAllocation.get(toolName)?.priority ?? 0.5;
  }
}
