/**
 * 生成系统模块
 * 负责住宅、工厂、商业建筑的生成逻辑
 */

import { CONFIG } from '../core/config.js';
import { LoadEntity } from '../entities/entities.js';
import { ENTITY_TYPES } from '../entities/entities.js';
import { isPositionClear, distToSegment } from '../utils/helpers.js';

/**
 * 生成系统
 */
export class SpawningSystem {
    constructor(runtimeState) {
        this.runtimeState = runtimeState;
    }

    /**
     * 更新生成系统
     */
    updateSpawning(dt) {
        const { gameTime, width, height, currentScale, houses, sources, links, batteries, pylons } = this.runtimeState;

        const totalPop = houses.length + pylons.length + batteries.length;

        // 检测游戏阶段
        let gamePhase = this.detectGamePhase(totalPop);

        // 调整住宅生成率
        let currentHouseSpawnRate = this.getHouseSpawnRate(totalPop);

        // 生成住宅
        if (gameTime - this.runtimeState.lastSpawnGameTime > currentHouseSpawnRate) {
            this.spawnEntity(ENTITY_TYPES.HOUSE);
            this.runtimeState.lastSpawnGameTime = gameTime;
        }

        // 生成工厂
        if (totalPop >= CONFIG.factoryUnlockPop) {
            let factoryRate = this.getFactorySpawnRate(gamePhase);
            if (gameTime - this.runtimeState.lastFactorySpawnTime > factoryRate) {
                this.spawnEntity(ENTITY_TYPES.FACTORY);
                this.runtimeState.lastFactorySpawnTime = gameTime;
            }
        }

        // 生成商业
        if (totalPop >= CONFIG.commUnlockPop) {
            let commRate = this.getCommSpawnRate(gamePhase);
            if (gameTime - this.runtimeState.lastCommSpawnTime > commRate) {
                this.spawnEntity(ENTITY_TYPES.COMMERCIAL);
                this.runtimeState.lastCommSpawnTime = gameTime;
            }
        }
    }

    /**
     * 检测游戏阶段
     */
    detectGamePhase(totalPop) {
        if (totalPop >= CONFIG.midGamePop) return 'late';
        if (totalPop >= CONFIG.earlyGamePop) return 'mid';
        return 'early';
    }

    /**
     * 获取住宅生成率
     */
    getHouseSpawnRate(totalPop) {
        if (totalPop >= CONFIG.commUnlockPop) return 12000; // 12秒
        if (totalPop >= CONFIG.factoryUnlockPop) return 10000; // 10秒
        return CONFIG.spawnRate; // 8秒
    }

    /**
     * 获取工厂生成率
     */
    getFactorySpawnRate(gamePhase) {
        let rate = CONFIG.factorySpawnRate;
        if (gamePhase === 'late') rate *= 0.7; // 30%更快
        return rate;
    }

    /**
     * 获取商业生成率
     */
    getCommSpawnRate(gamePhase) {
        let rate = CONFIG.commSpawnRate;
        if (gamePhase === 'late') rate *= 0.6; // 40%更快
        return rate;
    }

    /**
     * 生成实体
     */
    spawnEntity(type) {
        const { width, height, currentScale, houses, sources, links, batteries, pylons } = this.runtimeState;

        let attempts = 0;
        const maxAttempts = 100;
        let currentMinDist = CONFIG.minEntityDist + 10;
        let x, y;

        const worldViewW = width / currentScale;
        const worldViewH = height / currentScale;

        // 寻找有效位置
        do {
            attempts++;
            if (attempts > 50) currentMinDist = CONFIG.minEntityDist * 0.7;

            x = (Math.random() - 0.5) * worldViewW;
            y = (Math.random() - 0.5) * worldViewH;

            if (!isPositionClear(x, y, currentMinDist, sources, pylons, batteries, houses)) continue;
            if (Math.hypot(x, y) < 150) continue;

            // 检查是否与线路相交
            let hitWire = false;
            for (let l of links) {
                if (distToSegment({ x, y }, l.from, l.to) < 20) {
                    hitWire = true;
                    break;
                }
            }
            if (hitWire) continue;

            break;
        } while (attempts < maxAttempts);

        if (attempts >= maxAttempts) return;

        // 创建实体
        const entity = new LoadEntity(x, y, type);
        houses.push(entity);

        this.runtimeState.totalSpawns++;

        // 显示生成消息
        this.showSpawnMessage(entity, type);
    }

    /**
     * 显示生成消息
     */
    showSpawnMessage(entity, type) {
        if (type === ENTITY_TYPES.FACTORY) {
            this.runtimeState.setSystemMsg("警告: 检测到工业区", "warning", true);
            this.createSpawnEffect(entity, CONFIG.colors.factory);
        } else if (type === ENTITY_TYPES.COMMERCIAL) {
            this.runtimeState.setSystemMsg("新商业区", "normal", true);
            this.createSpawnEffect(entity, CONFIG.colors.comm);
        }
    }

    /**
     * 创建生成效果
     */
    createSpawnEffect(entity, color) {
        this.runtimeState.particles.push({
            x: entity.x,
            y: entity.y,
            vx: 0,
            vy: 0,
            life: 1.0,
            decay: 0.02,
            color: color,
            size: 20,
            type: 'shockwave'
        });
    }
}