export const setDraggingInstance = (instance) => {
    window.__DRAGGING__ = instance;
};
export const getDraggingInstance = () => {
    return window.__DRAGGING__;
};
export const clearDraggingInstance = () => {
    window.__DRAGGING__ = null;
};
