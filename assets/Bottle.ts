import { _decorator, Component, Graphics, Color, UITransform } from 'cc';
const { ccclass } = _decorator;

interface Bubble {
    x: number;
    y: number;
    radius: number;
    speed: number;
    alpha: number;
    life: number;
    maxLife: number;
}

interface LightSpot {
    x: number;
    y: number;
    speed: number;
    alpha: number;
    life: number;
}

@ccclass('Bottle')
export class Bottle extends Component {
    public maxLayers: number = 4;
    public waterLayers: string[] = [];

    private bottleWidth = 70;
    private bottleHeight = 200;
    private layerHeight: number = 42;
    private paddingBottom = 23;

    private neckWidth = 24;
    private neckHeight = 14;
    private bodyRadius = 16;

    private graphics: Graphics | null = null;
    private time: number = 0;
    private bubbles: Bubble[] = [];
    private lightSpots: LightSpot[] = [];

    onLoad() {
        this.graphics = this.node.getComponent(Graphics);
        if (!this.graphics) {
            this.graphics = this.node.addComponent(Graphics);
        }
        const uiTransform = this.getComponent(UITransform);
        if (uiTransform) {
            uiTransform.setContentSize(this.bottleWidth + 16, this.bottleHeight + 20);
        }
        this.draw();
    }

    update(dt: number) {
        this.time += dt;
        let needRedraw = false;

        // 更新气泡
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const b = this.bubbles[i];
            b.y += b.speed * dt;
            b.life -= dt;
            if (b.life <= 0 || b.y > this.layerHeight * this.waterLayers.length + 5) {
                this.bubbles.splice(i, 1);
                needRedraw = true;
            }
        }

        // 更新光斑
        for (let i = this.lightSpots.length - 1; i >= 0; i--) {
            const s = this.lightSpots[i];
            s.y += s.speed * dt;
            s.life -= dt;
            if (s.life <= 0 || s.y > this.layerHeight * this.waterLayers.length + 10) {
                this.lightSpots.splice(i, 1);
                needRedraw = true;
            }
        }

        // 随机生成新气泡和光斑
        if (this.waterLayers.length > 0) {
            const count = this.waterLayers.length;
            if (Math.random() < 0.25 * count * dt) {
                this.addBubble();
                needRedraw = true;
            }
            if (Math.random() < 0.1 * count * dt) {
                this.addLightSpot();
                needRedraw = true;
            }
        }

        if (this.waterLayers.length > 0 || needRedraw) {
            this.draw();
        }
    }

    private addBubble() {
        this.bubbles.push({
            x: (Math.random() - 0.5) * (this.bottleWidth - 20),
            y: Math.random() * 5,
            radius: 1.2 + Math.random() * 3.0,
            speed: 8 + Math.random() * 18,
            alpha: 0.4 + Math.random() * 0.5,
            life: 1.8 + Math.random() * 2.5,
            maxLife: 1.8 + Math.random() * 2.5
        });
    }

    private addLightSpot() {
        this.lightSpots.push({
            x: (Math.random() - 0.5) * (this.bottleWidth - 24),
            y: Math.random() * 5,
            speed: 3 + Math.random() * 6,
            alpha: 0.15 + Math.random() * 0.3,
            life: 1.5 + Math.random() * 3.0
        });
    }

    public draw() {
        if (!this.graphics) return;
        const g = this.graphics;
        g.clear();

        const halfW = this.bottleWidth / 2;
        const halfH = this.bottleHeight / 2;
        const offsetY = 10;

        const neckTopY = halfH + offsetY;
        const bodyTopY = neckTopY - this.neckHeight;
        const bodyBottomY = -halfH + offsetY;
        const bodyLeft = -halfW + 6;
        const bodyWidth = this.bottleWidth - 12;
        const bodyHeight = bodyTopY - bodyBottomY;

        // 阴影
        g.fillColor = new Color(0, 0, 0, 40);
        g.ellipse(0, bodyBottomY - 8, this.bottleWidth * 0.5, 8);
        g.fill();

        // 水绘制区域
        const waterLeft = bodyLeft + 3.2;
        const waterRight = bodyLeft + bodyWidth - 3.2;
        const waterWidth = waterRight - waterLeft;
        const waterStartY = bodyBottomY + this.paddingBottom - this.layerHeight * 0.5;

        if (this.waterLayers.length > 0) {
            const totalWaterHeight = this.waterLayers.length * this.layerHeight;

            // 液体主体（层间平滑过渡）
            this.drawLiquidBody(g, waterLeft, waterRight, waterStartY, totalWaterHeight);

            // 水面顶部动态高光
            const topWaterY = waterStartY + totalWaterHeight - 2;
            g.strokeColor = new Color(255, 255, 255, 200);
            g.lineWidth = 1.8;
            const waveAmp = 1.5;
            const waveFreq = 0.05;
            const startX = waterLeft + 4;
            const endX = waterRight - 4;
            g.moveTo(startX, topWaterY + Math.sin(this.time * 3 + startX * waveFreq) * waveAmp);
            for (let x = startX + 2; x <= endX; x += 2) {
                g.lineTo(x, topWaterY + Math.sin(this.time * 3 + x * waveFreq) * waveAmp);
            }
            g.stroke();

            g.strokeColor = new Color(255, 255, 255, 140);
            g.lineWidth = 1.0;
            g.moveTo(startX, topWaterY - 2 + Math.sin(this.time * 4 + startX * 0.07) * waveAmp * 0.7);
            for (let x = startX + 2; x <= endX; x += 2) {
                g.lineTo(x, topWaterY - 2 + Math.sin(this.time * 4 + x * 0.07) * waveAmp * 0.7);
            }
            g.stroke();

            // 内部波纹
            this.drawInternalRipples(g, waterLeft, waterRight, waterStartY, totalWaterHeight);

            // 气泡
            for (const bubble of this.bubbles) {
                const absY = waterStartY + bubble.y;
                const absX = bubble.x;
                let alpha = bubble.alpha;
                if (bubble.life < 0.2) alpha *= bubble.life / 0.2;
                else if (bubble.y < 5) alpha *= bubble.y / 5;

                g.strokeColor = new Color(255, 255, 255, alpha * 180);
                g.lineWidth = 0.8;
                g.circle(absX, absY, bubble.radius);
                g.stroke();

                g.fillColor = new Color(255, 255, 255, alpha * 150);
                g.circle(absX + bubble.radius * 0.4, absY + bubble.radius * 0.4, bubble.radius * 0.4);
                g.fill();
            }

            // 流动光斑
            for (const spot of this.lightSpots) {
                const absY = waterStartY + spot.y;
                const absX = spot.x;
                let alpha = spot.alpha;
                if (spot.life < 0.3) alpha *= spot.life / 0.3;
                g.fillColor = new Color(255, 255, 255, alpha * 200);
                g.circle(absX, absY, 2.5);
                g.fill();
            }

            // 环境光斑（模拟玻璃折射）
            const reflectY = waterStartY + totalWaterHeight * 0.4;
            g.fillColor = new Color(255, 255, 255, 40);
            g.ellipse(bodyLeft + 4, reflectY, 5, 12);
            g.fill();
            g.fillColor = new Color(255, 255, 255, 25);
            g.ellipse(bodyLeft + 6, reflectY - 8, 3, 8);
            g.fill();

            // 淡反光覆盖水面，统一质感
            g.fillColor = new Color(255, 255, 255, 15);
            g.roundRect(waterLeft, waterStartY + 1, waterWidth, totalWaterHeight - 2, 4);
            g.fill();
        }

        // === 瓶身和瓶口（画在水上面，遮住水层边角） ===
        const neckLeft = -this.neckWidth / 2;
        g.fillColor = new Color(200, 230, 255, 50);
        g.rect(neckLeft, bodyTopY, this.neckWidth, this.neckHeight);
        g.fill();
        g.strokeColor = new Color(120, 150, 200, 240);
        g.lineWidth = 6;
        g.rect(neckLeft, bodyTopY, this.neckWidth, this.neckHeight);
        g.stroke();

        g.fillColor = new Color(200, 230, 255, 50);
        g.roundRect(bodyLeft, bodyBottomY, bodyWidth, bodyHeight, this.bodyRadius);
        g.fill();
        g.strokeColor = new Color(120, 150, 200, 240);
        g.lineWidth = 6;
        g.roundRect(bodyLeft, bodyBottomY, bodyWidth, bodyHeight, this.bodyRadius);
        g.stroke();

        // 玻璃高光
        this.drawGlassHighlight(g, bodyLeft, bodyBottomY, bodyTopY);
    }

    /** 一体化的液体，层间平滑过渡 */
    private drawLiquidBody(g: Graphics, left: number, right: number, baseY: number, _totalHeight: number) {
        if (this.waterLayers.length === 0) return;

        const width = right - left;
        const transitionHeight = 6;

        // 整体暗色底边（模拟液体折射暗边），小圆角让底部不突兀
        g.fillColor = new Color(0, 0, 0, 10);
        g.roundRect(left, baseY, width, _totalHeight, 4);
        g.fill();

        let currentY = baseY;

        for (let i = 0; i < this.waterLayers.length; i++) {
            const colorName = this.waterLayers[i];
            const baseColor = this.getColorByName(colorName);
            const layerTopY = baseY + (i + 1) * this.layerHeight;
            const isLastLayer = (i === this.waterLayers.length - 1);
            const solidTopY = isLastLayer ? layerTopY : layerTopY - transitionHeight;

            // 纯色矩形
            if (solidTopY > currentY) {
                g.fillColor = baseColor;
                g.rect(left, currentY, width, solidTopY - currentY);
                g.fill();

                // 层顶部亮线
                if (solidTopY < layerTopY || isLastLayer) {
                    g.strokeColor = new Color(255, 255, 255, 50);
                    g.lineWidth = 1;
                    g.moveTo(left + 2, solidTopY);
                    g.lineTo(right - 2, solidTopY);
                    g.stroke();
                }
            }

            // 层间过渡渐变
            if (!isLastLayer) {
                const nextColor = this.getColorByName(this.waterLayers[i + 1]);
                const steps = Math.max(2, transitionHeight);
                for (let step = 0; step < steps; step++) {
                    const t = step / (steps - 1);
                    const r = baseColor.r + (nextColor.r - baseColor.r) * t;
                    const gv = baseColor.g + (nextColor.g - baseColor.g) * t;
                    const b = baseColor.b + (nextColor.b - baseColor.b) * t;
                    g.fillColor = new Color(r, gv, b, 255);
                    g.rect(left, solidTopY + step, width, 1);
                    g.fill();
                }
            }

            currentY = layerTopY;
        }
    }

    /** 水体内部波纹 */
    private drawInternalRipples(g: Graphics, left: number, right: number, baseY: number, totalHeight: number) {
        const lineCount = 5;
        for (let i = 1; i <= lineCount; i++) {
            const yOffset = (totalHeight / (lineCount + 1)) * i;
            const y = baseY + yOffset;
            const phase = this.time * (1.5 + i * 0.4) + i;
            const amp = 0.7 + i * 0.15;
            const freq = 0.04 + i * 0.01;
            g.strokeColor = new Color(255, 255, 255, 18 + i * 3);
            g.lineWidth = 0.5 + i * 0.08;
            g.moveTo(left + 2, y + Math.sin(phase) * amp);
            for (let x = left + 4; x <= right - 4; x += 3) {
                g.lineTo(x, y + Math.sin(phase + x * freq) * amp);
            }
            g.stroke();
        }
    }

    /** 玻璃高光条 */
    private drawGlassHighlight(g: Graphics, bodyLeft: number, bodyBottomY: number, bodyTopY: number) {
        g.strokeColor = new Color(255, 255, 255, 100);
        g.lineWidth = 4;
        g.moveTo(bodyLeft + 5, bodyBottomY + 30);
        g.lineTo(bodyLeft + 5, bodyTopY - 20);
        g.stroke();

        const bodyRight = bodyLeft + this.bottleWidth - 12;
        g.strokeColor = new Color(255, 255, 255, 60);
        g.lineWidth = 2.5;
        g.moveTo(bodyRight - 5, bodyBottomY + 50);
        g.lineTo(bodyRight - 5, bodyTopY - 10);
        g.stroke();
    }

    private getColorByName(name: string): Color {
        switch (name) {
            case 'red':    return new Color(220, 60, 60);
            case 'blue':   return new Color(60, 120, 220);
            case 'green':  return new Color(60, 180, 80);
            case 'yellow': return new Color(240, 200, 40);
            case 'purple': return new Color(160, 80, 200);
            case 'cyan':   return new Color(60, 200, 200);
            case 'orange': return new Color(240, 150, 50);
            default:       return Color.WHITE;
        }
    }

    public getTopColor(): string | null {
        if (this.waterLayers.length === 0) return null;
        return this.waterLayers[this.waterLayers.length - 1];
    }

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
            if (this.waterLayers.length < this.maxLayers) this.waterLayers.push(color);
        }
        this.draw();
    }

    public removeWater(count: number) {
        for (let i = 0; i < count; i++) {
            if (this.waterLayers.length > 0) this.waterLayers.pop();
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
