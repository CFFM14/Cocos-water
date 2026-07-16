// GameData.ts
export class GameData {
    private static _instance: GameData;
    public selectedLevelId: number = 1;

    static getInstance(): GameData {
        if (!this._instance) {
            this._instance = new GameData();
        }
        return this._instance;
    }
}