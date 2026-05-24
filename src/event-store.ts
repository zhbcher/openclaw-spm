/**
 * SPM Event Store
 *
 * 借鉴 OpenHands event_service_base.py：每个 event 存为一个 JSON 文件，
 * 按 phase 分目录，支持按 kind/timestamp 过滤查询。
 *
 * 文件结构：
 *   .spm_events/
 *     {sessionId}/
 *       phase-0_context/
 *         {uuid}.json
 *       phase-3_execution/
 *         {uuid}.json
 */
import { writeFileSync, mkdirSync, readdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { randomUUID } from 'crypto';
import type { SPMEvent, EventQuery, PhaseSummary, EventKind } from './types.js';

export class EventStore {
  private baseDir: string;
  private sessionId: string;

  constructor(opts: { baseDir?: string; sessionId?: string } = {}) {
    this.baseDir = opts.baseDir || '.spm_events';
    this.sessionId = opts.sessionId || randomUUID().slice(0, 8);
  }

  get session(): string {
    return this.sessionId;
  }

  /** 确保 phase 目录存在 */
  private dir(phase: string): string {
    const d = join(this.baseDir, this.sessionId, phase);
    if (!existsSync(d)) mkdirSync(d, { recursive: true });
    return d;
  }

  /** 写入单个事件 */
  emit(event: Omit<SPMEvent, 'id' | 'timestamp'>): SPMEvent {
    const ev: SPMEvent = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      ...event,
    };
    const file = join(this.dir(ev.phase), `${ev.id}.json`);
    writeFileSync(file, JSON.stringify(ev, null, 2));
    return ev;
  }

  /** 便捷：开始一个阶段，返回 { event, end() } */
  beginPhase(phase: string, data?: Record<string, any>) {
    const start = Date.now();
    const event = this.emit({ kind: 'phase.start' as EventKind, phase, data });
    return {
      event,
      end: (extra?: Record<string, any>) =>
        this.emit({
          kind: 'phase.end' as EventKind,
          phase,
          data: extra,
          durationMs: Date.now() - start,
        }),
    };
  }

  /** 便捷：子代理分发 */
  subagentDispatch(phase: string, agent: string, task: string) {
    return this.emit({
      kind: 'subagent.dispatch' as EventKind,
      phase,
      data: { agent, task },
    });
  }

  /** 便捷：子代理结果 */
  subagentResult(
    phase: string,
    agent: string,
    result: 'ok' | 'fail',
    data?: Record<string, any>,
  ) {
    return this.emit({
      kind: 'subagent.result' as EventKind,
      phase,
      data: { agent, result, ...data },
    });
  }

  /** 便捷：WBS 更新 */
  wbsUpdate(phase: string, taskId: string, status: string) {
    return this.emit({
      kind: 'wbs.update' as EventKind,
      phase,
      data: { taskId, status },
    });
  }

  /** 便捷：质量门禁 */
  qualityGate(phase: string, gate: string, passed: boolean, detail?: string) {
    return this.emit({
      kind: 'quality.gate' as EventKind,
      phase,
      data: { gate, passed, detail },
    });
  }

  /** 便捷：错误 */
  error(phase: string, err: Error, context?: Record<string, any>) {
    return this.emit({
      kind: 'error' as EventKind,
      phase,
      data: {
        message: err.message,
        stack: err.stack?.split('\n').slice(0, 6).join('\n'),
        ...context,
      },
    });
  }

  /** 查询事件（简单内存过滤，适用于单次会话） */
  query(q: EventQuery = {}): SPMEvent[] {
    const sessionDir = join(this.baseDir, this.sessionId);
    if (!existsSync(sessionDir)) return [];

    const results: SPMEvent[] = [];
    const phases = q.phase ? [q.phase] : readdirSync(sessionDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    for (const phase of phases) {
      const phaseDir = join(sessionDir, phase);
      if (!existsSync(phaseDir)) continue;
      for (const file of readdirSync(phaseDir)) {
        if (!file.endsWith('.json')) continue;
        const raw = readFileSync(join(phaseDir, file), 'utf8');
        const ev: SPMEvent = JSON.parse(raw);

        if (q.kind && ev.kind !== q.kind) continue;
        if (q.since && ev.timestamp < q.since) continue;

        results.push(ev);
      }
    }

    results.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    return q.limit ? results.slice(0, q.limit) : results;
  }

  /** 生成阶段摘要（用于交付报告） */
  summarize(): PhaseSummary[] {
    const sessionDir = join(this.baseDir, this.sessionId);
    if (!existsSync(sessionDir)) return [];

    return readdirSync(sessionDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => this._summarizePhase(d.name))
      .filter(Boolean) as PhaseSummary[];
  }

  private _summarizePhase(phase: string): PhaseSummary | null {
    const events = this.query({ phase });
    if (events.length === 0) return null;

    const starts = events.filter(e => e.kind === 'phase.start');
    const ends = events.filter(e => e.kind === 'phase.end');
    const errors = events.filter(e => e.kind === 'error');
    const subagents = events.filter(e => e.kind === 'subagent.result');

    return {
      phase,
      startTime: starts[0]?.timestamp || events[0].timestamp,
      endTime: ends[0]?.timestamp,
      durationMs: ends[0]?.durationMs,
      eventCount: events.length,
      errors,
      subagents: subagents.map(e => ({
        name: e.data?.agent || 'unknown',
        result: e.data?.result || 'fail',
        durationMs: e.durationMs,
      })),
    };
  }
}
