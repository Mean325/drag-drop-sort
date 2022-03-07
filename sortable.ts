import { Draggable } from "./draggable.js";
import {getDraggingInstance} from "./uilts.js";

export class Sortable {
    // 根元素
    element: HTMLElement;
    // 当前拖动的元素
    dragging: HTMLElement;
    // 放置参考元素
    dropRef: HTMLElement;

    constructor(element: HTMLElement, options?: Options) {
        if (!element) return;
        this.handleDragStart = this.handleDragStart.bind(this);
        this.handleDrag = this.handleDrag.bind(this);
        this.handleDragEnd = this.handleDragEnd.bind(this);
        this.handleDragOver = this.handleDragOver.bind(this);
        this.handleDragLeave = this.handleDragLeave.bind(this);
        this.handleDrop = this.handleDrop.bind(this);

        // @ts-ignore
        Object.assign(this, options);
        this.element = element;
        this.init();
    }

    init() {
        this.element.setAttribute('__SORTABLE_ROOT__', 'true');
        // 添加参考
        const dropRef = document.createElement('div');
        dropRef.setAttribute('class', 'drop-ref');
        dropRef.setAttribute('__DROP_REF__', 'true');
        dropRef.style.background = 'red';
        this.dropRef = dropRef;

        const children = this.element.children;
        const childrenLength = children.length;
        for (let i = 0; i < childrenLength; i++) {
            children[i].setAttribute('draggable', 'true');
            children[i].addEventListener('dragstart', this.handleDragStart);
        }
        this.element.addEventListener('drag', this.handleDrag);
        this.element.addEventListener('dragend', this.handleDragEnd);
        this.element.addEventListener('dragover', this.handleDragOver);
        this.element.addEventListener('dragleave', this.handleDragLeave);
        this.element.addEventListener('drop', this.handleDrop);

        const observer = new MutationObserver(mutations => {
            mutations.forEach(i => {
                const nodeList = i.addedNodes;
                if (!nodeList.length) return;
                nodeList.forEach(l => {
                    if (l === dropRef) return;
                    (l as HTMLElement).setAttribute('draggable', 'true');
                    (l as HTMLElement).addEventListener('dragstart', this.handleDragStart);
                });
            });
        })
        observer.observe(this.element, { childList: true, subtree: true });
    }

    handleDragStart(e) {
        console.log('拖动开始', e.target);
        this.dragging = e.target;
    }

    handleDrag(e) {
        if (!this.dragging) return;
        // 解决最底部拖拽时, 未生成拖放参考的问题
        if (!this.element.contains(this.dropRef)) {
            this.element.append(this.dropRef);
        }
        e.target.style.display = "none";
    }


    handleDragEnd(e) {
        try {
            if (!this.dragging) return;
            this.element.insertBefore(e.target, this.dropRef);
            if (this.element?.removeChild) this.element.removeChild(this.dropRef);
            e.target.style.display = "block";
            this.dragging = null;
        } catch (e) {
            // console.log(e);
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        if (!this.dragging) return;
        this.element.classList.add('forbidden-child-pointer-events');
        const { target, clientY } = e;
        if (target === this.dropRef || !(this.element.contains(target) || target === this.element)) return;
        if (target['__moveRect__']) return;

        if (!this.element.contains(this.dropRef)) {
            // 当列表中不包含"放置参考"时, 直接在当前位置插入
            this.element.append(this.dropRef);
        } else if (target !== this.element) {
            const position = this.judgeDropPos(target, clientY);
            console.log(position);

            let insertPos;
            if (position === '最后') {
                insertPos = null;
            } else if (position === '当前节点后') {
                insertPos = this.findNextDom(target);
            } else if (position === '当前节点前') {
                insertPos = target;
            } else if (position === '最前') {
                insertPos = this.element.firstElementChild;
            }
            if (insertPos === null) {
                this.element.append(this.dropRef);
            } else {
                this.capture();
                this.element.insertBefore(this.dropRef, insertPos);
                this.animate();
            }
        }
    }

    handleDragLeave(e) {
        try {
            if (!this.dragging) return;
            const dragging = this.dragging;
            if (e.relatedTarget !== this.element) return;
            if (this.element?.removeChild) this.element.removeChild(this.dropRef);
            this.element.classList.remove('forbidden-child-pointer-events');
            this.dragging = null;
        } catch (e) {
            console.log(e);
        }
    }

    handleDrop(e) {
        e.preventDefault();
        if (!this.dragging) return;
        const draggedId = e.dataTransfer.getData("text/plain");
        let target = this.dragging;
        target.style.display = "block";
        this.element.insertBefore(target, this.dropRef);
        this.element.removeChild(document.getElementsByClassName('drop-ref')[0]);
        this.dragging = null;
    }

    // 判断放置的位置
    judgeDropPos = (target, clientY) => {
        const lastChildRect = this.getLastChild().getBoundingClientRect();
        const firstChildRect = this.getFirstChild().getBoundingClientRect();
        if (clientY > lastChildRect.bottom) {
            console.log(clientY);
            console.log(lastChildRect);
            return '最后';
        } else if (clientY < firstChildRect.top) {
            return '最前'
        } else {
            const { top, height } = target.getBoundingClientRect();
            if (clientY < (top + height / 2)) {
                return '当前节点前'
            } else {
                return '当前节点后'
            }
        }
    }

    getFirstChild = () => {
        const first = this.element.firstElementChild;

        const find = (first) => {
            if (first.nodeType !== 1 || first.style.display === 'none') {
                return find(first.nextSibling);
            }
            return first;
        }

        return find(first);
    }

    getLastChild = () => {
        const last = this.element.lastElementChild;

        const find = (last) => {
            if (last.nodeType !== 1 || last.style.display === 'none') {
                return find(last.previousSibling);
            }
            return last;
        }

        return find(last);
    }

    /** 在调整节点前捕获所有子节点位置 */
    capture = () => {
        const duration = 150;

        if (duration) {
            for (let child = this.element.firstElementChild; child; child = child.nextElementSibling) {
                if ((child as HTMLElement).style.display !== "none") {
                    child["__moveRect__"] = child.getBoundingClientRect()
                }
                const moveAnimation = child["__moveAnimation__"]
                // if (moveAnimation) {
                //     moveAnimation.cancel()
                //     child["__moveAnimation__"] = undefined
                // }
            }
        }
    }

    /** 在调整节点后执行节点移动动画 */
    animate = () => {
        const duration = 150;
        const easing = "ease-out";

        if (duration) {
            for (let child = this.element.firstElementChild; child; child = child.nextElementSibling) {
                const oldRect = child["__moveRect__"]
                if (!oldRect) {
                    continue
                }
                child["__moveRect__"] = undefined
                const newRect = child.getBoundingClientRect()
                if (Math.abs(newRect.x - oldRect.x) < 1 && Math.abs(newRect.y - oldRect.y) < 1) {
                    continue
                }
                child["__moveAnimation__"] = child.animate({ transform: [`translate3d(${oldRect.x - newRect.x}px,${oldRect.y - newRect.y}px,0)`, `none`] }, {
                    duration: duration,
                    easing: easing
                })
            }
        }
    }

    // 寻找下一个节点
    findNextDom = (target, reverse = false) => {
        const dragging = this.dragging;
        const find = (target) => {
            const next = reverse ? target.previousSibling : target.nextSibling;
            if (next === null) {
                console.warn('无下个节点');
                return null;
            }
            if (next === this.dropRef || next === dragging || next.nodeType !== 1) return find(next);
            return next;
        }

        return find(target)
    }
}

interface Options {
    value?: any;
}