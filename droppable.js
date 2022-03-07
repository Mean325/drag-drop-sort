import { Draggable } from "./draggable.js";
import { clearDraggingInstance, getDraggingInstance } from "./uilts.js";
export class Droppable {
    constructor(element, options) {
        // 判断放置的位置
        this.judgeDropPos = (target, clientY) => {
            const lastChildRect = this.getLastChild().getBoundingClientRect();
            const firstChildRect = this.getFirstChild().getBoundingClientRect();
            if (clientY > lastChildRect.bottom) {
                console.log(clientY);
                console.log(lastChildRect);
                return '最后';
            }
            else if (clientY < firstChildRect.top) {
                return '最前';
            }
            else {
                const { top, height } = target.getBoundingClientRect();
                if (clientY < (top + height / 2)) {
                    return '当前节点前';
                }
                else {
                    return '当前节点后';
                }
            }
        };
        this.cloneNode = (target) => {
            let res = target.cloneNode();
            res.innerHTML = target.innerHTML;
            // res.addEventListener('dragstart', this.handleDragStart);
            return res;
        };
        this.getFirstChild = () => {
            const first = this.element.firstElementChild;
            const find = (first) => {
                if (first.nodeType !== 1 || first.style.display === 'none') {
                    return find(first.nextSibling);
                }
                return first;
            };
            return find(first);
        };
        this.getLastChild = () => {
            const last = this.element.lastElementChild;
            const find = (last) => {
                if (last.nodeType !== 1 || last.style.display === 'none') {
                    return find(last.previousSibling);
                }
                return last;
            };
            return find(last);
        };
        /** 在调整节点前捕获所有子节点位置 */
        this.capture = () => {
            const duration = 150;
            if (duration) {
                for (let child = this.element.firstElementChild; child; child = child.nextElementSibling) {
                    if (child.style.display !== "none") {
                        child["__moveRect__"] = child.getBoundingClientRect();
                    }
                    const moveAnimation = child["__moveAnimation__"];
                    // if (moveAnimation) {
                    //     moveAnimation.cancel()
                    //     child["__moveAnimation__"] = undefined
                    // }
                }
            }
        };
        /** 在调整节点后执行节点移动动画 */
        this.animate = () => {
            const duration = 150;
            const easing = "ease-out";
            if (duration) {
                for (let child = this.element.firstElementChild; child; child = child.nextElementSibling) {
                    const oldRect = child["__moveRect__"];
                    if (!oldRect) {
                        continue;
                    }
                    child["__moveRect__"] = undefined;
                    const newRect = child.getBoundingClientRect();
                    if (Math.abs(newRect.x - oldRect.x) < 1 && Math.abs(newRect.y - oldRect.y) < 1) {
                        continue;
                    }
                    child["__moveAnimation__"] = child.animate({ transform: [`translate3d(${oldRect.x - newRect.x}px,${oldRect.y - newRect.y}px,0)`, `none`] }, {
                        duration: duration,
                        easing: easing
                    });
                }
            }
        };
        // 寻找下一个节点
        this.findNextDom = (target, reverse = false) => {
            const dragging = getDraggingInstance().element;
            const find = (target) => {
                const next = reverse ? target.previousSibling : target.nextSibling;
                if (next === null) {
                    console.warn('无下个节点');
                    return null;
                }
                if (next === this.dropRef || next === dragging || next.nodeType !== 1)
                    return find(next);
                return next;
            };
            return find(target);
        };
        if (!element)
            return;
        this.handleDragOver = this.handleDragOver.bind(this);
        this.handleDragLeave = this.handleDragLeave.bind(this);
        this.handleDrop = this.handleDrop.bind(this);
        // @ts-ignore
        Object.assign(this, options);
        if (!element.style.overflowX) {
            element.style.overflowX = 'auto';
            console.warn('拖放元素的overflowX需要为auto');
        }
        this.element = element;
        this.init();
    }
    init() {
        this.element.setAttribute('__DROPPABLE_ROOT__', 'true');
        // 添加放置位置的参考对象
        const dropRef = document.createElement('div');
        dropRef.setAttribute('class', 'drop-ref');
        dropRef.setAttribute('__DROP_REF__', 'true');
        this.dropRef = dropRef;
        // 添加顶部及底部是否滚动的判定区域
        const scrollRef = document.createElement('div');
        scrollRef.setAttribute('class', 'scroll-ref');
        scrollRef.setAttribute('__SCROLL_REF__', 'true');
        this.scrollRef = scrollRef;
        this.element.addEventListener('dragover', this.handleDragOver);
        this.element.addEventListener('dragleave', this.handleDragLeave);
        this.element.addEventListener('drop', this.handleDrop);
    }
    handleDragStart() {
        console.log('重写生效');
    }
    handleDragOver(e) {
        e.preventDefault();
        if (!getDraggingInstance())
            return;
        const { target, clientY } = e;
        if (target === this.dropRef || !(this.element.contains(target) || target === this.element))
            return;
        if (target['__moveRect__'])
            return;
        // if (!this.element.contains(this.scrollRef)) {
        //     // 当列表中不包含"判定滚动的元素"时, 直接在尾部插入
        //     this.element.append(this.scrollRef);
        // }
        if (!this.element.contains(this.dropRef)) {
            // 当列表中不包含"放置参考"时, 直接在尾部插入
            this.element.append(this.dropRef);
        }
        else if (target !== this.element) {
            const position = this.judgeDropPos(target, clientY);
            console.log(position);
            let insertPos;
            if (position === '最后') {
                insertPos = null;
            }
            else if (position === '当前节点后') {
                insertPos = this.findNextDom(target);
            }
            else if (position === '当前节点前') {
                insertPos = target;
            }
            else if (position === '最前') {
                insertPos = this.element.firstElementChild;
            }
            if (insertPos === null) {
                this.element.append(this.dropRef);
            }
            else {
                this.capture();
                this.element.insertBefore(this.dropRef, insertPos);
                this.animate();
            }
        }
    }
    handleDragLeave(e) {
        var _a;
        try {
            if (!getDraggingInstance())
                return;
            const dragging = getDraggingInstance().element;
            if (!e.relatedTarget.contains(dragging))
                return;
            if ((_a = this.element) === null || _a === void 0 ? void 0 : _a.removeChild)
                this.element.removeChild(this.dropRef);
            this.element.classList.remove('forbidden-child-pointer-events');
        }
        catch (e) {
            console.log(e);
        }
    }
    handleDrop(e) {
        e.preventDefault();
        if (!getDraggingInstance())
            return;
        const draggedId = e.dataTransfer.getData("text/plain");
        let target = getDraggingInstance().element;
        target = this.cloneNode(target);
        this.element.insertBefore(target, this.dropRef);
        this.element.removeChild(document.getElementsByClassName('drop-ref')[0]);
        clearDraggingInstance();
    }
}
rewrite("handleDragStart", "handleDragStart");
// connect("dragMove", "handleDragMove")
// connect("dragEnd", "handleDragEnd", true)
function rewrite(dragEvent, dropEvent, before) {
    const old = Draggable.prototype[dragEvent];
    // Draggable.prototype[dragEvent] = before ? function (this: Draggable, e: PointerEvent) {
    //     Droppable[dropEvent](this, e)
    //     return old.call(this, e)
    // } : function (this: Draggable, e: PointerEvent) {
    //     const result = old.call(this, e)
    //     Droppable[dropEvent](this, e)
    //     return result
    // }
    if (before) {
        Draggable.prototype[dragEvent] = function (e) {
            Droppable.prototype[dropEvent](this, e);
            return old.call(this, e);
        };
    }
    else {
        Draggable.prototype[dragEvent] = function (e) {
            const result = old.call(this, e);
            Droppable.prototype[dropEvent](this, e);
            return result;
        };
    }
}
