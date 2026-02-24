/**
 * 实体工厂模块
 * 负责创建各种类型的游戏实体
 */

import { CONFIG } from '../core/config.js';
import {
    PowerSource,
    LoadEntity,
    Battery,
    Pylon,
    Link,
    Particle
} from './entities.js';
import { SOURCE_VARIANTS, ENTITY_TYPES, BATTERY_OPERATIONS } from './entities.js';

/**
 * 实体工厂
 */
export class EntityFactory {
    /**
     * 创建电源
     */
    static createPowerSource(x, y, variant, gameTime = 0) {
        let capacity, color, name, upkeep;

        if (variant === SOURCE_VARIANTS.STANDARD) {
            capacity = CONFIG.plantCapacity;
            color = '#fff';
            name = '电厂';
            upkeep = CONFIG.upkeepPerPlant;
        } else if (variant === SOURCE_VARIANTS.NUCLEAR) {
            capacity = CONFIG.nuclearCapacity;
            color = '#00ff66';
            name = '核电站';
            upkeep = CONFIG.nuclearUpkeep;
        } else if (variant === SOURCE_VARIANTS.WIND) {
            capacity = 10 + Math.random() * 5;
            color = '#88ffff';
            name = '风力电站';
            upkeep = 0;
        } else if (variant === SOURCE_VARIANTS.SOLAR) {
            capacity = 8 + Math.random() * 4;
            color = '#ffff88';
            name = '太阳能电站';
            upkeep = 0;
        } else if (variant === SOURCE_VARIANTS.TOWER) {
            capacity = 0;
            color = '#ff88ff';
            name = '电塔';
            upkeep = 0;
        } else {
            capacity = 0;
            color = '#fff';
            name = '建筑';
            upkeep = 0;
        }

        const source = new PowerSource(x, y, variant, capacity);
        source.upkeep = upkeep;
        source.builtTime = gameTime;

        return source;
    }

    /**
     * 创建负载实体（住宅、工厂、商业）
     */
    static createLoadEntity(x, y, type) {
        return new LoadEntity(x, y, type);
    }

    /**
     * 创建电池
     */
    static createBattery(x, y) {
        return new Battery(x, y);
    }

    /**
     * 创建电塔
     */
    static createPylon(x, y) {
        return new Pylon(x, y);
    }

    /**
     * 创建线路
     */
    static createLink(from, to, upgraded = false, distance = 0) {
        return new Link(from, to, upgraded, distance);
    }

    /**
     * 创建粒子效果
     */
    static createParticle(x, y, vx, vy, life, decay, color, size, type = 'normal') {
        return new Particle(x, y, vx, vy, life, decay, color, size, type);
    }

    /**
     * 创建爆炸效果
     */
    static createExplosion(x, y, color, count) {
        const particles = [];
        for (let i = 0; i < count; i++) {
            particles.push(new Particle(
                x,
                y,
                (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 6,
                1.0,
                0.02 + Math.random() * 0.03,
                color,
                1 + Math.random() * 3,
                'normal'
            ));
        }
        return particles;
    }

    /**
     * 创建冲击波效果
     */
    static createShockwave(x, y, color) {
        return new Particle(
            x,
            y,
            0,
            0,
            1.0,
            0.05,
            color,
            0,
            'shockwave'
        );
    }

    /**
     * 获取建筑成本
     */
    static getBuildingCost(type) {
        switch (type) {
            case 'plant':
            case SOURCE_VARIANTS.STANDARD:
                return CONFIG.costPlant;
            case SOURCE_VARIANTS.NUCLEAR:
                return CONFIG.costNuclear;
            case SOURCE_VARIANTS.WIND:
                return CONFIG.costWind;
            case SOURCE_VARIANTS.SOLAR:
                return CONFIG.costSolar;
            case SOURCE_VARIANTS.TOWER:
                return 100;
            case SOURCE_VARIANTS.REPAIR:
                return CONFIG.costRepairStation;
            case SOURCE_VARIANTS.DISPATCH:
                return CONFIG.costDispatchCenter;
            case SOURCE_VARIANTS.ENERGY_STORAGE:
                return CONFIG.costEnergyStorage;
            case ENTITY_TYPES.BATTERY:
                return CONFIG.costBattery;
            case ENTITY_TYPES.PYLON:
                return CONFIG.costPylon;
            default:
                return 0;
        }
    }

    /**
     * 获取建筑名称
     */
    static getBuildingName(type) {
        switch (type) {
            case 'plant':
            case SOURCE_VARIANTS.STANDARD:
                return '电厂';
            case SOURCE_VARIANTS.NUCLEAR:
                return '核电站';
            case SOURCE_VARIANTS.WIND:
                return '风力电站';
            case SOURCE_VARIANTS.SOLAR:
                return '太阳能电站';
            case SOURCE_VARIANTS.TOWER:
                return '电塔';
            case SOURCE_VARIANTS.REPAIR:
                return '维修站';
            case SOURCE_VARIANTS.DISPATCH:
                return '调度中心';
            case SOURCE_VARIANTS.ENERGY_STORAGE:
                return '储能站';
            case ENTITY_TYPES.BATTERY:
                return '电池';
            case ENTITY_TYPES.PYLON:
                return '电塔';
            case ENTITY_TYPES.HOUSE:
                return '住宅';
            case ENTITY_TYPES.FACTORY:
                return '工厂';
            case ENTITY_TYPES.COMMERCIAL:
                return '商业';
            default:
                return '未知';
        }
    }

    /**
     * 获取拆除返还金额
     */
    static getRefundAmount(entity) {
        let cost = 0;

        if (entity.variant) {
            switch (entity.variant) {
                case SOURCE_VARIANTS.STANDARD:
                    cost = CONFIG.costPlant;
                    break;
                case SOURCE_VARIANTS.NUCLEAR:
                    cost = CONFIG.costNuclear;
                    break;
                case SOURCE_VARIANTS.WIND:
                    cost = CONFIG.costWind;
                    break;
                case SOURCE_VARIANTS.SOLAR:
                    cost = CONFIG.costSolar;
                    break;
                case SOURCE_VARIANTS.REPAIR:
                    cost = CONFIG.costRepairStation;
                    break;
                case SOURCE_VARIANTS.DISPATCH:
                    cost = CONFIG.costDispatchCenter;
                    break;
                case SOURCE_VARIANTS.ENERGY_STORAGE:
                    cost = CONFIG.costEnergyStorage;
                    break;
                case SOURCE_VARIANTS.TOWER:
                    cost = CONFIG.costPylon;
                    break;
            }
        } else if (entity.type) {
            switch (entity.type) {
                case ENTITY_TYPES.BATTERY:
                    cost = CONFIG.costBattery;
                    break;
                case ENTITY_TYPES.PYLON:
                    cost = CONFIG.costPylon;
                    break;
            }
        }

        return Math.floor(cost * CONFIG.refundRate);
    }
}