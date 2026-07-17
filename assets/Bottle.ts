import { _decorator, Component, Graphics, Color, Node, UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Bottle')
export class Bottle extends Component {
    // 瓶子容量（层数）
    public maxLayers: number = 4;
    // 存储水的颜色名称，从底到顶，如 ['red','blue']
    public waterLayers: string[] = [];

    // 瓶子视觉参数
    private bottleWidth = 80;
    private bottleHeight = 200;
    private layerHeight: number = 40; // 每层水的高度
    private paddingBottom = 30; // 瓶底留白

    private graphics: Graphics | null = null;

    onLoad() {
        this.graphics = this.node.addComponent(Graphics);
        const uiTransform = this.getComponent(UITransform);
        if (uiTransform) {
            uiTransform.setContentSize(this.bottleWidth, this.bottleHeight);
        }
        this.draw();
    }

    /**
     * 根据 waterLayers 绘制整个瓶子
     */
    public draw() {
        if (!this.graphics) return;
        const g = this.graphics;
        g.clear();

        const x = -this.bottleWidth / 2;
        const y = -this.bottleHeight / 2;

        // 1. 先画水层（从底往上画）
        for (let i = 0; i < this.waterLayers.length; i++) {
            const colorName = this.waterLayers[i];
            const color = this.getColorByName(colorName);
            const layerY = y + this.paddingBottom + i * this.layerHeight;
            g.fillColor = color;
            g.rect(x + 5, layerY, this.bottleWidth - 10, this.layerHeight);
            g.fill();
        }

        // 2. 画瓶子边框
        g.strokeColor = Color.WHITE;
        g.lineWidth = 4;
        g.roundRect(x, y, this.bottleWidth, this.bottleHeight, 10);
        g.stroke();
    }

    /**
     * 把颜色名转成 Color 对象
     */
    private getColorByName(name: string): Color {
        switch (name) {
            case 'red': return Color.RED;
            case 'blue': return Color.BLUE;
            case 'green': return Color.GREEN;
            case 'yellow': return Color.YELLOW;
            case 'purple': return new Color(128, 0, 128);
            case 'cyan':   return new Color(0, 255, 255);
            case 'orange': return new Color(255, 165, 0);
            default: return Color.WHITE;
        }
    }

    /**
     * 获取最上层的颜色名称（没有水返回 null）
     */
    public getTopColor(): string | null {
        if (this.waterLayers.length === 0) return null;
        return this.waterLayers[this.waterLayers.length - 1];
    }

    /**
     * 获取从顶层开始连续相同颜色的层数
     */
    public getTopSameCount(): number {
        if (this.waterLayers.length === 0) return 0;
        const topColor = this.getTopColor();
        let count = 0;
        for (let i = this.waterLayers.length - 1; i >= 0; i--) {
            if (this.waterLayers[i] === topColor) count++;
            else break;
        }
        return count;
    }

    public isEmpty(): boolean { return this.waterLayers.length === 0; }
    public isFull(): boolean { return this.waterLayers.length >= this.maxLayers; }
    public getEmptySpace(): number { return this.maxLayers - this.waterLayers.length; }

    public addWater(color: string, count: number) {
        for (let i = 0; i < count; i++) {
            if (this.waterLayers.length < this.maxLayers) {
                this.waterLayers.push(color);
            }
        }
        this.draw();
    }

    public removeWater(count: number) {
        for (let i = 0; i < count; i++) {
            if (this.waterLayers.length > 0) {
                this.waterLayers.pop();
            }
        }
        this.draw();
    }

    public canPourFrom(source: Bottle): boolean {
        if (source.isEmpty()) return false;
        if (this.isFull()) return false;
        if (this.isEmpty()) return true;
        return source.getTopColor() === this.getTopColor();
    }
}
