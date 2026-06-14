/**
 * SPM Skill Loader
 *
 * 借鉴 OpenHands skill_loader.py + app_conversation_service_base.py：
 * - 多源加载（内置 → 用户 → 项目）
 * - 后者覆盖同名前者
 * - keyword/phases 触发器匹配
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// ============================================================
// Types
// ============================================================
export interface SkillMeta {
  name: string;
  version: string;
  description: string;
  triggers: {
    keywords: string[];
    phases: string[];
  };
  requires: string[];
  entry: string; // 入口文件相对路径
  source: 'builtin' | 'user' | 'project'; // 来源
  dir: string; // 技能目录绝对路径
}

// ============================================================
// Frontmatter parser — for built-in skills (SKILL.md)
// 简易解析：只处理 key: value 行，不依赖 js-yaml
// ============================================================
function parseFrontmatter(content: string): Record<string, any> | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const result: Record<string, any> = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^(\w[\w-]*):\s*(.+)$/);
    if (kv) result[kv[1]] = kv[2].trim();
  }
  return Object.keys(result).length > 0 ? result : null;
}

// ============================================================
// Skill Loader
// ============================================================
export class SkillLoader {
  private skills: Map<string, SkillMeta> = new Map();

  /** 从 skill.json 或 SKILL.md frontmatter 加载单个技能 */
  private loadSkill(dir: string, source: SkillMeta['source']): SkillMeta | null {
    // 优先读 skill.json（外部技能标准格式）
    const jsonPath = join(dir, 'skill.json');
    const mdPath = join(dir, 'SKILL.md');

    if (existsSync(jsonPath)) {
      const raw = JSON.parse(readFileSync(jsonPath, 'utf8'));
      return {
        name: raw.name,
        version: raw.version || '0.1.0',
        description: raw.description || '',
        triggers: {
          keywords: raw.triggers?.keywords || [],
          phases: raw.triggers?.phases || [],
        },
        requires: raw.requires || [],
        entry: raw.entry || 'SKILL.md',
        source,
        dir,
      };
    }

    // 回退：从 SKILL.md frontmatter 读取（内置技能格式）
    if (existsSync(mdPath)) {
      const fm = parseFrontmatter(readFileSync(mdPath, 'utf8'));
      if (fm?.name) {
        return {
          name: fm.name,
          version: fm.version || '0.1.0',
          description: fm.description || '',
          triggers: {
            keywords: fm.triggers?.keywords || [],
            phases: fm.triggers?.phases || [],
          },
          requires: fm.requires || [],
          entry: 'SKILL.md',
          source,
          dir,
        };
      }
    }

    return null;
  }

  /** 扫描一个目录下所有技能子目录 */
  private scanDir(root: string, source: SkillMeta['source']): SkillMeta[] {
    if (!existsSync(root)) return [];
    const result: SkillMeta[] = [];
    for (const entry of readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const skill = this.loadSkill(join(root, entry.name), source);
      if (skill) result.push(skill);
    }
    return result;
  }

  /** 加载所有技能（内置 → 用户 → 项目，后者覆盖同名） */
  loadAll(projectRoot?: string): SkillLoader {
    this.skills.clear();

    // 1. 内置技能（最低优先级）
    const builtinDir = join(import.meta.dirname, '..', 'skills');
    for (const s of this.scanDir(builtinDir, 'builtin')) {
      this.skills.set(s.name, s);
    }

    // 2. 用户技能（覆盖同名内置）
    const userDir = join(homedir(), '.spm', 'skills');
    for (const s of this.scanDir(userDir, 'user')) {
      this.skills.set(s.name, s); // 覆盖
    }

    // 3. 项目技能（最高优先级）
    if (projectRoot) {
      const projectDir = join(projectRoot, '.spm', 'skills');
      for (const s of this.scanDir(projectDir, 'project')) {
        this.skills.set(s.name, s); // 覆盖
      }
    }

    return this;
  }

  /** 按名称获取 */
  get(name: string): SkillMeta | undefined {
    return this.skills.get(name);
  }

  /** 列出全部 */
  list(): SkillMeta[] {
    return [...this.skills.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  /** 关键词匹配 — 返回匹配的技能列表（按优先级排序） */
  match(input: string): SkillMeta[] {
    const lower = input.toLowerCase();
    return this.list()
      .filter(s => s.triggers.keywords.some(kw => lower.includes(kw.toLowerCase())))
      .sort((a, b) => {
        // project > user > builtin 优先级
        const order = { project: 0, user: 1, builtin: 2 };
        return order[a.source] - order[b.source];
      });
  }

  /** 按阶段获取应自动激活的技能 */
  forPhase(phase: string): SkillMeta[] {
    return this.list().filter(s => s.triggers.phases.includes(phase));
  }
}
