<!-- <script lang="ts">
  import EpicItem from "./components/EpicItem.svelte";
  import Toolbar from "./components/Toolbar.svelte";
  import DebugPanel from "./components/DebugPanel.svelte";
  import { buildHierarchy } from "./hierachy";
  import type { DataRecord, Fields, StoryNode, TaskNode } from "./types";
  import { log } from "console";

  export let frame: { records: DataRecord[] } = { records: [] };

  // Helpers “plats”
  const recordId = (r: DataRecord | string) => {
    log("record Id In parent")
    log(typeof r === "string" ? r : (r?.id ?? r?.path ?? r?.name ?? ""));
    return typeof r === "string" ? r : (r?.id ?? r?.path ?? r?.name ?? "");
  };

  const openRecord = (r: DataRecord) => console.info("openRecord", r);
  const createRecord = async (args: any) =>
    ({ statusLabel: "À faire", values: { Title: args.title }, ...args }) as any;
  const updateRecord = async (_r: any, _patch: any) => void 0;
  const titleOf = (r: DataRecord) =>
    r?.values?.["Title"] ?? r?.values?.["Titre"] ?? r?.name ?? r?.path ?? "";
  const resolveRecordId = (s: string) => s;

  const FIELDS: Fields = {
    type: "Type",
    epic: "Epic",
    story: "Story",
    parent: "Parent",
    status: "Status",
  };

  $: hierarchy = buildHierarchy(frame.records, FIELDS, {
    recordId,
    resolveRecordId,
    titleOf,
  });

  function storiesOfEpic(epicId: string): StoryNode[] {
    console.log(hierarchy.epics);
    console.log(hierarchy.stories);
    console.log(hierarchy.tasks);

    return hierarchy.stories.filter((s) => s.epicId && s.epicId === epicId);
  }
  //   function tasksOfStory(storyId: string): TaskNode[] {
  //     return hierarchy.tasks.filter((t) => t.storyId === storyId);
  //   }
  function tasksOfEpicDirect(epicId: string): TaskNode[] {
    return hierarchy.tasks.filter((t) => t.epicId === epicId && !t.storyId);
  }

  // Callbacks — mêmes signatures qu’avant, mais sans env.*
  async function addStory(epic: DataRecord) {
    await createRecord({
      title: "Nouvelle story",
      values: { [FIELDS.type]: "Story", [FIELDS.epic]: recordId(epic) },
    });
  }
  async function addTask(story: DataRecord) {
    await createRecord({
      title: "Nouvelle tâche",
      values: { [FIELDS.type]: "Task", [FIELDS.story]: recordId(story) },
    });
  }
  async function addSubTask(task: DataRecord) {
    await createRecord({
      title: "Sous-tâche",
      values: {
        [FIELDS.type]: "Task",
        [FIELDS.parent]: recordId(task),
        [FIELDS.story]: task?.values?.[FIELDS.story],
      },
    });
  }
  async function setStatus(r: DataRecord, label: string) {
    await updateRecord(r, { values: { [FIELDS.status]: label } });
  }
  function addEpic() {
    createRecord({ title: "Nouvel epic", values: { [FIELDS.type]: "Epic" } });
  }
  const renameRecordInline = (r: DataRecord) => openRecord(r);
  const editRecordInline = (r: DataRecord) => openRecord(r);
  const childrenOfTask = (_id: string) => [];
  const isDone = (_r: DataRecord) => false;
</script>

<details class="epic" open>
  <summary>
    <DebugPanel
      show={true}
      records={frame.records}
      {recordId}
      {titleOf}
      typeField={FIELDS.type}
      parentField={FIELDS.parent}
    />
    <Toolbar onAddEpic={addEpic} />

    {#each hierarchy.epics as epic (recordId(epic))}
      <EpicItem
        {epic}
        stories={storiesOfEpic(recordId(epic))}
        tasksDirect={tasksOfEpicDirect(recordId(epic))}
        {openRecord}
        {addStory}
        {addTask}
        {addSubTask}
        {setStatus}
        rename={renameRecordInline}
        edit={editRecordInline}
        {childrenOfTask}
        {recordId}
        {isDone}
      />
    {/each}
  </summary>
</details> -->

<script context="module" lang="ts">
  // Types minimaux
  type Dict = Record<string, any>;
  export type DataRecord = {
    statusLabel: string;
    id?: string | undefined;
    name?: string | undefined;
    path?: string | undefined;
    values?: Dict | undefined;
  };
</script>

<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  // Prop d'entrée
  export let frame: { records: DataRecord[] } = { records: [] };

  const LOG = "[Accordion]";
  const DEF_TYPE_FIELD = "Projet";
  const DEF_PARENT_FIELD = "Parent";
  const DONE_FIELD_PRIMARY = "Status";
  const DONE_FIELD_ALT = "Statut";
  const DONE_VALUES = ["done", "fait", "termine", "terminé", "✅", "✔️"];
  const parentToChildren = new Map<string, DataRecord[]>();

  let showDebugPanel = false;

  // -------- Utils --------
  // --- Normalisation du type (Projet/Type) ---
  type Kind = "Epic" | "Story" | "Task" | "SubTask";

  function normalize(str?: string): string {
    return (str ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .trim();
  }
  function kindOf(r: DataRecord): Kind {
    const raw = String(
      r?.values?.["Projet"] ?? r?.values?.["Type"] ?? r?.values?.["type"] ?? ""
    );
    const k = normalize(raw);
    if (["epic"].includes(k)) return "Epic";
    if (["story", "user story"].includes(k)) return "Story";
    if (["subtask", "sub-task", "sous-tache", "sous tache"].includes(k))
      return "SubTask";
    return "Task"; // défaut
  }

  // --- Statuts + couleurs ---
  type StatusKey = "todo" | "doing" | "done" | "backlog" | "bug";
  const STATUS_META: Record<StatusKey, { label: string }> = {
    todo: { label: "À faire" },
    doing: { label: "En cours" },
    done: { label: "Terminé" },
    backlog: { label: "Backlog" },
    bug: { label: "Bugs" },
  };

  // mappe tout ce qui ressemble à tes valeurs vers une clé stable
  function statusKeyFrom(r: DataRecord): StatusKey {
    const raw = normalize(
      String(r?.values?.["Status"] ?? r?.values?.["Statut"] ?? "")
    );
    if (["done", "termine", "terminé", "complete", "completed"].includes(raw))
      return "done";
    if (
      ["doing", "en cours", "encours", "in progress", "progress"].includes(raw)
    )
      return "doing";
    if (["backlog", "a venir", "a faire plus tard"].includes(raw))
      return "backlog";
    if (["bug", "bugs", "defaut", "anomalie"].includes(raw)) return "bug";
    if (["todo", "a faire", "à faire", "to do"].includes(raw)) return "todo";
    return "todo";
  }

  function statusClass(r: DataRecord): string {
    return `status-${statusKeyFrom(r)}`;
  }

  // --- SubTasks: détection + recherche par parent ---
  function isSubTask(r: DataRecord): boolean {
    const raw = normalize(
      String(
        r?.values?.["Projet"] ??
          r?.values?.["Type"] ??
          r?.values?.["type"] ??
          ""
      )
    );
    return ["subtask", "sub-task", "sous-tache", "sous tache"].includes(raw);
  }

  // Retourne les SubTasks dont le champ Parent pointe vers l'ID donné
  function childrenOfTaskById(
    taskId: string,
    all = frame.records as DataRecord[]
  ): DataRecord[] {
    if (!taskId) return [];
    return all.filter((r) => {
      if (!isSubTask(r)) return false;
      const pref = String(r?.values?.["Parent"] ?? r?.values?.["parent"] ?? "");
      if (!pref) return false;
      return keyFromRef(pref) === keyFromRef(taskId);
    });
  }

  // --- Helpers d'affichage de nom (comme Table) ---
  function baseNameFrom(ref: string): string {
    if (!ref) return "";
    // [[Page|Alias]] -> "Alias" sinon "Page"
    const m = ref.match(/^\s*\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]\s*$/);
    if (m) return (m[2] ?? m[1] ?? "").trim();
    // sinon: "folder/sub/Note.md" -> "Note"
    const last = ref.split(/[\\/]/).pop() ?? ref;
    return last.replace(/#.*$/, "").replace(/\.md$/i, "");
  }

  function displayTitle(r: DataRecord): string {
    const app = (window as any)?.app;
    const link = resolveRecordId(r?.path ?? r?.name ?? recordId(r));

    // 1) champs explicites (on nettoie toujours .md et le chemin)
    const explicit =
      r?.values?.["Title"] ??
      r?.values?.["Titre"] ??
      r?.values?.["Name"] ??
      r?.values?.["name"];
    if (typeof explicit === "string" && explicit.trim()) {
      return baseNameFrom(explicit.trim());
    }

    // 2) on demande à Obsidian (retourne déjà sans .md)
    if (app) {
      const file = app.metadataCache.getFirstLinkpathDest(link, "");
      if (file) return app.metadataCache.fileToLinktext(file, "", false);
    }

    // 3) fallback
    return baseNameFrom(link) || "(sans titre)";
  }

  // --- Ouverture de note comme la vue Table ---
  function openRecord(r: DataRecord) {
    const app = (window as any)?.app;
    if (!app) return;
    const link = resolveRecordId(r?.path ?? r?.name ?? recordId(r));
    // Essaie de résoudre à un TFile puis ouvre
    const file = app.metadataCache.getFirstLinkpathDest(link, "");
    if (file) app.workspace.getLeaf(false).openFile(file);
    else app.workspace.openLinkText(link, "", false);
  }
  function asArray(v: any): any[] {
    if (v == null) return [];
    return Array.isArray(v) ? v : [v];
  }
  function norm(v: unknown) {
    return String(v ?? "")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .trim();
  }
  function resolveRecordId(ref: any): string {
    if (!ref) return "";
    if (typeof ref === "string") {
      // [[Page|alias]] -> Page
      const m = ref.match(/\[\[([^\]|#]+).*?\]\]/);
      if (m) return (m[1] ?? "").trim();
      return ref.trim();
    }
    if (typeof ref === "object") {
      return ref.id ?? ref.path ?? ref.file ?? ref.link ?? ref.name ?? "";
    }
    return String(ref ?? "");
  }
  function recordId(r: DataRecord): string {
    const raw = r?.id ?? r?.values?.["id"] ?? r?.name ?? r?.path ?? "";
    return resolveRecordId(raw);
  }
  function titleOf(r: DataRecord): string {
    return (
      r?.values?.["Title"] ??
      r?.values?.["Titre"] ??
      r?.values?.["Name"] ??
      r?.name ??
      recordId(r) ??
      "(sans titre)"
    );
  }

  // -------- Détection des colonnes --------
  function detectField(
    keys: string[],
    candidates: string[]
  ): string | undefined {
    const normKeys = new Map(keys.map((k) => [norm(k), k]));
    for (const c of candidates) {
      const n = norm(c);
      if (normKeys.has(n)) return normKeys.get(n);
      for (const [nk, original] of normKeys.entries()) {
        if (nk === n) return original;
        if (nk === `${n}s`) return original;
        if (nk.includes(n)) return original;
      }
    }
    return undefined;
  }
  function collectValueKeys(records: DataRecord[]): string[] {
    const s = new Set<string>();
    for (const r of records)
      for (const k of Object.keys(r?.values ?? {})) s.add(k);
    return [...s];
  }

  let TYPE_FIELD_EFF = DEF_TYPE_FIELD;
  let PARENT_FIELD_EFF = DEF_PARENT_FIELD;
  function chooseEffectiveFields(records: DataRecord[]) {
    const keys = collectValueKeys(records);
    console.groupCollapsed(`${LOG} champs détectés`);
    console.log(`${LOG} colonnes présentes`, keys);

    const typeGuess = detectField(keys, [
      DEF_TYPE_FIELD,
      "Project",
      "Type",
      "Kind",
      "Categorie",
      "Catégorie",
      "Classe",
      "Class",
      "ObjetType",
      "ObjectType",
    ]);
    const parentGuess = detectField(keys, [
      DEF_PARENT_FIELD,
      "Epic",
      "Parent Id",
      "ParentID",
      "Parent Note",
      "Story",
      "Linked to",
      "Parent page",
    ]);

    TYPE_FIELD_EFF = typeGuess ?? DEF_TYPE_FIELD;
    PARENT_FIELD_EFF = parentGuess ?? DEF_PARENT_FIELD;

    console.info(
      `${LOG} TYPE_FIELD =`,
      TYPE_FIELD_EFF,
      "| PARENT_FIELD =",
      PARENT_FIELD_EFF
    );
    console.groupEnd();
  }

  // -------- Lecture métier --------
  function getKind(r: DataRecord): "epic" | "story" | "task" | "" {
    const s = norm(r?.values?.[TYPE_FIELD_EFF]);
    if (["epic", "epopee", "épopée", "epique", "épique"].includes(s))
      return "epic";
    if (["story", "histoire"].includes(s)) return "story";
    if (["task", "tache", "tâche"].includes(s)) return "task";
    return "";
  }
  function getParentId(r: DataRecord): string | undefined {
    const ref = r?.values?.[PARENT_FIELD_EFF];
    const arr = asArray(ref);
    if (!arr.length) return;
    return resolveRecordId(arr[0]);
  }
  function isDone(r: DataRecord): boolean {
    const raw = r?.values?.[DONE_FIELD_PRIMARY] ?? r?.values?.[DONE_FIELD_ALT];
    return DONE_VALUES.includes(norm(raw));
  }

  // ---- helpers de clés tolérantes ----
  function stripMd(s: string) {
    return s.replace(/\.md$/i, "");
  }
  function baseName(s: string) {
    return s.split("/").pop() ?? s;
  }
  function keyVariants(raw: string) {
    const k = (raw ?? "").trim();
    const v = new Set<string>([
      k,
      stripMd(k),
      baseName(k),
      stripMd(baseName(k)),
      norm(k),
      norm(stripMd(k)),
      norm(baseName(k)),
      norm(stripMd(baseName(k))),
    ]);
    return [...v].filter(Boolean);
  }
  function addToIndex(idx: Map<string, string>, key: string, id: string) {
    for (const v of keyVariants(key)) idx.set(v, id);
  }
  function buildIndex(records: DataRecord[]) {
    const idx = new Map<string, string>(); // key variant -> canonical id
    for (const r of records) {
      const id = recordId(r);
      addToIndex(idx, id, id);
      addToIndex(idx, stripMd(id), id);
      addToIndex(idx, baseName(id), id);
      addToIndex(idx, titleOf(r), id);
    }
    return idx;
  }

  // clé stable à partir d'un ref/chemin
  function keyFromRef(ref: string): string {
    return resolveRecordId(ref); // ta fonction existante (ou fallback: baseNameFrom)
  }

  function buildSubtaskIndex(all: DataRecord[]) {
    parentToChildren.clear();
    for (const r of all) {
      if (kindOf(r) !== "SubTask") continue;
      const parentRef = String(
        r?.values?.["Parent"] ?? r?.values?.["parent"] ?? ""
      );
      if (!parentRef) continue;
      const pkey = keyFromRef(parentRef);
      const arr = parentToChildren.get(pkey) ?? [];
      arr.push(r);
      parentToChildren.set(pkey, arr);
    }
  }

  // -------- Hiérarchie --------
  type StoryNode = { record: DataRecord; epicId: string | undefined };
  type TaskNode = {
    record: DataRecord;
    storyId: string | undefined;
    epicId: string | undefined;
  };
  let hierarchy: {
    epics: DataRecord[];
    stories: StoryNode[];
    tasks: TaskNode[];
  } = {
    epics: [],
    stories: [],
    tasks: [],
  };

  let classifyRun = 0;
  function buildHierarchy(frameArg: { records: DataRecord[] }) {
    const records = frameArg?.records ?? [];
    const all = (records ?? []).filter(Boolean);

    buildSubtaskIndex(all);

    classifyRun += 1;
    console.groupCollapsed(`${LOG} classify() run #${classifyRun}`);
    chooseEffectiveFields(records ?? []);
    console.info(`${LOG} records reçus:`, records?.length ?? 0);
    if ((records?.length ?? 0) > 0) {
      console.log(`${LOG} exemple record[0]`, {
        id: recordId(records[0] ?? { statusLabel: "" }),
        name: records[0]?.name,
        path: records[0]?.path,
        values: records[0]?.values,
      });
    }

    // 1) Typer
    const epicRecs: DataRecord[] = [];
    const storyRecs: DataRecord[] = [];
    const taskRecs: DataRecord[] = [];
    for (const r of all) {
      const k = getKind(r);
      if (k === "epic") epicRecs.push(r);
      else if (k === "story") storyRecs.push(r);
      else if (k === "task") taskRecs.push(r);
    }

    // 2) Index
    const epicIndex = buildIndex(epicRecs);
    const storyIndex = buildIndex(storyRecs);

    // 3) Rattacher Story → Epic
    const storiesOut: StoryNode[] = [];
    const tasksOut: TaskNode[] = [];
    const orphans = {
      stories: [] as { id: string; parentRaw: any; tried: string[] }[],
      tasks: [] as { id: string; parentRaw: any; tried: string[] }[],
    };

    for (const s of storyRecs) {
      const sid = recordId(s);
      const parentRaw = getParentId(s) ?? "";
      const tried = keyVariants(parentRaw);
      let epicId: string | undefined;

      for (const v of tried) {
        if (epicIndex.has(v)) {
          epicId = epicIndex.get(v)!;
          break;
        }
      }
      if (!epicId) {
        // Tentative supplémentaire via titre
        for (const e of epicRecs) {
          if (keyVariants(titleOf(e)).some((v) => tried.includes(v))) {
            epicId = recordId(e);
            break;
          }
        }
      }
      if (!epicId) orphans.stories.push({ id: sid, parentRaw, tried });
      storiesOut.push({ record: s, epicId });
    }

    // 4) Rattacher Task → Story, sinon → Epic
    for (const t of taskRecs) {
      const tid = recordId(t);
      const parentRaw = getParentId(t) ?? "";
      const tried = keyVariants(parentRaw);
      let storyId: string | undefined;
      let epicId: string | undefined;

      for (const v of tried) {
        if (storyIndex.has(v)) {
          storyId = storyIndex.get(v)!;
          break;
        }
      }
      if (!storyId) {
        for (const v of tried) {
          if (epicIndex.has(v)) {
            epicId = epicIndex.get(v)!;
            break;
          }
        }
      }
      if (!storyId && !epicId)
        orphans.tasks.push({ id: tid, parentRaw, tried });
      tasksOut.push({ record: t, storyId, epicId });
    }

    // Logs
    console.table(
      all.map((r, i) => ({
        index: i,
        id: recordId(r),
        title: titleOf(r),
        type: getKind(r),
        parent: getParentId(r) ?? "",
        done: isDone(r),
      }))
    );
    console.info(
      "[Accordion] index epics (extraits)",
      Array.from(epicIndex).slice(0, 5)
    );
    console.info(
      "[Accordion] index stories (extraits)",
      Array.from(storyIndex).slice(0, 5)
    );
    console.info("[Accordion] orphans", {
      stories: orphans.stories.length,
      tasks: orphans.tasks.length,
    });
    if (orphans.stories.length)
      console.warn(
        "[Accordion] stories orphelines:",
        orphans.stories.slice(0, 10)
      );
    if (orphans.tasks.length)
      console.warn("[Accordion] tasks orphelines:", orphans.tasks.slice(0, 10));

    console.info(`${LOG} résultats`, {
      epics: epicRecs.length,
      stories: storiesOut.length,
      tasks: tasksOut.length,
    });
    console.groupEnd();

    showDebugPanel = (records?.length ?? 0) > 0 && epicRecs.length === 0;

    return { epics: epicRecs, stories: storiesOut, tasks: tasksOut };
  }

  // Réactivité: dépend explicitement de frame
  $: hierarchy = buildHierarchy(frame);

  // Sélecteurs pour le rendu
  function storiesOfEpic(epicId: string) {
    return hierarchy.stories.filter((s) => s.epicId === epicId);
  }
  function tasksOfStory(storyId: string) {
    return hierarchy.tasks.filter((t) => t.storyId === storyId);
  }
  function tasksOfEpicDirect(epicId: string) {
    return hierarchy.tasks.filter((t) => t.epicId === epicId && !t.storyId);
  }
  function totalTasksUnderEpic(epicId: string) {
    const inStories = storiesOfEpic(epicId).reduce(
      (acc, s) =>
        acc + (s?.record ? tasksOfStory(recordId(s.record)).length : 0),
      0
    );
    return inStories + tasksOfEpicDirect(epicId).length;
  }

  // ====== CONFIGURE ICI SI TES COLONNES ONT D'AUTRES NOMS ======
  const FIELDS = {
    type: "Type", // Epic | Story | Task | SubTask
    epic: "Epic", // relation Story -> Epic
    story: "Story", // relation Task  -> Story
    parent: "Parent", // relation SubTask -> Task
    status: "Status", // À faire | En cours | Terminé | Backlog | Bugs
  };

  // ====== STATUTS ======
  const STATUS = ["Backlog", "À faire", "En cours", "Terminé", "Bugs"] as const;
  type StatusLabel = (typeof STATUS)[number];

  // Utilise ta fonction existante si tu en as une
  //   function initializeStatusLabel(r: DataRecord) {
  //     const raw = String(r?.values?.[FIELDS.status] ?? "").trim();
  //     const hit = STATUS.find((s) => s.toLowerCase() === raw.toLowerCase());
  //     r.statusLabel = (hit ?? "À faire") as StatusLabel;
  //   }

  //   function getStatusLabel(r: DataRecord): StatusLabel {
  //     if (!r.statusLabel) initializeStatusLabel(r);
  //     return r.statusLabel as StatusLabel;
  //   }

  async function setStatus(record: DataRecord, value: any) {
    // @ts-ignore fournie par la vue Projects
    await updateRecord(record, {
      values: { [FIELDS.status]: value as StatusLabel },
    });
  }

  // ====== CREATION ======
  function defaultTitle(kind: Kind) {
    return kind === "Epic"
      ? "Nouvel Epic"
      : kind === "Story"
        ? "Nouvelle Story"
        : kind === "Task"
          ? "Nouvelle tâche"
          : "Nouvelle sous‑tâche";
  }

  function valuesFor(kind: Kind, parent?: DataRecord) {
    const base: Record<string, any> = { [FIELDS.type]: kind };
    if (kind === "Story" && parent) base[FIELDS.epic] = recordId(parent);
    if (kind === "Task" && parent) base[FIELDS.story] = recordId(parent);
    if (kind === "SubTask" && parent) base[FIELDS.parent] = recordId(parent);
    // statut par défaut
    base[FIELDS.status] = "Backlog";
    return base;
  }

  async function createAndOpen(kind: Kind, parent?: DataRecord) {
    const title = defaultTitle(kind);
    const values = valuesFor(kind, parent);
    // @ts-ignore fournie par la vue Projects
    const rec = await createRecord({ title, values });
    if (rec) openRecord(rec);
  }

  // Raccourcis
  const addEpic = () => createAndOpen("Epic");
  const addStory = (epic: DataRecord) => createAndOpen("Story", epic);
  const addTask = (story: DataRecord) => createAndOpen("Task", story);
  const addSubTask = (task: DataRecord) => createAndOpen("SubTask", task);

  // ====== MODIFICATION ======
  async function editRecordInline(record: DataRecord) {
    // Ouvre la fiche (éditeur Projects) pour tout modifier
    openRecord(record);
  }

  async function renameRecordInline(record: DataRecord) {
    const current = displayTitle(record);
    const next = window.prompt("Renommer :", current);
    if (!next || next === current) return;
    // @ts-ignore fournie par la vue Projects
    await updateRecord(record, { title: next });
  }

  // Fallback: reclasser si la longueur change “silencieusement”
  let lastCount = -1;
  let poll: any;
  onMount(() => {
    poll = setInterval(() => {
      const count = frame?.records?.length ?? 0;
      if (count !== lastCount) {
        console.info(
          `${LOG} poll: changement détecté ${lastCount} -> ${count}`
        );
        lastCount = count;
        hierarchy = buildHierarchy(frame);
      }
    }, 500);
  });
  onDestroy(() => clearInterval(poll));
</script>

{#if !frame?.records?.length}
  <div class="muted">No records.</div>
{:else}
  <div class="muted" style="margin:.5rem 0;">
    {frame.records.length} record(s) chargés
    <button
      on:click={() => (showDebugPanel = !showDebugPanel)}
      style="margin-left:.5rem;"
    >
      {showDebugPanel ? "Masquer debug" : "Afficher debug"}
    </button>
  </div>

  {#if showDebugPanel}
    <details open class="debug-panel">
      <summary>Debug: aperçu brut des records</summary>
      <div class="debug-grid">
        {#each frame.records as r (recordId(r))}
          <pre>{JSON.stringify(
              { id: recordId(r), title: titleOf(r), values: r.values },
              null,
              2
            )}</pre>
        {/each}
      </div>
      <div class="hint">
        Vérifie que la colonne type s'appelle bien "{TYPE_FIELD_EFF}" avec
        valeurs "Epic/Story/Task" (ou variantes FR), et que "{PARENT_FIELD_EFF}"
        pointe sur des liens valides vers la note parente.
      </div>
    </details>
  {/if}

  <div class="accordion">
    <!-- <div class="toolbar global">
      <button class="btn tiny" on:click={addEpic}>+ Epic</button>
    </div> -->
    {#each hierarchy.epics as epic (recordId(epic))}
      <details open>
        <summary>
          <a
            class="internal-link title epic"
            href="#"
            on:click|preventDefault={() => openRecord(epic)}>{displayTitle(epic)}</a>
          <!-- <button class="btn tiny" on:click={() => addStory(epic)}>+ Story</button> -->

          <span class="counts">
            <span class="chip"
              >Stories: {storiesOfEpic(recordId(epic)).length}</span
            >
            <span class="chip"
              >Tasks: {totalTasksUnderEpic(recordId(epic))}</span
            >
            {#if isDone(epic)}<span class="badge done">Done</span>{/if}
          </span>
        </summary>

        {#each storiesOfEpic(recordId(epic)) as story (recordId(story.record))}
          <details class="story">
            <summary>
              <a
                class="internal-link title story"
                href="#"
                on:click|preventDefault={() => openRecord(story.record)}
              >
                {displayTitle(story.record)}
              </a>
              <span class="counts">
                <span class="chip"
                  >Tasks: {tasksOfStory(recordId(story.record)).length}</span
                >
                {#if isDone(story.record)}<span class="badge done">Done</span
                  >{/if}
              </span>
              <!-- Actions Story -->
              <!-- <span class="actions">
                <button
                  class="btn tiny"
                  title="Ajouter une tâche"
                  on:click|stopPropagation={() => addTask(story.record)}
                  >+ Task</button
                >
                <button
                  class="icon"
                  title="Modifier la story"
                  on:click|stopPropagation={() =>
                    editRecordInline(story.record)}>✏️</button
                >
                <button
                  class="icon"
                  title="Renommer"
                  on:click|stopPropagation={() =>
                    renameRecordInline(story.record)}>📝</button
                >
              </span> -->
            </summary>

            <ul class="tasks">
              {#each tasksOfStory(recordId(story.record)) as t (recordId(t.record))}
                <li
                  class={`task ${statusClass(t.record)}`}
                  class:done={isDone(t.record)}
                >
                  <div class="task-row">
                    <div class="task-left">
                      <input type="checkbox" aria-hidden="true" />
                      <a
                        class="internal-link task-title"
                        href="#"
                        on:click|preventDefault={() => openRecord(t.record)}
                      >
                        {displayTitle(t.record)}
                      </a>
                    </div>

                    <span class={`status-pill ${statusClass(t.record)}`}>
                      {STATUS_META[statusKeyFrom(t.record)].label}
                    </span>
                  </div>

                  <!-- Edition rapide du statut -->
                  <!-- <select
                    class="status"
                    bind:value={t.record.statusLabel}
                    on:change={(e) =>
                      setStatus(t.record, e.currentTarget.value)}
                  >
                    {#each STATUS as s}<option value={s}>{s}</option>{/each}
                  </select> -->

                  <!-- Actions Task -->
                  <!-- <div class="row-actions">
                    <button
                      class="btn tiny"
                      title="Ajouter une sous‑tâche"
                      on:click={() => addSubTask(t.record)}>+ SubTask</button
                    >
                    <button
                      class="icon"
                      title="Modifier la tâche"
                      on:click={() => editRecordInline(t.record)}>✏️</button
                    >
                    <button
                      class="icon"
                      title="Renommer"
                      on:click={() => renameRecordInline(t.record)}>📝</button
                    >
                  </div> -->

                  {#if childrenOfTaskById(recordId(t.record))?.length}
                    <details class="subtasks-wrap" open>
                      <summary
                        >{childrenOfTaskById(recordId(t.record)).length} SubTasks</summary
                      >
                      <ul class="subtasks">
                        {#each childrenOfTaskById(recordId(t.record)) as st (recordId(st))}
                          <li class={`subtask ${statusClass(st)}`}>
                            <a
                              class="internal-link"
                              href="#"
                              on:click|preventDefault={() => openRecord(st)}
                            >
                              {displayTitle(st)}
                            </a>
                            <span
                              class={`status-dot ${statusClass(st)}`}
                              title={STATUS_META[statusKeyFrom(st)].label}
                            ></span>
                          </li>
                        {/each}
                      </ul>
                    </details>
                  {/if}
                </li>
              {/each}
            </ul>
          </details>
        {/each}

        {#if tasksOfEpicDirect(recordId(epic)).length}
          <div class="tasks-group-header">Tâches sans story</div>
          <ul class="tasks">
            {#each tasksOfEpicDirect(recordId(epic)) as t (recordId(t.record))}
              <li class:done={isDone(t.record)}>
                <span class="square" aria-hidden="true"></span>
                <span class="task-title">{titleOf(t.record)}</span>
              </li>
            {/each}
          </ul>
        {/if}
      </details>
    {/each}
  </div>
{/if}

<style>
  .muted {
    color: var(--text-muted, #8a8a8a);
    font-size: 0.9rem;
  }

  .accordion details {
    border: 1px solid var(--background-modifier-border, #ddd);
    border-radius: 6px;
    margin: 0.5rem 0;
    background: var(--background-primary, #fff);
  }
  .accordion summary {
    cursor: pointer;
    padding: 0.5rem 0.75rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .title.epic {
    font-weight: 600;
  }
  .title.story {
    font-weight: 500;
  }

  .counts {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }
  .chip {
    background: var(--background-modifier-form-field, #f2f2f2);
    border-radius: 12px;
    padding: 0 0.5rem;
    font-size: 0.8rem;
  }
  .badge.done {
    color: #0a7;
    border: 1px solid #0a7;
    border-radius: 10px;
    padding: 0 0.25rem;
    font-size: 0.75rem;
  }

  details.story {
    margin-left: 0.75rem;
  }

  .tasks {
    list-style: none;
    margin: 0.25rem 0.75rem 0.75rem 1.25rem;
    padding: 0;
  }
  .tasks li {
    padding: 0.25rem 0;
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  .tasks li .square {
    width: 0.75rem;
    height: 0.75rem;
    border: 1px solid var(--text-muted, #aaa);
    border-radius: 2px;
    flex: 0 0 0.75rem;
  }
  .tasks li.done .task-title {
    text-decoration: line-through;
    color: var(--text-muted, #888);
  }

  .tasks-group-header {
    margin: 0.25rem 0 -0.25rem 1rem;
    font-size: 0.85rem;
    color: var(--text-muted, #666);
  }

  .debug-panel {
    border: 1px dashed var(--background-modifier-border, #bbb);
    padding: 0.5rem;
    background: var(--background-secondary, #fafafa);
    margin-bottom: 0.5rem;
  }
  .debug-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 0.5rem;
    max-height: 50vh;
    overflow: auto;
  }
  .debug-panel pre {
    margin: 0;
    padding: 0.5rem;
    background: var(--background-primary, #fff);
    border: 1px solid var(--background-modifier-border, #e0e0e0);
    border-radius: 6px;
    font-size: 0.8rem;
  }
  .hint {
    margin-top: 0.5rem;
    color: var(--text-muted);
    font-size: 0.85rem;
  }
  /* Couleurs (adaptées aux thèmes Obsidian, avec fallback) */
  .accordion {
    --acc-epic: var(--color-purple, #7b68ee);
    --acc-story: var(--color-green, #2bb673);
    --acc-task: var(--color-blue, #3ea8ff);
  }

  a.internal-link.title.epic {
    color: var(--acc-epic);
  }
  a.internal-link.title.story {
    color: var(--acc-story);
  }
  a.internal-link.task-title {
    color: var(--acc-task);
  }
  a.internal-link:hover {
    text-decoration: underline;
  }

  /* Teintes de fond/bordure pour mieux distinguer */
  .accordion details.epic {
    border-left: 4px solid var(--acc-epic);
    background: color-mix(
      in srgb,
      var(--acc-epic) 7%,
      var(--background-primary, #fff)
    );
  }
  .accordion details.story {
    border-left: 3px solid var(--acc-story);
    background: color-mix(
      in srgb,
      var(--acc-story) 6%,
      var(--background-primary, #fff)
    );
  }

  /* Pastille avant les tâches, teintée */
  .tasks li.task .square {
    border-color: color-mix(
      in srgb,
      var(--acc-task) 60%,
      var(--text-muted, #aaa)
    );
    background: color-mix(in srgb, var(--acc-task) 20%, transparent);
  }

  /* Petites touches visuelles */
  .title.epic {
    font-weight: 600;
  }
  .title.story {
    font-weight: 500;
  }
  .badge.done {
    border-color: var(--acc-story);
    color: var(--acc-story);
  }
  .title.epic,
  .title.story,
  .task-title {
    max-width: 60ch; /* ajuste si besoin */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Palette statut (override possible par thème) */
  .accordion {
    --st-todo: #7da1ff;
    --st-doing: #f6b73c;
    --st-done: #34c759;
    --st-backlog: #a0a0a0;
    --st-bug: #ff5b5b;

    /* teintes de fond */
    --bg-todo: color-mix(
      in srgb,
      var(--st-todo) 12%,
      var(--background-primary, #fff)
    );
    --bg-doing: color-mix(
      in srgb,
      var(--st-doing) 15%,
      var(--background-primary, #fff)
    );
    --bg-done: color-mix(
      in srgb,
      var(--st-done) 12%,
      var(--background-primary, #fff)
    );
    --bg-backlog: color-mix(
      in srgb,
      var(--st-backlog) 10%,
      var(--background-primary, #fff)
    );
    --bg-bug: color-mix(
      in srgb,
      var(--st-bug) 12%,
      var(--background-primary, #fff)
    );
  }

  /* Palette statut */
  :root {
    --st-todo: #7da1ff;
    --st-doing: #f6b73c;
    --st-done: #34c759;
    --st-backlog: #a0a0a0;
    --st-bug: #ff5b5b;
  }
  .tasks .task {
    border: 1px solid var(--background-modifier-border);
    border-left-width: 6px;
    border-radius: 8px;
    padding: 8px 10px;
    margin: 8px 0;
    background: var(--background-primary);
  }
  .task-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .task-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .status-pill {
    font-size: 0.85em;
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid transparent;
    white-space: nowrap;
  }

  /* Couleurs par statut (bordure + badge + fond léger) */
  .status-todo {
    border-left-color: var(--st-todo);
  }
  .status-doing {
    border-left-color: var(--st-doing);
  }
  .status-done {
    border-left-color: var(--st-done);
  }
  .status-backlog {
    border-left-color: var(--st-backlog);
  }
  .status-bug {
    border-left-color: var(--st-bug);
  }

  .status-pill.status-todo {
    color: var(--st-todo);
    border-color: color-mix(in srgb, var(--st-todo) 50%, transparent);
  }
  .status-pill.status-doing {
    color: var(--st-doing);
    border-color: color-mix(in srgb, var(--st-doing) 50%, transparent);
  }
  .status-pill.status-done {
    color: var(--st-done);
    border-color: color-mix(in srgb, var(--st-done) 50%, transparent);
  }
  .status-pill.status-backlog {
    color: var(--st-backlog);
    border-color: color-mix(in srgb, var(--st-backlog) 50%, transparent);
  }
  .status-pill.status-bug {
    color: var(--st-bug);
    border-color: color-mix(in srgb, var(--st-bug) 50%, transparent);
  }

  /* Sous‑tâches */
  .subtasks-wrap summary {
    cursor: pointer;
    user-select: none;
    margin-top: 6px;
  }
  .subtasks {
    margin: 6px 0 0 0;
    padding-left: 12px;
    display: grid;
    gap: 4px;
  }
  .subtask {
    padding: 4px 8px;
    border-radius: 6px;
    border: 1px dashed var(--background-modifier-border);
    background: color-mix(in srgb, currentColor 8%, transparent);
  }
  .status-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-left: 6px;
    vertical-align: middle;
  }
  .status-dot.status-todo {
    background: var(--st-todo);
  }
  .status-dot.status-doing {
    background: var(--st-doing);
  }
  .status-dot.status-done {
    background: var(--st-done);
  }
  .status-dot.status-backlog {
    background: var(--st-backlog);
  }
  .status-dot.status-bug {
    background: var(--st-bug);
  }

  /* Le conteneur de tâche doit être un bloc, pas un flex */
  .tasks > li.task {
    display: block !important; /* override des styles existants */
  }

  /* La ligne titre + badge reste en flex */
  .tasks > li.task .task-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  /* La section SubTasks occupe toute la largeur sous la ligne */
  .tasks > li.task details.subtasks-wrap {
    display: block;
    width: 100%;
    margin-top: 6px;
  }

  /* Aspect du résumé "n sous‑tâche(s)" */
  .tasks > li.task details.subtasks-wrap > summary {
    list-style: none; /* enlève le triangle/bullet par défaut du thème */
    cursor: pointer;
    color: var(--text-muted);
    font-size: 12px;
    padding: 2px 0;
  }
  .tasks > li.task details.subtasks-wrap[open] > summary {
    margin-bottom: 6px;
  }

  /* Liste et items SubTasks en pleine largeur */
  .tasks > li.task .subtasks {
    padding-left: 0;
    margin: 0;
    display: grid;
    grid-template-columns: 1fr;
    gap: 6px;
  }
  .tasks > li.task .subtasks > li {
    list-style: none;
  }

  /* Style des sub‑tâches (reprend tes couleurs par statut) */
  .subtask {
    padding: 6px 8px;
    border-radius: 6px;
    border: 1px dashed var(--background-modifier-border);
    background: color-mix(in srgb, currentColor 8%, transparent);
  }

  .toolbar.global {
    margin: 6px 0 10px;
  }
  .btn.tiny {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 6px;
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border: none;
    cursor: pointer;
  }
  .icon {
    background: transparent;
    border: none;
    cursor: pointer;
    font-size: 14px;
    margin-left: 4px;
    opacity: 0.8;
  }
  .story > summary {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 8px;
    align-items: center;
  }
  .story > summary .counts {
    justify-self: end;
  }
  .story > summary .actions {
    justify-self: end;
    display: inline-flex;
    gap: 6px;
  }

  .tasks > li.task {
    display: block;
    padding: 6px 8px;
    border-radius: 6px;
  }
  .task-row {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 8px;
    align-items: center;
  }
  .task-title {
    font-weight: 500;
  }
  select.status {
    min-width: 120px;
  }
</style>
