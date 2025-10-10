<script lang="ts">
  import { type DataRecord } from "src/lib/dataframe/dataframe";
  import EpicItem from "./components/EpicItem.svelte";
  import Toolbar from "./components/Toolbar.svelte";
  import { buildHierarchy, DataFieldName } from "./hierachy";
  import { hierarchyStore } from "./hierarchyStore";
  import type { StoryNode, TaskNode } from "./types";
  import type { DataFrame } from "obsidian-projects-types";
  import type { ProjectDefinition } from "src/settings/settings";
  import { app } from "src/lib/stores/obsidian";
  import type { ViewApi } from "src/lib/viewApi";
  import { CreateNoteModal } from "src/ui/modals/createNoteModal";
  import { createDataRecord } from "src/lib/dataApi";
  import { EditNoteModal } from "src/ui/modals/editNoteModal";
  import type { OnRecordClick } from "../Board/components/Board/types";
  import ViewContent from "src/ui/components/Layout/ViewContent.svelte";
  import {
    ViewHeader,
    ViewLayout,
    ViewToolbar,
  } from "src/ui/components/Layout";

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

  $: hierarchyStore.set(
    buildHierarchy(records, {
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

  function tasksOfEpicDirect(epicId: string): TaskNode[] {
    const hierarchy = $hierarchyStore; // Accède à la valeur réactive
    if (!hierarchy) return []; // Gère le cas null
    return hierarchy.tasks.filter((t) => t.epicId === epicId && !t.storyId);
  }

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
</script>

<ViewLayout>
  <ViewHeader>
    <ViewToolbar variant="secondary">
    </ViewToolbar>
  </ViewHeader>
  <ViewContent>
    <Toolbar onAddEpic={addEpic}></Toolbar>
    <div class="accordion">
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
  </ViewContent>
</ViewLayout>

<style>
  .accordion {
    margin: 0;
    padding: 0.5em;
  }
</style>
