<script lang="ts">
  import type { DataRecord } from "../types";
  import {
    statusClass,
    STATUS_META,
    statusKeyFrom,
    baseNameFrom,
  } from "../status";
  import { hierarchyStore } from "../hierarchyStore";

  export let task: DataRecord;
  export let openRecord: (r: DataRecord) => void;
  export let onAddSubTask: (task: DataRecord) => void;
  export let setStatus: (r: DataRecord, v: string) => void;
  export let rename: (r: DataRecord, newName: string) => void;
  export let edit: (r: DataRecord) => void;
  export let isDone: (r: DataRecord) => boolean = () => false;

  $: children = $hierarchyStore?.subtasks ?? new Map<string, DataRecord[]>();

  function getChildren(): DataRecord[] {
    const normalizedId = normalizeTaskId(task.id);
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

    console.log("Not found");
    return [];
  }

  function normalizeTaskId(taskId: string): string {
    // Si déjà au format "[[...|...]]", on nettoie juste le .md dans la partie après |
    if (taskId.startsWith("[[") && taskId.endsWith("]]")) {
      const parts = taskId.slice(2, -2).split("|"); // Enlève [[ ]] et split
      if (parts.length === 2) {
        const [path, fileName] = parts;
        const cleanedFileName = fileName?.replace(/\.md$/i, ""); // Supprime .md (case-insensitive)
        return `[[${path}|${cleanedFileName}]]`;
      }
      return taskId; // Retourne tel quel si le format est invalide
    }

    // Cas normal : chemin/nom_fichier.md → [[chemin/nom_fichier|nom_fichier]]
    const lastSlashIndex = taskId.lastIndexOf("/");
    if (lastSlashIndex === -1) {
      // Pas de "/", c'est juste un nom de fichier (ex: "Test2.md")
      const cleanedId = taskId.replace(/\.md$/i, "");
      return `[[${cleanedId}|${cleanedId}]]`;
    }

    // Sépare chemin et nom de fichier
    const path = taskId;
    let fileName = taskId.substring(lastSlashIndex + 1);
    fileName = fileName.replace(/\.md$/i, ""); // Supprime .md

    return `[[${path}|${fileName}]]`;
  }

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
  <summary>
    <a
      class="internal-link title_task"
      href="#"
      on:click|preventDefault={() => openRecord(task)}
    >
      {baseNameFrom(task?.values?.["name"])}
    </a>
    {#if isDone(task)}<span class="badge done">Done</span>{/if}
    <span class="chip">
      {getChildren().length > 0 ? getChildren().length : 0}
      {getChildren().length > 1 ? "sous‑tâches" : "sous‑tâche"}
    </span>
  </summary>
  <ul class="subtasks">
    {#each getChildren() as st (st.id)}
      <li class="subtask">
        <a
          href="#"
          class="internal-link"
          on:click|preventDefault={() => openRecord(st)}
        >
          {baseNameFrom(st?.values?.["name"])}
        </a>
        <span
          class={"status-dot " + statusClass(st)}
          title={STATUS_META[statusKeyFrom(st)]?.label}
        ></span>
      </li>
    {/each}
  </ul>
  <!-- <button class="btn tiny" on:click={() => onAddSubTask(task)}>+ SubTask</button> -->
</details>

<style>
  .subtasks-wrap {
    position: relative;
    border: 1px solid var(--background-modifier-border, #ddd);
    border-left: 6px solid var(--acc-task, rgb(66, 196, 229));
    border-radius: 10px;
    background: color-mix(
      in srgb,
      var(--acc-task) 15%,
      var(--background-primary, #a4a4a4)
    );
    margin: 8px;
    padding: 0.5em;
    box-shadow:
      0 1px 0 rgba(0, 0, 0, 0.03),
      0 2px 10px color-mix(in srgb, var(--acc-task) 8%, transparent);
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

  .title_task {
    padding: 0.5em;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    /* color: var(--acc-epic); */
    letter-spacing: 0.2px;
  }

  .title_task::before {
    content: "";
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--acc-task, var(--color-blue));
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--acc-task) 28%, transparent);
  }

  /* Focus/hover sur la carte pour la navigabilité */
  .subtasks-wrap:focus-within,
  .subtasks-wrap:hover {
    border-color: color-mix(
      in srgb,
      var(--acc-task) 50%,
      var(--background-modifier-border)
    );
    box-shadow:
      0 1px 0 rgba(0, 0, 0, 0.04),
      0 8px 22px color-mix(in srgb, var(--acc-task) 18%, transparent);
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
  .chip {
    background: var(--background-modifier-form-field, #f2f2f2);
    border-radius: 12px;
    padding: 0 0.5rem;
    font-size: 0.8rem;
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
