<script lang="ts">
  import { baseNameFrom } from "../status";
  import type { DataRecord } from "../types";
  import TaskItem from "./TaskItem.svelte";
  import { hierarchyStore } from "../hierarchyStore";

  export let story: DataRecord;
  export let openRecord: (r: DataRecord) => void;
  export let addTask: (story: DataRecord) => void;
  export let addSubTask: (task: DataRecord) => void;
  export let setStatus: (r: DataRecord, v: string) => void;
  export let rename: (r: DataRecord) => void;
  export let edit: (r: DataRecord) => void;
  export let recordId: (r: DataRecord | string) => string;
  export let isDone: (r: DataRecord) => boolean = () => false;

  // Filtre les tâches associées à cette story
  $: tasks =
    $hierarchyStore?.tasks.filter((t) => t.storyId === recordId(story)) ?? [];
</script>

<details class="story" style="--done:{tasks.length}; --total:{tasks.length}">
  <summary>
    <a
      class="internal-link title_story"
      href="#"
      on:click|preventDefault={() => openRecord(story)}
    >
      {baseNameFrom(story?.values?.["name"])}
    </a>
    <span class="counts">
      <span class="chip">Tasks: {tasks.length}</span>
      {#if isDone(story)}
        <span class="badge done">Done</span>
      {/if}
    </span>
    <!-- <span class="actions">
      <button
        class="btn tiny"
        title="Ajouter une tâche"
        on:click|stopPropagation={() => addTask(story)}>+ Task</button
      >
      <button
        class="icon"
        title="Modifier"
        on:click|stopPropagation={() => edit(story)}>✏️</button
      >
      <button
        class="icon"
        title="Renommer"
        on:click|stopPropagation={() => rename(story)}>📝</button
      >
    </span> -->
  </summary>

  <ul class="tasks">
    {#each tasks ?? [] as t (recordId(t.record))}
      <TaskItem
        task={t.record}
        {openRecord}
        {setStatus}
        onAddSubTask={addSubTask}
        {rename}
        {edit}
        {isDone}
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
  .badge.done {
    color: #0a7;
    border: 1px solid #0a7;
    border-radius: 10px;
    padding: 0 0.25rem;
    font-size: 0.75rem;
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
