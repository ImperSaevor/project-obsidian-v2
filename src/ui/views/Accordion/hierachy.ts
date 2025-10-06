import type { DataRecord, Hierarchy, StoryNode, TaskNode, Fields } from "./types";
import { normalize } from "./status";

export function kindOf(r: DataRecord): "Epic" | "Story" | "Task" | "SubTask" {
  const raw = normalize(r?.values?.["Projet"] ?? r?.values?.["Type"] ?? r?.values?.["type"]);
  if (raw === "epic") return "Epic";
  if (raw === "story" || raw === "user story") return "Story";
  if (["subtask", "sub-task", "sous-tache", "sous tache"].includes(raw)) return "SubTask";
  return "Task";
}

function asArray(v: any): any[] {
  return Array.isArray(v) ? v : v ? [v] : [];
}

export function buildHierarchy(
  records: DataRecord[],
  fields: Fields,
  env: Pick<import("./types").Env, "resolveRecordId" | "recordId" | "titleOf">
): Hierarchy {
  const all = (records ?? []).filter(Boolean);

  // 1) Typer
  const epics: DataRecord[] = [];
  const stories: DataRecord[] = [];
  const tasks: DataRecord[] = [];
  const subtasks: DataRecord[] = [];

  for (const r of all) {
    const k = kindOf(r);
    if (k === "Epic") epics.push(r);
    else if (k === "Story") stories.push(r);
    else if (k === "SubTask") subtasks.push(r);
    else tasks.push(r);
  }

  // 2) Index simples (clés tolérantes)
  const idxEpic = new Map<string, string>();
  const idxStory = new Map<string, string>();
  for (const e of epics) {
    const id = env.recordId(e);
    addKeyVariants(idxEpic, id);
    addKeyVariants(idxEpic, env.titleOf(e));
  }
  for (const s of stories) {
    const id = env.recordId(s);
    addKeyVariants(idxStory, id);
    addKeyVariants(idxStory, env.titleOf(s));
  }

  // 3) Rattacher Story → Epic
  const storiesOut: StoryNode[] = stories.map((s) => {
    const parentRaw = firstRef(s.values?.[fields.parent]) ?? firstRef(s.values?.[fields.epic]);
    const tried = keyVariants(parentRaw, env);
    const epicId = tried.find((v) => idxEpic.has(v)) ? idxEpic.get(tried.find((v) => idxEpic.has(v))!)! : "";
    return { record: s, epicId };
  });

  // 4) Rattacher Task → Story/Epic
  const tasksOut: TaskNode[] = tasks.map((t) => {
    const pref = firstRef(t.values?.[fields.parent]) ?? firstRef(t.values?.[fields.story]);
    const tried = keyVariants(pref, env);
    let storyId: string = tried.find((v) => idxStory.has(v)) ? idxStory.get(tried.find((v) => idxStory.has(v))!)! : "";

    // fallback: si parent pointe vers un epic directement
    let epicId: string | undefined = "";
    if (!storyId) {
      const triedEpic = keyVariants(pref, env);
      epicId = triedEpic.find((v) => idxEpic.has(v)) ? idxEpic.get(triedEpic.find((v) => idxEpic.has(v))!) : undefined;
    }
    return { record: t, storyId: storyId ?? "", epicId: epicId ?? "" };
  });

  // 5) Index SubTasks par parentId
  const parentToChildren = new Map<string, DataRecord[]>();
  for (const st of subtasks) {
    const pref = String(st?.values?.[fields.parent] ?? "");
    const key = env.resolveRecordId(pref);
    const arr = parentToChildren.get(key) ?? [];
    arr.push(st);
    parentToChildren.set(key, arr);
  }

  // expose petit sélecteur local
  (tasksOut as any).__childrenIndex = parentToChildren;

  return { epics, stories: storiesOut, tasks: tasksOut };
}

function addKeyVariants(idx: Map<string, string>, raw: string) {
  for (const k of raw ? [raw, stripMd(raw), baseName(raw), raw.toLowerCase()] : []) {
    if (k) idx.set(k, raw);
  }
}
function stripMd(s: string) { return s.replace(/\.md$/i, ""); }
function baseName(s: string) { return s.split("/").pop() ?? s; }
function firstRef(v: any): string | undefined {
  const arr = asArray(v);
  return arr.length ? String(arr[0]) : undefined;
}
function keyVariants(raw: any, env: Pick<import("./types").Env, "resolveRecordId">) {
  const v = String(raw ?? "");
  if (!v) return [];
  const k = env.resolveRecordId(v);
  return [k, stripMd(k), baseName(k), k.toLowerCase()];
}

// Helpers de sélection côté parent
export function childrenOfTaskById(taskId: string, hierarchy: Hierarchy): DataRecord[] {
  const idx = (hierarchy.tasks as any).__childrenIndex as Map<string, DataRecord[]>;
  return idx?.get(taskId) ?? [];
}
