import DotNode from "./DotNode";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameManager extends cc.Component {

    @property(cc.Prefab)
    NodePrefab: cc.Prefab = null;

    @property(cc.Graphics)
    gridGraphics: cc.Graphics = null;
    @property(cc.EditBox)
    columnInput: cc.EditBox = null;

    @property(cc.EditBox)
    rowInput: cc.EditBox = null;

    @property(cc.Button)
    submitButton: cc.Button = null;
    private rows = 6;
    private columns = 6;

    private rowOffset = 60;
    private columnOffset = 60;
    startCorner: cc.Vec3 = new cc.Vec3(-500, -5000, 0);

    nodeList: DotNode[] = [];

    findDotAtPosition(position: cc.Vec2): DotNode | null {
        for (let dot of this.nodeList) {
            let dotPos = dot.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
            let distance = position.sub(dotPos).mag();
            if (distance < 30) {
                return dot;
            }
        }
        return null;
    }

    onLoad() {
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.touchCancel, this)
    }

    protected onDestroy(): void {
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this.touchCancel, this)
    }

    touchCancel(TouchCancel: any) {
        this.nodeList.forEach(n => {
            n.node.emit('touchCancelEvent', TouchCancel);
        });
    }

    start() {
    }

    onSubmitClick() {
        this.rows = parseInt(this.rowInput.string);
        this.columns = parseInt(this.columnInput.string);

        this.rowInput.node.active = false;
        this.columnInput.node.active = false;
        this.submitButton.node.active = false;

        this.spawnMatrix();
    }

    spawnMatrix() {
        this.nodeList.forEach(dot => dot.node.destroy());
        this.nodeList = [];

        for (let i = 0; i < this.columns; i++) {
            let pos = this.startCorner.clone();
            pos.y = this.columnOffset * i - 100;
            for (let j = 0; j < this.rows; j++) {
                let node = cc.instantiate(this.NodePrefab);
                node.parent = this.node;
                let dotNode = node.getComponent(DotNode);

                if (!dotNode) {
                    continue;
                }

                this.addToNodeList(dotNode);
                dotNode.initialize(j, i, this.rows, this.columns, this);
                pos.x = (this.rowOffset * j) - 100;
                node.position = pos;
            }
        }

        this.drawGridLines();
        this.connectAdjacentDots();
    }

    drawGridLines() {
        if (!this.gridGraphics) {
            return;
        }

        this.gridGraphics.clear();
        this.gridGraphics.strokeColor = cc.Color.GRAY;
        this.gridGraphics.lineWidth = 2;

        for (let i = 0; i < this.columns; i++) {
            let startPos = this.nodeList[i * this.rows].node.position;
            let endPos = this.nodeList[(i + 1) * this.rows - 1].node.position;
            this.gridGraphics.moveTo(startPos.x, startPos.y);
            this.gridGraphics.lineTo(endPos.x, endPos.y);
        }

        for (let j = 0; j < this.rows; j++) {
            let startPos = this.nodeList[j].node.position;
            let endPos = this.nodeList[this.nodeList.length - this.rows + j].node.position;
            this.gridGraphics.moveTo(startPos.x, startPos.y);
            this.gridGraphics.lineTo(endPos.x, endPos.y);
        }

        this.gridGraphics.stroke();
    }

    private addToNodeList(dotNode: DotNode) {
        this.nodeList.push(dotNode);
    }

    connectAdjacentDots() {
        for (let i = 0; i < this.nodeList.length; i++) {
            let dotNode = this.nodeList[i];
            if (!dotNode) continue;

            if (dotNode.index.x < this.rows - 1) {
                let rightIndex = i + 1;
                if (rightIndex < this.nodeList.length) {
                    let rightDot = this.nodeList[rightIndex];
                    dotNode.connectedTo.push(rightDot);
                    rightDot.connectedTo.push(dotNode);
                }
            }

            if (dotNode.index.y < this.columns - 1) {
                let belowIndex = i + this.rows;
                if (belowIndex < this.nodeList.length) {
                    let belowDot = this.nodeList[belowIndex];
                    dotNode.connectedTo.push(belowDot);
                    belowDot.connectedTo.push(dotNode);
                }
            }
        }
    }
}
