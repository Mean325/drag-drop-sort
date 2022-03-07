import { clearDraggingInstance, setDraggingInstance } from "./uilts.js";
export class Draggable {
    constructor(element, options) {
        if (!element)
            return;
        this.handleDragStart = this.handleDragStart.bind(this);
        this.handleDragEnd = this.handleDragEnd.bind(this);
        // @ts-ignore
        Object.assign(this, options);
        this.element = element;
        this.init();
    }
    init() {
        this.element.draggable = true;
        this.element.addEventListener('dragstart', this.handleDragStart);
        this.element.addEventListener('dragend', this.handleDragEnd);
    }
    handleDragStart(e) {
        e.dataTransfer.setData("text/plain", e.target.id);
        e.dataTransfer.dropEffect = "move";
        // isContainer = dropTarget.contains(draging);
        setDraggingInstance(this);
    }
    handleDragEnd(e) {
        clearDraggingInstance();
    }
}
