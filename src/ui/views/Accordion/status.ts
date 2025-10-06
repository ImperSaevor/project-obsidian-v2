import type { DataRecord } from "./types";

export const STATUS = ["Backlog", "À faire", "En cours", "Terminé", "Bugs"] as const;
export type StatusLabel = typeof STATUS[number];

export const STATUS_META: Record<string, { label: string }> = {
  todo: { label: "À faire" },
  doing: { label: "En cours" },
  done: { label: "Terminé" },
  backlog: { label: "Backlog" },
  bug: { label: "Bugs" },
};

export function normalize(str?: any): string {
  return String(str ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

export function statusKeyFrom(r: DataRecord): "todo" | "doing" | "done" | "backlog" | "bug" {
  const raw = normalize(r?.values?.["Status"] ?? r?.values?.["Statut"]);
  if (["done", "termine", "terminee", "terminé", "completed", "complete"].includes(raw)) return "done";
  if (["doing", "en cours", "progress", "in progress"].includes(raw)) return "doing";
  if (["backlog"].includes(raw)) return "backlog";
  if (["bug", "bugs", "defaut", "anomalie"].includes(raw)) return "bug";
  return "todo";
}

export function statusClass(r: DataRecord): string {
  return `status-${statusKeyFrom(r)}`;
}

export function baseNameFrom(ref: string): string {
  if (!ref) return "";
  const m = ref.match(/^\s*\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]\s*$/);
  if (m) return (m[2] ?? m[1] ?? "").trim();
  const last = ref.split(/[\\/]/).pop() ?? ref;
  return last.replace(/#.*$/, "").replace(/\.md$/i, "");
}
