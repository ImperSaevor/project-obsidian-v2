import type { Hierarchy, StoryNode, TaskNode } from "./types";
import { normalize } from "./status";
import type { DataRecord } from "src/lib/dataframe/dataframe";

export enum DataFieldName {
  Type = "Type",
  Project = "Projet",
  Parent = "Parent",
  Statut = "Statut",
}

export function kindOf(r: DataRecord): "Epic" | "Story" | "Task" | "SubTask" {
  const raw = normalize(r?.values?.["Project"] ?? r?.values?.["Projet"]);
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
  }

  for (const s of stories) {
    const id = env.recordId(s);
    addKeyVariants(idxStory, id);
  }

  // 3) Rattacher Story → Epic
  const storiesOut: StoryNode[] = stories.map((s) => {
    const parentRaw = firstRef(s.values?.["Parent"]) ?? firstRef(s.values?.["Project"]);
    const tried = keyVariants(parentRaw, env);
    const epicId = (() => {
      const match = tried.find((v) => idxEpic.has(v));
      return match ? idxEpic.get(match) ?? "" : "";
    })();
    return { record: s, epicId };
  });

  // 4) Rattacher Task → Story/Epic
  const tasksOut: TaskNode[] = tasks.map((t) => {
    const pref = firstRef(t.values?.[DataFieldName.Parent]) ?? firstRef(t.values?.[DataFieldName.Project]);
    const tried = keyVariants(pref, env);

    // 2. Recherche de la première valeur commune entre `tried` et `idxStory`
    const foundValue = tried.find((v) => idxStory.has(v));

    // 3. Récupération de l'ID depuis la Map (avec gestion des cas undefined)
    let storyId: string;
    if (foundValue !== undefined) {
      const idFromMap = idxStory.get(foundValue);
      storyId = idFromMap ?? ""; // Fallback à "" si undefined
    } else {
      storyId = "";
    }

    // fallback: si parent pointe vers un epic directement
    let epicId: string | undefined = "";
    if (!storyId) {
      epicId = (() => {
        const match = tried.find((v) => idxEpic.has(v));
        return match ? idxEpic.get(match) ?? "" : "";
      })();
    }
    return { record: t, storyId: storyId ?? "", epicId: epicId ?? "" };
  });

  // 5) Index SubTasks par parentId
  const parentToChildren = new Map<string, DataRecord[]>();
  for (const st of subtasks) {
    const pref = String(st?.values?.[DataFieldName.Parent] ?? "");
    // console.log("Subtask parent raw: ", pref);

    let key = env.resolveRecordId(pref);
    // console.log("Resolved key for subtask: ", key);

    if (key.endsWith("]]]]")) {
      key = key.replace("]]]]", "]]");
      // console.log("Final key for subtask: ", key);
    }

    const arr = parentToChildren.get(key) ?? [];
    arr.push(st);
    parentToChildren.set(key, arr);
  }

  // // expose petit sélecteur local
  // (tasksOut as any).__childrenIndex = parentToChildren;

  return { epics, stories: storiesOut, tasks: tasksOut, subtasks: parentToChildren };
}

function addKeyVariants(idx: Map<string, string>, raw: string) {
  for (const k of raw ? [raw, stripMd(raw), baseName(raw), raw.toLowerCase(), toWikiLink(baseName(raw)), cleanWikiLink(toWikiLink(baseName(raw)))] : []) {
    // for (const k of raw ? [raw, stripMd(raw), baseName(raw), raw.toLowerCase()] : []) {
    if (k) idx.set(k, raw);
  }
}
function stripMd(s: string) { return s.replace(/\.md$/i, ""); }
function baseName(s: string) { return s.split("/").pop() ?? s; }
function refName(s: string): string { return s.split("#").shift() ?? s; }
export function toWikiLink(s: string): string {
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
export function cleanWikiLink(input: string): string {
  // 1. Supprime les crochets existants (si l'entrée est déjà un wikilink)
  // console.log("Input to cleanWikiLink: ", input);

  const withoutBrackets = input.replace(/^\[\[|\]\]$/, "");
  // console.log("Without brackets: ", withoutBrackets);

  // 2. Sépare le nom du fichier et l'alias (si "|" est présent)
  const [filePart] = withoutBrackets.split("|");
  // console.log("File part: ", filePart);

  // 3. Supprime l'extension .md (ou .markdown, case-insensitive)
  const withoutExtension = filePart?.replace(/\.(md|markdown)$/i, "");
  // console.log("Without extension: ", withoutExtension);
  // console.log("Final result: ", `[[${withoutExtension}]]`);

  let finalResult = `[[${withoutExtension}]]`;
  if (finalResult.endsWith("]]]]")) finalResult = finalResult.replace("]]]]", "]]");
  // console.log("Final result after check: ", finalResult);

  // 4. Retourne le résultat entre doubles crochets
  return finalResult;
}
export function pathToWikilink(mdPath: string): string {
  // Supprime l'extension .md si présente
  const withoutExtension = mdPath.replace(/\.md$/, '');

  // Divise le chemin par '/' et prend le dernier élément
  const parts = withoutExtension.split('/');
  const lastPart = parts[parts.length - 1];

  // Retourne le résultat entre doubles crochets
  return `[[${lastPart}]]`;
}
function firstRef(v: any): string | undefined {
  const arr = asArray(v);
  return arr.length ? String(arr[0]) : undefined;
}
function keyVariants(raw: any, env: Pick<import("./types").Env, "resolveRecordId">) {
  const v = String(raw ?? "");
  if (!v) return [];
  const k = env.resolveRecordId(v);

  // console.log("K: ", k);
  // console.log("Strip K: ", stripMd(k));
  // console.log("Base K: ", baseName(k));
  // console.log("Lower K: ", k.toLowerCase());
  // console.log("Wiki K: ", toWikiLink(baseName(k)));
  // console.log("Clean Wiki K: ", cleanWikiLink(toWikiLink(baseName(k))));

  return [k, stripMd(k), baseName(k), k.toLowerCase(), toWikiLink(baseName(k)), cleanWikiLink(toWikiLink(baseName(k)))];
  // return [k, stripMd(k), baseName(k), k.toLowerCase()];
}

// Helpers de sélection côté parent
export function childrenOfTaskById(taskId: string, hierarchy: Hierarchy): DataRecord[] {
  const idx = (hierarchy.tasks as any).__childrenIndex as Map<string, DataRecord[]>;
  return idx?.get(taskId) ?? [];
}
