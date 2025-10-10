// src/ui/views/Accordion/accordionView.ts
import { ProjectView, type DataQueryResult, type ProjectViewProps } from "src/customViewApi";
import AccordionViewSvelte from "./AccordionView.svelte";
import type { AccordionConfig } from "./types";

export class AccordionView extends ProjectView<any> {
    view?: AccordionViewSvelte | null;

    getViewType() { return "accordion"; }
    getDisplayName() { return "Accordion"; }
    getIcon() { return "chevrons-down-up"; }

    // Accepte DataFrame OU { data: DataFrame }
    async onData({ data }: DataQueryResult) {
        this.view?.$set({ frame: data });
    }

    async onOpen(props: ProjectViewProps<AccordionConfig>) {
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
            },
        });
    }

    async onClose() {
        this.view?.$destroy();
        this.view = null;
    }
}
