import { _decorator, Component, Node, Prefab, instantiate, Vec3, EventTouch, director, Button, Label } from 'cc';
import { Bottle } from './Bottle';
import { LevelData, LEVELS } from './LevelConfig';
import { GameData } from './GameData';

const { ccclass, property } = _decorator;

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

    // 撤销栈：每次倒水前存一份快照
    private undoStack: string[][][] = [];

    // 本关已添加的瓶子数（最多2个）
    private addedBottleCount: number = 0;

    start() {
        // 初始隐藏胜利面板
        if (this.winPanel) {
            this.winPanel.active = false;
        }
        // 绑定结算界面按钮事件
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

        // 加载关卡
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

    public loadLevel(level: LevelData) {
        this.clearBottles();
        this.currentLevel = level;

        // 更新顶部关卡数文字
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
        // 清空撤销记录
        this.undoStack = [];
        this.addedBottleCount = 0;
        this.updateUndoBtnState();
    }

    private initGame() {
        if (!this.currentLevel) return;
        const { bottlesTotal, maxLayers } = this.currentLevel;

        const cols = Math.ceil(Math.sqrt(bottlesTotal));
        const spacingX = 150;
        const spacingY = 250;
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
        const clickedNode = event.target as Node;
        const clickedBottle = clickedNode.getComponent(Bottle);
        if (!clickedBottle) return;

        if (this.selectedBottle === null) {
            if (clickedBottle.isEmpty()) return;
            this.highlightBottle(clickedNode, true);
            this.selectedBottle = clickedNode;
        } else {
            const sourceBottle = this.selectedBottle.getComponent(Bottle);
            if (!sourceBottle) {
                this.clearSelection();
                return;
            }

            if (this.selectedBottle === clickedNode) {
                this.clearSelection();
                return;
            }

            if (clickedBottle.canPourFrom(sourceBottle)) {
                // 倒水前保存快照，方便撤销
                this.saveUndoSnapshot();

                const sameCount = sourceBottle.getTopSameCount();
                const emptySpace = clickedBottle.getEmptySpace();
                const pourCount = Math.min(sameCount, emptySpace);
                const color = sourceBottle.getTopColor()!;

                sourceBottle.removeWater(pourCount);
                clickedBottle.addWater(color, pourCount);

                this.checkWin();
            }

            this.clearSelection();
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
        // 检查：所有非空瓶子必须装满且颜色单一
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

        // === 通关了！===
        console.log('🎉 本关通过！');

        if (!this.winPanel) return;

        // 更新标题文字
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

        // 最后一关隐藏"下一关"按钮
        if (this.nextBtn) {
            this.nextBtn.node.active = !isLastLevel;
        }

        // 显示胜利面板，并把它提到最顶层（在所有瓶子上面）
        this.winPanel.active = true;
        this.winPanel.setSiblingIndex(this.node.children.length - 1);
    }

    /**
     * 保存当前所有瓶子的水层状态（拍照）
     */
    private saveUndoSnapshot() {
        const snapshot: string[][] = [];
        for (const bottleNode of this.bottles) {
            const bottle = bottleNode.getComponent(Bottle);
            if (bottle) {
                // 深拷贝水层数组
                snapshot.push([...bottle.waterLayers]);
            } else {
                snapshot.push([]);
            }
        }
        this.undoStack.push(snapshot);
        this.updateUndoBtnState();
    }

    /**
     * 撤销：恢复到上一步的状态
     */
    private onUndo() {
        if (this.undoStack.length === 0) return;

        // 取出最后一张快照
        const snapshot = this.undoStack.pop()!;

        // 还原每个瓶子的水层
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

    /**
     * 撤销栈为空时，按钮变灰
     */
    private updateUndoBtnState() {
        if (this.undoBtn) {
            this.undoBtn.interactable = this.undoStack.length > 0;
        }
    }

    /**
     * 加一个空瓶子，降低难度
     */
    private onAddBottle() {
        if (!this.currentLevel) return;

        // 每关最多加2个
        if (this.addedBottleCount >= 2) {
            console.log('本关已添加两个瓶子，不能再加了');
            return;
        }
        this.addedBottleCount++;

        const bottleNode = instantiate(this.bottlePrefab);
        bottleNode.parent = this.node;

        // 按当前瓶子数量，接在网格后面排列
        const cols = Math.ceil(Math.sqrt(this.bottles.length + 1));
        const spacingX = 150;
        const spacingY = 250;
        const startX = -((cols - 1) * spacingX) / 2;
        const startY = 200;

        const idx = this.bottles.length;
        const row = Math.floor(idx / cols);
        const col = idx % cols;
        bottleNode.setPosition(new Vec3(startX + col * spacingX, startY - row * spacingY, 0));

        const bottleComp = bottleNode.getComponent(Bottle);
        if (bottleComp) {
            bottleComp.maxLayers = this.currentLevel.maxLayers;
            bottleComp.draw(); // 空瓶也要画边框
        }

        this.bottles.push(bottleNode);
        bottleNode.on(Node.EventType.TOUCH_END, this.onBottleClick, this);

        // 加瓶子后清空撤销记录（状态变了，之前快照不适用）
        this.undoStack = [];
        this.updateUndoBtnState();

        // 加满2个后按钮变灰
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
        // 返回关卡选择界面（GameData 里的 selectedLevelId 保留当前关卡号，
        // LevelSelect 会自动跳到当前关卡所在的那一页）
        director.loadScene('LevelSelect');
    }
}
