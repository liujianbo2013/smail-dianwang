/**
 * 右键菜单模块
 * 负责显示和管理右键上下文菜单
 */

import { CONFIG } from '../core/config.js';
import { SOURCE_VARIANTS } from '../entities/entities.js';

/**
 * 右键菜单管理器
 */
export class ContextMenuManager {
    constructor(runtimeState) {
        this.runtimeState = runtimeState;
    }

    /**
     * 显示右键菜单
     */
    showContextMenu(screenX, screenY, entity) {
        // 移除现有菜单
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) existingMenu.remove();

        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.left = screenX + 'px';
        menu.style.top = screenY + 'px';

        // 添加标题
        this.addMenuTitle(menu, entity);

        // 添加信息区域
        this.addMenuInfo(menu, entity);

        // 添加太阳能升级按钮
        if (entity.variant === SOURCE_VARIANTS.SOLAR && !entity.hasStorageUpgrade) {
            this.addSolarUpgradeButton(menu, entity);
        }

        // 添加核电站维护按钮
        if (entity.variant === SOURCE_VARIANTS.NUCLEAR && !entity.maintenanceMode) {
            this.addNuclearMaintenanceButton(menu, entity);
        }

        // 添加线路升级按钮（如果是线路）
        if (entity.from && entity.to) {
            this.addLinkUpgradeButton(menu, entity);
        }

        // 添加拆除按钮
        this.addDemolishButton(menu, entity);

        document.body.appendChild(menu);

        // 点击外部关闭菜单
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 0);
    }

    /**
     * 添加菜单标题
     */
    addMenuTitle(menu, entity) {
        const title = document.createElement('h3');
        title.textContent = this.getEntityName(entity);
        menu.appendChild(title);
    }

    /**
     * 添加菜单信息
     */
    addMenuInfo(menu, entity) {
        const info = document.createElement('div');
        info.className = 'context-menu-info';
        info.innerHTML = this.getEntityInfoHTML(entity);
        menu.appendChild(info);
    }

    /**
     * 添加太阳能升级按钮
     */
    addSolarUpgradeButton(menu, entity) {
        const upgradeBtn = document.createElement('button');
        upgradeBtn.className = 'context-menu-btn';
        upgradeBtn.innerHTML = `<span>🔋 升级储能板</span><span class="cost">$${CONFIG.solarStorageUpgradeCost}</span>`;
        upgradeBtn.onclick = () => {
            this.upgradeSolarStorage(entity);
            menu.remove();
        };
        menu.appendChild(upgradeBtn);
    }

    /**
     * 添加核电站维护按钮
     */
    addNuclearMaintenanceButton(menu, entity) {
        const maintainBtn = document.createElement('button');
        maintainBtn.className = 'context-menu-btn';
        maintainBtn.innerHTML = `<span>🔧 维护升级</span><span class="cost">$${CONFIG.nuclearMaintenanceUpgradeCost}</span>`;
        maintainBtn.onclick = () => {
            this.upgradeNuclearMaintenance(entity);
            menu.remove();
        };
        menu.appendChild(maintainBtn);
    }

    /**
     * 添加线路升级按钮
     */
    addLinkUpgradeButton(menu, entity) {
        const upgradeLinkBtn = document.createElement('button');
        upgradeLinkBtn.className = 'context-menu-btn';

        const dist = Math.hypot(entity.from.x - entity.to.x, entity.from.y - entity.to.y);
        const upgradeCost = Math.floor(dist * CONFIG.costWirePerUnit * CONFIG.costUpgradeMult);

        if (entity.upgraded) {
            upgradeLinkBtn.innerHTML = `<span>✅ 已升级</span><span class="cost">高压线</span>`;
            upgradeLinkBtn.disabled = true;
        } else {
            upgradeLinkBtn.innerHTML = `<span>⚡ 升级为高压线</span><span class="cost">$${upgradeCost}</span>`;
            upgradeLinkBtn.onclick = () => {
                this.upgradeLink(entity, upgradeCost);
                menu.remove();
            };
        }

        menu.appendChild(upgradeLinkBtn);
    }

    /**
     * 添加拆除按钮
     */
    addDemolishButton(menu, entity) {
        const demolishCost = this.getDemolishCost(entity);

        const demolishBtn = document.createElement('button');
        demolishBtn.className = 'context-menu-btn danger';
        demolishBtn.innerHTML = `<span>🗑️ 拆除</span><span class="cost">+$${Math.floor(demolishCost)}</span>`;
        demolishBtn.onclick = () => {
            this.demolishBuilding(entity);
            menu.remove();
        };
        menu.appendChild(demolishBtn);
    }

    /**
     * 获取实体名称
     */
    getEntityName(entity) {
        if (entity.variant === SOURCE_VARIANTS.STANDARD) return '电厂';
        if (entity.variant === SOURCE_VARIANTS.NUCLEAR) return '核电站';
        if (entity.variant === SOURCE_VARIANTS.WIND) return '风力电站';
        if (entity.variant === SOURCE_VARIANTS.SOLAR) return '太阳能电站';
        if (entity.variant === SOURCE_VARIANTS.TOWER) return '电塔';
        if (entity.variant === SOURCE_VARIANTS.REPAIR) return '维修站';
        if (entity.variant === SOURCE_VARIANTS.DISPATCH) return '调度中心';
        if (entity.variant === SOURCE_VARIANTS.ENERGY_STORAGE) return '储能站';
        if (entity.type === 'battery') return '电池';
        if (entity.type === 'pylon') return '电塔';
        if (entity.type === 'house') return '住宅';
        if (entity.type === 'factory') return '工厂';
        if (entity.type === 'commercial') return '商业';
        return '未知';
    }

    /**
     * 获取实体信息HTML
     */
    getEntityInfoHTML(entity) {
        if (entity.variant === SOURCE_VARIANTS.NUCLEAR) {
            const coolingStatus = entity.coolingSatisfied ? '✅ 冷却充足' : '⚠️ 冷却不足';
            return `
                容量: ${entity.capacity.toFixed(1)}<br>
                负载: ${entity.load.toFixed(1)}<br>
                ${coolingStatus}<br>
                冷却电池: ${entity.coolingBatteries}/2
            `;
        }

        if (entity.variant === SOURCE_VARIANTS.WIND) {
            const windStatus = entity.windSpeedMultiplier > 1 ? '🌪️ 风速提升' :
                               entity.windSpeedMultiplier < 1 ? '🍃 风速降低' : '🌬️ 正常';
            return `
                容量: ${entity.capacity.toFixed(1)}<br>
                负载: ${entity.load.toFixed(1)}<br>
                ${windStatus}<br>
                效率: ${(entity.windSpeedMultiplier * 100).toFixed(0)}%
            `;
        }

        if (entity.variant === SOURCE_VARIANTS.SOLAR) {
            const solarStatus = entity.hasStorageUpgrade ? '🔋 已升级储能' : '☀️ 无储能升级';
            return `
                容量: ${entity.capacity.toFixed(1)}<br>
                负载: ${entity.load.toFixed(1)}<br>
                ${solarStatus}
            `;
        }

        if (entity.type === 'battery') {
            return `
                电量: ${entity.energy.toFixed(0)}/${entity.maxEnergy}<br>
                负载: ${entity.targetLoad.toFixed(1)}<br>
                状态: ${entity.currentOp === 'charge' ? '充电中' : entity.currentOp === 'discharge' ? '放电中' : '待机'}
            `;
        }

        return `
            容量: ${entity.capacity ? entity.capacity.toFixed(1) : 'N/A'}<br>
            负载: ${entity.load.toFixed(1)}
        `;
    }

    /**
     * 升级太阳能储能
     */
    upgradeSolarStorage(solar) {
        if (this.runtimeState.money >= CONFIG.solarStorageUpgradeCost) {
            this.runtimeState.money -= CONFIG.solarStorageUpgradeCost;
            solar.hasStorageUpgrade = true;
            this.runtimeState.setSystemMsg("太阳能储能板升级完成！夜间保留20%发电效率", "success");
            this.createExplosion(solar.x, solar.y, '#ffff00', 25);
        } else {
            this.runtimeState.setSystemMsg("资金不足", "warning");
        }
    }

    /**
     * 升级核电站维护
     */
    upgradeNuclearMaintenance(nuclear) {
        if (this.runtimeState.money >= CONFIG.nuclearMaintenanceUpgradeCost) {
            this.runtimeState.money -= CONFIG.nuclearMaintenanceUpgradeCost;
            nuclear.maintenanceMode = true;
            nuclear.maintenanceEndTime = this.runtimeState.gameTime + CONFIG.nuclearMaintenanceDuration;
            nuclear.maintenanceCostMultiplier = 2.0;
            this.runtimeState.setSystemMsg("核电站维护已启动，容量衰减暂停1小时", "success");
            this.createExplosion(nuclear.x, nuclear.y, '#00ff66', 25);
        } else {
            this.runtimeState.setSystemMsg("资金不足，需要$" + CONFIG.nuclearMaintenanceUpgradeCost, "warning");
        }
    }

    /**
     * 升级线路
     */
    upgradeLink(link, upgradeCost) {
        if (this.runtimeState.money >= upgradeCost) {
            this.runtimeState.money -= upgradeCost;
            link.upgraded = true;
            link.maxLoad = CONFIG.upgradedWireLoad;
            this.createExplosion((link.from.x + link.to.x) / 2, (link.from.y + link.to.y) / 2, CONFIG.colors.wireUpgraded, 15);
            this.runtimeState.setSystemMsg(`电线已升级 (-$${upgradeCost})`, "success");
            // updatePowerGrid() - 需要从外部调用
        } else {
            this.runtimeState.setSystemMsg("资金不足", "warning");
        }
    }

    /**
     * 拆除建筑
     */
    demolishBuilding(entity) {
        // 移除连线
        this.runtimeState.links = this.runtimeState.links.filter(l => l.from !== entity && l.to !== entity);

        // 返还资金
        const refund = this.getDemolishCost(entity);
        this.runtimeState.money += refund;

        // 移除实体
        this.removeEntity(entity);

        this.runtimeState.setSystemMsg(`已拆除，返还 $${Math.floor(refund)}`, "info");
        this.createExplosion(entity.x, entity.y, '#ff6666', 20);
        // updatePowerGrid() - 需要从外部调用
    }

    /**
     * 获取拆除返还金额
     */
    getDemolishCost(entity) {
        if (entity.variant === SOURCE_VARIANTS.STANDARD) return CONFIG.costPlant * CONFIG.refundRate;
        if (entity.variant === SOURCE_VARIANTS.NUCLEAR) return CONFIG.costNuclear * CONFIG.refundRate;
        if (entity.variant === SOURCE_VARIANTS.WIND) return CONFIG.costWind * CONFIG.refundRate;
        if (entity.variant === SOURCE_VARIANTS.SOLAR) return CONFIG.costSolar * CONFIG.refundRate;
        if (entity.variant === SOURCE_VARIANTS.REPAIR) return CONFIG.costRepairStation * CONFIG.refundRate;
        if (entity.variant === SOURCE_VARIANTS.DISPATCH) return CONFIG.costDispatchCenter * CONFIG.refundRate;
        if (entity.variant === SOURCE_VARIANTS.ENERGY_STORAGE) return CONFIG.costEnergyStorage * CONFIG.refundRate;
        if (entity.type === 'battery') return CONFIG.costBattery * CONFIG.refundRate;
        if (entity.type === 'pylon' || entity.variant === SOURCE_VARIANTS.TOWER) return CONFIG.costPylon * CONFIG.refundRate;
        return 0;
    }

    /**
     * 移除实体
     */
    removeEntity(entity) {
        if (entity.variant && [
            SOURCE_VARIANTS.STANDARD, SOURCE_VARIANTS.NUCLEAR, SOURCE_VARIANTS.WIND,
            SOURCE_VARIANTS.SOLAR, SOURCE_VARIANTS.REPAIR, SOURCE_VARIANTS.DISPATCH,
            SOURCE_VARIANTS.ENERGY_STORAGE
        ].includes(entity.variant)) {
            const index = this.runtimeState.sources.indexOf(entity);
            if (index > -1) {
                this.runtimeState.sources.splice(index, 1);
            }
        } else if (entity.type === 'battery') {
            const index = this.runtimeState.batteries.indexOf(entity);
            if (index > -1) {
                this.runtimeState.batteries.splice(index, 1);
            }
        } else if (entity.type === 'pylon') {
            const index = this.runtimeState.pylons.indexOf(entity);
            if (index > -1) {
                this.runtimeState.pylons.splice(index, 1);
            }
        } else if (entity.type === 'house' || entity.type === 'factory' || entity.type === 'commercial') {
            const index = this.runtimeState.houses.indexOf(entity);
            if (index > -1) {
                this.runtimeState.houses.splice(index, 1);
            }
        }
    }

    /**
     * 创建爆炸效果
     */
    createExplosion(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.runtimeState.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.03,
                color: color,
                size: 1 + Math.random() * 3
            });
        }
    }
}