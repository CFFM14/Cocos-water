import { _decorator, Component, Node, Prefab, instantiate, Vec3, EventTouch, director, Button, Label, Graphics, Color } from 'cc';
import { Bottle } from './Bottle';
import { LevelData, LEVELS } from './LevelConfig';
import { GameData } from './GameData';

const { ccclass, property } = _decorator;

interface PourAnim {
    sourceNode: Node;
    targetNode: Node;
    sourceBottle: Bottle;
    targetBottle: Bottle;
    fromColor: string;
    pourCount: number;
    elapsed: number;
    duration: number;
    sourceOrigX: number;
    sourceOrigY: number;
    targetX: number;
    targetY: number;
    tiltAngle: number;
}

@ccclass('GameManager')
export class GameManager extends Component {
    @property(Prefab)
    bottlePrefab: Prefab = null!;

    @property(Node)
    winPanel: Node = null!;

    @property(Button)
    nextBtn: Button = null!;

    @property(Button)
    menuBtn: Button = null!;

    @property(Button)
    backBtn: Button = null!;

    @property(Label)
    levelLabel: Label = null!;

    @property(Button)
    exitBtn: Button = null!;

    @property(Button)
    undoBtn: Button = null!;

    @property(Button)
    addBtn: Button = null!;

    private bottles: Node[] = [];
    private selectedBottle: Node | null = null;
    private currentLevel: LevelData | null = null;
    private undoStack: string[][][] = [];
    private addedBottleCount: number = 0;
    private isAnimating: boolean = false;
    private activePour: PourAnim | null = null;
    private streamGraphics: Graphics | null = null;

    start() {
        if (this.winPanel) {
            this.winPanel.active = false;
        }
        if (this.nextBtn) {
            this.nextBtn.node.on(Button.EventType.CLICK, this.onNextLevel, this);
        }
        if (this.menuBtn) {
            this.menuBtn.node.on(Button.EventType.CLICK, this.onMainMenu, this);
        }
        if (this.backBtn) {
            this.backBtn.node.on(Button.EventType.CLICK, this.onBackToLevelSelect, this);
        }
        if (this.exitBtn) {
            this.exitBtn.node.on(Button.EventType.CLICK, this.onBackToLevelSelect, this);
        }
        if (this.undoBtn) {
            this.undoBtn.node.on(Button.EventType.CLICK, this.onUndo, this);
        }
        if (this.addBtn) {
            this.addBtn.node.on(Button.EventType.CLICK, this.onAddBottle, this);
        }

        const streamNode = new Node('PourStream');
        streamNode.parent = this.node;
        streamNode.addComponent(Graphics);
        this.streamGraphics = streamNode.getComponent(Graphics);

        const levelId = GameData.getInstance().selectedLevelId;
        const level = LEVELS.find(l => l.levelId === levelId);
        if (level) {
            this.loadLevel(level);
        } else {
            console.error('关卡数据未找到');
            const fallback = LEVELS[0];
            if (fallback) this.loadLevel(fallback);
        }
    }

    update(dt: number) {
        if (!this.activePour) return;
        const a = this.activePour;
        a.elapsed += dt;
        const t = Math.min(a.elapsed / a.duration, 1);

        const easeInOut = (p: number) => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        const moveTo = (from: number, to: number, p: number) => from + (to - from) * easeInOut(p);
        const riseH = 60;
        const srcAngleRad = a.tiltAngle * Math.PI / 180;
        const sideDir = a.tiltAngle > 0 ? 1 : -1;
        const hoverX = a.targetX + sideDir * 107;
        const hoverY = a.targetY + 100;

        if (t < 0.25) {
            const p = t / 0.25;
            a.sourceNode.angle = a.tiltAngle * p;
            const mx = moveTo(a.sourceOrigX, hoverX, p);
            const my = moveTo(a.sourceOrigY, hoverY, p) + Math.sin(p * Math.PI) * riseH;
            a.sourceNode.setPosition(mx, my, 0);
        } else if (t < 0.7) {
            const pourP = (t - 0.25) / 0.45;
            a.sourceNode.angle = a.tiltAngle;
            a.sourceNode.setPosition(hoverX, hoverY, 0);
            a.sourceBottle.pourOutCount = a.pourCount;
            a.sourceBottle.pourOutProgress = pourP;
            a.targetBottle.pourInColor = a.fromColor;
            a.targetBottle.pourInCount = a.pourCount;
            a.targetBottle.pourInProgress = pourP;

            const bp = Math.min(1, pourP / 0.3);
            const bump = 1 + Math.sin(bp * Math.PI) * 0.05;
            a.targetNode.setScale(bump, bump, 1);

            this.drawPourStream(a);
        } else {
            const p = (t - 0.7) / 0.3;
            a.sourceNode.angle = a.tiltAngle * (1 - p);
            const mx = moveTo(hoverX, a.sourceOrigX, p);
            const my = moveTo(hoverY, a.sourceOrigY, p) + Math.sin(p * Math.PI) * riseH;
            a.sourceNode.setPosition(mx, my, 0);
            a.targetNode.setScale(1, 1, 1);
            if (this.streamGraphics) this.streamGraphics.clear();
        }

        a.sourceBottle.draw();
        a.targetBottle.draw();

        if (t >= 1) {
            a.sourceBottle.pourOutCount = 0;
            a.sourceBottle.pourOutProgress = 0;
            a.targetBottle.pourInColor = null;
            a.targetBottle.pourInCount = 0;
            a.targetBottle.pourInProgress = 0;
            a.sourceNode.angle = 0;
            a.sourceNode.setPosition(a.sourceOrigX, a.sourceOrigY, 0);
            a.sourceBottle.showShadow = true;
            a.targetNode.setScale(1, 1, 1);
            if (this.streamGraphics) this.streamGraphics.clear();

            a.sourceBottle.removeWater(a.pourCount);
            a.targetBottle.addWater(a.fromColor, a.pourCount);

            this.activePour = null;
            this.isAnimating = false;
            this.clearSelection();
            this.checkWin();
        }
    }

    private drawPourStream(a: PourAnim) {
        if (!this.streamGraphics) return;
        const g = this.streamGraphics;
        g.clear();

        const waterColor = this.getStreamColor(a.fromColor);
        const neckY = 110;

        // 来源瓶口（考虑倾斜旋转）
        const srcAngle = a.sourceNode.angle * Math.PI / 180;
        const lipX = a.sourceNode.position.x + neckY * Math.sin(srcAngle);
        const lipY = a.sourceNode.position.y + neckY * Math.cos(srcAngle);

        // 目标水面（用 Bottle 提供的方法）
        const targetLipY = a.targetBottle.getWaterSurfaceWorldY();

        if (lipY <= targetLipY) return;

        // 竖直线水流（对准目标瓶口）
        const streamX = a.targetNode.position.x;
        const w = 7;
        g.strokeColor = waterColor;
        g.lineWidth = w;
        g.lineCap = 1;
        g.moveTo(streamX, lipY);
        g.lineTo(streamX, targetLipY);
        g.stroke();

        // 高光
        g.strokeColor = new Color(255, 255, 255, 100);
        g.lineWidth = w * 0.4;
        g.moveTo(streamX, lipY);
        g.lineTo(streamX, targetLipY);
        g.stroke();

        // 下落水滴
        for (let i = 0; i < 6; i++) {
            const delay = i * 0.06;
            const dp = Math.max(0, Math.min(1, (a.elapsed / a.duration - 0.2 - delay) / 0.35));
            if (dp <= 0 || dp >= 1) continue;
            const dy = lipY + (targetLipY - lipY) * dp;
            const dx = streamX + Math.sin(i * 2.5 + a.elapsed * 8) * 6;
            const r = 1.2 + Math.random() * 1.5;

            g.fillColor = waterColor;
            g.circle(dx, dy, r);
            g.fill();
            g.fillColor = new Color(255, 255, 255, 140);
            g.circle(dx - r * 0.3, dy - r * 0.3, r * 0.3);
            g.fill();
        }
    }

    private getStreamColor(name: string): Color {
        switch (name) {
            case 'red':    return new Color(220, 60, 60);
            case 'blue':   return new Color(60, 120, 220);
            case 'green':  return new Color(60, 180, 80);
            case 'yellow': return new Color(240, 200, 40);
            case 'purple': return new Color(160, 80, 200);
            case 'cyan':   return new Color(60, 200, 200);
            case 'orange': return new Color(240, 150, 50);
            default:       return new Color(255, 255, 255);
        }
    }

    public loadLevel(level: LevelData) {
        this.clearBottles();
        this.currentLevel = level;
        if (this.levelLabel) {
            this.levelLabel.string = `第 ${level.levelId} 关`;
        }
        this.initGame();
    }

    private clearBottles() {
        for (const bottleNode of this.bottles) {
            bottleNode.destroy();
        }
        this.bottles = [];
        this.clearSelection();
        this.undoStack = [];
        this.addedBottleCount = 0;
        this.updateUndoBtnState();
    }

    private initGame() {
        if (!this.currentLevel) return;
        const { bottlesTotal, maxLayers } = this.currentLevel;

        const cols = Math.ceil(Math.sqrt(bottlesTotal));
        const spacingX = 160;
        const spacingY = 260;
        const startX = -((cols - 1) * spacingX) / 2;
        const startY = 200;

        for (let i = 0; i < bottlesTotal; i++) {
            const bottleNode = instantiate(this.bottlePrefab);
            bottleNode.parent = this.node;

            const row = Math.floor(i / cols);
            const col = i % cols;
            const x = startX + col * spacingX;
            const y = startY - row * spacingY;
            bottleNode.setPosition(new Vec3(x, y, 0));

            const bottleComp = bottleNode.getComponent(Bottle);
            if (bottleComp) {
                bottleComp.maxLayers = maxLayers;
            }

            this.bottles.push(bottleNode);
            bottleNode.on(Node.EventType.TOUCH_END, this.onBottleClick, this);
        }

        this.fillBottlesRandomly();
    }

    private fillBottlesRandomly() {
        if (!this.currentLevel) return;
        const { colors, bottlesTotal, maxLayers, extraEmptyBottles } = this.currentLevel;

        const nonEmptyBottles = bottlesTotal - extraEmptyBottles;
        const layers: string[] = [];

        for (const c of colors) {
            for (let i = 0; i < maxLayers; i++) {
                layers.push(c);
            }
        }

        for (let i = layers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [layers[i], layers[j]] = [layers[j], layers[i]];
        }

        let idx = 0;
        for (let i = 0; i < nonEmptyBottles; i++) {
            const bottleComp = this.bottles[i].getComponent(Bottle);
            if (bottleComp) {
                for (let j = 0; j < maxLayers; j++) {
                    if (idx < layers.length) {
                        bottleComp.waterLayers.push(layers[idx++]);
                    }
                }
                bottleComp.draw();
            }
        }
    }

    private onBottleClick(event: EventTouch) {
        if (this.isAnimating) return;

        const clickedNode = event.target as Node;
        const clickedBottle = clickedNode.getComponent(Bottle);
        if (!clickedBottle) return;

        if (this.selectedBottle === null) {
            if (clickedBottle.isEmpty()) return;
            this.highlightBottle(clickedNode, true);
            this.selectedBottle = clickedNode;
        } else {
            const sourceNode = this.selectedBottle;
            const sourceBottle = sourceNode.getComponent(Bottle);
            if (!sourceBottle) {
                this.clearSelection();
                return;
            }

            if (sourceNode === clickedNode) {
                this.clearSelection();
                return;
            }

            if (!clickedBottle.canPourFrom(sourceBottle)) {
                this.clearSelection();
                return;
            }

            this.saveUndoSnapshot();

            const sameCount = sourceBottle.getTopSameCount();
            const emptySpace = clickedBottle.getEmptySpace();
            const pourCount = Math.min(sameCount, emptySpace);
            const color = sourceBottle.getTopColor()!;

            const sourcePos = sourceNode.position;
            const targetPos = clickedNode.position;
            const tiltAngle = targetPos.x > sourcePos.x ? -60 : 60;

            sourceNode.setSiblingIndex(sourceNode.parent!.children.length - 1);
            if (this.streamGraphics) {
                this.streamGraphics.node.setSiblingIndex(sourceNode.parent!.children.length - 1);
            }
            sourceBottle.showShadow = false;

            this.isAnimating = true;
            this.activePour = {
                sourceNode,
                targetNode: clickedNode,
                sourceBottle,
                targetBottle: clickedBottle,
                fromColor: color,
                pourCount,
                elapsed: 0,
                duration: 1.2,
                sourceOrigX: sourcePos.x,
                sourceOrigY: sourcePos.y,
                targetX: targetPos.x,
                targetY: targetPos.y,
                tiltAngle
            };
        }
    }

    private highlightBottle(node: Node, on: boolean) {
        if (on) {
            node.setScale(1.1, 1.1, 1);
        } else {
            node.setScale(1, 1, 1);
        }
    }

    private clearSelection() {
        if (this.selectedBottle) {
            this.highlightBottle(this.selectedBottle, false);
            this.selectedBottle = null;
        }
    }

    private checkWin() {
        for (const bottleNode of this.bottles) {
            const bottle = bottleNode.getComponent(Bottle);
            if (!bottle) continue;
            if (bottle.isEmpty()) continue;

            if (bottle.waterLayers.length < bottle.maxLayers) return;
            const firstColor = bottle.waterLayers[0];
            for (const c of bottle.waterLayers) {
                if (c !== firstColor) return;
            }
        }

        console.log('🎉 本关通过！');

        if (!this.winPanel) return;

        const titleLabel = this.winPanel.getChildByName('WinTitle')?.getComponent(Label);
        if (!this.currentLevel) return;
        const isLastLevel = this.currentLevel.levelId >= LEVELS.length;

        if (titleLabel) {
            if (isLastLevel) {
                titleLabel.string = '🏆 恭喜！全部通关！';
            } else {
                titleLabel.string = '🎉 恭喜通关！';
            }
        }

        if (this.nextBtn) {
            this.nextBtn.node.active = !isLastLevel;
        }

        this.winPanel.active = true;
        this.winPanel.setSiblingIndex(this.node.children.length - 1);
    }

    private saveUndoSnapshot() {
        const snapshot: string[][] = [];
        for (const bottleNode of this.bottles) {
            const bottle = bottleNode.getComponent(Bottle);
            if (bottle) {
                snapshot.push([...bottle.waterLayers]);
            } else {
                snapshot.push([]);
            }
        }
        this.undoStack.push(snapshot);
        this.updateUndoBtnState();
    }

    private onUndo() {
        if (this.undoStack.length === 0) return;

        const snapshot = this.undoStack.pop()!;

        for (let i = 0; i < this.bottles.length; i++) {
            const bottle = this.bottles[i].getComponent(Bottle);
            if (bottle && i < snapshot.length) {
                bottle.waterLayers = [...snapshot[i]];
                bottle.draw();
            }
        }

        this.clearSelection();
        this.updateUndoBtnState();
    }

    private updateUndoBtnState() {
        if (this.undoBtn) {
            this.undoBtn.interactable = this.undoStack.length > 0;
        }
    }

    private onAddBottle() {
        if (!this.currentLevel) return;

        if (this.addedBottleCount >= 2) {
            console.log('本关已添加两个瓶子，不能再加了');
            return;
        }
        this.addedBottleCount++;

        const bottleNode = instantiate(this.bottlePrefab);
        bottleNode.parent = this.node;

        const cols = Math.ceil(Math.sqrt(this.bottles.length + 1));
        const spacingX = 160;
        const spacingY = 260;
        const startX = -((cols - 1) * spacingX) / 2;
        const startY = 200;

        const idx = this.bottles.length;
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        bottleNode.setPosition(new Vec3(startX + col * spacingX, startY - row * spacingY, 0));

        const bottleComp = bottleNode.getComponent(Bottle);
        if (bottleComp) {
            bottleComp.maxLayers = this.currentLevel.maxLayers;
            bottleComp.draw();
        }

        this.bottles.push(bottleNode);
        bottleNode.on(Node.EventType.TOUCH_END, this.onBottleClick, this);

        this.undoStack = [];
        this.updateUndoBtnState();

        if (this.addBtn && this.addedBottleCount >= 2) {
            this.addBtn.interactable = false;
        }
    }

    private onNextLevel() {
        if (!this.currentLevel) return;
        const nextId = this.currentLevel.levelId + 1;
        const nextLevel = LEVELS.find(l => l.levelId === nextId);
        if (nextLevel) {
            GameData.getInstance().selectedLevelId = nextId;
            director.loadScene('scene');
        }
    }

    private onMainMenu() {
        director.loadScene('MainMenu');
    }

    private onBackToLevelSelect() {
        director.loadScene('LevelSelect');
    }
}
