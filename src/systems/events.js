/**
 * 事件系统模块
 * 负责游戏事件的管理和触发
 */

import { CONFIG } from '../core/config.js';
import { SOURCE_VARIANTS } from '../entities/entities.js';

/**
 * 事件系统
 */
export class EventSystem {
    constructor(runtimeState) {
        this.runtimeState = runtimeState;
    }

    /**
     * 更新事件系统
     */
    updateEvents(dt) {
        const { gameTime, houses, gameState, sources, pylons, links } = this.runtimeState;

        // 高峰时段事件
        this.updatePeakHour(gameTime);

        // 核电站风险事件
        this.updateNuclearRisks(gameTime);

        // 风力发电事件
        this.updateWindEvents(gameTime);

        // 低需求事件
        this.updateLowDemandEvent(gameTime, houses);

        // 维护事件
        this.updateMaintenanceEvents(gameTime, sources);

        // 自然灾害事件
        this.updateDisasterEvents(gameTime, houses);

        // 清理过期事件
        this.cleanupExpiredEvents(gameTime);

        // 处理灾害伤害
        this.handleDisasterDamage(dt);
    }

    /**
     * 更新高峰时段
     */
    updatePeakHour(gameTime) {
        const peakHourInterval = this.runtimeState.gameState.peakHourInterval || CONFIG.peakHourInterval;
        if (gameTime - this.runtimeState.lastPeakHourTime > peakHourInterval) {
            this.runtimeState.lastPeakHourTime = gameTime;
            this.runtimeState.isPeakHour = true;
            this.runtimeState.setSystemMsg("⚡ 用电高峰时段！用电需求+50%", "warning", true);

            setTimeout(() => {
                this.runtimeState.isPeakHour = false;
                this.runtimeState.setSystemMsg("用电高峰结束", "success", true);
            }, CONFIG.peakHourDuration);
        }
    }

    /**
     * 更新核电站风险
     */
    updateNuclearRisks(gameTime) {
        if (gameTime - this.runtimeState.nuclearCheckTime > 60000) {
            this.runtimeState.nuclearCheckTime = gameTime;
            const { sources } = this.runtimeState;

            sources.forEach(s => {
                if (s.variant === SOURCE_VARIANTS.NUCLEAR) {
                    this.checkNuclearCooling(s);
                    this.checkNuclearFailure(s);
                }
            });
        }

        // 核电站衰减
        if (gameTime - this.runtimeState.nuclearDecayCheckTime > 3600000) {
            this.runtimeState.nuclearDecayCheckTime = gameTime;
            this.updateNuclearDecay();
        }
    }

    /**
     * 检查核电站冷却
     */
    checkNuclearCooling(nuclear) {
        const { links, batteries } = this.runtimeState;

        const connectedBatteries = links
            .filter(l => l.from === nuclear || l.to === nuclear)
            .map(l => {
                const battery = l.from === nuclear ? l.to : l.from;
                return batteries.find(b => b === battery);
            })
            .filter(b => b !== undefined && b.powered)
            .length;

        nuclear.coolingBatteries = connectedBatteries;
        nuclear.coolingSatisfied = connectedBatteries >= CONFIG.nuclearCoolingBatteryCount;

        if (!nuclear.coolingSatisfied) {
            nuclear.failureChance = CONFIG.nuclearCoolingFailureRate;
        } else {
            nuclear.failureChance = this.runtimeState.gameState.nuclearFailureChance || CONFIG.nuclearFailureChance;
        }
    }

    /**
     * 检查核电站故障
     */
    checkNuclearFailure(nuclear) {
        if (Math.random() < nuclear.failureChance) {
            nuclear.needsRepair = true;
            const reason = !nuclear.coolingSatisfied ? "冷却不足" : "系统故障";
            this.runtimeState.setSystemMsg(`⚠️ 核电站${reason}！需要维修！`, "warning", true);
        }
    }

    /**
     * 更新核电站衰减
     */
    updateNuclearDecay() {
        const { sources } = this.runtimeState;

        sources.forEach(s => {
            if (s.variant === SOURCE_VARIANTS.NUCLEAR) {
                // 维护模式时跳过衰减
                if (s.maintenanceMode) {
                    return;
                }
                s.capacity = Math.max(10, s.capacity - CONFIG.nuclearDecayRate);

                if (s.capacity < CONFIG.nuclearCapacity * 0.5) {
                    this.runtimeState.setSystemMsg("⚠️ 核电站性能下降，需要维护", "warning", true);
                }
            }
        });
    }

    /**
     * 更新风力发电事件
     */
    updateWindEvents(gameTime) {
        if (gameTime - this.runtimeState.nuclearCheckTime > 60000) {
            const { sources, gameState } = this.runtimeState;

            sources.filter(s => s.variant === SOURCE_VARIANTS.WIND).forEach(wind => {
                if (Math.random() < CONFIG.windSpeedEventChance) {
                    const isNight = gameState.gameDate >= 20 || gameState.gameDate < 6;

                    if (isNight) {
                        wind.windSpeedMultiplier = 1.0;
                    } else {
                        const event = Math.random() < 0.5 ? 'high' : 'low';
                        wind.windSpeedMultiplier = event === 'high' ? 1.8 : 0.5;

                        const message = event === 'high' ? '提升' : '降低';
                        const multiplier = event === 'high' ? '+80%' : '-50%';
                        const type = event === 'high' ? 'success' : 'warning';

                        this.runtimeState.setSystemMsg(`风速${message}！效率${multiplier}`, type, true);

                        // 添加视觉效果
                        this.runtimeState.particles.push({
                            x: wind.x,
                            y: wind.y,
                            vx: 0,
                            vy: 0,
                            life: 1.0,
                            decay: 0.05,
                            color: event === 'high' ? '#88ffff' : '#ff8888',
                            size: 15,
                            type: 'shockwave'
                        });
                    }
                }
            });
        }
    }

    /**
     * 更新低需求事件
     */
    updateLowDemandEvent(gameTime, houses) {
        const population = houses.length;
        const isPeakHour = this.runtimeState.gameState.gameDate >= 18 &&
                           this.runtimeState.gameState.gameDate <= 22;

        if (population < 200 && !isPeakHour && this.runtimeState.gameState.activeEvents.length === 0) {
            if (Math.random() < CONFIG.lowDemandEventChance) {
                this.runtimeState.gameState.activeEvents.push({
                    type: 'lowDemand',
                    startTime: gameTime,
                    duration: 300000,
                    batteryChargeBonus: 1.2
                });

                this.runtimeState.setSystemMsg("用电低谷期！电池充电效率+20%", "info", true);

                this.runtimeState.particles.push({
                    x: 0,
                    y: 0,
                    vx: 0,
                    vy: 0,
                    life: 1.0,
                    decay: 0.02,
                    color: '#00ffaa',
                    size: 30,
                    type: 'shockwave'
                });
            }
        }
    }

    /**
     * 更新维护事件
     */
    updateMaintenanceEvents(gameTime, sources) {
        sources.forEach(source => {
            if (source.underMaintenance) {
                if (gameTime >= source.maintenanceEndTime) {
                    source.underMaintenance = false;
                    source.efficiencyBonus = source.efficiencyBonus || 1.1;

                    const name = this.getSourceName(source.variant);
                    this.runtimeState.setSystemMsg(`${name}检修完成，效率+10%`, "success", true);
                }
            } else if (source.builtTime && !source.maintenanceMode) {
                const runningTime = gameTime - source.builtTime;

                if (runningTime > 3600000) {
                    if (Math.random() < CONFIG.maintenanceEventChance) {
                        source.underMaintenance = true;
                        source.maintenanceEndTime = gameTime + 30000;

                        const name = this.getSourceName(source.variant);
                        this.runtimeState.setSystemMsg(`${name}需要检修，临时关闭30秒`, "warning", true);
                    }
                }
            }
        });
    }

    /**
     * 更新自然灾害事件
     */
    updateDisasterEvents(gameTime, houses) {
        const population = houses.length;

        if (population > CONFIG.disasterPopThreshold &&
            this.runtimeState.gameState.activeEvents.length === 0) {
            if (Math.random() < CONFIG.disasterEventChance) {
                const disasterType = Math.random() < 0.5 ? 'storm' : 'typhoon';
                const disasterName = disasterType === 'storm' ? '暴雨' : '台风';

                this.runtimeState.gameState.activeEvents.push({
                    type: disasterType,
                    startTime: gameTime,
                    duration: 600000,
                    linkDamageChance: 0.3
                });

                this.runtimeState.setSystemMsg(`灾害预警：${disasterName}来袭！加固电塔！`, "error", true);
                this.runtimeState.gameState.records.disasterCount++;
            }
        }
    }

    /**
     * 清理过期事件
     */
    cleanupExpiredEvents(gameTime) {
        this.runtimeState.gameState.activeEvents = this.runtimeState.gameState.activeEvents.filter(event => {
            if (gameTime - event.startTime > event.duration) {
                if (event.type === 'lowDemand') {
                    this.runtimeState.setSystemMsg("用电低谷期结束", "info", true);
                }
                return false;
            }
            return true;
        });
    }

    /**
     * 处理灾害伤害
     */
    handleDisasterDamage(dt) {
        const disaster = this.runtimeState.gameState.activeEvents.find(
            e => e.type === 'storm' || e.type === 'typhoon'
        );

        if (disaster) {
            this.runtimeState.pylons.forEach(pylon => {
                if (Math.random() < disaster.linkDamageChance * 0.01) {
                    pylon.isDamaged = true;

                    this.runtimeState.particles.push({
                        x: pylon.x,
                        y: pylon.y,
                        vx: 0,
                        vy: 0,
                        life: 1.0,
                        decay: 0.05,
                        color: '#ff8800',
                        size: 15,
                        type: 'shockwave'
                    });
                }
            });
        }
    }

    /**
     * 获取电源名称
     */
    getSourceName(variant) {
        switch (variant) {
            case SOURCE_VARIANTS.STANDARD: return '电厂';
            case SOURCE_VARIANTS.NUCLEAR: return '核电站';
            case SOURCE_VARIANTS.WIND: return '风力电站';
            case SOURCE_VARIANTS.SOLAR: return '太阳能电站';
            default: return '设施';
        }
    }
}