/**
 * Neon Grid - 电力网格游戏
 * 主入口文件
 */

import { CONFIG } from './core/config.js';
import { createInitialState, createRuntimeState } from './core/state.js';
import { PowerSource } from './entities/entities.js';
import { SOURCE_VARIANTS } from './entities/entities.js';
import { updateViewBounds, toWorld } from './utils/helpers.js';
import { PowerGridSystem } from './systems/power-grid.js';
import { EconomySystem } from './systems/economy.js';
import { SpawningSystem } from './systems/spawning.js';
import { EventSystem } from './systems/events.js';
import { Renderer } from './rendering/renderer.js';
import { InputHandler } from './ui/input-handler.js';
import { UIUpdater } from './ui/ui-updater.js';
import { ContextMenuManager } from './ui/context-menu.js';
import { SaveLoadSystem } from './storage/save-load.js';
import { RecordsSystem } from './storage/records.js';
import { EntityFactory } from './entities/entity-factory.js';

/**
 * 游戏类
 */
class Game {
    constructor() {
        // DOM 元素
        this.canvas = document.getElementById('gameCanvas');
        this.container = document.getElementById('game-container');
        this.ctx = this.canvas.getContext('2d', { alpha: false });

        // 游戏状态
        this.gameState = createInitialState();
        this.runtimeState = createRuntimeState();

        // 系统
        this.powerGridSystem = new PowerGridSystem(this.runtimeState);
        this.economySystem = new EconomySystem(this.runtimeState);
        this.spawningSystem = new SpawningSystem(this.runtimeState);
        this.eventSystem = new EventSystem(this.runtimeState);
        this.renderer = new Renderer(this.ctx, this.runtimeState);
        this.uiUpdater = new UIUpdater(this.runtimeState);
        this.inputHandler = new InputHandler(this.canvas, this.runtimeState);
        this.contextMenuManager = new ContextMenuManager(this.runtimeState);
        this.saveLoadSystem = new SaveLoadSystem(this.runtimeState, this.powerGridSystem, this.uiUpdater);
        this.recordsSystem = new RecordsSystem(this.runtimeState);

        // 设置运行时状态的回调
        this.setupRuntimeStateCallbacks();

        // 初始化
        this.init();
    }

    /**
     * 设置运行时状态的回调
     */
    setupRuntimeStateCallbacks() {
        this.runtimeState.setSystemMsg = (text, type, isEvent) => this.uiUpdater.setSystemMsg(text, type, isEvent);
        this.runtimeState.clearSystemMsg = (force) => this.uiUpdater.clearSystemMsg(force);
        this.runtimeState.showContextMenu = (x, y, entity) => this.contextMenuManager.showContextMenu(x, y, entity);
        this.runtimeState.gameState = this.gameState;
    }

    /**
     * 初始化游戏
     */
    init() {
        // 设置画布大小
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // 创建初始电源
        this.createInitialSource();

        // 设置全屏
        this.setupFullscreen();

        // 添加按钮事件
        this.setupButtonEvents();

        // 显示难度选择
        this.showDifficultyModal();

        // 开始游戏循环
        requestAnimationFrame((timestamp) => this.renderLoop(timestamp));
    }

    /**
     * 调整画布大小
     */
    resize() {
        const rect = this.container.getBoundingClientRect();
        this.runtimeState.width = rect.width;
        this.runtimeState.height = rect.height;
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.runtimeState.cx = rect.width / 2;
        this.runtimeState.cy = rect.height / 2;
    }

    /**
     * 创建初始电源
     */
    createInitialSource() {
        this.runtimeState.sources.push({
            x: 0,
            y: 0,
            radius: 25,
            type: 'source',
            id: Math.random(),
            load: 0,
            heat: 0,
            capacity: CONFIG.plantCapacity,
            spawnScale: 0,
            displayLoad: 0,
            rotation: 0,
            variant: SOURCE_VARIANTS.STANDARD,
            upkeep: CONFIG.upkeepPerPlant,
            builtTime: 0
        });

        this.runtimeState.currentNetIncome = CONFIG.baseSubsidy - (this.runtimeState.sources.length * CONFIG.upkeepPerPlant);
    }

    /**
     * 设置全屏功能
     */
    setupFullscreen() {
        document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('webkitfullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('mozfullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('MSFullscreenChange', () => this.handleFullscreenChange());
    }

    /**
     * 处理全屏变化
     */
    handleFullscreenChange() {
        const isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement ||
                               document.mozFullScreenElement || document.msFullscreenElement);
        this.runtimeState.isFullscreen = isFullscreen;
        this.uiUpdater.updateFullscreenButton(isFullscreen);
        this.resize();

        if (isFullscreen) {
            this.uiUpdater.showHelpTip("已进入全屏模式 (按 ESC 退出)");
        } else {
            this.uiUpdater.showHelpTip("已退出全屏模式");
        }
    }

    /**
     * 设置按钮事件
     */
    setupButtonEvents() {
        // 速度按钮
        const speedBtns = document.querySelectorAll('.speed-btn');
        this.runtimeState.speedBtns = speedBtns;

        speedBtns.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                const speeds = [0, 0.5, 1.0, 2.0];
                this.setTimeScale(speeds[index]);
            });
        });

        // 建筑按钮
        document.querySelectorAll('.building-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.getAttribute('data-type');
                this.enterPlacementMode(type);
            });
        });

        // 功能按钮
        document.getElementById('save-btn')?.addEventListener('click', () => this.saveLoadSystem.saveGame());
        document.getElementById('load-btn')?.addEventListener('click', () => this.saveLoadSystem.loadGame());
        document.getElementById('records-btn')?.addEventListener('click', () => this.recordsSystem.showLeaderboard());
        document.getElementById('fullscreen-btn')?.addEventListener('click', () => this.toggleFullscreen());

        // 缩放按钮
        document.getElementById('zoom-in-btn')?.addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-out-btn')?.addEventListener('click', () => this.zoomOut());
        document.getElementById('reset-view-btn')?.addEventListener('click', () => this.resetView());
    }

    /**
     * 显示难度选择弹窗
     */
    showDifficultyModal() {
        setTimeout(() => {
            const modal = document.getElementById('difficulty-modal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.style.display = 'flex';
            }
        }, 100);
    }

    /**
     * 设置时间缩放
     */
    setTimeScale(scale) {
        this.runtimeState.timeScale = scale;
        this.uiUpdater.updateSpeedButtons(scale, this.runtimeState.speedBtns);
        this.uiUpdater.showHelpTip(`速度: ${scale === 0 ? '暂停' : scale + 'x'}`);
    }

    /**
     * 进入放置模式
     */
    enterPlacementMode(type) {
        this.runtimeState.placementMode = type;
        this.uiUpdater.updateBuildingButtons(type);

        const buildingName = EntityFactory.getBuildingName(type);
        const cost = EntityFactory.getBuildingCost(type);
        this.runtimeState.setSystemMsg(`放置${buildingName}模式 - 左键确认，右键取消`, "highlight");
        this.uiUpdater.showHelpTip(`点击地图放置${buildingName} ($${cost})`);
    }

    /**
     * 放大
     */
    zoomIn() {
        const newScale = Math.min(this.runtimeState.currentScale * 1.2, CONFIG.maxScale);
        this.runtimeState.currentScale = newScale;
        this.uiUpdater.showHelpTip("放大视图");
    }

    /**
     * 缩小
     */
    zoomOut() {
        const newScale = Math.max(this.runtimeState.currentScale / 1.2, CONFIG.minScale);
        this.runtimeState.currentScale = newScale;
        this.uiUpdater.showHelpTip("缩小视图");
    }

    /**
     * 重置视图
     */
    resetView() {
        this.runtimeState.currentScale = CONFIG.initialScale;
        this.runtimeState.viewOffsetX = 0;
        this.runtimeState.viewOffsetY = 0;
        this.uiUpdater.showHelpTip("视图已重置");
    }

    /**
     * 切换全屏
     */
    toggleFullscreen() {
        if (!document.fullscreenElement && !document.webkitFullscreenElement &&
            !document.mozFullScreenElement && !document.msFullscreenElement) {
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            } else if (elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen();
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }

    /**
     * 游戏循环
     */
    renderLoop(timestamp) {
        this.update(timestamp);
        this.draw();
        requestAnimationFrame((t) => this.renderLoop(t));
    }

    /**
     * 更新游戏状态
     */
    update(timestamp) {
        const { lastTime, timeScale, gameOver } = this.runtimeState;

        if (!lastTime) {
            this.runtimeState.lastTime = timestamp;
        }

        const dt = (timestamp - lastTime) * timeScale;
        this.runtimeState.lastTime = timestamp;
        this.runtimeState.gameTime += dt;

        // 更新游戏时间
        this.gameState.gameTime = this.runtimeState.gameTime;
        this.gameState.gameDate = (this.gameState.gameDate + dt / 60000) % 24;
        this.gameState.gameDays = Math.floor(this.runtimeState.gameTime / (24 * 60 * 1000));

        // 更新视窗边界
        this.runtimeState.viewBounds = updateViewBounds(
            this.runtimeState.width,
            this.runtimeState.height,
            this.runtimeState.cx,
            this.runtimeState.cy,
            this.runtimeState.viewOffsetX,
            this.runtimeState.viewOffsetY,
            this.runtimeState.currentScale
        );

        // 视图扩展
        if (this.runtimeState.currentScale > CONFIG.minScale) {
            const currentWorldWidth = this.runtimeState.width / this.runtimeState.currentScale;
            const newWorldWidth = currentWorldWidth + (CONFIG.viewExpansionRate * dt);
            this.runtimeState.currentScale = this.runtimeState.width / newWorldWidth;
            if (this.runtimeState.currentScale < CONFIG.minScale) {
                this.runtimeState.currentScale = CONFIG.minScale;
            }
        }

        if (gameOver) return;

        // 更新各系统
        this.powerGridSystem.updatePowerGrid();
        this.economySystem.updateEconomy(dt);
        this.spawningSystem.updateSpawning(dt);
        this.eventSystem.updateEvents(dt);

        // 更新动画
        this.updateAnimations(dt);

        // 更新UI
        this.uiUpdater.updateUI();
        this.uiUpdater.updateSystemUI();
    }

    /**
     * 更新动画
     */
    updateAnimations(dt) {
        const { sources, pylons, houses, batteries, links, particles, timeScale } = this.runtimeState;

        const animSpeed = 0.05 * timeScale * (60 / 16);

        // 更新实体生成动画
        [sources, pylons, houses, batteries].forEach(arr => {
            arr.forEach(e => {
                if (e.spawnScale < 1) {
                    e.spawnScale += (1 - e.spawnScale) * 0.1;
                    if (e.spawnScale > 0.99) e.spawnScale = 1;
                }
            });
        });

        // 更新线路生成动画
        links.forEach(l => {
            if (l.spawnProgress < 1) {
                l.spawnProgress += 0.1;
                if (l.spawnProgress > 1) l.spawnProgress = 1;
            }
        });

        // 更新粒子
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx * timeScale;
            p.y += p.vy * timeScale;
            p.life -= p.decay * timeScale;
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }
    }

    /**
     * 绘制画面
     */
    draw() {
        this.renderer.render();
    }
}

/**
 * 全局函数（用于HTML onclick）
 */
let gameInstance = null;

window.selectDifficulty = function(mode) {
    if (gameInstance) {
        gameInstance.gameState.mode = mode;
        const modal = document.getElementById('difficulty-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }

        // 应用难度设置
        switch (mode) {
            case 'beginner':
                gameInstance.gameState.difficultyMultiplier = CONFIG.difficultyBeginnerMoneyMult;
                gameInstance.gameState.peakHourInterval = CONFIG.peakHourInterval / CONFIG.difficultyBeginnerPeakFreqMult;
                gameInstance.gameState.nuclearFailureChance = CONFIG.nuclearFailureChance * CONFIG.difficultyBeginnerFailureMult;
                gameInstance.gameState.initialMoney = 200 * CONFIG.difficultyBeginnerMoneyMult;
                gameInstance.runtimeState.setSystemMsg("难度：新手模式", "info");
                break;
            case 'normal':
                gameInstance.gameState.difficultyMultiplier = 1.0;
                gameInstance.gameState.peakHourInterval = 300000;
                gameInstance.gameState.nuclearFailureChance = 0.05;
                gameInstance.gameState.initialMoney = 200;
                gameInstance.runtimeState.setSystemMsg("难度：普通模式", "info");
                break;
            case 'expert':
                gameInstance.gameState.difficultyMultiplier = CONFIG.difficultyExpertMoneyMult;
                gameInstance.gameState.peakHourInterval = CONFIG.peakHourInterval / CONFIG.difficultyExpertPeakFreqMult;
                gameInstance.gameState.nuclearFailureChance = CONFIG.nuclearFailureChance * CONFIG.difficultyExpertFailureMult;
                gameInstance.gameState.initialMoney = 200 * CONFIG.difficultyExpertMoneyMult;
                gameInstance.runtimeState.setSystemMsg("难度：专家模式", "warning");
                break;
        }

        // 重启游戏
        gameInstance.restartGame();
    }
};

window.restartGame = function() {
    if (gameInstance) {
        gameInstance.runtimeState.gameOver = false;
        gameInstance.runtimeState.money = gameInstance.gameState.initialMoney || CONFIG.initialMoney;
        gameInstance.runtimeState.currentNetIncome = 0;
        gameInstance.runtimeState.sources = [];
        gameInstance.runtimeState.pylons = [];
        gameInstance.runtimeState.houses = [];
        gameInstance.runtimeState.batteries = [];
        gameInstance.runtimeState.links = [];
        gameInstance.runtimeState.particles = [];
        gameInstance.runtimeState.totalSpawns = 0;
        gameInstance.runtimeState.currentScale = CONFIG.initialScale;
        gameInstance.runtimeState.viewOffsetX = 0;
        gameInstance.runtimeState.viewOffsetY = 0;
        gameInstance.runtimeState.placementMode = null;

        // 重置按钮状态
        document.querySelectorAll('.building-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // 创建初始电源
        gameInstance.createInitialSource();

        gameInstance.uiUpdater.hideGameOver();
        gameInstance.runtimeState.setSystemMsg("系统已重启 - 点击建筑按钮放置", "success", true);
    }
};

/**
 * 页面加载完成后启动游戏
 */
document.addEventListener('DOMContentLoaded', () => {
    gameInstance = new Game();
});