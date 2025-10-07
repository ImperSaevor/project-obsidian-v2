import type { DataRecord, Hierarchy, StoryNode, TaskNode, Fields } from "./types";
import { normalize } from "./status";
import { log } from "console";
import { task } from "fp-ts";

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

    const epicId = (() => {
      const match = tried.find((v) => idxEpic.has(v));
      return match ? idxEpic.get(match) ?? "" : "";
    })();

    return { record: s, epicId };
  });

  // 4) Rattacher Task → Story/Epic
  const tasksOut: TaskNode[] = tasks.map((t) => {
    const pref = firstRef(t.values?.[fields.parent]) ?? firstRef(t.values?.[fields.story]);
    const tried = keyVariants(pref, env);
    // let storyId: string = tried.find((v) => idxStory.has(v)) ? idxStory.get(tried.find((v) => idxStory.has(v))!)! : "";

    // 1. Log des données d'entrée
    // console.log("🔍 [DEBUG] Contenu de `tried`:", tried);
    // console.log("🔍 [DEBUG] Clés disponibles dans `idxStory`:", Array.from(idxStory.keys()));

    // 2. Recherche de la première valeur commune entre `tried` et `idxStory`
    const foundValue = tried.find((v) => idxStory.has(v));
    // console.log("🔍 [DEBUG] Première valeur trouvée dans idxStory:", foundValue);

    // 3. Récupération de l'ID depuis la Map (avec gestion des cas undefined)
    let storyId: string;
    if (foundValue !== undefined) {
      const idFromMap = idxStory.get(foundValue);
      // console.log("🔍 [DEBUG] ID associé dans idxStory:", idFromMap);

      storyId = idFromMap ?? ""; // Fallback à "" si undefined
      // console.log("🔍 [DEBUG] storyId final:", storyId);
    } else {
      storyId = "";
      // console.log("🔍 [DEBUG] Aucune valeur trouvée → storyId = \"\"");
    }

    // fallback: si parent pointe vers un epic directement
    let epicId: string | undefined = "";
    if (!storyId) {
      // const triedEpic = keyVariants(pref, env);
      // epicId = triedEpic.find((v) => idxEpic.has(v)) ? idxEpic.get(triedEpic.find((v) => idxEpic.has(v))!) : undefined;
      epicId = (() => {
        const match = tried.find((v) => idxEpic.has(v));
        return match ? idxEpic.get(match) ?? "" : "";
      })();
    }
    return { record: t, storyId: storyId ?? "", epicId: epicId ?? "" };
  });

  if (tasksOut != null)
    console.log(tasksOut);

  // 5) Index SubTasks par parentId
  const parentToChildren = new Map<string, DataRecord[]>();
  for (const st of subtasks) {
    const pref = String(st?.values?.[fields.parent] ?? "");
    const key = env.resolveRecordId(pref);
    const arr = parentToChildren.get(key) ?? [];
    arr.push(st);
    parentToChildren.set(key, arr);
  }

  // // expose petit sélecteur local
  // (tasksOut as any).__childrenIndex = parentToChildren;

  return { epics, stories: storiesOut, tasks: tasksOut, subtasks : parentToChildren };
}

function addKeyVariants(idx: Map<string, string>, raw: string) {
  for (const k of raw ? [raw, stripMd(raw), baseName(raw), raw.toLowerCase(), toWikiLink(baseName(raw)), cleanWikiLink(toWikiLink(baseName(raw)))] : []) {
    if (k) idx.set(k, raw);
  }
}
function stripMd(s: string) { return s.replace(/\.md$/i, ""); }
function baseName(s: string) { return s.split("/").pop() ?? s; }
function refName(s: string): string { return s.split("#").shift() ?? s; }
function toWikiLink(s: string): string {
  // 1. Applique `refName` pour supprimer les ancres (#...) si présentes
  const cleanName = refName(s);

  // 2. Supprime l'extension `.md` (case-insensitive)
  const withoutExt = cleanName.replace(/\.md$/i, "");

  // 3. Vérifie si la chaîne est déjà un wikilink (pour éviter [[[[Deck]]]])
  if (withoutExt.startsWith("[[") && withoutExt.endsWith("]]")) {
    return withoutExt;
  }

  // 4. Encadre avec des doubles crochets
  return `[[${withoutExt}]]`;
}
function cleanWikiLink(input: string): string {
  // 1. Supprime les crochets existants (si l'entrée est déjà un wikilink)
  const withoutBrackets = input.replace(/^\[\[|\]\]$/, "");

  // 2. Sépare le nom du fichier et l'alias (si "|" est présent)
  const [filePart] = withoutBrackets.split("|");

  // 3. Supprime l'extension .md (ou .markdown, case-insensitive)
  const withoutExtension = filePart?.replace(/\.(md|markdown)$/i, "");

  // 4. Retourne le résultat entre doubles crochets
  return `[[${withoutExtension}]]`;
}
function firstRef(v: any): string | undefined {
  const arr = asArray(v);
  return arr.length ? String(arr[0]) : undefined;
}
function keyVariants(raw: any, env: Pick<import("./types").Env, "resolveRecordId">) {
  const v = String(raw ?? "");
  if (!v) return [];
  const k = env.resolveRecordId(v);
  return [k, stripMd(k), baseName(k), k.toLowerCase(), toWikiLink(baseName(k)), cleanWikiLink(toWikiLink(baseName(k)))];
}

// Helpers de sélection côté parent
export function childrenOfTaskById(taskId: string, hierarchy: Hierarchy): DataRecord[] {
  const idx = (hierarchy.tasks as any).__childrenIndex as Map<string, DataRecord[]>;
  return idx?.get(taskId) ?? [];
}
