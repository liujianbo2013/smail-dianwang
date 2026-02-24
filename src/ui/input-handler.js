/**
 * 输入处理模块
 * 负责处理鼠标和触摸输入
 */

import { CONFIG } from '../core/config.js';
import { getCanvasCoordinates, getTouchDistance, toWorld, isPositionClear, getEntityAt, getLinkAt, isWindPlacementValid } from '../utils/helpers.js';
import { checkIntersection } from '../utils/geometry.js';
import { SOURCE_VARIANTS } from '../entities/entities.js';

/**
 * 输入处理器
 */
export class InputHandler {
    constructor(canvas, runtimeState) {
        this.canvas = canvas;
        this.runtimeState = runtimeState;

        this.setupEventListeners();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 鼠标事件
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.handleWheel.bind(this));
        this.canvas.addEventListener('contextmenu', this.handleContextMenu.bind(this));

        // 触摸事件
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));

        // 键盘事件
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
    }

    /**
     * 处理鼠标按下
     */
    handleMouseDown(e) {
        if (this.runtimeState.gameOver || this.runtimeState.isPanning) return;

        const c = getCanvasCoordinates(e, this.canvas);

        if (e.button === 0) {
            this.handleLeftClick(c.x, c.y);
        } else if (e.button === 2) {
            this.handleRightClick(c.x, c.y);
        }
    }

    /**
     * 处理鼠标移动
     */
    handleMouseMove(e) {
        const c = getCanvasCoordinates(e, this.canvas);
        this.handleInputMove(c.x, c.y);
    }

    /**
     * 处理鼠标释放
     */
    handleMouseUp(e) {
        if (e.button === 0) {
            this.handleInputEnd();
        }
    }

    /**
     * 处理鼠标滚轮
     */
    handleWheel(e) {
        e.preventDefault();
        const { currentScale } = this.runtimeState;
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        this.runtimeState.currentScale = Math.max(CONFIG.minScale, Math.min(CONFIG.maxScale, currentScale * delta));
    }

    /**
     * 处理右键菜单
     */
    handleContextMenu(e) {
        e.preventDefault();

        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const worldPos = this.getWorldPosition(mouseX, mouseY);
        const entity = getEntityAt(worldPos.x, worldPos.y, 30,
            this.runtimeState.sources,
            this.runtimeState.pylons,
            this.runtimeState.batteries,
            this.runtimeState.houses
        );

        if (entity) {
            // 显示右键菜单（需要从外部实现）
            this.runtimeState.showContextMenu(e.clientX, e.clientY, entity);
        } else if (this.runtimeState.placementMode) {
            this.exitPlacementMode();
        }
    }

    /**
     * 处理触摸开始
     */
    handleTouchStart(e) {
        if (e.touches.length === 2) {
            this.runtimeState.isZooming = true;
            this.runtimeState.touchStartDist = getTouchDistance(e);
            e.preventDefault();
        } else if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.runtimeState.lastTouchX = touch.clientX;
            this.runtimeState.lastTouchY = touch.clientY;

            const c = getCanvasCoordinates(e, this.canvas);
            this.handleLeftClick(c.x, c.y);
        }
    }

    /**
     * 处理触摸移动
     */
    handleTouchMove(e) {
        if (this.runtimeState.isZooming && e.touches.length === 2) {
            const dist = getTouchDistance(e);
            const scaleFactor = dist / this.runtimeState.touchStartDist;
            const { currentScale } = this.runtimeState;
            this.runtimeState.currentScale = Math.max(CONFIG.minScale, Math.min(CONFIG.maxScale, currentScale * scaleFactor));
            this.runtimeState.touchStartDist = dist;
            e.preventDefault();
        } else if (this.runtimeState.isPanning && e.touches.length === 1) {
            const touch = e.touches[0];
            const dx = touch.clientX - this.runtimeState.lastTouchX;
            const dy = touch.clientY - this.runtimeState.lastTouchY;
            this.runtimeState.viewOffsetX += dx;
            this.runtimeState.viewOffsetY += dy;
            this.runtimeState.lastTouchX = touch.clientX;
            this.runtimeState.lastTouchY = touch.clientY;
            e.preventDefault();
        }
    }

    /**
     * 处理触摸结束
     */
    handleTouchEnd(e) {
        if (e.touches.length === 0) {
            this.runtimeState.isZooming = false;
            this.runtimeState.isPanning = false;
            this.handleInputEnd();
        }
    }

    /**
     * 处理键盘按下
     */
    handleKeyDown(e) {
        if (e.key === 'Shift') {
            this.runtimeState.isHighVoltageMode = true;
            if (this.runtimeState.dragStartNode) {
                this.runtimeState.setSystemMsg("高压线模式", "highlight");
            }
        } else if (e.key === 'F11') {
            e.preventDefault();
            this.toggleFullscreen();
        } else if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            this.toggleFullscreen();
        }
    }

    /**
     * 处理键盘释放
     */
    handleKeyUp(e) {
        if (e.key === 'Shift') {
            this.runtimeState.isHighVoltageMode = false;
            if (this.runtimeState.dragStartNode) {
                this.runtimeState.clearSystemMsg();
            }
        }
    }

    /**
     * 处理左键点击
     */
    handleLeftClick(mouseX, mouseY) {
        const wPos = this.getWorldPosition(mouseX, mouseY);

        // 建筑放置模式
        if (this.runtimeState.placementMode) {
            this.placeBuildingAt(wPos.x, wPos.y, this.runtimeState.placementMode);
            return;
        }

        // Shift+左键点击电线升级
        if (this.runtimeState.isHighVoltageMode) {
            const clickedLink = getLinkAt(wPos.x, wPos.y, this.runtimeState.links);
            if (clickedLink && !clickedLink.upgraded) {
                this.upgradeLink(clickedLink);
                return;
            }
        }

        // 检查是否在实体上（开始拉线）
        const hovered = getEntityAt(wPos.x, wPos.y, 30,
            this.runtimeState.sources,
            this.runtimeState.pylons,
            this.runtimeState.batteries,
            this.runtimeState.houses
        );

        if (hovered) {
            this.runtimeState.input.isDown = true;
            this.runtimeState.dragStartNode = hovered;
            this.runtimeState.snapTarget = null;
        }
    }

    /**
     * 处理右键点击
     */
    handleRightClick(mouseX, mouseY) {
        if (this.runtimeState.gameOver) return;

        // 建筑放置模式，右键退出
        if (this.runtimeState.placementMode) {
            this.exitPlacementMode();
            return;
        }

        const wPos = this.getWorldPosition(mouseX, mouseY);

        // 拆除实体
        const entity = getEntityAt(wPos.x, wPos.y, 30,
            this.runtimeState.sources,
            this.runtimeState.pylons,
            this.runtimeState.batteries,
            this.runtimeState.houses
        );

        if (entity && (entity.type === 'pylon' || entity.type === 'battery')) {
            this.deleteEntity(entity);
            return;
        }

        // 拆除线路
        const link = getLinkAt(wPos.x, wPos.y, this.runtimeState.links);
        if (link) {
            this.deleteLink(link);
        }
    }

    /**
     * 处理输入移动
     */
    handleInputMove(mouseX, mouseY) {
        const { input } = this.runtimeState;
        input.x = mouseX;
        input.y = mouseY;

        const wPos = this.getWorldPosition(mouseX, mouseY);
        input.worldX = wPos.x;
        input.worldY = wPos.y;

        // 建筑放置模式
        if (this.runtimeState.placementMode) {
            this.updatePlacementPreview();
            return;
        }

        // 拉线模式
        if (input.isDown && this.runtimeState.dragStartNode) {
            this.updateDragPreview(wPos);
        } else {
            // 悬停提示
            this.updateHoverInfo(wPos);
        }
    }

    /**
     * 处理输入结束
     */
    handleInputEnd() {
        if (this.runtimeState.input.isDown && this.runtimeState.dragStartNode) {
            this.finalizeDrag();
        }

        this.runtimeState.input.isDown = false;
        this.runtimeState.dragStartNode = null;
        this.runtimeState.snapTarget = null;
        this.runtimeState.isIntersecting = false;
        this.runtimeState.clearSystemMsg();
    }

    /**
     * 获取世界坐标
     */
    getWorldPosition(screenX, screenY) {
        const { cx, cy, viewOffsetX, viewOffsetY, currentScale } = this.runtimeState;
        return toWorld(screenX, screenY, cx, cy, viewOffsetX, viewOffsetY, currentScale);
    }

    /**
     * 更新建筑放置预览
     */
    updatePlacementPreview() {
        const { placementMode, input, money, sources, pylons, batteries, houses, width, height, viewOffsetX, viewOffsetY, currentScale } = this.runtimeState;

        let isValid = isPositionClear(input.worldX, input.worldY, 60, sources, pylons, batteries, houses);

        // 检查风力电站位置限制
        if (placementMode === SOURCE_VARIANTS.WIND && CONFIG.windEdgeOnly) {
            isValid = isValid && isWindPlacementValid(input.worldX, input.worldY, width, height, viewOffsetX, viewOffsetY, currentScale);
        }

        let cost = 0;
        let buildingName = '';

        if (placementMode === 'plant' || placementMode === SOURCE_VARIANTS.STANDARD) {
            cost = CONFIG.costPlant;
            buildingName = '电厂';
        } else if (placementMode === SOURCE_VARIANTS.NUCLEAR) {
            cost = CONFIG.costNuclear;
            buildingName = '核电站';
        } else if (placementMode === 'battery') {
            cost = CONFIG.costBattery;
            buildingName = '电池';
        } else if (placementMode === SOURCE_VARIANTS.WIND) {
            cost = CONFIG.costWind;
            buildingName = '风力电站';
        } else if (placementMode === SOURCE_VARIANTS.SOLAR) {
            cost = CONFIG.costSolar;
            buildingName = '太阳能电站';
        } else if (placementMode === SOURCE_VARIANTS.TOWER) {
            cost = 100;
            buildingName = '电塔';
        } else if (placementMode === SOURCE_VARIANTS.REPAIR) {
            cost = CONFIG.costRepairStation;
            buildingName = '维修站';
        } else if (placementMode === SOURCE_VARIANTS.DISPATCH) {
            cost = CONFIG.costDispatchCenter;
            buildingName = '调度中心';
        } else if (placementMode === SOURCE_VARIANTS.ENERGY_STORAGE) {
            cost = CONFIG.costEnergyStorage;
            buildingName = '储能站';
        }

        if (!isValid) {
            this.runtimeState.setSystemMsg(`此处无法放置${buildingName}`, "warning");
        } else if (money < cost) {
            this.runtimeState.setSystemMsg(`资金不足 (需要$${cost})`, "warning");
        } else {
            this.runtimeState.setSystemMsg(`左键放置${buildingName} ($${cost})`, "highlight");
        }
    }

    /**
     * 更新拖拽预览
     */
    updateDragPreview(wPos) {
        const { dragStartNode, input, links, money, isHighVoltageMode } = this.runtimeState;

        const entity = getEntityAt(wPos.x, wPos.y, CONFIG.snapDistance,
            this.runtimeState.sources,
            this.runtimeState.pylons,
            this.runtimeState.batteries,
            this.runtimeState.houses
        );

        this.runtimeState.snapTarget = (entity && entity !== dragStartNode) ? entity : null;
        this.runtimeState.validBuildPos = !this.runtimeState.snapTarget ?
            isPositionClear(wPos.x, wPos.y, CONFIG.minEntityDist,
                this.runtimeState.sources,
                this.runtimeState.pylons,
                this.runtimeState.batteries,
                this.runtimeState.houses
            ) : true;

        const targetX = this.runtimeState.snapTarget ? this.runtimeState.snapTarget.x : wPos.x;
        const targetY = this.runtimeState.snapTarget ? this.runtimeState.snapTarget.y : wPos.y;
        this.runtimeState.isIntersecting = this.checkLineIntersection(dragStartNode, { x: targetX, y: targetY }, links, dragStartNode, this.runtimeState.snapTarget);

        const dist = Math.hypot(targetX - dragStartNode.x, targetY - dragStartNode.y);
        const isValidLen = dist <= CONFIG.maxWireLength && dist > 10;

        if (isValidLen) {
            const isHV = isHighVoltageMode;
            const costMult = isHV ? CONFIG.costUpgradeMult : 1;
            const wireCost = Math.floor(dist * CONFIG.costWirePerUnit * costMult);
            let estCost = wireCost + (!this.runtimeState.snapTarget && this.runtimeState.validBuildPos ? CONFIG.costPylon : 0);
            let label = (!this.runtimeState.snapTarget && this.runtimeState.validBuildPos) ? "建造电塔" : "连接";
            if (isHV) label = "高压" + label;

            if (this.runtimeState.isIntersecting) {
                this.runtimeState.setSystemMsg("错误: 线路交叉", "warning");
            } else if (money < estCost) {
                this.runtimeState.setSystemMsg(`成本: $${estCost} (资金不足)`, "warning");
            } else {
                this.runtimeState.setSystemMsg(`${label} 成本: $${estCost}`, "highlight");
            }
        } else {
            this.runtimeState.setSystemMsg("距离无效", "warning");
        }
    }

    /**
     * 更新悬停信息
     */
    updateHoverInfo(wPos) {
        const { sources, pylons, batteries, houses, links, isHighVoltageMode } = this.runtimeState;

        this.runtimeState.hoveredEntity = getEntityAt(wPos.x, wPos.y, 30, sources, pylons, batteries, houses);
        this.runtimeState.hoveredLink = !this.runtimeState.hoveredEntity ? getLinkAt(wPos.x, wPos.y, links) : null;

        if (this.runtimeState.hoveredEntity) {
            if (this.runtimeState.hoveredEntity.type === 'pylon' || this.runtimeState.hoveredEntity.type === 'battery') {
                this.runtimeState.setSystemMsg("右键拆除", "normal");
            } else {
                this.runtimeState.setSystemMsg("左键拖动建造电线", "normal");
            }
        } else if (this.runtimeState.hoveredLink) {
            if (isHighVoltageMode) {
                if (this.runtimeState.hoveredLink.upgraded) {
                    this.runtimeState.setSystemMsg("已是高压线", "normal");
                } else {
                    const dist = Math.hypot(
                        this.runtimeState.hoveredLink.from.x - this.runtimeState.hoveredLink.to.x,
                        this.runtimeState.hoveredLink.from.y - this.runtimeState.hoveredLink.to.y
                    );
                    const cost = Math.floor(dist * CONFIG.costWirePerUnit * CONFIG.costUpgradeMult);
                    this.runtimeState.setSystemMsg(`Shift+左键升级 ($${cost})`, "highlight");
                }
            } else {
                this.runtimeState.setSystemMsg("右键删除电线", "warning");
            }
        } else {
            this.runtimeState.clearSystemMsg();
        }
    }

    /**
     * 完成拖拽
     */
    finalizeDrag() {
        const { dragStartNode, input, snapTarget, validBuildPos, isIntersecting, isHighVoltageMode, money, links } = this.runtimeState;

        const targetPos = snapTarget ? snapTarget : { x: input.worldX, y: input.worldY };
        const dist = Math.hypot(targetPos.x - dragStartNode.x, targetPos.y - dragStartNode.y);
        const isValidLength = dist <= CONFIG.maxWireLength && dist > 10;

        if (isValidLength && !isIntersecting) {
            const isHV = isHighVoltageMode;
            const costMult = isHV ? CONFIG.costUpgradeMult : 1;
            const wireCost = Math.floor(dist * CONFIG.costWirePerUnit * costMult);

            if (snapTarget) {
                if (money >= wireCost) {
                    this.tryConnect(dragStartNode, snapTarget, wireCost, isHV);
                } else {
                    this.createShockwave(input.worldX, input.worldY, '#ff3333');
                    this.runtimeState.setSystemMsg("资金不足", "warning", true);
                }
            } else if (validBuildPos) {
                const totalCost = wireCost + CONFIG.costPylon;
                if (money >= totalCost) {
                    this.tryBuildPylon(input.worldX, input.worldY, dragStartNode, totalCost, isHV);
                } else {
                    this.createShockwave(input.worldX, input.worldY, '#ff3333');
                    this.runtimeState.setSystemMsg("资金不足", "warning", true);
                }
            } else {
                this.createShockwave(input.worldX, input.worldY, '#ff0000');
                this.runtimeState.setSystemMsg("位置错误", "warning", true);
            }
        } else {
            this.createShockwave(input.worldX, input.worldY, '#ff0000');
            this.runtimeState.setSystemMsg("长度错误", "warning", true);
        }
    }

    /**
     * 尝试连接
     */
    tryConnect(nodeA, nodeB, cost, isHV = false) {
        if (this.runtimeState.links.some(l =>
            (l.from === nodeA && l.to === nodeB) || (l.from === nodeB && l.to === nodeA)
        )) {
            this.runtimeState.setSystemMsg("已经连接", "warning", true);
            return;
        }

        this.runtimeState.money -= cost;

        const distance = Math.hypot(nodeB.x - nodeA.x, nodeB.y - nodeA.y);
        const maxLoad = isHV ? CONFIG.upgradedWireLoad : CONFIG.baseWireLoad;

        this.runtimeState.links.push({
            from: nodeA,
            to: nodeB,
            active: false,
            load: 0,
            heat: 0,
            spawnProgress: 0,
            maxLoad: maxLoad,
            upgraded: isHV,
            distance: distance,
            loss: 0,
            isHighVoltage: isHV,
            lastOverloadTime: 0,
            isDamaged: false,
            cascadeCooldown: 0
        });

        if (isHV) {
            this.createExplosion((nodeA.x + nodeB.x) / 2, (nodeA.y + nodeB.y) / 2, CONFIG.colors.wireUpgraded, 15);
        }

        // updatePowerGrid() - 需要从外部调用
        this.runtimeState.setSystemMsg(`已连接 (-$${cost})`, "normal", true);
    }

    /**
     * 尝试建造电塔
     */
    tryBuildPylon(x, y, parentNode, cost, isHV = false) {
        this.runtimeState.money -= cost;

        const newPylon = {
            x: x,
            y: y,
            type: 'pylon',
            powered: false,
            id: Math.random(),
            spawnScale: 0
        };

        this.runtimeState.pylons.push(newPylon);

        const distance = Math.hypot(x - parentNode.x, y - parentNode.y);
        const maxLoad = isHV ? CONFIG.upgradedWireLoad : CONFIG.baseWireLoad;

        this.runtimeState.links.push({
            from: parentNode,
            to: newPylon,
            active: false,
            load: 0,
            heat: 0,
            spawnProgress: 0,
            maxLoad: maxLoad,
            upgraded: isHV,
            distance: distance,
            loss: 0,
            isHighVoltage: isHV,
            lastOverloadTime: 0,
            isDamaged: false,
            cascadeCooldown: 0
        });

        this.createExplosion(x, y, isHV ? CONFIG.colors.wireUpgraded : CONFIG.colors.powerOn, 10);
        // updatePowerGrid() - 需要从外部调用
        this.runtimeState.setSystemMsg(`已建造 (-$${cost})`, "normal", true);
    }

    /**
     * 升级线路
     */
    upgradeLink(link) {
        const dist = Math.hypot(link.from.x - link.to.x, link.from.y - link.to.y);
        const cost = Math.floor(dist * CONFIG.costWirePerUnit * CONFIG.costUpgradeMult);

        if (this.runtimeState.money >= cost) {
            this.runtimeState.money -= cost;
            link.upgraded = true;
            link.maxLoad = CONFIG.upgradedWireLoad;
            this.createExplosion((link.from.x + link.to.x) / 2, (link.from.y + link.to.y) / 2, CONFIG.colors.wireUpgraded, 15);
            this.runtimeState.setSystemMsg(`电线已升级 (-$${cost})`, "success", true);
            // updatePowerGrid() - 需要从外部调用
        } else {
            this.createShockwave(this.runtimeState.input.worldX, this.runtimeState.input.worldY, '#ff3333');
            this.runtimeState.setSystemMsg("资金不足", "warning", true);
        }
    }

    /**
     * 删除实体
     */
    deleteEntity(entity) {
        // 实现删除逻辑
        this.runtimeState.setSystemMsg("已删除实体", "info", true);
    }

    /**
     * 删除线路
     */
    deleteLink(link) {
        const dist = Math.hypot(link.from.x - link.to.x, link.from.y - link.to.y);
        const costMult = link.upgraded ? CONFIG.costUpgradeMult : 1;
        const refund = Math.floor(Math.floor(dist * CONFIG.costWirePerUnit * costMult) * CONFIG.refundRate);

        this.runtimeState.money += refund;
        this.runtimeState.links = this.runtimeState.links.filter(l => l !== link);
        // updatePowerGrid() - 需要从外部调用
        this.runtimeState.setSystemMsg(`返还 +$${refund}`, "success", true);
    }

    /**
     * 放置建筑
     */
    placeBuildingAt(worldX, worldY, type) {
        const { sources, pylons, batteries, houses, money, gameState } = this.runtimeState;

        // 检查位置是否空闲
        let buffer = type === 'tower' ? 30 : 60;
        if (!isPositionClear(worldX, worldY, buffer, sources, pylons, batteries, houses)) {
            this.createShockwave(worldX, worldY, '#ff3333');
            this.runtimeState.setSystemMsg("位置无效", "warning", true);
            return;
        }

        // 检查风力电站位置限制
        if (type === SOURCE_VARIANTS.WIND && CONFIG.windEdgeOnly) {
            if (!isWindPlacementValid(worldX, worldY, this.runtimeState.width, this.runtimeState.height,
                this.runtimeState.viewOffsetX, this.runtimeState.viewOffsetY, this.runtimeState.currentScale)) {
                this.createShockwave(worldX, worldY, '#ff3333');
                this.runtimeState.setSystemMsg("风力电站只能放置在地图边缘区域", "warning", true);
                return;
            }
        }

        // 计算成本
        let cost = 0;
        let capacity = 0;
        let color = '#fff';
        let name = '建筑';
        let upkeep = 0;
        let variant = SOURCE_VARIANTS.STANDARD;

        if (type === 'plant' || type === SOURCE_VARIANTS.STANDARD) {
            cost = CONFIG.costPlant;
            capacity = CONFIG.plantCapacity;
            color = '#fff';
            name = '电厂';
            upkeep = CONFIG.upkeepPerPlant;
            variant = SOURCE_VARIANTS.STANDARD;
        } else if (type === SOURCE_VARIANTS.NUCLEAR) {
            cost = CONFIG.costNuclear;
            capacity = CONFIG.nuclearCapacity;
            color = '#00ff66';
            name = '核电站';
            upkeep = CONFIG.nuclearUpkeep;
            variant = SOURCE_VARIANTS.NUCLEAR;
        } else if (type === 'battery') {
            cost = CONFIG.costBattery;
            color = '#00ff00';
            name = '电池';
        } else if (type === SOURCE_VARIANTS.WIND) {
            cost = CONFIG.costWind;
            capacity = 10 + Math.random() * 5;
            color = '#88ffff';
            name = '风力电站';
            variant = SOURCE_VARIANTS.WIND;
        } else if (type === SOURCE_VARIANTS.SOLAR) {
            cost = CONFIG.costSolar;
            capacity = 8 + Math.random() * 4;
            color = '#ffff88';
            name = '太阳能电站';
            variant = SOURCE_VARIANTS.SOLAR;
        } else if (type === SOURCE_VARIANTS.TOWER) {
            cost = 100;
            color = '#ff88ff';
            name = '电塔';
            variant = SOURCE_VARIANTS.TOWER;
        } else if (type === SOURCE_VARIANTS.REPAIR) {
            cost = CONFIG.costRepairStation;
            name = '维修站';
            variant = SOURCE_VARIANTS.REPAIR;
        } else if (type === SOURCE_VARIANTS.DISPATCH) {
            cost = CONFIG.costDispatchCenter;
            name = '调度中心';
            variant = SOURCE_VARIANTS.DISPATCH;
        } else if (type === SOURCE_VARIANTS.ENERGY_STORAGE) {
            cost = CONFIG.costEnergyStorage;
            name = '储能站';
            variant = SOURCE_VARIANTS.ENERGY_STORAGE;
        }

        // 检查资金
        if (money < cost) {
            this.createShockwave(worldX, worldY, '#ff3333');
            this.runtimeState.setSystemMsg("资金不足", "warning", true);
            return;
        }

        // 扣除资金
        this.runtimeState.money -= cost;

        // 创建实体
        if (type === 'battery') {
            // 创建电池
            this.runtimeState.batteries.push({
                x: worldX,
                y: worldY,
                type: 'battery',
                id: Math.random(),
                energy: 0,
                maxEnergy: CONFIG.batteryCapacity,
                spawnScale: 0,
                powered: false,
                currentOp: 'idle',
                targetLoad: 0
            });
            this.runtimeState.setSystemMsg(`电池已建造 (-$${cost})`, "success", true);
            this.createExplosion(worldX, worldY, '#00ff00', 15);
        } else {
            // 创建电源/建筑
            const towerId = Math.random();
            let sourceObj = {
                x: worldX,
                y: worldY,
                radius: type === SOURCE_VARIANTS.TOWER ? 10 : 25,
                type: type === SOURCE_VARIANTS.TOWER ? 'tower' : 'source',
                id: towerId,
                load: 0,
                heat: 0,
                capacity: capacity,
                spawnScale: 0,
                displayLoad: 0,
                rotation: 0,
                variant: variant,
                upkeep: upkeep,
                builtTime: gameState.gameTime
            };

            // 添加变体特定属性
            if (variant === SOURCE_VARIANTS.WIND) {
                sourceObj.windSpeedMultiplier = 1.0;
                sourceObj.lastWindEvent = 0;
            } else if (variant === SOURCE_VARIANTS.SOLAR) {
                sourceObj.hasStorageUpgrade = false;
            } else if (variant === SOURCE_VARIANTS.NUCLEAR) {
                sourceObj.coolingBatteries = 0;
                sourceObj.coolingSatisfied = false;
                sourceObj.failureChance = CONFIG.nuclearFailureChance;
                sourceObj.needsRepair = false;
                sourceObj.maintenanceMode = false;
                sourceObj.maintenanceEndTime = 0;
            } else if (variant === SOURCE_VARIANTS.DISPATCH) {
                sourceObj.priorityMode = 'balanced';
            } else if (variant === SOURCE_VARIANTS.ENERGY_STORAGE) {
                sourceObj.capacityMultiplier = CONFIG.energyStorageCapacityMultiplier;
                sourceObj.chargeRateMultiplier = CONFIG.energyStorageChargeRateMultiplier;
            } else if (variant === SOURCE_VARIANTS.REPAIR) {
                sourceObj.maintenanceReduction = CONFIG.repairStationMaintenanceReduction;
            }

            this.runtimeState.sources.push(sourceObj);

            // 如果是电塔，也添加到 pylons
            if (type === SOURCE_VARIANTS.TOWER) {
                this.runtimeState.pylons.push({
                    x: worldX,
                    y: worldY,
                    type: 'pylon',
                    id: towerId,
                    spawnScale: 0,
                    powered: true
                });
            }

            this.runtimeState.setSystemMsg(`${name}已建造 (-$${cost})`, "success", true);
            this.createExplosion(worldX, worldY, color, type === SOURCE_VARIANTS.TOWER ? 10 : 20);
        }
    }

    /**
     * 退出放置模式
     */
    exitPlacementMode() {
        this.runtimeState.placementMode = null;
        this.runtimeState.clearSystemMsg();
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

    /**
     * 创建冲击波效果
     */
    createShockwave(x, y, color) {
        this.runtimeState.particles.push({
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            life: 1.0,
            decay: 0.05,
            color: color,
            size: 0,
            type: 'shockwave'
        });
    }

    /**
     * 切换全屏
     */
    toggleFullscreen() {
        // 实现全屏切换
        this.runtimeState.setSystemMsg("切换全屏", "info", true);
    }

    /**
     * 检查线路交叉
     */
    checkLineIntersection(startPos, endPos, links, dragStartNode, snapTarget) {
        for (let l of links) {
            if (l.from === dragStartNode || l.to === dragStartNode || l.from === snapTarget || l.to === snapTarget) continue;

            // 计算两条线段的交点
            const det = (endPos.x - startPos.x) * (l.to.y - l.from.y) - (l.to.x - l.from.x) * (endPos.y - startPos.y);
            if (det === 0) continue;
            const lambda = ((l.to.y - l.from.y) * (l.to.x - startPos.x) + (l.from.x - l.to.x) * (l.to.y - startPos.y)) / det;
            const gamma = ((startPos.y - endPos.y) * (l.to.x - startPos.x) + (endPos.x - startPos.x) * (l.to.y - startPos.y)) / det;
            if ((0 < lambda && lambda < 1) && (0 < gamma && gamma < 1)) return true;
        }
        return false;
    }
}