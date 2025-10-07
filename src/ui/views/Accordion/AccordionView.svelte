<script lang="ts">
  import EpicItem from "./components/EpicItem.svelte";
  import Toolbar from "./components/Toolbar.svelte";
  // import DebugPanel from "./components/DebugPanel.svelte";
  import { buildHierarchy } from "./hierachy";
  import { hierarchyStore } from "./hierarchyStore";
  import type { DataRecord, Fields, StoryNode, TaskNode } from "./types";
  import { log } from "console";

  export let frame: { records: DataRecord[] } = { records: [] };

  // Helpers “plats”
  const recordId = (r: DataRecord | string) => {
    log("record Id In parent");
    log(typeof r === "string" ? r : (r?.id ?? r?.path ?? r?.name ?? ""));
    return typeof r === "string" ? r : (r?.id ?? r?.path ?? r?.name ?? "");
  };

  function openRecord(r: DataRecord) {
    const app = (window as any)?.app;
    if (!app) return;
    const link = resolveRecordId(r?.path ?? r?.name ?? recordId(r));
    // Essaie de résoudre à un TFile puis ouvre
    const file = app.metadataCache.getFirstLinkpathDest(link, "");
    if (file) app.workspace.getLeaf(false).openFile(file);
    else app.workspace.openLinkText(link, "", false);
  }

  const createRecord = async (args: any) => {};
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

  $: hierarchyStore.set(
    buildHierarchy(frame.records, FIELDS, {
      recordId,
      resolveRecordId,
      titleOf,
    })
  );

  function storiesOfEpic(epicId: string): StoryNode[] {
    const hierarchy = $hierarchyStore; // Accède à la valeur réactive
    if (!hierarchy) return []; // Gère le cas null
    return hierarchy.stories.filter((s) => s.epicId && s.epicId === epicId);
  }
  //   function tasksOfStory(storyId: string): TaskNode[] {
  //     return hierarchy.tasks.filter((t) => t.storyId === storyId);
  //   }
  function tasksOfEpicDirect(epicId: string): TaskNode[] {
    const hierarchy = $hierarchyStore; // Accède à la valeur réactive
    if (!hierarchy) return []; // Gère le cas null
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
  const isDone = (_r: DataRecord) => false;
</script>

<details class="epic" open>
  <summary>
    <!-- <DebugPanel
      show={true}
      records={frame.records}
      {recordId}
      {titleOf}
      typeField={FIELDS.type}
      parentField={FIELDS.parent}
    /> -->
    <Toolbar onAddEpic={addEpic} />

    {#each $hierarchyStore?.epics ?? [] as epic (recordId(epic))}
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
        {recordId}
        {isDone}
      />
    {/each}
  </summary>
</details>
