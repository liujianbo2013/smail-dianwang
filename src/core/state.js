/**
 * 游戏状态管理模块
 */

import { CONFIG } from './config.js';

/**
 * 游戏初始状态
 */
export function createInitialState() {
    return {
        // 难度设置
        mode: 'normal', // normal, beginner, expert
        difficultyMultiplier: 1.0,

        // 游戏时间系统（24小时循环）
        gameDate: 0, // 0-23 小时循环
        gameDays: 0, // 游戏天数

        // 活跃事件
        activeEvents: [],

        // 成就系统
        achievements: {
            powerPioneer: { unlocked: false, progress: 0, target: 100 },
            cleanEnergyMaster: { unlocked: false, progress: 0, target: 70 },
            crisisExpert: { unlocked: false, progress: 0, target: 5 }
        },

        // 科技树解锁
        unlockedTech: [],

        // 记录统计
        records: {
            maxPopulation: 0,
            longestUptime: 0,
            currentUptime: 0,
            disasterCount: 0,
            totalEarnings: 0
        },

        // 通货膨胀率
        inflationRate: 0,

        // 故障时间追踪
        lastFailureTime: 0,

        // 电网健康度
        gridHealth: 100,

        // 一键检测高亮
        highlightedIssues: [],

        // 补贴追踪
        lastSubsidyDay: 0
    };
}

/**
 * 运行时状态（不保存）
 */
export function createRuntimeState() {
    return {
        // 基本游戏状态
        width: 0,
        height: 0,
        cx: 0,
        cy: 0,
        viewOffsetX: 0,
        viewOffsetY: 0,
        lastTime: 0,
        gameOver: false,
        money: CONFIG.initialMoney,
        currentNetIncome: 0,
        timeScale: 1.0,
        gameTime: 0,

        // 输入状态
        input: {
            x: 0,
            y: 0,
            worldX: 0,
            worldY: 0,
            isDown: false,
            isRightDown: false
        },
        dragStartNode: null,
        snapTarget: null,
        validBuildPos: true,
        isIntersecting: false,
        hoveredLink: null,
        hoveredEntity: null,
        currentScale: CONFIG.initialScale,
        totalSpawns: 0,
        isCriticalState: false,
        isHighVoltageMode: false,

        // 建筑放置
        placementMode: null,
        draggedType: null,
        dragPreview: null,

        // 触摸支持
        touchStartDist: 0,
        lastTouchX: 0,
        lastTouchY: 0,
        isPanning: false,
        isZooming: false,

        // 长按批量选择
        longPressTimer: null,
        longPressDuration: 800,
        longPressStartPos: null,
        isLongPressActive: false,
        selectedEntities: [],

        // 实体列表
        sources: [],
        pylons: [],
        houses: [],
        batteries: [],
        particles: [],
        links: [],

        // 回放历史
        gameHistory: [],
        lastSnapshotTime: 0,

        // 时间追踪
        lastSpawnGameTime: 0,
        lastFactorySpawnTime: 0,
        lastCommSpawnTime: 0,
        lastIncomeGameTime: 0,
        lastPeakHourTime: 0,
        isPeakHour: false,
        nuclearCheckTime: 0,
        nuclearDecayCheckTime: 0,
        angryGracePeriods: new Map(),

        // 消息状态
        msgState: {
            text: "系统就绪 - 拖拽建筑到地图上",
            type: "normal",
            priority: 0,
            eventTimer: 0
        },
        lastRenderedMsg: "",

        // 视窗边界
        viewBounds: {
            minX: 0,
            maxX: 0,
            minY: 0,
            maxY: 0
        },

        // 全屏状态
        isFullscreen: false
    };
}

/**
 * 消息状态常量
 */
export const MSG_TYPES = {
    NORMAL: 'normal',
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    SUCCESS: 'success',
    HIGHLIGHT: 'highlight'
};