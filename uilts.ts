export const setDraggingInstance = (instance) => {
    (window as any).__DRAGGING__ = instance;
}

export const getDraggingInstance = () => {
    return (window as any).__DRAGGING__;
}

export const clearDraggingInstance = () => {
    (window as any).__DRAGGING__ = null;
}