import GameManager from "./GameManager";
import { NodeIndex } from "./NodeIndex";

const { ccclass, property } = cc._decorator;

enum DotNodeState {
    active = 0,
    connected = 1,
}

@ccclass
export default class DotNode extends cc.Component {

    @property(cc.Graphics)
    LineRenderer: cc.Graphics = null;

    index: NodeIndex = null;
    maxRow: number = 0;
    maxCol: number = 0;
    gameManager: GameManager;
    connectedTo: DotNode[] = [];
    currentState: DotNodeState = DotNodeState.active;

    private isDragging: boolean = false;
    private currentLine: cc.Vec2 = null;

    initialize(x: number, y: number, maxRow: number, maxCol: number, gameManager) {
        this.index = new NodeIndex(x, y);
        this.maxCol = maxCol;
        this.maxRow = maxRow;
        this.gameManager = gameManager;

        if (!this.LineRenderer) {
            this.LineRenderer = this.node.addComponent(cc.Graphics);
        }
    }

    protected onLoad(): void {
        this.node.on(cc.Node.EventType.TOUCH_START, this.touchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.touchMoved, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.touchEnded, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.touchCancel, this);
    }

    touchStart(event: cc.Event.EventTouch) {
        this.isDragging = true;
        this.currentLine = null;
    }

    touchMoved(event: cc.Event.EventTouch) {
        if (!this.isDragging) return;

        let touchPoint = event.getLocation();
        let touchPointInNodeSpace = this.node.convertToNodeSpaceAR(touchPoint);
        this.currentLine = touchPointInNodeSpace;
        this.drawLine(cc.v2(0, 0), touchPointInNodeSpace, cc.Color.CYAN);
    }

    touchEnded(event: cc.Event.EventTouch) {
        if (!this.isDragging) return;

        this.isDragging = false;

        let touchPoint = event.getLocation();
        let endDot = this.gameManager.findDotAtPosition(touchPoint);

        if (endDot && endDot !== this && this.isAdjacent(endDot) && !this.alreadyConnectedTo(endDot)) {
            this.createLineSegment(endDot);
            this.connectedTo.push(endDot);
            endDot.connectedTo.push(this);
            this.currentState = DotNodeState.connected;
            endDot.currentState = DotNodeState.connected;
        } else if (this.currentLine) {
            this.drawLine(cc.v2(0, 0), this.currentLine, cc.Color.GRAY);
        }
    }

    touchCancel(event: cc.Event.EventTouch) {
        this.isDragging = false;
        if (this.currentLine) {
            this.drawLine(cc.v2(0, 0), this.currentLine, cc.Color.GRAY);
        }
    }

    createLineSegment(to: DotNode) {
        let toPos = to.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        let localPos = this.node.convertToNodeSpaceAR(toPos);
        this.drawLine(cc.v2(0, 0), localPos, cc.Color.GRAY);
    }

    drawLine(from: cc.Vec2, to: cc.Vec2, color: cc.Color) {
        if (!this.LineRenderer) {
            return;
        }
        this.LineRenderer.clear();
        this.LineRenderer.lineWidth = 10;
        this.LineRenderer.strokeColor = color;
        this.LineRenderer.moveTo(from.x, from.y);
        this.LineRenderer.lineTo(to.x, to.y);
        this.LineRenderer.stroke();

        this.LineRenderer.circle(to.x, to.y, 5);
        this.LineRenderer.fill();
    }

    alreadyConnectedTo(neighbor: DotNode): boolean {
        return this.connectedTo.some((element) => element.index.x === neighbor.index.x && element.index.y === neighbor.index.y);
    }

    isAdjacent(dotNode: DotNode): boolean {
        let dx = Math.abs(this.index.x - dotNode.index.x);
        let dy = Math.abs(this.index.y - dotNode.index.y);
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    }

    protected onDestroy(): void {
        this.node.off(cc.Node.EventType.TOUCH_START, this.touchStart, this);
        this.node.off(cc.Node.EventType.TOUCH_MOVE, this.touchMoved, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this.touchEnded, this);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this.touchCancel, this);
    }
}
