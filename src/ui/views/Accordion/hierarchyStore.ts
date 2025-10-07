// stores/hierarchyStore.js
import { writable } from 'svelte/store';
import type { Hierarchy } from "./types";

export const hierarchyStore = writable<Hierarchy | null>(null);
