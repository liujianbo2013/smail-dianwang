/**
 * 存档读写模块
 * 负责游戏存档的保存和加载
 */

import { CONFIG } from '../core/config.js';
import { PowerSource, LoadEntity, Battery, Pylon, Link } from '../entities/entities.js';
import { SOURCE_VARIANTS } from '../entities/entities.js';
import { getEntityIndex } from '../utils/helpers.js';
import { EntityFactory } from '../entities/entity-factory.js';

/**
 * 存档系统
 */
export class SaveLoadSystem {
    constructor(runtimeState, powerGridSystem = null, uiUpdater = null) {
        this.runtimeState = runtimeState;
        this.powerGridSystem = powerGridSystem;
        this.uiUpdater = uiUpdater;
    }

    /**
     * 保存游戏
     */
    saveGame() {
        if (this.runtimeState.gameOver) {
            this.runtimeState.setSystemMsg("游戏已结束，无法保存", "warning", true);
            return;
        }

        try {
            const saveData = this.createSaveData();
            this.downloadSave(saveData);
            this.runtimeState.setSystemMsg("存档已下载！", "success", true);
        } catch (e) {
            console.error("保存失败:", e);
            this.runtimeState.setSystemMsg("保存失败：" + e.message, "warning", true);
        }
    }

    /**
     * 创建存档数据
     */
    createSaveData() {
        const { money, currentNetIncome, timeScale, gameTime, viewOffsetX, viewOffsetY,
                currentScale, totalSpawns, isCriticalState, placementMode,
                lastSpawnGameTime, lastFactorySpawnTime, lastCommSpawnTime, lastIncomeGameTime,
                gameState, sources, pylons, houses, batteries, links } = this.runtimeState;

        return {
            version: '1.0',
            money,
            currentNetIncome,
            timeScale,
            gameTime,
            viewOffsetX,
            viewOffsetY,
            currentScale,
            totalSpawns,
            isCriticalState,
            placementMode,
            lastSpawnGameTime,
            lastFactorySpawnTime,
            lastCommSpawnTime,
            lastIncomeGameTime,
            gameState: {
                achievements: gameState.achievements,
                unlockedTech: gameState.unlockedTech,
                records: gameState.records,
                currentUptime: gameState.records.currentUptime
            },
            sources: sources.map(s => ({
                x: s.x, y: s.y, radius: s.radius, type: s.type,
                load: s.load, heat: s.heat, capacity: s.capacity,
                variant: s.variant, upkeep: s.upkeep, needsRepair: s.needsRepair || false
            })),
            pylons: pylons.map(p => ({ x: p.x, y: p.y, type: p.type, radius: p.radius })),
            houses: houses.map(h => ({
                x: h.x, y: h.y, type: h.type,
                patience: h.patience, powered: h.powered,
                currentLoad: h.currentLoad
            })),
            batteries: batteries.map(b => ({
                x: b.x, y: b.y, type: b.type,
                energy: b.energy, maxEnergy: b.maxEnergy
            })),
            links: links.map(l => {
                const fromIdx = getEntityIndex(l.from, sources, pylons, houses, batteries);
                const toIdx = getEntityIndex(l.to, sources, pylons, houses, batteries);
                return { from: fromIdx, to: toIdx, upgraded: l.upgraded };
            })
        };
    }

    /**
     * 下载存档文件
     */
    downloadSave(saveData) {
        const saveString = JSON.stringify(saveData, null, 2);
        const blob = new Blob([saveString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        a.download = `neon-grid-save-${timestamp}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * 加载游戏
     */
    loadGame() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.style.display = 'none';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const saveData = JSON.parse(event.target.result);
                    this.loadFromData(saveData);
                } catch (err) {
                    console.error("读取存档失败:", err);
                    this.runtimeState.setSystemMsg("读取存档失败：文件格式错误", "warning", true);
                }
            };

            reader.onerror = () => {
                this.runtimeState.setSystemMsg("读取文件失败", "warning", true);
            };

            reader.readAsText(file);
        };

        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    }

    /**
     * 从数据加载游戏
     */
    loadFromData(saveData) {
        // 验证存档版本
        if (!saveData.version) {
            this.runtimeState.setSystemMsg("无效的存档文件", "warning", true);
            return;
        }

        // 恢复基本状态
        this.runtimeState.money = saveData.money || CONFIG.initialMoney;
        this.runtimeState.currentNetIncome = saveData.currentNetIncome || 0;
        this.runtimeState.timeScale = saveData.timeScale || 1.0;
        this.runtimeState.gameTime = saveData.gameTime || 0;
        this.runtimeState.viewOffsetX = saveData.viewOffsetX || 0;
        this.runtimeState.viewOffsetY = saveData.viewOffsetY || 0;
        this.runtimeState.currentScale = saveData.currentScale || CONFIG.initialScale;
        this.runtimeState.totalSpawns = saveData.totalSpawns || 0;
        this.runtimeState.isCriticalState = saveData.isCriticalState || false;
        this.runtimeState.placementMode = saveData.placementMode || null;
        this.runtimeState.lastSpawnGameTime = saveData.lastSpawnGameTime || 0;
        this.runtimeState.lastFactorySpawnTime = saveData.lastFactorySpawnTime || 0;
        this.runtimeState.lastCommSpawnTime = saveData.lastCommSpawnTime || 0;
        this.runtimeState.lastIncomeGameTime = saveData.lastIncomeGameTime || 0;

        // 恢复游戏状态
        if (saveData.gameState) {
            this.runtimeState.gameState.achievements = saveData.gameState.achievements || this.runtimeState.gameState.achievements;
            this.runtimeState.gameState.unlockedTech = saveData.gameState.unlockedTech || [];
            this.runtimeState.gameState.records = saveData.gameState.records || this.runtimeState.gameState.records;
        }

        // 恢复实体
        this.runtimeState.sources = (saveData.sources || []).map(s => ({
            ...s,
            id: Math.random(),
            spawnScale: 1,
            displayLoad: s.load || 0,
            rotation: 0,
            heat: s.heat || 0,
            variant: s.variant || SOURCE_VARIANTS.STANDARD
        }));

        this.runtimeState.pylons = (saveData.pylons || []).map(p => ({
            ...p,
            id: Math.random(),
            spawnScale: 1
        }));

        this.runtimeState.houses = (saveData.houses || []).map(h => ({
            ...h,
            id: Math.random(),
            spawnScale: 1
        }));

        this.runtimeState.batteries = (saveData.batteries || []).map(b => ({
            ...b,
            id: Math.random(),
            spawnScale: 1,
            currentOp: 'idle'
        }));

        // 恢复连线
        const allEntities = [
            ...this.runtimeState.sources,
            ...this.runtimeState.pylons,
            ...this.runtimeState.houses,
            ...this.runtimeState.batteries
        ];

        this.runtimeState.links = (saveData.links || []).map(l => {
            const fromEntity = allEntities[l.from];
            const toEntity = allEntities[l.to];
            if (!fromEntity || !toEntity) return null;

            return {
                from: fromEntity,
                to: toEntity,
                upgraded: l.upgraded,
                maxLoad: l.upgraded ? CONFIG.upgradedWireLoad : CONFIG.baseWireLoad,
                active: true,
                load: 0,
                heat: 0,
                spawnProgress: 1
            };
        }).filter(l => l !== null);

        // 清除游戏结束状态
        this.runtimeState.gameOver = false;

        // 更新电网和UI
        if (this.powerGridSystem) {
            this.powerGridSystem.updatePowerGrid(true);
        }
        if (this.uiUpdater) {
            this.uiUpdater.updateUI();
            this.uiUpdater.updateSystemUI();
        }

        this.runtimeState.setSystemMsg("存档已读取！", "success", true);
    }
}