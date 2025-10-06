<script lang="ts">
  export let onAddEpic: () => void;
</script>

<div class="toolbar global">
  <button class="btn tiny" on:click={onAddEpic}>+ Epic</button>
</div>

<style>
  .toolbar.global {
    margin: 6px 0 10px;
  }
  .btn.tiny {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 6px;
    background: var(--interactive-accent);
    color: var(--text-on-accent);
    border: none;
    cursor: pointer;
  }
</style>
