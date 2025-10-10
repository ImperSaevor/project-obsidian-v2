<script lang="ts">
  import { onMount } from "svelte";

  export let done = 0;
  export let total = 0;

  // Optionnels
  export let accent: string | undefined; // ex: "var(--acc-epic)"
  export let showLabel: "none" | "percent" | "ratio" = "percent";
  export let size: "xs" | "sm" | "md" | "lg" = "sm";
  export let rounded = true;
  export let striped = false;
  export let animated = false;

  $: pct = total > 0 && done > 0 ? Math.min(100, Math.max(0, (done / total) * 100)) : 20;
  $: aria = `${Math.round(pct)}%`;

  onMount(() => {
    console.log(
      "ProgressBar mounted with done:",
      done,
      "total:",
      total,
      "pct:",
      pct
    );
    console.log("Options - accent:", accent, "showLabel:", showLabel, "size:", size, "rounded:", rounded, "striped:", striped, "animated:", animated);
  });
</script>

<div
  class="progress {size} {rounded ? 'rounded' : ''} {striped
    ? 'striped'
    : ''} {animated ? 'animated' : ''}"
  style={accent ? `--accent:${accent}` : undefined}
  role="progressbar"
  aria-valuemin="0"
  aria-valuemax="100"
  aria-valuenow={Math.round(pct)}
  aria-label={`Progression ${aria}`}
>
  <span class="bar" style={`--pct:${pct}%`}></span>

  {#if showLabel !== "none"}
    <span class="label">
      {#if showLabel === "percent"}{Math.round(pct)}%{:else}{done}/{total}{/if}
    </span>
  {/if}
</div>

<style>
  .progress {
    --accent: var(--acc-epic, #7b68ee);
    --track: var(--background-modifier-form-field, #e9e9e9);
    --bar: color-mix(in srgb, var(--accent) 85%, #fff);

    position: relative;
    background: var(--track);
    height: 8px;
    border-radius: 8px;
    overflow: hidden;
  }
  .progress.xs {
    height: 6px;
  }
  .progress.sm {
    height: 8px;
  }
  .progress.md {
    height: 10px;
  }
  .progress.lg {
    height: 14px;
  }

  .progress.rounded {
    border-radius: 999px;
  }

  .progress .bar {
    position: absolute;
    inset: 0;
    width: var(--pct, 0%);
    background: linear-gradient(90deg, var(--bar), var(--accent));
    transition: width 0.25s ease;
  }

  .progress.striped .bar {
    background-image: repeating-linear-gradient(
      45deg,
      color-mix(in srgb, var(--accent) 70%, #fff) 0 10px,
      color-mix(in srgb, var(--accent) 20%, #fff) 10px 20px
    );
  }
  .progress.animated.striped .bar {
    animation: slide 1s linear infinite;
    background-size: 40px 40px;
  }
  @keyframes slide {
    from {
      background-position: 0 0;
    }
    to {
      background-position: 40px 0;
    }
  }

  .progress .label {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 11px;
    color: color-mix(in srgb, var(--accent) 60%, #333);
    user-select: none;
  }
</style>
