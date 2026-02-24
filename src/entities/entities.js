/**
 * 实体类定义模块
 */

import { CONFIG } from '../core/config.js';
import { generateId } from '../utils/helpers.js';

/**
 * 实体类型枚举
 */
export const ENTITY_TYPES = {
    SOURCE: 'source',
    HOUSE: 'house',
    BATTERY: 'battery',
    PYLON: 'pylon',
    TOWER: 'tower',
    FACTORY: 'factory',
    COMMERCIAL: 'commercial'
};

/**
 * 发电厂变体枚举
 */
export const SOURCE_VARIANTS = {
    STANDARD: 'standard',    // 普通电厂
    NUCLEAR: 'nuclear',      // 核电站
    WIND: 'wind',            // 风力电站
    SOLAR: 'solar',          // 太阳能电站
    TOWER: 'tower',          // 电塔
    REPAIR: 'repair',        // 维修站
    DISPATCH: 'dispatch',    // 调度中心
    ENERGY_STORAGE: 'energystorage'  // 储能站
};

/**
 * 电池操作状态枚举
 */
export const BATTERY_OPERATIONS = {
    IDLE: 'idle',
    CHARGE: 'charge',
    DISCHARGE: 'discharge'
};

/**
 * 基础实体类
 */
export class Entity {
    constructor(x, y, type = ENTITY_TYPES.SOURCE) {
        this.id = generateId();
        this.x = x;
        this.y = y;
        this.type = type;
        this.powered = false;
        this.spawnScale = 0;
    }
}

/**
 * 电源实体类（发电厂、变电站等）
 */
export class PowerSource extends Entity {
    constructor(x, y, variant = SOURCE_VARIANTS.STANDARD, capacity = CONFIG.plantCapacity) {
        super(x, y, ENTITY_TYPES.SOURCE);
        this.variant = variant;
        this.capacity = capacity;
        this.load = 0;
        this.heat = 0;
        this.displayLoad = 0;
        this.rotation = 0;
        this.radius = 25;
        this.upkeep = CONFIG.upkeepPerPlant;
        this.builtTime = 0;

        // 变体特定属性
        this.initVariantProperties();
    }

    initVariantProperties() {
        switch (this.variant) {
            case SOURCE_VARIANTS.NUCLEAR:
                this.capacity = CONFIG.nuclearCapacity;
                this.upkeep = CONFIG.nuclearUpkeep;
                this.coolingBatteries = 0;
                this.coolingSatisfied = false;
                this.failureChance = CONFIG.nuclearFailureChance;
                this.needsRepair = false;
                this.maintenanceMode = false;
                this.maintenanceEndTime = 0;
                break;

            case SOURCE_VARIANTS.WIND:
                this.capacity = 10 + Math.random() * 5;
                this.upkeep = 0;
                this.windSpeedMultiplier = 1.0;
                this.lastWindEvent = 0;
                break;

            case SOURCE_VARIANTS.SOLAR:
                this.capacity = 8 + Math.random() * 4;
                this.upkeep = 0;
                this.hasStorageUpgrade = false;
                break;

            case SOURCE_VARIANTS.TOWER:
                this.radius = 10;
                this.capacity = 0;
                this.upkeep = 0;
                break;

            case SOURCE_VARIANTS.REPAIR:
                this.capacity = 0;
                this.upkeep = 0;
                this.maintenanceReduction = CONFIG.repairStationMaintenanceReduction;
                break;

            case SOURCE_VARIANTS.DISPATCH:
                this.capacity = 0;
                this.upkeep = 0;
                this.priorityMode = 'balanced';
                break;

            case SOURCE_VARIANTS.ENERGY_STORAGE:
                this.capacity = 0;
                this.upkeep = 0;
                this.capacityMultiplier = CONFIG.energyStorageCapacityMultiplier;
                this.chargeRateMultiplier = CONFIG.energyStorageChargeRateMultiplier;
                break;
        }
    }
}

/**
 * 负载实体类（住宅、工厂、商业）
 */
export class LoadEntity extends Entity {
    constructor(x, y, type = ENTITY_TYPES.HOUSE) {
        super(x, y, type);
        this.patience = CONFIG.houseMaxPatience;
        this.load = type === ENTITY_TYPES.FACTORY ? CONFIG.factoryLoad : 1;
        this.currentLoad = type === ENTITY_TYPES.COMMERCIAL ? CONFIG.commBaseLoad : 1;
        this.phase = Math.random() * Math.PI * 2;
        this.isAlert = false;
        this.isCritical = false;
        this.dead = false;
    }
}

/**
 * 电池实体类
 */
export class Battery extends Entity {
    constructor(x, y) {
        super(x, y, ENTITY_TYPES.BATTERY);
        this.energy = 0;
        this.maxEnergy = CONFIG.batteryCapacity;
        this.targetLoad = 0;
        this.currentOp = BATTERY_OPERATIONS.IDLE;
    }
}

/**
 * 电塔实体类
 */
export class Pylon extends Entity {
    constructor(x, y) {
        super(x, y, ENTITY_TYPES.PYLON);
        this.powered = false;
        this.isDamaged = false;
    }
}

/**
 * 线路实体类
 */
export class Link {
    constructor(from, to, upgraded = false, distance = 0) {
        this.from = from;
        this.to = to;
        this.active = false;
        this.load = 0;
        this.heat = 0;
        this.spawnProgress = 0;
        this.upgraded = upgraded;
        this.distance = distance;
        this.loss = 0;
        this.isHighVoltage = upgraded;
        this.maxLoad = upgraded ? CONFIG.upgradedWireLoad : CONFIG.baseWireLoad;
        this.lastOverloadTime = 0;
        this.isDamaged = false;
        this.cascadeCooldown = 0;
    }
}

/**
 * 粒子效果类
 */
export class Particle {
    constructor(x, y, vx, vy, life, decay, color, size, type = 'normal') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.decay = decay;
        this.color = color;
        this.size = size;
        this.type = type;
    }
}

/**
 * 事件实体类
 */
export class GameEvent {
    constructor(type, duration, data = {}) {
        this.type = type;
        this.startTime = 0;
        this.duration = duration;
        this.data = data;
    }
}