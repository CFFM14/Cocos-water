// LevelConfig.ts
export interface LevelData {
    levelId: number;
    colors: string[];          // 本轮用到的颜色
    bottlesTotal: number;      // 总瓶子数
    maxLayers: number;         // 每瓶容量（固定4层）
    extraEmptyBottles: number; // 额外空瓶数
}

export const LEVELS: LevelData[] = [
    // 关卡 1-10：3种颜色，5个瓶子，1个空瓶
    { levelId: 1,  colors: ['red','blue','green'],                            bottlesTotal: 5,  maxLayers: 4, extraEmptyBottles: 1 },
    { levelId: 2,  colors: ['red','blue','green'],                            bottlesTotal: 5,  maxLayers: 4, extraEmptyBottles: 1 },
    { levelId: 3,  colors: ['red','blue','green'],                            bottlesTotal: 5,  maxLayers: 4, extraEmptyBottles: 1 },
    { levelId: 4,  colors: ['red','blue','green'],                            bottlesTotal: 5,  maxLayers: 4, extraEmptyBottles: 1 },
    { levelId: 5,  colors: ['red','blue','green'],                            bottlesTotal: 5,  maxLayers: 4, extraEmptyBottles: 1 },
    { levelId: 6,  colors: ['red','blue','green'],                            bottlesTotal: 5,  maxLayers: 4, extraEmptyBottles: 1 },
    { levelId: 7,  colors: ['red','blue','green'],                            bottlesTotal: 5,  maxLayers: 4, extraEmptyBottles: 1 },
    { levelId: 8,  colors: ['red','blue','green'],                            bottlesTotal: 5,  maxLayers: 4, extraEmptyBottles: 1 },
    { levelId: 9,  colors: ['red','blue','green'],                            bottlesTotal: 5,  maxLayers: 4, extraEmptyBottles: 1 },
    { levelId: 10, colors: ['red','blue','green'],                            bottlesTotal: 5,  maxLayers: 4, extraEmptyBottles: 1 },

    // 关卡 11-20：加入黄色，4种颜色，7个瓶子，2个空瓶
    { levelId: 11, colors: ['red','blue','green','yellow'],                   bottlesTotal: 7,  maxLayers: 4, extraEmptyBottles: 2 },
    { levelId: 12, colors: ['red','blue','green','yellow'],                   bottlesTotal: 7,  maxLayers: 4, extraEmptyBottles: 2 },
    { levelId: 13, colors: ['red','blue','green','yellow'],                   bottlesTotal: 7,  maxLayers: 4, extraEmptyBottles: 2 },
    { levelId: 14, colors: ['red','blue','green','yellow'],                   bottlesTotal: 7,  maxLayers: 4, extraEmptyBottles: 2 },
    { levelId: 15, colors: ['red','blue','green','yellow'],                   bottlesTotal: 7,  maxLayers: 4, extraEmptyBottles: 2 },
    { levelId: 16, colors: ['red','blue','green','yellow'],                   bottlesTotal: 7,  maxLayers: 4, extraEmptyBottles: 2 },
    { levelId: 17, colors: ['red','blue','green','yellow'],                   bottlesTotal: 7,  maxLayers: 4, extraEmptyBottles: 2 },
    { levelId: 18, colors: ['red','blue','green','yellow'],                   bottlesTotal: 7,  maxLayers: 4, extraEmptyBottles: 2 },
    { levelId: 19, colors: ['red','blue','green','yellow'],                   bottlesTotal: 7,  maxLayers: 4, extraEmptyBottles: 2 },
    { levelId: 20, colors: ['red','blue','green','yellow'],                   bottlesTotal: 7,  maxLayers: 4, extraEmptyBottles: 2 },

    // 关卡 21-30：加入紫色，5种颜色，9个瓶子，2个空瓶
    { levelId: 21, colors: ['red','blue','green','yellow','purple'],          bottlesTotal: 9,  maxLayers: 4, extraEmptyBottles: 2 },
    { levelId: 22, colors: ['red','blue','green','yellow','purple'],          bottlesTotal: 9,  maxLayers: 4, extraEmptyBottles: 2 },
    { levelId: 23, colors: ['red','blue','green','yellow','purple'],          bottlesTotal: 9,  maxLayers: 4, extraEmptyBottles: 2 },
    { levelId: 24, colors: ['red','blue','green','yellow','purple'],          bottlesTotal: 9,  maxLayers: 4, extraEmptyBottles: 2 },
    { levelId: 25, colors: ['red','blue','green','yellow','purple'],          bottlesTotal: 9,  maxLayers: 4, extraEmptyBottles: 2 },
    { levelId: 26, colors: ['red','blue','green','yellow','purple'],          bottlesTotal: 9,  maxLayers: 4, extraEmptyBottles: 2 },
    { levelId: 27, colors: ['red','blue','green','yellow','purple'],          bottlesTotal: 9,  maxLayers: 4, extraEmptyBottles: 2 },
    { levelId: 28, colors: ['red','blue','green','yellow','purple'],          bottlesTotal: 9,  maxLayers: 4, extraEmptyBottles: 2 },
    { levelId: 29, colors: ['red','blue','green','yellow','purple'],          bottlesTotal: 9,  maxLayers: 4, extraEmptyBottles: 2 },
    { levelId: 30, colors: ['red','blue','green','yellow','purple'],          bottlesTotal: 9,  maxLayers: 4, extraEmptyBottles: 2 },

    // 关卡 31-40：加入青色，6种颜色，11个瓶子，3个空瓶
    { levelId: 31, colors: ['red','blue','green','yellow','purple','cyan'],   bottlesTotal: 11, maxLayers: 4, extraEmptyBottles: 3 },
    { levelId: 32, colors: ['red','blue','green','yellow','purple','cyan'],   bottlesTotal: 11, maxLayers: 4, extraEmptyBottles: 3 },
    { levelId: 33, colors: ['red','blue','green','yellow','purple','cyan'],   bottlesTotal: 11, maxLayers: 4, extraEmptyBottles: 3 },
    { levelId: 34, colors: ['red','blue','green','yellow','purple','cyan'],   bottlesTotal: 11, maxLayers: 4, extraEmptyBottles: 3 },
    { levelId: 35, colors: ['red','blue','green','yellow','purple','cyan'],   bottlesTotal: 11, maxLayers: 4, extraEmptyBottles: 3 },
    { levelId: 36, colors: ['red','blue','green','yellow','purple','cyan'],   bottlesTotal: 11, maxLayers: 4, extraEmptyBottles: 3 },
    { levelId: 37, colors: ['red','blue','green','yellow','purple','cyan'],   bottlesTotal: 11, maxLayers: 4, extraEmptyBottles: 3 },
    { levelId: 38, colors: ['red','blue','green','yellow','purple','cyan'],   bottlesTotal: 11, maxLayers: 4, extraEmptyBottles: 3 },
    { levelId: 39, colors: ['red','blue','green','yellow','purple','cyan'],   bottlesTotal: 11, maxLayers: 4, extraEmptyBottles: 3 },
    { levelId: 40, colors: ['red','blue','green','yellow','purple','cyan'],   bottlesTotal: 11, maxLayers: 4, extraEmptyBottles: 3 },

    // 关卡 41-50：加入橙色，7种颜色，13个瓶子，3个空瓶
    { levelId: 41, colors: ['red','blue','green','yellow','purple','cyan','orange'],  bottlesTotal: 13, maxLayers: 4, extraEmptyBottles: 3 },
    { levelId: 42, colors: ['red','blue','green','yellow','purple','cyan','orange'],  bottlesTotal: 13, maxLayers: 4, extraEmptyBottles: 3 },
    { levelId: 43, colors: ['red','blue','green','yellow','purple','cyan','orange'],  bottlesTotal: 13, maxLayers: 4, extraEmptyBottles: 3 },
    { levelId: 44, colors: ['red','blue','green','yellow','purple','cyan','orange'],  bottlesTotal: 13, maxLayers: 4, extraEmptyBottles: 3 },
    { levelId: 45, colors: ['red','blue','green','yellow','purple','cyan','orange'],  bottlesTotal: 13, maxLayers: 4, extraEmptyBottles: 3 },
    { levelId: 46, colors: ['red','blue','green','yellow','purple','cyan','orange'],  bottlesTotal: 13, maxLayers: 4, extraEmptyBottles: 3 },
    { levelId: 47, colors: ['red','blue','green','yellow','purple','cyan','orange'],  bottlesTotal: 13, maxLayers: 4, extraEmptyBottles: 3 },
    { levelId: 48, colors: ['red','blue','green','yellow','purple','cyan','orange'],  bottlesTotal: 13, maxLayers: 4, extraEmptyBottles: 3 },
    { levelId: 49, colors: ['red','blue','green','yellow','purple','cyan','orange'],  bottlesTotal: 13, maxLayers: 4, extraEmptyBottles: 3 },
    { levelId: 50, colors: ['red','blue','green','yellow','purple','cyan','orange'],  bottlesTotal: 13, maxLayers: 4, extraEmptyBottles: 3 }
];