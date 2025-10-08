<script lang="ts">
  import { type DataRecord } from "src/lib/dataframe/dataframe";
  // import { CreateNoteModal } from "src/ui/modals/createNoteModal";
  import EpicItem from "./components/EpicItem.svelte";
  import Toolbar from "./components/Toolbar.svelte";
  // import DebugPanel from "./components/DebugPanel.svelte";
  import { buildHierarchy, DataFieldName } from "./hierachy";
  import { hierarchyStore } from "./hierarchyStore";
  import type { StoryNode, TaskNode } from "./types";
  import type { DataFrame } from "obsidian-projects-types";
  import type { ProjectDefinition } from "src/settings/settings";
  // import { createDataRecord } from "src/lib/dataApi";
  import { app } from "src/lib/stores/obsidian";
  import type { ViewApi } from "src/lib/viewApi";
  import { CreateNoteModal } from "src/ui/modals/createNoteModal";
  import { createDataRecord } from "src/lib/dataApi";
  import { EditNoteModal } from "src/ui/modals/editNoteModal";
  import type { OnRecordClick } from "../Board/components/Board/types";
  // import { onMount } from "svelte";

  // export let frame: { records: DataRecord[] } = { records: [] };
  export let api: ViewApi;
  export let project: ProjectDefinition;
  export let frame: DataFrame;

  $: ({ fields, records } = frame);

  // Helpers “plats”
  const recordId = (r: DataRecord | string) => {
    return typeof r === "string"
      ? r
      : (r?.id ?? r?.values?.["path"] ?? r?.values?.["name"] ?? "");
  };

  function openRecord(r: DataRecord) {
    const app = (window as any)?.app;
    if (!app) return;
    const link = resolveRecordId(
      (r?.values?.["path"] as string) ??
        r?.values?.["name"] ??
        recordId(r) ??
        ""
    );
    // Essaie de résoudre à un TFile puis ouvre
    const file = app.metadataCache.getFirstLinkpathDest(link, "");
    if (file) app.workspace.getLeaf(false).openFile(file);
    else app.workspace.openLinkText(link, "", false);
  }

  // const createRecord = async (args: any) =>{}
  const createRecord = async (args: any) => {
    new CreateNoteModal($app, project, (name, templatePath, project) => {
      api.addRecord(
        createDataRecord(name, project, {
          [DataFieldName.Project]: "Epic",
        }),
        fields,
        templatePath
      );
    }).open();
  };
  const updateRecord = async (_r: any, _patch: any) => void 0;
  const titleOf = (r: DataRecord) =>
    (r?.values?.["Title"] as string) ??
    (r?.values?.["Titre"] as string) ??
    (r?.values?.["name"] as string) ??
    (r?.values?.["path"] as string) ??
    "";
  const resolveRecordId = (s: string) => s;

  // const FIELDS: Fields = {
  //   type: "Type",
  //   epic: "Epic",
  //   story: "Story",
  //   parent: "Parent",
  //   status: "Status",
  // };

  $: hierarchyStore.set(
    buildHierarchy(records, {
      recordId,
      resolveRecordId,
      titleOf,
    })
  );

  function storiesOfEpic(epicId: string): StoryNode[] {
    const hierarchy = $hierarchyStore; // Accède à la valeur réactive
    console.log("epic Id: ", epicId);
    console.log("Stories: ", hierarchy?.stories);
    console.log(
      "Stories filtered: ",
      hierarchy?.stories.filter((s) => s.epicId && s.epicId === epicId)
    );

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
  // async function addStory(epic: DataRecord) {
  //   await createRecord({
  //     title: "Nouvelle story",
  //     values: { [FIELDS.type]: "Story", [FIELDS.epic]: recordId(epic) },
  //   });
  // }
  // async function addTask(story: DataRecord) {
  //   await createRecord({
  //     title: "Nouvelle tâche",
  //     values: { [FIELDS.type]: "Task", [FIELDS.story]: recordId(story) },
  //   });
  // }
  // async function addSubTask(task: DataRecord) {
  //   await createRecord({
  //     title: "Sous-tâche",
  //     values: {
  //       [FIELDS.type]: "Task",
  //       [FIELDS.parent]: recordId(task),
  //       [FIELDS.story]: task?.values?.[FIELDS.story],
  //     },
  //   });
  // }
  async function setStatus(r: DataRecord, label: string) {
    await updateRecord(r, { values: { [DataFieldName.Statut]: label } });
  }
  function addEpic() {
    createRecord({
      title: "Nouvel epic",
      values: { [DataFieldName.Project]: "Epic" },
    });
  }
  const renameRecordInline = (r: DataRecord) => openRecord(r);
  const editRecordInline = (r: DataRecord) => openRecord(r);

  const handleRecordClick: OnRecordClick = (record) => {
    new EditNoteModal(
      $app,
      fields,
      (record) => api.updateRecord(record, fields),
      record
    ).open();
  };

  // onMount(() => {
  //   console.log("Epics : ", $hierarchyStore?.epics);
  //   console.log("Stories : ", $hierarchyStore?.stories);
  //   console.log("Tasks : ", $hierarchyStore?.tasks);
  //   console.log("Substasks : ", $hierarchyStore?.subtasks);
  // });
</script>

<div class="accordion">
  <Toolbar onAddEpic={addEpic}></Toolbar>

  {#each $hierarchyStore?.epics ?? [] as epic (recordId(epic))}
    <EpicItem
      {epic}
      stories={storiesOfEpic(recordId(epic))}
      tasksDirect={tasksOfEpicDirect(recordId(epic))}
      {openRecord}
      {setStatus}
      rename={renameRecordInline}
      edit={editRecordInline}
      {recordId}
      {api}
      {project}
      {frame}
      onRecordClick={handleRecordClick}
    />
  {/each}
</div>

<style>
  .accordion {
    margin: 0;
    padding: 0.5em;
  }
</style>
