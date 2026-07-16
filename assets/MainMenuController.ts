import { _decorator, Component, director } from 'cc';
import { GameData } from './GameData';
const { ccclass } = _decorator;

@ccclass('MainMenuController')
export class MainMenuController extends Component {

    onStartGame() {
        // 从第一关开始，跳转到关卡选择界面
        GameData.getInstance().selectedLevelId = 1;
        director.loadScene('LevelSelect');
    }
}