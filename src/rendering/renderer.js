/**
 * 渲染器主模块
 * 负责游戏画面的渲染
 */

import { CONFIG } from '../core/config.js';
import { isInView, isLinkInView } from '../utils/helpers.js';
import { SOURCE_VARIANTS } from '../entities/entities.js';

/**
 * 渲染器
 */
export class Renderer {
    constructor(ctx, runtimeState) {
        this.ctx = ctx;
        this.runtimeState = runtimeState;
    }

    /**
     * 渲染一帧
     */
    render() {
        const { width, height, cx, cy, viewOffsetX, viewOffsetY, currentScale } = this.runtimeState;

        // 清空画布
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.fillStyle = CONFIG.colors.bg;
        this.ctx.fillRect(0, 0, width, height);

        // 保存状态并应用变换
        this.ctx.save();
        this.ctx.translate(cx + viewOffsetX, cy + viewOffsetY);
        this.ctx.scale(currentScale, currentScale);

        // 渲染各层
        this.renderGrid();
        this.renderLinksGlow();
        this.renderLinksCore();
        this.renderDragLine();
        this.renderBuildingPreview();
        this.renderEntitiesGlow();
        this.renderEntitiesCore();
        this.renderParticles();

        this.ctx.restore();
    }

    /**
     * 渲染网格
     */
    renderGrid() {
        const { viewBounds } = this.runtimeState;

        this.ctx.strokeStyle = CONFIG.colors.grid;
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.3;

        const gridSz = 50;
        const startX = Math.floor(viewBounds.minX / gridSz) * gridSz;
        const endX = Math.ceil(viewBounds.maxX / gridSz) * gridSz;
        const startY = Math.floor(viewBounds.minY / gridSz) * gridSz;
        const endY = Math.ceil(viewBounds.maxY / gridSz) * gridSz;

        this.ctx.beginPath();

        for (let x = startX; x <= endX; x += gridSz) {
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
        }

        for (let y = startY; y <= endY; y += gridSz) {
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(endX, y);
        }

        this.ctx.stroke();
        this.ctx.globalAlpha = 1;
    }

    /**
     * 渲染线路发光效果
     */
    renderLinksGlow() {
        const { links, hoveredLink, isHighVoltageMode } = this.runtimeState;

        this.ctx.globalCompositeOperation = 'lighter';

        links.forEach(l => {
            if (!isLinkInView(l, this.runtimeState.viewBounds)) return;

            const limit = l.maxLoad || CONFIG.baseWireLoad;

            if (l === hoveredLink) {
                if (isHighVoltageMode && !l.upgraded) {
                    this.ctx.strokeStyle = CONFIG.colors.upgradeHighlight;
                    this.ctx.lineWidth = 12;
                    this.ctx.globalAlpha = 0.5;
                    this.ctx.beginPath();
                    this.ctx.moveTo(l.from.x, l.from.y);
                    this.ctx.lineTo(l.to.x, l.to.y);
                    this.ctx.stroke();
                } else if (!isHighVoltageMode) {
                    this.ctx.strokeStyle = CONFIG.colors.deleteHighlight;
                    this.ctx.lineWidth = 12;
                    this.ctx.globalAlpha = 0.5;
                    this.ctx.beginPath();
                    this.ctx.moveTo(l.from.x, l.from.y);
                    this.ctx.lineTo(l.to.x, l.to.y);
                    this.ctx.stroke();
                }
            } else if (l.active) {
                const loadRatio = Math.min(1.0, l.load / limit);

                if (l.upgraded) {
                    this.ctx.strokeStyle = CONFIG.colors.wireUpgradedGlow;
                } else {
                    const hue = 180 - (loadRatio * 180);
                    this.ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
                }

                if (loadRatio > 0 || l.upgraded) {
                    let thickness = 6 + loadRatio * 6 + Math.sin(Date.now() / 200) * 2;
                    if (l.upgraded) thickness += 4;

                    this.ctx.lineWidth = thickness;
                    this.ctx.globalAlpha = 0.4;
                    this.ctx.beginPath();
                    this.ctx.moveTo(l.from.x, l.from.y);
                    this.ctx.lineTo(l.to.x, l.to.y);
                    this.ctx.stroke();
                }
            }
        });
    }

    /**
     * 渲染线路核心
     */
    renderLinksCore() {
        const { links, hoveredLink, isHighVoltageMode } = this.runtimeState;

        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.globalAlpha = 1.0;

        links.forEach(l => {
            if (!isLinkInView(l, this.runtimeState.viewBounds)) return;

            const limit = l.maxLoad || CONFIG.baseWireLoad;

            let endX = l.to.x;
            let endY = l.to.y;

            if (l.spawnProgress < 1) {
                endX = l.from.x + (l.to.x - l.from.x) * l.spawnProgress;
                endY = l.from.y + (l.to.y - l.from.y) * l.spawnProgress;
            }

            this.ctx.beginPath();

            let hue = 180;
            let lineWidth = 2;
            let jitter = 0;

            if (l === hoveredLink) {
                if (isHighVoltageMode && !l.upgraded) {
                    this.ctx.strokeStyle = '#fff';
                    lineWidth = 3;
                } else if (!isHighVoltageMode) {
                    this.ctx.strokeStyle = '#ff6666';
                    lineWidth = 3;
                } else {
                    this.ctx.strokeStyle = l.upgraded ? CONFIG.colors.wireUpgraded : CONFIG.colors.wire;
                    lineWidth = l.upgraded ? 4 : 2;
                }
            } else {
                if (l.active) {
                    const loadRatio = Math.min(1.0, l.load / limit);

                    if (l.upgraded) {
                        this.ctx.strokeStyle = CONFIG.colors.wireUpgraded;
                        lineWidth = 4;
                        if (l.load > limit) {
                            if (Math.floor(Date.now() / 100) % 2 === 0) {
                                this.ctx.strokeStyle = '#fff';
                            }
                            jitter = 3;
                        }
                    } else {
                        hue = 180 - (loadRatio * 180);
                        if (l.load > limit) {
                            hue = 0;
                            if (Math.floor(Date.now() / 100) % 2 === 0) {
                                hue = 60;
                            }
                            lineWidth = 3;
                            jitter = 3;
                        } else if (loadRatio > 0.8) {
                            lineWidth = 2.5;
                            jitter = 1;
                        }
                        this.ctx.strokeStyle = `hsl(${hue}, 100%, 75%)`;
                    }
                } else {
                    this.ctx.strokeStyle = l.upgraded ? '#5500aa' : CONFIG.colors.wire;
                    if (l.upgraded) {
                        lineWidth = 3;
                    }
                }

                if (l.heat > 0) {
                    jitter += (l.heat / CONFIG.maxHeat) * 5;
                    if (l.heat > CONFIG.maxHeat * 0.5) {
                        this.ctx.strokeStyle = '#ff9999';
                    }
                }
            }

            this.ctx.lineWidth = lineWidth;
            this.ctx.moveTo(l.from.x, l.from.y);

            if (jitter > 0) {
                const dist = Math.hypot(l.from.x - endX, l.from.y - endY);
                const steps = Math.max(1, Math.floor(dist / 40));

                for (let i = 1; i < steps; i++) {
                    const t = i / steps;
                    const lx = l.from.x + (endX - l.from.x) * t;
                    const ly = l.from.y + (endY - l.from.y) * t;
                    this.ctx.lineTo(
                        lx + (Math.random() - 0.5) * jitter,
                        ly + (Math.random() - 0.5) * jitter
                    );
                }
            }

            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
        });
    }

    /**
     * 渲染拖拽线路
     */
    renderDragLine() {
        const { input, dragStartNode, snapTarget, validBuildPos, isIntersecting, isHighVoltageMode, money, viewBounds } = this.runtimeState;

        if (!input.isDown || !dragStartNode) return;

        let targetX = input.worldX;
        let targetY = input.worldY;
        let isSnap = false;

        if (snapTarget) {
            targetX = snapTarget.x;
            targetY = snapTarget.y;
            isSnap = true;
        }

        const dist = Math.hypot(targetX - dragStartNode.x, targetY - dragStartNode.y);
        const isValidLen = dist <= CONFIG.maxWireLength && dist > 10;

        const isHV = isHighVoltageMode;
        const costMult = isHV ? CONFIG.costUpgradeMult : 1;
        const wireCost = Math.floor(dist * CONFIG.costWirePerUnit * costMult);

        let estCost = wireCost + (!snapTarget && validBuildPos ? CONFIG.costPylon : 0);
        const canAfford = money >= estCost;
        const isGood = isValidLen && (isSnap || validBuildPos) && !isIntersecting && canAfford;
        const lineColor = isGood ? (isHV ? CONFIG.colors.upgradeHighlight : CONFIG.colors.dragLineValid) : CONFIG.colors.dragLineInvalid;

        this.ctx.beginPath();
        this.ctx.moveTo(dragStartNode.x, dragStartNode.y);
        this.ctx.lineTo(targetX, targetY);
        this.ctx.strokeStyle = lineColor;
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash(isSnap ? [] : [15, 15]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        if (isSnap && isGood) {
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(targetX, targetY, 30, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        this.ctx.beginPath();
        this.ctx.arc(dragStartNode.x, dragStartNode.y, CONFIG.maxWireLength, 0, Math.PI * 2);
        this.ctx.strokeStyle = isGood ? 'rgba(0, 255, 255, 0.4)' : 'rgba(255, 50, 50, 0.4)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 10]);
        this.ctx.lineDashOffset = -Date.now() / 20;
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    /**
     * 渲染建筑预览
     */
    renderBuildingPreview() {
        const { placementMode, input, money } = this.runtimeState;

        if (!placementMode || input.worldX === undefined) return;

        let isValid = this.isPlacementValid();

        let cost = 0;
        if (placementMode === SOURCE_VARIANTS.STANDARD) cost = CONFIG.costPlant;
        else if (placementMode === SOURCE_VARIANTS.NUCLEAR) cost = CONFIG.costNuclear;
        else if (placementMode === 'battery') cost = CONFIG.costBattery;
        else if (placementMode === SOURCE_VARIANTS.WIND) cost = CONFIG.costWind;
        else if (placementMode === SOURCE_VARIANTS.SOLAR) cost = CONFIG.costSolar;
        else if (placementMode === SOURCE_VARIANTS.TOWER) cost = 100;

        const canAfford = money >= cost;
        const isGood = isValid && canAfford;

        this.ctx.globalAlpha = 0.6;

        if (placementMode === 'battery') {
            this.ctx.fillStyle = isGood ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
            this.ctx.fillRect(input.worldX - 15, input.worldY - 10, 30, 20);
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(input.worldX - 15, input.worldY - 10, 30, 20);
        } else {
            this.ctx.beginPath();
            this.ctx.arc(input.worldX, input.worldY, 25, 0, Math.PI * 2);
            this.ctx.fillStyle = isGood ?
                (placementMode === SOURCE_VARIANTS.NUCLEAR ? 'rgba(0, 255, 100, 0.5)' : 'rgba(0, 255, 0, 0.5)') :
                'rgba(255, 0, 0, 0.5)';
            this.ctx.fill();
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }

        this.ctx.globalAlpha = 1;
    }

    /**
     * 检查放置是否有效
     */
    isPlacementValid() {
        const { placementMode, input, sources, pylons, batteries, houses } = this.runtimeState;

        let isValid = true;

        for (let s of sources) {
            if (Math.hypot(input.worldX - s.x, input.worldY - s.y) < 60) {
                isValid = false;
                break;
            }
        }

        if (isValid) {
            for (let p of pylons) {
                if (Math.hypot(input.worldX - p.x, input.worldY - p.y) < 60) {
                    isValid = false;
                    break;
                }
            }
        }

        if (isValid) {
            for (let b of batteries) {
                if (Math.hypot(input.worldX - b.x, input.worldY - b.y) < 60) {
                    isValid = false;
                    break;
                }
            }
        }

        if (isValid) {
            for (let h of houses) {
                if (Math.hypot(input.worldX - h.x, input.worldY - h.y) < 60) {
                    isValid = false;
                    break;
                }
            }
        }

        // 检查风力电站位置限制
        if (placementMode === SOURCE_VARIANTS.WIND && CONFIG.windEdgeOnly) {
            const edgeThreshold = 150;
            const { sources, pylons, houses } = this.runtimeState;
            
            // 获取所有已存在建筑的位置
            const allBuildings = [...sources, ...pylons, ...houses];
            
            if (allBuildings.length > 0) {
                // 计算建筑群的边界
                const minX = Math.min(...allBuildings.map(b => b.x));
                const maxX = Math.max(...allBuildings.map(b => b.x));
                const minY = Math.min(...allBuildings.map(b => b.y));
                const maxY = Math.max(...allBuildings.map(b => b.y));
                
                // 检查是否在边界外
                const isOnEdge = input.worldX < minX - edgeThreshold || 
                                input.worldX > maxX + edgeThreshold ||
                                input.worldY < minY - edgeThreshold || 
                                input.worldY > maxY + edgeThreshold;
                
                isValid = isValid && isOnEdge;
            }
        }

        return isValid;
    }

    /**
     * 渲染实体发光效果
     */
    renderEntitiesGlow() {
        const { sources, houses } = this.runtimeState;

        this.ctx.globalCompositeOperation = 'lighter';

        sources.forEach(s => {
            if (!isInView(s.x, s.y, 50, this.runtimeState.viewBounds)) return;

            const scale = s.spawnScale || 1;
            this.ctx.save();
            this.ctx.translate(s.x, s.y);
            this.ctx.scale(scale, scale);

            const loadPct = s.load / s.capacity;
            const hue = s.variant === SOURCE_VARIANTS.NUCLEAR ? 120 : Math.max(0, 50 - (loadPct * 50));
            this.ctx.fillStyle = `hsl(${hue}, 100%, 30%)`;

            const breathe = 1 + Math.sin(Date.now() / 1000) * 0.05 * loadPct;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 32 * breathe, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.restore();
        });

        this.ctx.fillStyle = 'rgba(0, 255, 170, 0.3)';

        houses.forEach(h => {
            if (!h.powered || !isInView(h.x, h.y, 30, this.runtimeState.viewBounds)) return;

            const scale = h.spawnScale || 1;
            this.ctx.save();
            this.ctx.translate(h.x, h.y);
            this.ctx.scale(scale, scale);

            if (h.type === 'factory') {
                this.ctx.fillStyle = h.powered ? 'rgba(255, 136, 0, 0.4)' : 'rgba(50, 20, 0, 0.4)';
                this.ctx.beginPath();
                this.ctx.rect(-20, -20, 40, 40);
                this.ctx.fill();
            } else if (h.type === 'commercial') {
                this.ctx.fillStyle = h.powered ? 'rgba(0, 136, 255, 0.4)' : 'rgba(0, 20, 50, 0.4)';
                this.ctx.beginPath();

                for (let i = 0; i < 6; i++) {
                    const a = i * Math.PI / 3;
                    this.ctx.lineTo(Math.cos(a) * 25, Math.sin(a) * 25);
                }

                this.ctx.fill();
            } else {
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 24, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.ctx.restore();
        });
    }

    /**
     * 渲染实体核心
     */
    renderEntitiesCore() {
        this.renderBatteries();
        this.renderSources();
        this.renderPylons();
        this.renderHouses();
    }

    /**
     * 渲染电池
     */
    renderBatteries() {
        const { batteries, hoveredEntity, viewBounds } = this.runtimeState;

        batteries.forEach(b => {
            if (!isInView(b.x, b.y, 30, viewBounds)) return;

            const scale = b.spawnScale || 1;
            this.ctx.save();
            this.ctx.translate(b.x, b.y);
            this.ctx.scale(scale, scale);

            let color = b.powered ? CONFIG.colors.battery : CONFIG.colors.powerOff;
            if (b.currentOp === 'discharge') color = CONFIG.colors.batteryDraining;
            if (hoveredEntity === b) color = CONFIG.colors.deleteHighlight;

            this.ctx.fillStyle = '#222';
            this.ctx.fillRect(-15, -10, 30, 20);
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(-15, -10, 30, 20);

            // 能量条
            const pct = b.energy / b.maxEnergy;
            this.ctx.fillStyle = color;
            this.ctx.fillRect(-12, -7, 24 * pct, 14);

            // 状态图标
            if (b.currentOp === 'charge') {
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '10px monospace';
                this.ctx.fillText("+", -4, 4);
            } else if (b.currentOp === 'discharge') {
                this.ctx.fillStyle = '#000';
                this.ctx.font = '10px monospace';
                this.ctx.fillText("-", -4, 4);
            }

            this.ctx.restore();
        });
    }

    /**
     * 渲染电源
     */
    renderSources() {
        const { sources, viewBounds } = this.runtimeState;

        sources.forEach(s => {
            if (!isInView(s.x, s.y, 50, viewBounds)) return;

            // 跳过电塔渲染（与pylons一起渲染）
            if (s.type === 'tower') return;

            const scale = s.spawnScale || 1;
            this.ctx.save();
            this.ctx.translate(s.x, s.y);
            this.ctx.scale(scale, scale);

            const isNuc = s.variant === SOURCE_VARIANTS.NUCLEAR;
            const isWind = s.variant === SOURCE_VARIANTS.WIND;
            const isSolar = s.variant === SOURCE_VARIANTS.SOLAR;

            // 计算负载百分比
            let loadPct = 0;
            if (s.capacity && s.capacity > 0) {
                loadPct = Math.min(1, (s.displayLoad || 0) / s.capacity);
            }

            let hue = Math.max(0, 50 - (loadPct * 50));
            if (isNuc) hue = 120;
            else if (isWind) hue = 180;
            else if (isSolar) hue = 60;

            // 维修警告
            if (s.needsRepair) {
                this.ctx.save();
                this.ctx.strokeStyle = '#ff0000';
                this.ctx.lineWidth = 3;
                this.ctx.setLineDash([5, 5]);
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 40, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.restore();

                this.ctx.fillStyle = '#ff0000';
                this.ctx.font = '12px Arial';
                this.ctx.fillText('!', -3, 4);
            }

            // 过热警告
            if (s.heat > 80 || loadPct > 0.95) {
                this.ctx.save();
                this.ctx.strokeStyle = '#ff0000';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                let r = 35 + (Date.now() % 1000) / 20;
                this.ctx.arc(0, 0, r, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.restore();
            }

            // 风力发电可视化
            if (isWind) {
                this.renderWindTurbine(s);
            }
            // 太阳能可视化
            else if (isSolar) {
                this.renderSolarPanel();
            }
            // 标准电厂或核电站
            else {
                this.renderPowerPlant(s, hue, isNuc, loadPct);
            }

            // 热量条
            if (s.heat > 0) {
                this.ctx.fillStyle = '#330000';
                this.ctx.fillRect(-20, -45, 40, 6);
                this.ctx.fillStyle = s.heat > 80 ? '#fff' : '#ff0000';
                this.ctx.fillRect(-20, -45, 40 * (s.heat / CONFIG.maxHeat), 6);
            }

            this.ctx.restore();
        });
    }

    /**
     * 渲染风力发电机
     */
    renderWindTurbine(s) {
        this.ctx.fillStyle = '#88ffff';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -25);
        this.ctx.lineTo(8, 25);
        this.ctx.lineTo(-8, 25);
        this.ctx.closePath();
        this.ctx.fill();

        // 旋转叶片
        this.ctx.save();
        this.ctx.rotate(s.rotation);

        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(0, -30);
            this.ctx.lineWidth = 4;
            this.ctx.strokeStyle = '#88ffff';
            this.ctx.stroke();
            this.ctx.rotate(Math.PI * 2 / 3);
        }

        this.ctx.restore();
    }

    /**
     * 渲染太阳能板
     */
    renderSolarPanel() {
        this.ctx.fillStyle = '#ffff88';
        this.ctx.fillRect(-20, -15, 40, 30);
        this.ctx.strokeStyle = '#ffaa00';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(-20, -15, 40, 30);

        // 网格线
        this.ctx.strokeStyle = '#ffaa00';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();

        for (let i = -15; i <= 15; i += 10) {
            this.ctx.moveTo(i, -13);
            this.ctx.lineTo(i, 13);
        }

        this.ctx.stroke();
    }

    /**
     * 渲染发电厂
     */
    renderPowerPlant(s, hue, isNuc, loadPct) {
        // 外圈旋转
        this.ctx.save();
        this.ctx.rotate(s.rotation * 0.5);
        this.ctx.strokeStyle = `hsla(${hue}, 100%, 50%, 0.5)`;
        this.ctx.lineWidth = 2;
        const ringSize = 35;

        if (isNuc) {
            for (let i = 0; i < 3; i++) {
                const ang = i * (Math.PI * 2 / 3);
                this.ctx.beginPath();
                this.ctx.arc(Math.cos(ang) * ringSize, Math.sin(ang) * ringSize, 5, 0, Math.PI * 2);
                this.ctx.stroke();
            }
            this.ctx.beginPath();
            this.ctx.arc(0, 0, ringSize, 0, Math.PI * 2);
            this.ctx.stroke();
        } else {
            this.ctx.beginPath();
            this.ctx.arc(0, 0, ringSize, 0, Math.PI * 0.4);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.arc(0, 0, ringSize, Math.PI, Math.PI * 1.4);
            this.ctx.stroke();
        }

        this.ctx.restore();

        // 背景
        this.ctx.fillStyle = '#150a00';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 28, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = isNuc ? '#0f0' : '#421';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // 负载条
        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + (Math.PI * 2 * loadPct);
        this.ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'butt';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 22, startAngle, endAngle);
        this.ctx.stroke();

        // 核心
        this.ctx.save();
        this.ctx.rotate(-s.rotation);
        this.ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;

        if (isNuc) {
            this.ctx.beginPath();
            for (let i = 0; i < 3; i++) {
                const a = i * (Math.PI * 2 / 3);
                this.ctx.moveTo(0, 0);
                this.ctx.arc(0, 0, 15, a, a + 1);
                this.ctx.lineTo(0, 0);
            }
            this.ctx.fill();
        } else {
            const coreSize = 10 + (loadPct * 5);
            this.ctx.beginPath();

            for (let i = 0; i < 6; i++) {
                const ang = (Math.PI / 3) * i;
                this.ctx.lineTo(Math.cos(ang) * coreSize, Math.sin(ang) * coreSize);
            }

            this.ctx.fill();
        }

        this.ctx.restore();
    }

    /**
     * 渲染电塔
     */
    renderPylons() {
        const { pylons, sources, hoveredEntity, viewBounds } = this.runtimeState;

        pylons.forEach(p => {
            if (!isInView(p.x, p.y, 15, viewBounds)) return;

            const scale = p.spawnScale || 1;
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.scale(scale, scale);

            let color = p.powered ? CONFIG.colors.powerOn : CONFIG.colors.powerOff;
            if (hoveredEntity === p) color = CONFIG.colors.deleteHighlight;

            // 检查是否是电塔（特殊pylon）
            const isTower = sources.some(s => s.type === 'tower' && s.x === p.x && s.y === p.y);

            if (isTower) {
                // 电塔可视化
                this.ctx.fillStyle = '#333';
                this.ctx.fillRect(-5, -25, 10, 50);
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(-5, -25, 10, 50);

                // 横梁
                this.ctx.beginPath();
                this.ctx.moveTo(-15, -15);
                this.ctx.lineTo(15, -15);
                this.ctx.moveTo(-12, 0);
                this.ctx.lineTo(12, 0);
                this.ctx.moveTo(-15, 15);
                this.ctx.lineTo(15, 15);
                this.ctx.stroke();

                // 顶部灯
                this.ctx.fillStyle = p.powered ? '#ff0000' : '#660000';
                this.ctx.beginPath();
                this.ctx.arc(0, -28, 4, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                // 标准电塔
                this.ctx.fillStyle = color;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#fff';
                this.ctx.beginPath();
                this.ctx.rect(-3, -3, 6, 6);
                this.ctx.fill();
            }

            this.ctx.restore();
        });
    }

    /**
     * 渲染住宅
     */
    renderHouses() {
        const { houses, viewBounds } = this.runtimeState;

        houses.forEach(h => {
            if (!isInView(h.x, h.y, 30, viewBounds)) return;

            const scale = h.spawnScale || 1;
            this.ctx.save();
            this.ctx.translate(h.x, h.y);
            this.ctx.scale(scale, scale);

            if (h.type === 'factory') {
                this.renderFactory(h);
            } else if (h.type === 'commercial') {
                this.renderCommercial(h);
            } else {
                this.renderHouse(h);
            }

            // 耐心条
            if (!h.powered) {
                this.ctx.strokeStyle = h.isCritical ? '#ff0000' : (h.isAlert ? '#ff5500' : '#888');
                this.ctx.lineWidth = 4;
                this.ctx.beginPath();
                const endAngle = (h.patience / CONFIG.houseMaxPatience) * Math.PI * 2 - Math.PI / 2;
                this.ctx.arc(0, 0, 20, -Math.PI / 2, endAngle);
                this.ctx.stroke();
            }

            this.ctx.restore();
        });
    }

    /**
     * 渲染工厂
     */
    renderFactory(h) {
        let color = h.powered ? CONFIG.colors.factoryHappy : CONFIG.colors.factoryOff;
        if (h.isCritical) color = CONFIG.colors.houseAngry;

        if (h.isCritical) {
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(-25, -25, 50, 50);
        }

        if (h.isAlert) {
            const t = Date.now();
            this.ctx.translate(Math.sin(t / 20) * 2, Math.cos(t / 15) * 2);
        }

        this.ctx.fillStyle = color;
        this.ctx.fillRect(-15, -15, 30, 30);
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(-15, -15);
        this.ctx.lineTo(15, 15);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(15, -15);
        this.ctx.lineTo(-15, 15);
        this.ctx.stroke();
    }

    /**
     * 渲染商业
     */
    renderCommercial(h) {
        let color = h.powered ? CONFIG.colors.commHappy : CONFIG.colors.commOff;
        if (h.isCritical) color = CONFIG.colors.houseAngry;

        if (h.isCritical) {
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 30, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        this.ctx.fillStyle = color;
        this.ctx.beginPath();

        for (let i = 0; i < 6; i++) {
            const a = i * Math.PI / 3;
            this.ctx.lineTo(Math.cos(a) * 18, Math.sin(a) * 18);
        }

        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // 负载指示器
        if (h.powered) {
            const loadPct = ((h.currentLoad || CONFIG.commBaseLoad) - CONFIG.commBaseLoad) / (CONFIG.commPeakLoad - CONFIG.commBaseLoad);
            const barHeight = 24;
            this.ctx.fillStyle = '#001133';
            this.ctx.fillRect(24, -12, 6, barHeight);
            this.ctx.fillStyle = '#00ffff';

            if (loadPct > 0.8 && Math.floor(Date.now() / 100) % 2 === 0) {
                this.ctx.fillStyle = '#fff';
            }

            const fillH = barHeight * Math.max(0.1, loadPct);
            this.ctx.fillRect(24, 12 - fillH, 6, fillH);
            this.ctx.strokeStyle = '#0088ff';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(24, -12, 6, barHeight);
        }
    }

    /**
     * 渲染住宅
     */
    renderHouse(h) {
        let color = h.powered ? CONFIG.colors.houseHappy : CONFIG.colors.houseOff;
        if (h.isCritical) color = CONFIG.colors.houseAngry;

        if (h.isCritical) {
            this.ctx.strokeStyle = '#ff0000';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 25, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        if (h.isAlert) {
            const t = Date.now();
            this.ctx.translate(Math.sin(t / 20 + h.id * 10) * 2, Math.cos(t / 15 + h.id * 10) * 2);
        }

        this.ctx.fillStyle = color;
        this.ctx.beginPath();

        for (let i = 0; i < 6; i++) {
            const ang = (Math.PI * 2 * i) / 6;
            this.ctx.lineTo(Math.cos(ang) * 15, Math.sin(ang) * 15);
        }

        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();

        for (let i = 0; i < 6; i++) {
            const ang = (Math.PI * 2 * i) / 6;
            this.ctx.lineTo(Math.cos(ang) * 8, Math.sin(ang) * 8);
        }

        this.ctx.fill();
    }

    /**
     * 渲染粒子
     */
    renderParticles() {
        const { particles, viewBounds } = this.runtimeState;

        this.ctx.globalCompositeOperation = 'lighter';

        particles.forEach(p => {
            if (!isInView(p.x, p.y, (p.size || 3) * 2 + 60, viewBounds)) return;

            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;

            if (p.type === 'shockwave') {
                this.ctx.strokeStyle = p.color;
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, (1.0 - p.life) * 60, 0, Math.PI * 2);
                this.ctx.stroke();
            } else {
                this.ctx.fillStyle = p.color;
                this.ctx.globalAlpha = p.life;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size || 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });

        this.ctx.globalAlpha = 1;
    }
}