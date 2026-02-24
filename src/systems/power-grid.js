/**
 * 电力网格系统模块
 * 负责电力分配、负载计算和电网状态更新
 */

import { CONFIG } from '../core/config.js';
import { ENTITY_TYPES } from '../entities/entities.js';

/**
 * 电力网格系统
 */
export class PowerGridSystem {
    constructor(runtimeState) {
        this.runtimeState = runtimeState;
    }

    /**
     * 计算有效容量（考虑天气、时间、维护等因素）
     */
    getEffectiveCapacity(source) {
        let effectiveCapacity = source.capacity;

        // 应用风速倍率
        if (source.variant === 'wind' && source.windSpeedMultiplier) {
            effectiveCapacity *= source.windSpeedMultiplier;
        }

        // 应用太阳能效率（基于时间）
        if (source.variant === 'solar') {
            const hour = this.runtimeState.gameState.gameDate;
            if (hour >= CONFIG.solarDayStart && hour < CONFIG.solarDayEnd) {
                // 白天：100%效率
                effectiveCapacity *= 1.0;
            } else if ((hour >= CONFIG.solarDayStart - CONFIG.solarDawnDuration && hour < CONFIG.solarDayStart) ||
                       (hour >= CONFIG.solarDayEnd && hour < CONFIG.solarDayEnd + CONFIG.solarDuskDuration)) {
                // 黄昏/黎明：50%效率
                effectiveCapacity *= 0.5;
            } else {
                // 夜间：0%效率（或升级后20%）
                if (source.hasStorageUpgrade) {
                    effectiveCapacity *= CONFIG.solarStorageEfficiency;
                } else {
                    effectiveCapacity = 0;
                }
            }
        }

        // 应用核电站维护模式
        if (source.variant === 'nuclear' && source.maintenanceMode) {
            effectiveCapacity = 0;
        }

        // 应用维修中状态
        if (source.underMaintenance) {
            effectiveCapacity = 0;
        }

        // 应用效率加成
        if (source.efficiencyBonus) {
            effectiveCapacity *= source.efficiencyBonus;
        }

        return effectiveCapacity;
    }

    /**
     * 计算传输损耗
     */
    calculateTransmissionLoss(distance, isHighVoltage) {
        return 0; // 已禁用传输损耗
    }

    /**
     * 更新电力网格
     */
    updatePowerGrid(silent = false) {
        const { sources, pylons, houses, batteries, links } = this.runtimeState;

        // 重置状态
        const prevPowered = new Set();
        pylons.forEach(p => { if (p.powered) prevPowered.add(p); p.powered = false; });
        houses.forEach(h => { if (h.powered) prevPowered.add(h); h.powered = false; });
        batteries.forEach(b => { if (b.powered) prevPowered.add(b); b.powered = false; });
        links.forEach(l => { l.active = false; l.load = 0; });
        sources.forEach(s => s.load = 0);

        // BFS 遍历电网
        let queue = [];
        let visited = new Map();

        sources.forEach(s => {
            if (s.needsRepair) return;
            queue.push({ node: s, depth: 0, sourceRoot: s });
            visited.set(s, { depth: 0, parentLink: null });
        });

        while (queue.length > 0) {
            let currentObj = queue.shift();
            let u = currentObj.node;

            for (let link of links) {
                if (link.isDamaged) continue;

                let v = (link.from === u) ? link.to : (link.to === u ? link.from : null);
                if (v) {
                    if (v.type === ENTITY_TYPES.PYLON && v.isDamaged) continue;

                    if (!visited.has(v)) {
                        visited.set(v, { depth: currentObj.depth + 1, parentLink: link });
                        link.active = true;
                        v.powered = true;
                        queue.push({ node: v, depth: currentObj.depth + 1 });
                    } else if (visited.get(v).parentLink !== link) {
                        link.active = true;
                    }
                }
            }
        }

        // 反向计算负载
        let nodesByDepth = Array.from(visited.keys())
            .sort((a, b) => visited.get(b).depth - visited.get(a).depth);

        for (let node of nodesByDepth) {
            if (node.type === ENTITY_TYPES.SOURCE || node.type === ENTITY_TYPES.TOWER) continue;
            const feedLink = visited.get(node).parentLink;
            if (feedLink) {
                let nodeLoad = this.calculateNodeLoad(node);

                // 应用高峰时段负载增加
                if (this.runtimeState.isPeakHour) {
                    nodeLoad *= CONFIG.peakHourMultiplier;
                }

                let totalLoad = nodeLoad + (node.accumulatedLoad || 0);

                // 应用传输损耗
                if (feedLink.loss > 0) {
                    totalLoad = totalLoad / (1 - feedLink.loss);
                }

                feedLink.load += totalLoad;
                let parentNode = (feedLink.from === node) ? feedLink.to : feedLink.from;
                if (parentNode.type === ENTITY_TYPES.SOURCE || parentNode.type === ENTITY_TYPES.TOWER) {
                    parentNode.load += totalLoad;
                } else {
                    parentNode.accumulatedLoad = (parentNode.accumulatedLoad || 0) + totalLoad;
                }
            }
            node.accumulatedLoad = 0;
        }

        // 生成通电效果（如果不是静默模式）
        if (!silent) {
            houses.forEach(h => {
                if (h.powered && !prevPowered.has(h)) {
                    this.createPowerEffect(h);
                }
            });
        }
    }

    /**
     * 计算节点负载
     */
    calculateNodeLoad(node) {
        let nodeLoad = 0;

        if (node.type === ENTITY_TYPES.HOUSE) {
            nodeLoad = 1;
        } else if (node.type === ENTITY_TYPES.FACTORY) {
            nodeLoad = CONFIG.factoryLoad;
        } else if (node.type === ENTITY_TYPES.COMMERCIAL) {
            let baseLoad = node.currentLoad || CONFIG.commBaseLoad;
            // 高峰时段增加商业负载
            if (this.runtimeState.isPeakHour && Math.random() < 0.3) {
                baseLoad *= CONFIG.peakHourMultiplier;
            }
            nodeLoad = baseLoad;
        } else if (node.type === ENTITY_TYPES.BATTERY) {
            nodeLoad = node.targetLoad || 0;
        }

        return nodeLoad;
    }

    /**
     * 创建通电效果
     */
    createPowerEffect(entity) {
        const { particles, gameState } = this.runtimeState;
        let color = CONFIG.colors.houseHappy;

        if (entity.type === ENTITY_TYPES.FACTORY) {
            color = CONFIG.colors.factoryHappy;
        } else if (entity.type === ENTITY_TYPES.COMMERCIAL) {
            color = CONFIG.colors.commHappy;
        }

        const size = entity.type === ENTITY_TYPES.HOUSE ? 8 : 15;

        for (let i = 0; i < size; i++) {
            particles.push({
                x: entity.x,
                y: entity.y,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                life: 0.5,
                decay: 0.05,
                color: color,
                size: 2
            });
        }
    }
}