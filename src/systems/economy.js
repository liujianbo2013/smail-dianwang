/**
 * 经济系统模块
 * 负责收入计算、维护费用、补贴等经济逻辑
 */

import { CONFIG } from '../core/config.js';
import { calculateCoverage } from '../utils/helpers.js';
import { SOURCE_VARIANTS } from '../entities/entities.js';

/**
 * 经济系统
 */
export class EconomySystem {
    constructor(runtimeState) {
        this.runtimeState = runtimeState;
    }

    /**
     * 更新经济系统
     */
    updateEconomy(dt) {
        const { gameState, money, houses, sources, batteries, gameTime, lastIncomeGameTime } = this.runtimeState;

        if (gameTime - lastIncomeGameTime <= CONFIG.economyTickRate) {
            return;
        }

        // 处理电池充放电
        this.updateBatteries(dt);

        const totalPop = houses.length;
        const coverage = calculateCoverage(houses);

        // 计算收入
        let income = this.calculateIncome(totalPop, coverage);

        // 计算维护费用
        let upkeep = this.calculateUpkeep();

        // 净收入
        const netIncome = income - upkeep;

        this.runtimeState.currentNetIncome = netIncome;
        this.runtimeState.money += netIncome;
        this.runtimeState.lastIncomeGameTime = gameTime;

        // 更新总收入记录
        if (netIncome > 0) {
            gameState.records.totalEarnings += netIncome;
        }
    }

    /**
     * 更新电池充放电状态
     */
    updateBatteries(dt) {
        const { batteries, gameState, sources, houses } = this.runtimeState;
        
        // 检查是否有低需求事件（充电加成）
        const lowDemandEvent = gameState.activeEvents.find(e => e.type === 'lowDemand');
        const chargeBonus = lowDemandEvent ? lowDemandEvent.batteryChargeBonus : 1.0;
        
        // 检查是否是高峰时段
        const isPeakHour = this.runtimeState.isPeakHour;
        
        // 计算电网负载
        const coverage = calculateCoverage(houses);
        const totalCapacity = sources.reduce((sum, s) => sum + s.capacity, 0);
        const totalLoad = sources.reduce((sum, s) => sum + s.load, 0);
        const loadRatio = totalCapacity > 0 ? totalLoad / totalCapacity : 0;
        
        batteries.forEach(battery => {
            if (!battery.powered) {
                battery.currentOp = 'idle';
                return;
            }
            
            // 决定电池操作模式
            if (isPeakHour || loadRatio > 0.8) {
                // 高峰时段或高负载：放电
                if (battery.energy > 0 && battery.currentOp !== 'discharge') {
                    battery.currentOp = 'discharge';
                }
            } else if (!isPeakHour && loadRatio < 0.6 && battery.energy < battery.maxEnergy) {
                // 非高峰时段且低负载：充电
                if (battery.currentOp !== 'charge') {
                    battery.currentOp = 'charge';
                }
            } else {
                // 待机
                battery.currentOp = 'idle';
            }
            
            // 执行充放电
            if (battery.currentOp === 'charge') {
                const chargeAmount = CONFIG.batteryChargeRate * dt * chargeBonus / 1000;
                battery.energy = Math.min(battery.maxEnergy, battery.energy + chargeAmount);
            } else if (battery.currentOp === 'discharge') {
                const dischargeAmount = CONFIG.batteryDischargeRate * dt / 1000;
                battery.energy = Math.max(0, battery.energy - dischargeAmount);
            }
        });
    }

    /**
     * 计算收入
     */
    calculateIncome(totalPop, coverage) {
        let income = CONFIG.baseSubsidy;

        // 补贴缩放
        if (this.runtimeState.money < CONFIG.subsidyThreshold) {
            income *= 2; // 早期游戏双倍补贴
        } else if (totalPop > CONFIG.subsidyCancelPop) {
            income = 0; // 后期游戏无补贴
        }

        // 清洁能源补贴
        this.applyCleanEnergySubsidy(income);

        // 人口收入
        const { houses } = this.runtimeState;
        houses.forEach(h => {
            if (h.powered) {
                let val = CONFIG.incomePerHouse;
                if (h.type === 'factory') val = CONFIG.incomePerFactory;
                if (h.type === 'commercial') val = CONFIG.incomePerComm;

                // 分层定价加成
                if (coverage >= 100) val *= 1.2;
                else if (coverage < 50) val *= 0.5;

                income += val;
            }
        });

        return income;
    }

    /**
     * 应用清洁能源补贴
     */
    applyCleanEnergySubsidy(income) {
        const { sources, gameState } = this.runtimeState;

        const cleanEnergySources = sources.filter(s =>
            [SOURCE_VARIANTS.WIND, SOURCE_VARIANTS.SOLAR].includes(s.variant)
        ).length;
        const totalSources = sources.length;
        const cleanEnergyRatio = totalSources > 0 ? cleanEnergySources / totalSources : 0;

        if (cleanEnergyRatio >= CONFIG.cleanEnergySubsidyThreshold &&
            gameState.gameDays > gameState.lastSubsidyDay) {
            gameState.lastSubsidyDay = gameState.gameDays;
            const dailyIncome = this.runtimeState.currentNetIncome * 60 * 24;
            const subsidy = Math.abs(dailyIncome) * 0.5;
            this.runtimeState.money += subsidy;

            // 显示补贴消息（通过事件系统）
            this.runtimeState.setSystemMsg(
                `政策补贴：清洁能源占比${(cleanEnergyRatio * 100).toFixed(0)}%，获得 $${subsidy.toFixed(2)}`,
                "success",
                true
            );
        }
    }

    /**
     * 计算维护费用
     */
    calculateUpkeep() {
        const { sources } = this.runtimeState;
        let upkeep = 0;

        const plantCount = sources.filter(s =>
            s.variant !== SOURCE_VARIANTS.NUCLEAR &&
            s.variant !== SOURCE_VARIANTS.WIND &&
            s.variant !== SOURCE_VARIANTS.SOLAR
        ).length;

        // 计算维护减免
        let maintenanceReduction = 0;
        sources.filter(s => s.variant === SOURCE_VARIANTS.REPAIR).forEach(station => {
            maintenanceReduction += station.maintenanceReduction;
        });
        maintenanceReduction = Math.min(0.5, maintenanceReduction); // 最多减免50%

        // 计算每个电厂的维护费用
        sources.forEach((s, index) => {
            let plantUpkeep = this.getSourceUpkeep(s);

            // 应用维护减免
            plantUpkeep *= (1 - maintenanceReduction);

            // 维护缩放（后期电厂更贵）
            if (plantCount > CONFIG.maintenanceScaleThreshold && index >= CONFIG.maintenanceScaleThreshold - 1) {
                plantUpkeep *= CONFIG.maintenanceScaleMultiplier;
            }

            upkeep += plantUpkeep;
        });

        return upkeep;
    }

    /**
     * 获取电源维护费用
     */
    getSourceUpkeep(source) {
        if (source.variant === SOURCE_VARIANTS.NUCLEAR) {
            return CONFIG.nuclearUpkeep;
        }
        return source.upkeep || CONFIG.upkeepPerPlant;
    }

    /**
     * 检查购买能力
     */
    canAfford(cost) {
        return this.runtimeState.money >= cost;
    }

    /**
     * 扣除资金
     */
    spendMoney(amount) {
        this.runtimeState.money -= amount;
    }

    /**
     * 增加资金
     */
    addMoney(amount) {
        this.runtimeState.money += amount;
    }
}