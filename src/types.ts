/**
 * SPM Event Types
 *
 * 借鉴 OpenHands event_service_base.py 的事件持久化设计，
 * 为 SPM 六阶段生命周期提供结构化审计轨迹。
 */

// ============================================================
// Event kinds — 对应 SPM 的六个阶段和关键操作
// ============================================================
export enum EventKind {
  // Phase transitions
  PHASE_START = 'phase.start',
  PHASE_END = 'phase.end',

  // Subagent lifecycle
  SUBAGENT_DISPATCH = 'subagent.dispatch',
  SUBAGENT_RESULT = 'subagent.result',

  // Tool calls
  TOOL_INVOKE = 'tool.invoke',
  TOOL_RESULT = 'tool.result',

  // WBS ledger mutations
  WBS_CREATE = 'wbs.create',
  WBS_UPDATE = 'wbs.update',

  // Quality gates
  QUALITY_GATE = 'quality.gate',

  // Errors and recovery
  ERROR = 'error',
  RALPH_RETRY = 'ralph.retry',
}

// ============================================================
// Core event interface
// ============================================================
export interface SPMEvent {
  /** UUID — unique per event */
  id: string;

  /** Event kind (phase.start, subagent.dispatch, …) */
  kind: EventKind;

  /** ISO 8601 timestamp */
  timestamp: string;

  /** Which phase this event belongs to */
  phase: string;

  /** Session identifier for multi-session grouping */
  sessionId?: string;

  /** Arbitrary payload — task id, agent name, duration, error info … */
  data?: Record<string, any>;

  /** Elapsed ms since phase.start (only on phase.end / tool.result) */
  durationMs?: number;
}

// ============================================================
// Security gate types
// ============================================================
export type ConfirmationMode = 'never' | 'risky' | 'always';
export interface EventQuery {
  phase?: string;
  kind?: EventKind;
  sessionId?: string;
  since?: string; // ISO timestamp
  limit?: number;
}

export interface PhaseSummary {
  phase: string;
  startTime: string;
  endTime?: string;
  durationMs?: number;
  eventCount: number;
  errors: SPMEvent[];
  subagents: { name: string; result: 'ok' | 'fail'; durationMs?: number }[];
}
