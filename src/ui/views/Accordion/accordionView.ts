// src/ui/views/Accordion/accordionView.ts
import { ProjectView, type ProjectViewProps } from "src/customViewApi";
import AccordionViewSvelte from "./AccordionViewOneComponent.svelte";

export class AccordionView extends ProjectView<any> {
    view?: AccordionViewSvelte | null;

    getViewType() { return "accordion"; }
    getDisplayName() { return "Accordion"; }
    getIcon() { return "chevrons-down-up"; }

    // Accepte DataFrame OU { data: DataFrame }
    async onData(arg: any) {
        const df = arg?.data ? arg.data : arg;           // compat V2/V3
        const records = Array.isArray(df?.records) ? [...df.records] : [];
        // Pousser une nouvelle référence évite l’égalité stricte et déclenche l’update Svelte
        this.view?.$set({ frame: { records } });
        console.log("[Accordion] records:", records.length);
    }

    async onOpen(props: ProjectViewProps<any>) {
        this.view = new AccordionViewSvelte({
            target: props.contentEl,
            props: {
                frame: { fields: [], records: [] },
                api: props.viewApi,
                project: props.project,
                readonly: props.readonly,
                config: props.config,
                onConfigChange: props.saveConfig,
                getRecordColor: props.getRecordColor,
                sortRecords: props.sortRecords,
                getRecord: props.getRecord,
            }
        });
    }

    async onClose() { this.view?.$destroy(); this.view = null; }
}
