<script lang="ts">
  // import { onMount } from "svelte";
  import type { StoryNode, TaskNode } from "../types";
  import StoryItem from "./StoryItem.svelte";
  import { baseNameFrom } from "../status";
  import type { DataFrame, DataRecord } from "src/lib/dataframe/dataframe";
  import { CreateNoteModal } from "src/ui/modals/createNoteModal";
  import { createDataRecord } from "src/lib/dataApi";
  import type { ViewApi } from "src/lib/viewApi";
  import type { ProjectDefinition } from "src/settings/settings";
  import { app } from "src/lib/stores/obsidian";
  import { cleanWikiLink, DataFieldName, toWikiLink } from "../hierachy";
  import type { OnRecordClick } from "../../Board/components/Board/types";

  export let api: ViewApi;
  export let project: ProjectDefinition;
  export let frame: DataFrame;

  $: ({ fields, records } = frame);

  export let epic: DataRecord;
  export let stories: StoryNode[] = [];
  export let tasksDirect: TaskNode[] = [];
  export let openRecord: (r: DataRecord) => void;
  // export let addStory: (epic: DataRecord) => void;
  // export let addTask: (story: DataRecord) => void;
  // export let addSubTask: (task: DataRecord) => void;
  export let onRecordClick: OnRecordClick;
  export let setStatus: (r: DataRecord, v: string) => void;
  export let rename: (r: DataRecord) => void;
  export let edit: (r: DataRecord) => void;
  export let recordId: (r: DataRecord | string) => string;

  function isDone() {
    return (
      stories.every((s) => s.record?.values?.["Status"] === "Terminé") &&
      stories.length > 0
    );
  }

  function isInProgress() {
    return (
      stories.some((s) => s.record?.values?.["Status"] === "En cours") &&
      stories.length > 0
    );
  }

  function isInTodo() {
    return (
      stories.some((s) => s.record?.values?.["Status"] === "À faire") &&
      stories.length > 0
    );
  }

  function isInBugs() {
    return (
      stories.some((s) => s.record?.values?.["Status"] === "Bugs") &&
      stories.length > 0
    );
  }

  function isInBacklog() {
    return (
      stories.some((s) => s.record?.values?.["Status"] === "Backlog") &&
      stories.length > 0
    );
  }

  const addStory = async (args: any) => {
    new CreateNoteModal($app, project, (name, templatePath, project) => {
      api.addRecord(
        createDataRecord(name, project, {
          [DataFieldName.Project]: "Story",
          [DataFieldName.Parent]: cleanWikiLink(toWikiLink(epic.id)),
        }),
        fields,
        templatePath
      );
    }).open();
  };

  // onMount(() => {
  //   console.log(epic?.values);
  //   console.log(epic?.values?.["name"]);
  //   console.log(baseNameFrom(epic?.values?.["name"]));
  // });

  // $: taskCount = stories.reduce(
  //   (acc, s) => acc + tasksDirect.filter((t) => t.storyId === undefined).length,
  //   0
  // );
</script>

<details
  class="epic"
  style="--done:{stories.length}; --total:{stories.length}"
  open
>
  <summary>
    <a
      class="internal-link title_epic"
      href="#"
      on:click|preventDefault={() => openRecord(epic)}
      on:click={() => onRecordClick(epic)}
    >
      {baseNameFrom(epic?.values?.["name"]?.toString() ?? "")}
    </a>
    <button class="btn tiny" on:click={() => addStory(epic)}>+ Story</button>
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
      <span class="chip">Stories: {stories.length}</span>
      <span class="chip"
        >Tasks: {stories.reduce((n, s) => n + 0, 0) + tasksDirect.length}</span
      >
      <!-- <span class="badge done">Done</span> -->
    </span>
  </summary>

  {#each stories as s (recordId(s.record))}
    <StoryItem
      story={s.record}
      onRecordClick={onRecordClick}
      {openRecord}
      {setStatus}
      {rename}
      {edit}
      {recordId}
      {api}
      {project}
      {frame}
    />
  {/each}

  {#if tasksDirect.length}
    <div class="tasks-group-header">Tâches sans story</div>
    <ul class="tasks">
      {#each tasksDirect as t (recordId(t.record))}
        <li>
          <span class="square" aria-hidden="true"></span>
          <a
            href="#"
            class="task-title"
            on:click|preventDefault={() => openRecord(t.record)}
          >
            {t.record?.values?.["Title"] ??
              t.record?.values?.["Titre"] ??
              t.record?.values?.["name"] ??
              t.record?.values?.["path"]}
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</details>

<style>
  /* Couleurs d’accent (garde tes valeurs) */
  :root {
    --acc-epic: var(--color-purple);
    --acc-story: var(--color-green);
    --acc-task: var(--color-blue);
  }

  /* Carte Epic */
  .epic {
    position: relative;
    border: 1px solid var(--background-modifier-border, #ddd);
    border-left: 6px solid var(--acc-epic, rebeccapurple);
    border-radius: 10px;
    background: color-mix(
      in srgb,
      var(--acc-epic) 15%,
      var(--background-primary, #a4a4a4)
    );
    margin: 8px 0;
    box-shadow:
      0 1px 0 rgba(0, 0, 0, 0.03),
      0 2px 10px color-mix(in srgb, var(--acc-epic) 8%, transparent);
    transition:
      background 0.2s ease,
      box-shadow 0.2s ease,
      border-color 0.2s ease;
  }

  /* Ouvert/fermé (marche si tu utilises <details class="epic">) */
  .epic[open] {
    background: color-mix(
      in srgb,
      var(--acc-epic) 10%,
      var(--background-primary)
    );
    box-shadow:
      0 1px 0 rgba(0, 0, 0, 0.04),
      0 6px 18px color-mix(in srgb, var(--acc-epic) 14%, transparent);
  }

  /* Bandeau supérieur en grille: Titre | Compteurs | Actions */
  .epic > summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 8px 12px;
  }

  /* Titre Epic + pastille */
  .title_epic {
    padding: 0.5em;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    /* color: var(--acc-epic); */
    letter-spacing: 0.2px;
  }
  .title_epic::before {
    content: "";
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--acc-epic), var(--color-green);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--acc-epic) 28%, transparent);
  }

  /* Compteurs alignés à droite, façon “chips” */
  .counts {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    justify-self: end;
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
  .chip .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
    opacity: 0.6;
  }
  .chip.stories {
    color: color-mix(in srgb, var(--acc-story) 80%, #333);
  }
  .chip.tasks {
    color: color-mix(in srgb, var(--acc-task) 80%, #333);
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

  .badge.inProgress {
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
    background: color-mix(in srgb, rgb(170, 0, 0) 170, 133, 0 10%, transparent);
  }

  /* Barre de progression (utilise --done et --total sur .epic) */
  .epic .progress {
    --pct: calc((var(--done, 0) / max(var(--total, 1), 1)) * 100%);
    height: 6px;
    border-radius: 999px;
    overflow: hidden;
    margin: 0 12px 8px 12px;
    background: var(--background-modifier-form-field, #eee);
    position: relative;
  }
  .epic .progress > span {
    display: block;
    height: 100%;
    width: clamp(0%, var(--pct), 100%);
    background: linear-gradient(
      90deg,
      color-mix(in srgb, var(--acc-epic) 85%, #fff),
      var(--acc-epic)
    );
    transition: width 0.25s ease;
  }

  /* Corps (liste des stories/tasks) */
  .epic .body {
    padding: 6px 10px 10px 10px;
  }

  /* Liste des tâches immédiates de l’Epic (si tu en affiches) */
  .tasks {
    list-style: none;
    margin: 4px 10px 10px 22px; /* un peu plus d’indentation */
    padding: 0;
  }
  .tasks li {
    padding: 4px 0;
    display: flex;
    gap: 8px;
    align-items: center;
    border-bottom: 1px dashed
      color-mix(
        in srgb,
        var(--acc-epic) 10%,
        var(--background-modifier-border, #ddd)
      );
  }
  .tasks li:last-child {
    border-bottom: none;
  }

  .tasks li .square {
    width: 12px;
    height: 12px;
    border-radius: 3px;
    border: 1px solid
      color-mix(in srgb, var(--acc-task) 55%, var(--text-muted, #aaa));
    background: color-mix(in srgb, var(--acc-task) 15%, transparent);
  }

  /* Boutons d’action compacts à droite */
  .actions {
    justify-self: end;
    display: inline-flex;
    gap: 6px;
  }
  .btn.tiny {
    font-size: 12px;
    padding: 3px 8px;
    border-radius: 6px;
    border: 1px solid var(--background-modifier-border);
    background: var(--background-modifier-form-field);
    color: var(--text-normal);
    cursor: pointer;
  }
  .btn.tiny:hover {
    background: color-mix(
      in srgb,
      var(--acc-epic) 10%,
      var(--background-modifier-form-field)
    );
    border-color: color-mix(
      in srgb,
      var(--acc-epic) 30%,
      var(--background-modifier-border)
    );
  }

  /* Focus/hover sur la carte pour la navigabilité */
  .epic:focus-within,
  .epic:hover {
    border-color: color-mix(
      in srgb,
      var(--acc-epic) 50%,
      var(--background-modifier-border)
    );
    box-shadow:
      0 1px 0 rgba(0, 0, 0, 0.04),
      0 8px 22px color-mix(in srgb, var(--acc-epic) 18%, transparent);
  }

  /* Densité compacte si besoin: ajoute .dense sur un parent */
  .dense .summary {
    padding: 6px 10px;
  }
  .dense .epic .progress {
    margin: 0 10px 6px;
  }
  .dense .tasks li {
    padding: 2px 0;
  }
</style>
