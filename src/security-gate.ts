/**
 * SPM Security Gate
 *
 * 借鉴 OpenHands app_conversation_service_base.py 的三级确认策略：
 *   NeverConfirm  → 全自动
 *   ConfirmRisky  → LLM 判断风险
 *   AlwaysConfirm → 每步人工确认
 *
 * SPM 应用：Phase 3 Execution 中自动拦截危险操作。
 */
import type { ConfirmationMode } from './types.js';

// ============================================================
// 风险等级
// ============================================================
export type RiskLevel = 'safe' | 'risky' | 'dangerous';

export interface ToolCall {
  tool: string;
  args: Record<string, any>;
}

export interface GateVerdict {
  level: RiskLevel;
  reason: string;
  requiresConfirm: boolean; // 是否需要人工确认
}

// ============================================================
// 危险命令黑名单
// ============================================================
const DANGEROUS_PATTERNS: RegExp[] = [
  /rm\s+-rf\s+\//,           // rm -rf /
  /rm\s+-rf\s+\*\s*$/,       // rm -rf *
  /rm\s+-rf\s+~/,            // rm -rf ~
  /git\s+push\s+--force.*origin.*main/, // force push main
  /git\s+push\s+-f.*origin.*master/,
  /DROP\s+(TABLE|DATABASE)/i, // SQL drop
  /chmod\s+777/,             // world-writable
  />\s*\/dev\/(sda|disk)/,   // raw disk write
];

const RISKY_PATTERNS: RegExp[] = [
  /rm\s+-rf/,               // any rm -rf
  /git\s+push\s+--force/,   // any force push
  /git\s+reset\s+--hard/,   // hard reset
  /chmod\s+[0-7]{3}/,       // any chmod
  /sudo\s+/,                 // sudo
  /\.env/,                   // env file changes
  /npm\s+publish/,          // npm publish
  /docker\s+rm/,            // docker remove
];

// ============================================================
// SecurityGate
// ============================================================
export class SecurityGate {
  private mode: ConfirmationMode;
  private allowList: string[];    // 始终允许的工具
  private blockList: string[];    // 始终阻止的工具

  constructor(opts: {
    mode?: ConfirmationMode;
    allowList?: string[];
    blockList?: string[];
  } = {}) {
    this.mode = opts.mode || 'risky';
    this.allowList = opts.allowList || ['read', 'memory_search', 'memory_get'];
    this.blockList = opts.blockList || [];
  }

  /** 主入口：判断一个工具调用是否需要确认 */
  evaluate(call: ToolCall): GateVerdict {
    // 白名单 → 永远安全
    if (this.allowList.includes(call.tool)) {
      return { level: 'safe', reason: 'whitelist', requiresConfirm: false };
    }

    // 黑名单 → 永远阻止
    if (this.blockList.includes(call.tool)) {
      return { level: 'dangerous', reason: 'blacklist', requiresConfirm: true };
    }

    // 检查命令内容（exec 调用）
    if (call.tool === 'exec' && call.args.command) {
      return this._evaluateCommand(call.args.command);
    }

    // 检查文件操作
    if (call.tool === 'write' || call.tool === 'edit') {
      return this._evaluateFileOp(call.args);
    }

    // 其他工具 → 默认 risky
    if (this.mode === 'never') {
      return { level: 'safe', reason: 'mode=never', requiresConfirm: false };
    }

    return { level: 'risky', reason: 'unknown tool', requiresConfirm: this.mode !== 'never' };
  }

  /** 检查命令是否危险 */
  private _evaluateCommand(command: string): GateVerdict {
    // 危险模式 → 强制确认
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(command)) {
        return {
          level: 'dangerous',
          reason: `匹配危险模式: ${pattern}`,
          requiresConfirm: true,
        };
      }
    }

    // 风险模式 → 按确认策略决定
    for (const pattern of RISKY_PATTERNS) {
      if (pattern.test(command)) {
        return {
          level: 'risky',
          reason: `匹配风险模式: ${pattern}`,
          requiresConfirm: this.mode !== 'never',
        };
      }
    }

    // 安全命令
    return { level: 'safe', reason: '常规命令', requiresConfirm: false };
  }

  /** 检查文件操作 */
  private _evaluateFileOp(args: Record<string, any>): GateVerdict {
    const path = args.path || args.file || '';

    // 写入系统目录
    if (/^\/(etc|usr|bin|sbin|var|opt|tmp)\//.test(path)) {
      return {
        level: 'risky',
        reason: `系统目录写入: ${path}`,
        requiresConfirm: this.mode !== 'never',
      };
    }

    // 覆盖模式
    if (args.overwrite === true || args.force === true) {
      return {
        level: 'risky',
        reason: 'overwrite/force 模式',
        requiresConfirm: this.mode !== 'never',
      };
    }

    return { level: 'safe', reason: '项目目录写入', requiresConfirm: false };
  }

  /** 批量评估 */
  evaluateBatch(calls: ToolCall[]): GateVerdict[] {
    return calls.map(c => this.evaluate(c));
  }

  /** 获取需要确认的调用 */
  filterRisky(calls: ToolCall[]): ToolCall[] {
    return calls.filter(c => this.evaluate(c).requiresConfirm);
  }

  /** 切换模式 */
  setMode(mode: ConfirmationMode) {
    this.mode = mode;
  }
}
