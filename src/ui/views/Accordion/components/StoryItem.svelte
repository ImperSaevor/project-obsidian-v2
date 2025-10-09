<script lang="ts">
  import { baseNameFrom } from "../status";
  import TaskItem from "./TaskItem.svelte";
  import { hierarchyStore } from "../hierarchyStore";
  import type { DataFrame, DataRecord } from "src/lib/dataframe/dataframe";
  import type { OnRecordClick } from "../../Board/components/Board/types";
  import { CreateNoteModal } from "src/ui/modals/createNoteModal";
  import { createDataRecord } from "src/lib/dataApi";
  import { DataFieldName, pathToWikilink } from "../hierachy";
  import type { ProjectDefinition } from "src/settings/settings";
  import type { ViewApi } from "src/lib/viewApi";
  import { app } from "src/lib/stores/obsidian";
  import { handleHoverLink } from "../../helpers";

  export let api: ViewApi;
  export let project: ProjectDefinition;
  export let frame: DataFrame;

  $: ({ fields, records } = frame);

  export let onRecordClick: OnRecordClick;
  export let story: DataRecord;
  export let openRecord: (r: DataRecord) => void;
  // export let addTask: (story: DataRecord) => void;
  // export let addSubTask: (task: DataRecord) => void;
  export let setStatus: (r: DataRecord, v: string) => void;
  export let rename: (r: DataRecord) => void;
  export let edit: (r: DataRecord) => void;
  export let recordId: (r: DataRecord | string) => string;

  function updateStoryStatus(story: DataRecord, newStatus: string) {
    if (!story?.values) return;

    // Créer une copie modifiable de l'objet
    const updatedStory = {
      ...story,
      values: {
        ...story.values,
        Status: newStatus,
      },
    };

    return updatedStory; // Utilisez cette nouvelle version
  }

  function isDone() {
    // if (tasks.length > 0) {
    //   console.log(tasks);

    //   console.log(
    //     "Checking Done for tasks with every: ",
    //     tasks.every((s) => s.record?.values?.["Status"] === "Terminé")
    //   );
    //   console.log(
    //     "Checking Done for tasks with some: ",
    //     tasks.some((s) => s.record?.values?.["Status"] === "Terminé")
    //   );
    // }

    if (
      tasks.every((s) => s.record?.values?.["Status"] === "Terminé") &&
      tasks.length > 0
    ) {
      updateStoryStatus(story, "Terminé");
      return true;
    } else {
      return false;
    }
  }

  function isInProgress() {
    // if (tasks.length > 0) {
    //   console.log(
    //     "Checking InProgress for tasks with every: ",
    //     tasks.every((s) => s.record?.values?.["Status"] === "En cours")
    //   );
    //   console.log(
    //     "Checking InProgress for tasks with some: ",
    //     tasks.some((s) => s.record?.values?.["Status"] === "En cours")
    //   );
    // }

    if (
      tasks.some((s) => s.record?.values?.["Status"] === "En cours") &&
      tasks.length > 0
    ) {
      updateStoryStatus(story, "En cours");
      return true;
    } else {
      return false;
    }
  }

  function isInTodo() {
    // if (tasks.length > 0) {
    //   console.log(
    //     "Checking todo for tasks with every: ",
    //     tasks.every((s) => s.record?.values?.["Status"] === "À faire")
    //   );
    //   console.log(
    //     "Checking todo for tasks with some: ",
    //     tasks.some((s) => s.record?.values?.["Status"] === "À faire")
    //   );
    // }

    if (
      tasks.some((s) => s.record?.values?.["Status"] === "À faire") &&
      tasks.length > 0
    ) {
      updateStoryStatus(story, "À faire");
      return true;
    } else {
      return false;
    }
  }

  function isInBugs() {
    // if (tasks.length > 0) {
    //   console.log(
    //     "Checking bugs for tasks with every: ",
    //     tasks.every((s) => s.record?.values?.["Status"] === "Bugs")
    //   );
    //   console.log(
    //     "Checking bugs for tasks with some: ",
    //     tasks.some((s) => s.record?.values?.["Status"] === "Bugs")
    //   );
    // }

    if (
      tasks.some((s) => s.record?.values?.["Status"] === "Bugs") &&
      tasks.length > 0
    ) {
      updateStoryStatus(story, "Bugs");
      return true;
    } else {
      return false;
    }
  }

  function isInBacklog() {
    // if (tasks.length > 0) {
    //   console.log(
    //     "Checking Backlog for tasks with every: ",
    //     tasks.every((s) => s.record?.values?.["Status"] === "Backlog")
    //   );
    //   console.log(
    //     "Checking Backlog for tasks with some: ",
    //     tasks.some((s) => s.record?.values?.["Status"] === "Backlog")
    //   );
    // }

    if (
      tasks.some((s) => s.record?.values?.["Status"] === "Backlog") &&
      tasks.length > 0
    ) {
      updateStoryStatus(story, "Backlog");
      return true;
    } else {
      return false;
    }
  }

  const addTask = async (args: any) => {
    new CreateNoteModal($app, project, (name, templatePath, project) => {
      api.addRecord(
        createDataRecord(name, project, {
          [DataFieldName.Project]: "Task",
          [DataFieldName.Parent]: pathToWikilink(story.id),
        }),
        fields,
        templatePath
      );
    }).open();
  };

  // Filtre les tâches associées à cette story
  $: tasks =
    $hierarchyStore?.tasks.filter((t) => t.storyId === recordId(story)) ?? [];
</script>

<details class="story" style="--done:{tasks.length}; --total:{tasks.length}">
  <summary>
    <a
      class="internal-link title_story"
      href={story.id}
      on:click|preventDefault={() => openRecord(story)}
      on:mouseover={(event) => handleHoverLink(event, story.id)}
    >
      {baseNameFrom(story?.values?.["name"]?.toString() ?? "")}
    </a>
    <span class="actions">
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
        <span class="chip">Tasks: {tasks.length}</span>
      </span>
      <button
        class="btn tiny"
        title="Ajouter une tâche"
        on:click|stopPropagation={() => addTask(story)}>+ Task</button
      >
      <button
        class="icon"
        title="Supprimer"
        on:click|stopPropagation={() => rename(story)}>📝</button
      >
    </span>
  </summary>

  <ul class="tasks">
    {#each tasks ?? [] as t (recordId(t.record))}
      <TaskItem
        task={t.record}
        {openRecord}
        {setStatus}
        {rename}
        {edit}
        {api}
        {project}
        {frame}
      />
    {/each}
  </ul>
</details>

<style>
  :root {
    --acc-story: var(--color-green);
    --acc-task: var(--color-blue);
  }
  .story {
    position: relative;
    border: 1px solid var(--background-modifier-border, #ddd);
    border-left: 6px solid var(--acc-story, rgb(88, 229, 66));
    border-radius: 10px;
    background: color-mix(
      in srgb,
      var(--acc-story) 15%,
      var(--background-primary, #a4a4a4)
    );
    margin: 8px;
    padding: 0.5em;
    box-shadow:
      0 1px 0 rgba(0, 0, 0, 0.03),
      0 2px 10px color-mix(in srgb, var(--acc-story) 8%, transparent);
    transition:
      background 0.2s ease,
      box-shadow 0.2s ease,
      border-color 0.2s ease;
  }

  .story > summary {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
  }
  .story > summary .counts {
    justify-self: end;
  }
  .story > summary .actions {
    justify-self: end;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .title_story {
    padding: 0.5em;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    /* color: var(--acc-epic); */
    letter-spacing: 0.2px;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 60%;
  }

  .title_story::before {
    content: "";
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--acc-story, var(--color-green));
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--acc-story) 28%, transparent);
  }

  .story[open] {
    background: color-mix(
      in srgb,
      var(--acc-story) 10%,
      var(--background-primary)
    );
    box-shadow:
      0 1px 0 rgba(0, 0, 0, 0.04),
      0 6px 18px color-mix(in srgb, var(--acc-story) 14%, transparent);
  }

  .chip {
    background: var(--background-modifier-form-field, #f2f2f2);
    border-radius: 12px;
    padding: 0 0.5rem;
    font-size: 0.8rem;
  }
  /* Badge de statut éventuel (Done, Blocked, etc.) */
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
    color:
      rgb(170, 156, 0) 170,
      133,
      0;
    border:
      1px solid rgb(170, 156, 0) 170,
      133,
      0;
    border-radius: 8px;
    padding: 0 6px;
    font-size: 11px;
    background: color-mix(
      in srgb,
      rgb(170, 156, 0) 170,
      133,
      0 10%,
      transparent
    );
  }
  .badge.bugs {
    color:
      rgb(170, 0, 0) 170,
      133,
      0;
    border:
      1px solid rgb(170, 0, 0) 170,
      133,
      0;
    border-radius: 8px;
    padding: 0 6px;
    font-size: 11px;
    background: color-mix(
      in srgb,
      rgb(170, 0, 0) 170,
      133,
      0 10%,
      transparent
    );
  }

  .tasks {
    list-style: none;
    margin: 0.25rem 0.75rem 0.75rem 1.25rem;
    padding: 0;
  }

  /* Focus/hover sur la carte pour la navigabilité */
  .story:focus-within,
  .story:hover {
    border-color: color-mix(
      in srgb,
      var(--acc-story) 50%,
      var(--background-modifier-border)
    );
    box-shadow:
      0 1px 0 rgba(0, 0, 0, 0.04),
      0 8px 22px color-mix(in srgb, var(--acc-story) 18%, transparent);
  }
</style>
