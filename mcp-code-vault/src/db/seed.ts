import * as fs from 'fs';
import * as path from 'path';
import { Persona } from './models/Persona';
import { LLMModel } from './models/LLMModel';
import { Project } from './models/Project';
import { Agent } from './models/Agent';

const SEED_DIR = 'configs/seed';

interface PersonaSeed {
  name: string;
  description: string;
  prompt: string;
}

interface ModelSeed {
  name: string;
  provider: string;
  label: string;
}

interface ProjectSeed {
  name: string;
  key: string;
}

interface AgentSeed {
  name: string;
  description: string;
  system_prompt: string;
  focus: string;
  project_key: string;
  model_names: string[];
  persona_names: string[];
  tools: { file_watch?: boolean; db_read_write?: boolean; web_search?: boolean; run_shell?: boolean };
}

function getSeedDir(): string {
  const cwd = process.cwd();
  const dir = path.join(cwd, SEED_DIR);
  if (!fs.existsSync(dir)) {
    throw new Error(`Seed config directory not found: ${dir} (cwd: ${cwd})`);
  }
  return dir;
}

function loadJson<T>(dir: string, file: string): T {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Seed file not found: ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as T;
}

export type SeedResult = 'ran' | 'skipped';

/**
 * Idempotent seed: loads personas, models, project, and agents from
 * configs/seed/*.json and inserts them only when the DB is empty (no personas).
 * Returns 'ran' when data was inserted, 'skipped' when DB already had data.
 */
export async function runSeed(): Promise<SeedResult> {
  const count = await Persona.countDocuments();
  if (count > 0) {
    return 'skipped';
  }

  const dir = getSeedDir();
  const personasSeed = loadJson<PersonaSeed[]>(dir, 'personas.json');
  const modelsSeed = loadJson<ModelSeed[]>(dir, 'models.json');
  const projectsSeed = loadJson<ProjectSeed[]>(dir, 'projects.json');
  const agentsSeed = loadJson<AgentSeed[]>(dir, 'agents.json');

  const personas = await Persona.insertMany(personasSeed);
  const nameToPersonaId = new Map<string, string>();
  personas.forEach((p) => nameToPersonaId.set(p.name, p._id.toString()));

  const models = await LLMModel.insertMany(modelsSeed);
  const nameToModelId = new Map<string, string>();
  models.forEach((m) => nameToModelId.set(m.name, m._id.toString()));

  const projects = await Project.insertMany(projectsSeed);
  const keyToProjectId = new Map<string, string>();
  projects.forEach((p) => keyToProjectId.set(p.key, p._id.toString()));

  for (const a of agentsSeed) {
    const projectId = keyToProjectId.get(a.project_key);
    if (!projectId) throw new Error(`Seed agent "${a.name}": project_key "${a.project_key}" not found`);
    const modelIds = (a.model_names || [])
      .map((n) => nameToModelId.get(n))
      .filter((id): id is string => id != null);
    const personaIds = (a.persona_names || [])
      .map((n) => nameToPersonaId.get(n))
      .filter((id): id is string => id != null);
    await Agent.create({
      name: a.name,
      description: a.description,
      system_prompt: a.system_prompt,
      focus: a.focus,
      project_id: projectId,
      model_ids: modelIds,
      persona_ids: personaIds,
      tools: {
        file_watch: a.tools?.file_watch ?? false,
        db_read_write: a.tools?.db_read_write ?? false,
        web_search: a.tools?.web_search ?? false,
        run_shell: a.tools?.run_shell ?? false
      }
    });
  }
  return 'ran';
}
