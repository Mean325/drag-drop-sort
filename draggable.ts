import {clearDraggingInstance, setDraggingInstance} from "./uilts.js";

export class Draggable {
    // 根元素
    element: HTMLElement;

    constructor(element: HTMLElement, options?: Options) {
        if (!element) return;
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

interface Options {
    value?: any;
}