<script lang="ts">
  import type { DataRecord } from "../types.ts";
  export let show = false;
  export let records: DataRecord[] = [];
  export let recordId: (r: DataRecord) => string;
  export let titleOf: (r: DataRecord) => string;
  export let typeField = "Type";
  export let parentField = "Parent";
</script>

{#if show}
  <details open class="debug-panel">
    <summary>Debug: aperçu brut des records</summary>
    <div class="debug-grid">
      {#each records as r (recordId(r))}
        <pre>{JSON.stringify(
            { id: recordId(r), title: titleOf(r), values: r.values },
            null,
            2
          )}</pre>
      {/each}
    </div>
    <div class="hint">
      Vérifie que les colonnes s'appellent bien "{typeField}" et "{parentField}".
    </div>
  </details>
{/if}

<style>
  .debug-panel {
    border: 1px dashed var(--background-modifier-border, #bbb);
    padding: 0.5rem;
    background: var(--background-secondary, #fafafa);
    margin-bottom: 0.5rem;
  }
  .debug-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 0.5rem;
    max-height: 50vh;
    overflow: auto;
  }
  .debug-panel pre {
    margin: 0;
    padding: 0.5rem;
    background: var(--background-primary, #fff);
    border: 1px solid var(--background-modifier-border, #e0e0e0);
    border-radius: 6px;
    font-size: 0.8rem;
  }
  .hint {
    margin-top: 0.5rem;
    color: var(--text-muted);
    font-size: 0.85rem;
  }
</style>
