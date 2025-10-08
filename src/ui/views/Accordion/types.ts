import type { DataRecord } from "src/lib/dataframe/dataframe";

export type AccordionConfig = {
  projetField: "Projet",
  parentField: "Parent",
  dependsOnField: "Dépendances", // si tu l’utilises
  doneValues?: string[];
  collapsed?: {
    epics?: Record<string, boolean>;
    stories?: Record<string, Record<string, boolean>>;
  };
};

// Types minimaux compatibles avec ton code actuel
export type Dict = Record<string, any>;

// export type DataRecord = {
//   statusLabel: string;
//   title: string;
//   id: string;
//   name?: string;
//   path?: string;
//   values?: Dict;
//   __childrenIndex?: Map<string, DataRecord[]>;
// };

export type Kind = "Epic" | "Story" | "Task" | "SubTask";

export type StoryNode = { record: DataRecord; epicId?: string };
export type TaskNode = {
  record: DataRecord;
  storyId?: string;
  epicId?: string;
};

export type Hierarchy = {
  epics: DataRecord[];
  stories: StoryNode[];
  tasks: TaskNode[];
  subtasks: Map<string, DataRecord[]>;
};

export type Env = {
  // wrappers fournis par Projects ou ton host
  recordId: (r: DataRecord | string) => string;
  resolveRecordId: (s: string) => string;
  openRecord: (r: DataRecord) => void;
  createRecord: (args: { title: string; values?: Dict }) => Promise<DataRecord>;
  updateRecord: (r: DataRecord, patch: Partial<DataRecord> & { values?: Dict }) => Promise<void>;
  titleOf: (r: DataRecord) => string;
};

export type Fields = {
  type: string;   // "Type"
  epic: string;   // "Epic"
  story: string;  // "Story"
  parent: string; // "Parent"
  status: string; // "Status" | "Statut"
};
