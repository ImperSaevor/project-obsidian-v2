<script lang="ts">
  import type { DataRecord, StoryNode, TaskNode } from "../types";
  import StoryItem from "./StoryItem.svelte";

  export let epic: DataRecord;
  export let stories: StoryNode[] = [];
  export let tasksDirect: TaskNode[] = [];
  export let openRecord: (r: DataRecord) => void;
  export let addStory: (epic: DataRecord) => void;
  export let addTask: (story: DataRecord) => void;
  export let addSubTask: (task: DataRecord) => void;
  export let setStatus: (r: DataRecord, v: string) => void;
  export let rename: (r: DataRecord) => void;
  export let edit: (r: DataRecord) => void;
  export let childrenOfTask: (taskId: string) => DataRecord[];
  export let recordId: (r: DataRecord | string) => string;
  export let isDone: (r: DataRecord) => boolean = () => false;

  $: taskCount = stories.reduce(
    (acc, s) => acc + tasksDirect.filter((t) => t.storyId === undefined).length,
    0
  );
</script>

<details class="epic" open>
  <summary>
    <span>{taskCount}</span>
    <a
      class="internal-link title epic"
      href="#"
      on:click|preventDefault={() => openRecord(epic)}
    >
      {epic?.values?.["Title"] ??
        epic?.values?.["Titre"] ??
        epic?.name ??
        epic?.path}
    </a>
    <button class="btn tiny" on:click={() => addStory(epic)}>+ Story</button>
    <span class="counts">
      <span class="chip">Stories: {stories.length}</span>
      <span class="chip"
        >Tasks: {stories.reduce((n, s) => n + 0, 0) + tasksDirect.length}</span
      >
      {#if isDone(epic)}<span class="badge done">Done</span>{/if}
    </span>
  </summary>

  {#each stories as s (recordId(s.record))}
    <StoryItem
      story={s.record}
      tasks={[]}
      {openRecord}
      {addTask}
      {addSubTask}
      {setStatus}
      {rename}
      {edit}
      {childrenOfTask}
      {recordId}
      {isDone}
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
              t.record?.name ??
              t.record?.path}
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</details>

<style>
  .epic {
    border: 1px solid var(--background-modifier-border, #ddd);
    border-radius: 6px;
    margin: 0.5rem 0;
    background: var(--background-primary, #fff);
    border-left: 4px solid var(--acc-epic, var(--color-purple));
  }
  .summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .title.epic {
    font-weight: 600;
    color: var(--acc-epic, var(--color-purple));
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
  }
  .task-title {
    color: var(--acc-task, var(--color-blue));
  }
  .tasks-group-header {
    margin: 0.25rem 0 -0.25rem 1rem;
    font-size: 0.85rem;
    color: var(--text-muted, #666);
  }
  .btn.tiny {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 6px;
    border: 1px solid var(--background-modifier-border);
    background: var(--background-modifier-form-field);
    cursor: pointer;
  }
</style>
