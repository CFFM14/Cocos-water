import { _decorator, Component, Node, Prefab, instantiate, Button, Label, director } from 'cc';
import { LEVELS } from './LevelConfig';
import { GameData } from './GameData';

const { ccclass, property } = _decorator;

@ccclass('LevelSelectController')
export class LevelSelectController extends Component {
    // 关卡按钮预制体（你做的那个 LevelBtn）
    @property(Prefab)
    levelBtnPrefab: Prefab = null!;

    // 放关卡按钮的容器节点
    @property(Node)
    levelContainer: Node = null!;

    // 上一页按钮
    @property(Button)
    prevBtn: Button = null!;

    // 下一页按钮
    @property(Button)
    nextBtn: Button = null!;

    // "第 X 页" 的文本
    @property(Label)
    pageLabel: Label = null!;

    // 返回主菜单按钮
    @property(Button)
    backBtn: Button = null!;

    private static readonly LEVELS_PER_PAGE = 12; // 每页12个（4列 x 3行）
    private static readonly COLS = 4;
    private currentPage: number = 1;
    private totalPages: number = 1;

    start() {
        // 计算总页数
        this.totalPages = Math.ceil(LEVELS.length / LevelSelectController.LEVELS_PER_PAGE);

        // 根据上次玩的关卡，自动跳到对应页
        const lastLevelId = GameData.getInstance().selectedLevelId;
        this.currentPage = Math.ceil(lastLevelId / LevelSelectController.LEVELS_PER_PAGE);

        // 绑定翻页按钮事件
        if (this.prevBtn) {
            this.prevBtn.node.on(Button.EventType.CLICK, this.onPrevPage, this);
        }
        if (this.nextBtn) {
            this.nextBtn.node.on(Button.EventType.CLICK, this.onNextPage, this);
        }
        if (this.backBtn) {
            this.backBtn.node.on(Button.EventType.CLICK, this.onBackToMenu, this);
        }

        // 显示当前页
        this.showPage(this.currentPage);
    }

    /**
     * 显示某一页的关卡按钮
     */
    private showPage(page: number) {
        this.currentPage = page;

        // 先清空旧按钮
        this.levelContainer.removeAllChildren();

        // 计算这一页要显示哪些关卡
        const start = (page - 1) * LevelSelectController.LEVELS_PER_PAGE;
        const end = Math.min(start + LevelSelectController.LEVELS_PER_PAGE, LEVELS.length);

        // 排列参数：4列 x 3行，按钮间距
        const spacingX = 150;
        const spacingY = 150;
        const cols = LevelSelectController.COLS;
        const startX = -((cols - 1) * spacingX) / 2;
        const startY = 80; // 第一行 Y 坐标

        for (let i = start; i < end; i++) {
            const levelData = LEVELS[i];

            // 从预制体复制一个关卡按钮
            const btnNode = instantiate(this.levelBtnPrefab);
            btnNode.parent = this.levelContainer;

            // 计算行列位置
            const idxInPage = i - start;
            const row = Math.floor(idxInPage / cols);
            const col = idxInPage % cols;
            btnNode.setPosition(startX + col * spacingX, startY - row * spacingY, 0);

            // 修改按钮上的数字（关数 = levelData.levelId）
            const labelComp = btnNode.getChildByName('Label')?.getComponent(Label);
            if (labelComp) {
                labelComp.string = String(levelData.levelId);
            }

            // 点击按钮：设置关卡ID，跳转游戏场景
            const btnComp = btnNode.getComponent(Button);
            if (btnComp) {
                btnComp.node.on(Button.EventType.CLICK, () => {
                    GameData.getInstance().selectedLevelId = levelData.levelId;
                    director.loadScene('scene');
                }, this);
            }
        }

        // 更新页码文字
        if (this.pageLabel) {
            this.pageLabel.string = `第 ${page} / ${this.totalPages} 页`;
        }

        // 第一页时"上一页"变灰，最后一页时"下一页"变灰
        if (this.prevBtn) {
            this.prevBtn.interactable = page > 1;
        }
        if (this.nextBtn) {
            this.nextBtn.interactable = page < this.totalPages;
        }
    }

    private onPrevPage() {
        if (this.currentPage > 1) {
            this.showPage(this.currentPage - 1);
        }
    }

    private onNextPage() {
        if (this.currentPage < this.totalPages) {
            this.showPage(this.currentPage + 1);
        }
    }

    private onBackToMenu() {
        director.loadScene('MainMenu');
    }
}
