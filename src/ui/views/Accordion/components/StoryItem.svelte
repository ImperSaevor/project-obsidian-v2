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
  $: tasks = $hierarchyStore?.tasks.filter((t) => t.storyId === recordId(story)) ?? [];

</script>

<details class="story">
  <summary>
    <a
      class="internal-link title story"
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
    <span class="actions">
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
    </span>
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
  .title.story {
    font-weight: 500;
    color: var(--acc-story, var(--color-green));
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
</style>
