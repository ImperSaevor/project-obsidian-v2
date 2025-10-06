<script lang="ts">
  import type { DataRecord } from "../types";
  import { statusClass, STATUS_META, statusKeyFrom } from "../status";

  export let task: DataRecord;
  export let children: DataRecord[] = [];
  export let openRecord: (r: DataRecord) => void;
  export let onAddSubTask: (task: DataRecord) => void;
  export let setStatus: (r: DataRecord, v: string) => void;
  export let rename: (r: DataRecord, newName: string) => void;
  export let edit: (r: DataRecord) => void;
  export let isDone: (r: DataRecord) => boolean = () => false;

  // État local non‑persisté pour le <select>
//   let selectValue: string;
//   $: selectValue = getStatusLabel(task); // se remet à jour si le record change

//   function onChange(e: Event) {
//     const v = (e.currentTarget as HTMLSelectElement).value;
//     selectValue = v; // met à jour l’UI
//     setStatus(task, v); // demande la mise à jour côté Projects
//   }
</script>

<details class="subtasks-wrap">
  <summary
    >{children.length}
    {children.length > 1 ? "sous‑tâches" : "sous‑tâche"}</summary
  >
  <ul class="subtasks">
    {#each children as st (st.id)}
      <li class="subtask">
        <a
          href="#"
          class="internal-link"
          on:click|preventDefault={() => openRecord(st)}
        >
          {st?.values?.["Title"] ??
            st?.values?.["Titre"] ??
            st?.name ??
            st?.path}
        </a>
        <span
          class={"status-dot " + statusClass(st)}
          title={STATUS_META[statusKeyFrom(st)]?.label}
        ></span>
      </li>
    {/each}
  </ul>
  <button class="btn tiny" on:click={() => onAddSubTask(task)}>+ SubTask</button
  >
</details>

<style>
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
  .btn.tiny {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 6px;
    border: 1px solid var(--background-modifier-border);
    background: var(--background-modifier-form-field);
    cursor: pointer;
  }
  .status-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-left: 6px;
    vertical-align: middle;
  }
  .status-todo {
    background: var(--st-todo);
  }
  .status-doing {
    background: var(--st-doing);
  }
  .status-done {
    background: var(--st-done);
  }
  .status-backlog {
    background: var(--st-backlog);
  }
  .status-bug {
    background: var(--st-bug);
  }
</style>
