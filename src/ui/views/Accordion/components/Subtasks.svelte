<script lang="ts">
  import { baseNameFrom } from "../status";
  import type {
    DataFrame,
    DataRecord,
  } from "../../../../lib/dataframe/dataframe";
  import { handleHoverLink } from "../../helpers";
  import type { ViewApi } from "src/lib/viewApi";
  import type { ProjectDefinition } from "src/settings/settings";
  import { hierarchyStore } from "../hierarchyStore";
  import { DataFieldName, pathToWikilink } from "../hierachy";
  import { CreateNoteModal } from "src/ui/modals/createNoteModal";
  import { createDataRecord } from "src/lib/dataApi";
  import { app } from "src/lib/stores/obsidian";
  import Self from "./Subtasks.svelte";

  export let api: ViewApi;
  export let project: ProjectDefinition;
  export let frame: DataFrame;
  export let task: DataRecord;
  export let openRecord: (r: DataRecord) => void;

  $: ({ fields, records } = frame);

  $: children = $hierarchyStore?.subtasks ?? new Map<string, DataRecord[]>();

  function getChildren(): DataRecord[] {
    const normalizedId = pathToWikilink(task.id);
    console.log("Normalized ID:", normalizedId); // Debug
    console.log("Children keys:", Array.from(children.keys())); // Debug

    // Vérifie si la clé normalisée existe
    if (children.has(normalizedId)) {
      console.log("Found with normalized ID");
      return children.get(normalizedId) ?? [];
    }

    // Fallback : essaie avec l'ID brut (au cas où)
    if (children.has(task.id)) {
      console.log("Found with raw ID");
      return children.get(task.id) ?? [];
    }

    // console.log("Not found");
    return [];
  }

  function isDone() {
    return task?.values?.["Status"] === "Terminé";
  }

  function isInProgress() {
    return task?.values?.["Status"] === "En cours";
  }

  function isInTodo() {
    return task?.values?.["Status"] === "À faire";
  }

  function isInBugs() {
    return task?.values?.["Status"] === "Bugs";
  }

  function isInBacklog() {
    return task?.values?.["Status"] === "Backlog";
  }

  const addSubTask = async (args: any) => {
    new CreateNoteModal($app, project, (name, templatePath, project) => {
      api.addRecord(
        createDataRecord(name, project, {
          [DataFieldName.Project]: "SubTask",
          [DataFieldName.Parent]: pathToWikilink(task.id),
        }),
        fields,
        templatePath
      );
    }).open();
  };
</script>

<details class="subtasks-wrap">
  <summary>
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <a
      href={task.id}
      class="internal-link title_subtask"
      on:click|preventDefault={() => openRecord(task)}
      on:mouseover={(event) => handleHoverLink(event, task.id)}
    >
      {baseNameFrom(task?.values?.["name"]?.toString() ?? "")}
    </a>
    <span class="counts">
      {#if isDone()}
        <span class="badge done">Done</span>
      {:else if isInProgress()}
        <span class="badge inProgress">In Progress</span>
      {:else if isInBugs()}
        <span class="badge bugs">Bugs</span>
      {:else if isInBacklog()}
        <span class="badge backlog">Backlog</span>
      {:else if isInTodo()}
        <span class="badge todo">To Do</span>
      {/if}
      <span class="chip">
        {getChildren().length > 0 ? getChildren().length : 0}
        {getChildren().length > 1 ? "sous‑tâches" : "sous‑tâche"}
      </span>
      <button
        class="btn tiny"
        title="Ajouter une sous tâche"
        on:click|stopPropagation={() => addSubTask(task)}>+ SubTask</button
      >
    </span>
  </summary>
  <ul class="subtasks">
    {#each getChildren() as st (task.id)}
      <Self {api} {project} {frame} task={st} {openRecord} />
    {/each}
  </ul>
</details>

<style>
  .subtasks-wrap {
    position: relative;
    border: 1px solid var(--background-modifier-border, #ddd);
    border-left: 6px solid var(--acc-subtask, rgb(154, 154, 154));
    border-radius: 10px;
    background: color-mix(
      in srgb,
      var(--acc-subtask) 15%,
      var(--background-primary, #a4a4a4)
    );
    margin: 8px;
    padding: 0.5em;
    box-shadow:
      0 1px 0 rgba(0, 0, 0, 0.03),
      0 2px 10px color-mix(in srgb, var(--acc-subtask) 8%, transparent);
    transition:
      background 0.2s ease,
      box-shadow 0.2s ease,
      border-color 0.2s ease;
  }

  .subtasks-wrap summary {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
  }
  .title_subtask {
    padding: 0.5em;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    /* color: var(--acc-epic); */
    letter-spacing: 0.2px;
  }

  .title_subtask::before {
    content: "";
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--acc-subtask, var(--color-grey));
    box-shadow: 0 0 0 4px
      color-mix(in srgb, var(--acc-subtask) 28%, transparent);
  }

  /* Focus/hover sur la carte pour la navigabilité */
  .subtasks-wrap:focus-within,
  .subtasks-wrap:hover {
    border-color: color-mix(
      in srgb,
      var(--acc-subtask) 50%,
      var(--background-modifier-border)
    );
    box-shadow:
      0 1px 0 rgba(0, 0, 0, 0.04),
      0 8px 22px color-mix(in srgb, var(--acc-subtask) 18%, transparent);
  }
  .subtasks {
    margin: 6px 0 0 0;
    padding-left: 12px;
    display: grid;
    gap: 4px;
  }
  .badge.backlog {
    color: rgb(0, 174, 255);
    border: 1px solid rgb(0, 174, 255);
    border-radius: 8px;
    padding: 0 6px;
    font-size: 11px;
    background: color-mix(in srgb, rgb(0, 174, 255) 10%, transparent);
  }
  .badge.todo {
    color: rgb(140, 140, 140);
    border: 1px solid rgb(140, 140, 140);
    border-radius: 8px;
    padding: 0 6px;
    font-size: 11px;
    background: color-mix(in srgb, rgb(140, 140, 140) 10%, transparent);
  }
  .badge.done {
    color: #0a7;
    border: 1px solid #0a7;
    border-radius: 8px;
    padding: 0 6px;
    font-size: 11px;
    background: color-mix(in srgb, #0a7 10%, transparent);
  }
  .badge.inProgress {
    color: rgb(232, 232, 0);
    border: 1px solid rgb(232, 232, 0);
    border-radius: 8px;
    padding: 0 6px;
    font-size: 11px;
    background: color-mix(in srgb, rgb(232, 232, 0) 10%, transparent);
  }
  .badge.bugs {
    color: rgb(232, 0, 0);
    border: 1px solid rgb(232, 0, 0);
    border-radius: 8px;
    padding: 0 6px;
    font-size: 11px;
    background: color-mix(in srgb, rgb(232, 0, 0) 10%, transparent);
  }
  .btn.tiny {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 6px;
    border: 1px solid var(--background-modifier-border);
    background: var(--background-modifier-form-field);
    cursor: pointer;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 22px;
    padding: 0 8px;
    font-size: 12px;
    line-height: 20px;
    background: var(--background-modifier-form-field, #f2f2f2);
    border: 1px solid var(--background-modifier-border, #ddd);
    border-radius: 999px;
    color: var(--text-muted);
  }
  .counts {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    justify-self: end;
  }
</style>
