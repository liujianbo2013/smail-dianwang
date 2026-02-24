
        const canvas = document.getElementById('gameCanvas');
        const container = document.getElementById('game-container');
        const ctx = canvas.getContext('2d', { alpha: false }); 
        const sysMsgEl = document.getElementById('system-msg');
        const alarmOverlay = document.getElementById('alarm-overlay');
        const helpTip = document.getElementById('help-tip');
         
        // Replay Canvas & UI
        const replayCanvas = document.getElementById('replayCanvas');
        const replayCtx = replayCanvas.getContext('2d');
        const replaySlider = document.getElementById('replay-slider');
 
        // Prevent Context Menu on Canvas
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();

            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const worldPos = toWorld(mouseX, mouseY);
            const entity = getEntityAt(worldPos.x, worldPos.y);

            if (entity) {
                showContextMenu(e.clientX, e.clientY, entity);
            } else if (placementMode) {
                exitPlacementMode();
            }
        });
 
        // --- Game Constants & Config ---
        const CONFIG = {
            initialMoney: 200, 
            baseSubsidy: 25,     
            incomePerHouse: 1,  
             
            // Factory Settings (FIXED INTERVALS)
            factoryUnlockPop: 30, 
            factorySpawnRate: 90000, // 1 minute 30 seconds
            factoryLoad: 5,
            incomePerFactory: 8,
 
            // Commercial Settings (FIXED INTERVALS)
            commUnlockPop: 60, 
            commSpawnRate: 45000, // 45 seconds (Half of 90s)
            commBaseLoad: 2,
            commPeakLoad: 3, 
            incomePerComm: 5,
 
            // Battery Settings
            costBattery: 800,
            batteryCapacity: 500,
            batteryChargeRate: 4.0, 
            batteryDischargeRate: 6.0,
 
            upkeepPerPlant: 10, 
            economyTickRate: 1000, 
            refundRate: 0.1, 
             
            costPylon: 10,            
            costPlant: 1500,
             
            // Nuclear Settings
            costNuclear: 6000,
            nuclearCapacity: 60,
            nuclearUpkeep: 50,
            nuclearFailureChance: 0.05, // 5% per minute
            nuclearDecayRate: 5, // 5 capacity per hour
            nuclearCoolingBatteryCount: 2, // Required batteries for cooling
            nuclearCoolingFailureRate: 0.15, // 15% per minute if cooling insufficient
            nuclearMaintenanceUpgradeCost: 3000, // Cost for maintenance upgrade
            nuclearMaintenanceDuration: 3600000, // 1 hour in ms

            // Wind Power Settings
            costWind: 2000,
            windCapacity: 12.5, // Average of 10-15
            windUpkeep: 0,
            windSpeedEventChance: 0.10, // 10% per minute
            windSpeedBoost: 0.80, // +80% efficiency
            windSpeedDrop: 0.50, // -50% efficiency
            windEdgeOnly: true, // Can only place at map edges
            windEdgeDistance: 200, // Distance from edge to allow placement

            // Solar Power Settings
            costSolar: 2500,
            solarCapacity: 10, // Average of 8-12
            solarUpkeep: 0,
            solarStorageUpgradeCost: 1500, // Cost for storage upgrade
            solarStorageEfficiency: 0.20, // 20% efficiency at night with upgrade
            solarDayStart: 6, // 6 AM
            solarDayEnd: 18, // 6 PM
            solarDawnDuration: 1, // 1 hour transition
            solarDuskDuration: 1, // 1 hour transition

            // Wire Loss Settings
            wireLossThreshold150: 150,
            wireLossThreshold200: 200,
            wireLossThreshold300: 300,
            wireLoss150: 0.10, // 10% loss for 150-200
            wireLoss200: 0.30, // 30% loss for 200-300
            wireLoss300: 0.50, // 50% loss for >300
            highVoltageTowerSpacing: 200, // Require tower every 200 units

            // Event Settings
            wireCascadeChance: 0.20, // 20% chance of cascade failure
            lowDemandEventChance: 0.30, // 30% chance when conditions met
            maintenanceEventChance: 0.05, // 5% per minute
            disasterEventChance: 0.01, // 1% per minute
            disasterPopThreshold: 300, // Population threshold for disasters
            cleanEnergySubsidyThreshold: 0.50, // 50% clean energy ratio

            // Difficulty Settings
            difficultyBeginnerMoneyMult: 1.5,
            difficultyBeginnerPeakFreqMult: 0.5,
            difficultyBeginnerFailureMult: 0.5,
            difficultyExpertMoneyMult: 0.7,
            difficultyExpertPeakFreqMult: 1.5,
            difficultyExpertFailureMult: 1.5,
            difficultyExpertDepreciationRate: 0.10, // 10% per hour
            difficultyInflationThreshold: 500, // Population threshold for inflation
            difficultyInflationRate: 0.0001, // Increase per frame

            // New Buildings
            costRepairStation: 2000,
            repairStationUnlockPop: 150,
            repairStationMaintenanceReduction: 0.20,

            costDispatchCenter: 3500,
            dispatchCenterUnlockPop: 250,

            costEnergyStorage: 4000,
            energyStorageUnlockBatteryCount: 8,
            energyStorageCapacityMultiplier: 5,
            energyStorageChargeRateMultiplier: 1.5,

            // Achievement Thresholds
            achievementPowerPioneerPop: 100,
            achievementPowerPioneerReward: 1000,
            achievementCleanEnergyRatio: 0.70,
            achievementCleanEnergyDiscount: 0.10,
            achievementCrisisExpertCount: 5,
            achievementCrisisExpertDiscount: 0.20,

            // Tech Tree
            techSmartGridCost: 100000,
            techSmartGridOverloadReduction: 0.15,
            techNuclearTechRequirement: 5,
            techNuclearTechFailureRate: 0.02,
             
            costWirePerUnit: 0.1,
            costUpgradeMult: 6.0, 
            baseWireLoad: 5,
            upgradedWireLoad: 15,
             
            maxWireLength: 300, 
            snapDistance: 40,   
            minEntityDist: 60,
             
            plantCapacity: 15,        
            overheatSpeed: 0.05, 
            maxHeat: 100,
            
            // Plant Upgrade Settings
            plantLevel2Capacity: 30,
            plantLevel3Capacity: 45,
            plantLevel2Cost: 3000,
            plantLevel3Cost: 6000,
            plantLevel2Upkeep: 20,
            plantLevel3Upkeep: 40,
             
            initialScale: 1.2,    
            minScale: 0.1,
            maxScale: 3.0,
            viewExpansionRate: 0.003, 
            spawnRate: 8000, // Initial House Spawn Rate
            houseMaxPatience: 3500, 
            maxAngryHouses: 5, // Updated from 1 to 5
            
            // Game Phase Settings
            earlyGamePop: 100,
            midGamePop: 300,
            
            // Peak Hour Settings
            peakHourInterval: 300000, // 5 minutes
            peakHourDuration: 30000, // 30 seconds
            peakHourMultiplier: 1.5, // 50% increase
            
            // Subsidy Settings
            subsidyThreshold: 500, // Below this, double subsidy
            subsidyCancelPop: 200, // Above this, no subsidy
            
            // Maintenance Scaling
            maintenanceScaleThreshold: 5, // After 5 plants, increase cost
            maintenanceScaleMultiplier: 1.5, // 50% increase
            
            colors: {
                bg: '#020205',
                grid: '#0d0d1a',
                powerOn: '#00ffff',
                powerOff: '#333344',
                powerSource: '#ffffff',
                nuclearSource: '#00ff66',
                houseAngry: '#ff2a2a',
                houseHappy: '#00ffaa',
                houseOff: '#004433', 
                 
                factory: '#ff8800', 
                factoryHappy: '#ffe600',
                factoryOff: '#442200', 
                 
                comm: '#0088ff',
                commHappy: '#00ccff',
                commOff: '#002244', 
                 
                battery: '#00ff00',
                batteryDraining: '#ffaa00',
                wire: '#1a1a26',
                wireUpgraded: '#d000ff', 
                wireUpgradedGlow: '#e055ff',
                wireOverload: '#ffaa00',
                wireDanger: '#ff0000',
                dragLineValid: '#00ffff',
                dragLineInvalid: '#ff3333',
                deleteHighlight: '#ff3333',
                upgradeHighlight: '#d000ff',
                nuclearHighlight: '#00ff66',
                plantOverload: '#ff0000',
                refundText: '#00ff88',
                
                // New facility colors
                windSource: '#88ffff',
                solarSource: '#ffff88',
                tower: '#ff88ff',
                datacenter: '#ff00ff',
                hospital: '#ff6666'
            }
        };
 
        // --- State ---
        let width, height; 
        let cx, cy; 
        let viewOffsetX = 0, viewOffsetY = 0;
        let lastTime = 0;
        let gameOver = false;
        let money = CONFIG.initialMoney;
        let currentNetIncome = 0;
        let timeScale = 1.0;
        let gameTime = 0; 
         
        let input = { x: 0, y: 0, worldX: 0, worldY: 0, isDown: false, isRightDown: false };
        let dragStartNode = null; 
        let snapTarget = null; 
        let validBuildPos = true; 
        let isIntersecting = false; 
        let hoveredLink = null; 
        let hoveredEntity = null;
        let currentScale = CONFIG.initialScale;
        let totalSpawns = 0;
        let isCriticalState = false;
        let isHighVoltageMode = false; // Shift键高压模式
 
        // 建筑放置相关
        let placementMode = null; // 当前放置模式: null | 'plant' | 'nuclear' | 'battery' | 'wind' | 'solar' | 'tower'
        let draggedType = null;   // 仅用于旧的拖拽功能（保留用于兼容）
        let dragPreview = null;
 
        // 触摸手势支持
        let touchStartDist = 0;
        let lastTouchX = 0, lastTouchY = 0;
        let isPanning = false;
        let isZooming = false;

        // 长按批量选择
        let longPressTimer = null;
        let longPressDuration = 800; // 800ms 长按触发
        let longPressStartPos = null;
        let isLongPressActive = false;
        let selectedEntities = []; // 批量选中的实体
 
        let sources = [];
        let pylons = [];
        let houses = []; 
        let batteries = []; 
        let particles = [];
        let links = []; 
 
        // Replay History
        let gameHistory = [];
        let lastSnapshotTime = 0;
 
        let lastSpawnGameTime = 0;
        let lastFactorySpawnTime = 0;
        let lastCommSpawnTime = 0;
        let lastIncomeGameTime = 0;
        
        // New gameplay features
        let lastPeakHourTime = 0;
        let isPeakHour = false;
        let nuclearCheckTime = 0;
        let nuclearDecayCheckTime = 0;
        let angryGracePeriods = new Map(); // Track grace periods for angry houses

        // 游戏状态系统
        let gameState = {
            // 难度设置
            mode: 'normal', // normal, beginner, expert
            difficultyMultiplier: 1.0,
            
            // 游戏时间系统（24小时循环）
            gameDate: 0, // 0-23 小时循环
            gameDays: 0, // 游戏天数
            
            // 活跃事件
            activeEvents: [], // 当前活跃的事件列表
            
            // 成就系统
            achievements: {
                powerPioneer: { unlocked: false, progress: 0, target: 100 },
                cleanEnergyMaster: { unlocked: false, progress: 0, target: 70 },
                crisisExpert: { unlocked: false, progress: 0, target: 5 }
            },
            
            // 科技树解锁
            unlockedTech: [],
            
            // 记录统计
            records: {
                maxPopulation: 0,
                longestUptime: 0,
                currentUptime: 0,
                disasterCount: 0,
                totalEarnings: 0
            },
            
            // 通货膨胀率
            inflationRate: 0, // 0-0.05
            
            // 故障时间追踪
            lastFailureTime: 0,
            
            // 电网健康度
            gridHealth: 100, // 0-100%
            
            // 一键检测高亮
            highlightedIssues: []
        };

        let msgState = { text: "系统就绪 - 拖拽建筑到地图上", type: "normal", priority: 0, eventTimer: 0 };
        let lastRenderedMsg = "";
 
        // UI Elements
        const moneyEl = document.getElementById('money-display');
        const incomeEl = document.getElementById('income-display');
        const coverageEl = document.getElementById('coverage-display');
        const scaleEl = document.getElementById('scale-display');
        const gameOverScreen = document.getElementById('game-over');
        const gameOverReason = document.getElementById('game-over-reason');
        const speedBtns = document.querySelectorAll('.speed-btn');
 
        // --- 视图控制函数 ---
        function zoomIn() {
            currentScale = Math.min(currentScale * 1.2, CONFIG.maxScale);
            showHelpTip("放大视图");
        }
 
        function zoomOut() {
            currentScale = Math.max(currentScale / 1.2, CONFIG.minScale);
            showHelpTip("缩小视图");
        }
 
        function resetView() {
            currentScale = CONFIG.initialScale;
            viewOffsetX = 0;
            viewOffsetY = 0;
            showHelpTip("视图已重置");
        }
 
        function showHelpTip(text, duration = 2000) {
            helpTip.textContent = text;
            helpTip.classList.add('show');
            setTimeout(() => helpTip.classList.remove('show'), duration);
        }
 
        // --- 全屏模式功能 ---
        let isFullscreen = false;
 
        function toggleFullscreen() {
            if (!document.fullscreenElement && !document.webkitFullscreenElement && 
                !document.mozFullScreenElement && !document.msFullscreenElement) {
                // 进入全屏
                enterFullscreen();
            } else {
                // 退出全屏
                exitFullscreen();
            }
        }
 
        function enterFullscreen() {
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            } else if (elem.mozRequestFullScreen) {
                elem.mozRequestFullScreen();
            } else if (elem.msRequestFullscreen) {
                elem.msRequestFullscreen();
            }
        }
 
        function exitFullscreen() {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
 
        function updateFullscreenButton() {
            const btn = document.getElementById('fullscreen-btn');
            if (isFullscreen) {
                btn.innerHTML = '◱';
                btn.title = '退出全屏';
                btn.classList.add('active');
            } else {
                btn.innerHTML = '⛶';
                btn.title = '全屏';
                btn.classList.remove('active');
            }
        }
 
        // 监听全屏变化事件
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);
 
        function handleFullscreenChange() {
            isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement || 
                             document.mozFullScreenElement || document.msFullscreenElement);
            updateFullscreenButton();
            resize();
            if (isFullscreen) {
                showHelpTip("已进入全屏模式 (按 ESC 退出)");
            } else {
                showHelpTip("已退出全屏模式");
            }
        }
 
        // 进入建筑放置模式
        function enterPlacementMode(type) {
            placementMode = type;
            // 更新按钮状态
            document.querySelectorAll('.building-btn').forEach(btn => {
                if (btn.getAttribute('data-type') === type) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
             
            // 显示提示信息
            let buildingName = '';
            let cost = 0;
            if (type === 'plant') { buildingName = '电厂'; cost = CONFIG.costPlant; }
            else if (type === 'nuclear') { buildingName = '核电站'; cost = CONFIG.costNuclear; }
            else if (type === 'battery') { buildingName = '电池'; cost = CONFIG.costBattery; }
            else if (type === 'wind') { buildingName = '风力电站'; cost = 2000; }
            else if (type === 'solar') { buildingName = '太阳能电站'; cost = 2500; }
            else if (type === 'tower') { buildingName = '电塔'; cost = 100; }
             
            setSystemMsg(`放置${buildingName}模式 - 左键确认，右键取消`, "highlight");
            showHelpTip(`点击地图放置${buildingName} ($${cost})`);
        }
 
        // 退出建筑放置模式
        function exitPlacementMode() {
            placementMode = null;
            document.querySelectorAll('.building-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            clearSystemMsg();
            showHelpTip("已切换到电线模式");
        }
 
        // --- View Culling Helpers ---
        let viewBounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
         
        function updateViewBounds() {
            const margin = 100; 
            viewBounds.minX = (0 - cx - viewOffsetX) / currentScale - margin;
            viewBounds.maxX = (width - cx - viewOffsetX) / currentScale + margin;
            viewBounds.minY = (0 - cy - viewOffsetY) / currentScale - margin;
            viewBounds.maxY = (height - cy - viewOffsetY) / currentScale + margin;
        }
 
        function isInView(x, y, radius = 0) {
            return x + radius > viewBounds.minX && 
                   x - radius < viewBounds.maxX && 
                   y + radius > viewBounds.minY && 
                   y - radius < viewBounds.maxY;
        }
 
        function isLinkInView(l) {
            const minX = Math.min(l.from.x, l.to.x);
            const maxX = Math.max(l.from.x, l.to.x);
            const minY = Math.min(l.from.y, l.to.y);
            const maxY = Math.max(l.from.y, l.to.y);
            return maxX > viewBounds.minX && 
                   minX < viewBounds.maxX && 
                   maxY > viewBounds.minY && 
                   minY < viewBounds.maxY;
        }
 
        // --- Replay System ---
        function takeSnapshot() {
            const frame = {
                entities: [],
                links: [],
                scale: currentScale
            };
             
            const allEntities = [...sources, ...pylons, ...houses, ...batteries];
            allEntities.forEach(e => {
                let colorCode = 0;
                if (e.variant === 'nuclear') colorCode = 7;
                else if (e.type === 'source') colorCode = 3;
                else if (e.type === 'factory') colorCode = 4;
                else if (e.type === 'commercial') colorCode = 5;
                else if (e.type === 'battery') colorCode = 6;
                else if (e.isCritical) colorCode = 2;
                else if (e.powered) colorCode = 1;
                else colorCode = 0;
                 
                frame.entities.push({
                    x: Math.round(e.x),
                    y: Math.round(e.y),
                    t: e.type.charAt(0),
                    c: colorCode
                });
            });
 
            links.forEach(l => {
                frame.links.push({
                    x1: Math.round(l.from.x),
                    y1: Math.round(l.from.y),
                    x2: Math.round(l.to.x),
                    y2: Math.round(l.to.y),
                    u: l.upgraded ? 1 : 0
                });
            });
             
            gameHistory.push(frame);
        }
 
        function renderReplayFrame(frameIndex) {
            if (gameHistory.length === 0) return;
            const idx = Math.min(Math.max(0, frameIndex), gameHistory.length - 1);
            const frame = gameHistory[idx];
             
            const rctx = replayCtx;
            const rw = replayCanvas.width;
            const rh = replayCanvas.height;
             
            rctx.fillStyle = '#000';
            rctx.fillRect(0, 0, rw, rh);
             
            const thumbScale = (rw / width) * frame.scale * 0.8;
             
            rctx.save();
            rctx.translate(rw/2, rh/2);
            rctx.scale(thumbScale, thumbScale);
             
            // Draw Links
            rctx.lineWidth = 10 / frame.scale; 
            frame.links.forEach(l => {
                rctx.beginPath();
                rctx.moveTo(l.x1, l.y1);
                rctx.lineTo(l.x2, l.y2);
                rctx.strokeStyle = l.u ? '#d000ff' : '#334455';
                rctx.stroke();
            });
 
            // Draw Entities
            frame.entities.forEach(e => {
                let color = '#333';
                let size = 20 / frame.scale;
                 
                if (e.c === 7) { color = '#00ff66'; size *= 1.8; }
                else if (e.c === 3) { color = '#fff'; size *= 1.5; }
                else if (e.c === 4) { color = '#ff8800'; size *= 1.2; }
                else if (e.c === 5) { color = '#0088ff'; size *= 1.2; }
                else if (e.c === 6) { color = '#00ff00'; size *= 1.0; }
                else if (e.c === 2) color = '#ff0000';
                else if (e.c === 1) color = '#00ffaa';
                else if (e.c === 0) {
                    if (e.t === 'h') color = '#004433';
                    if (e.t === 'f') color = '#442200';
                    if (e.t === 'c') color = '#002244';
                }
                 
                rctx.fillStyle = color;
                 
                if (e.t === 's' || e.t === 'h') {
                    rctx.beginPath(); rctx.arc(e.x, e.y, size, 0, Math.PI*2); rctx.fill();
                } else if (e.t === 'p') {
                    rctx.beginPath(); rctx.arc(e.x, e.y, size*0.5, 0, Math.PI*2); rctx.fill();
                } else {
                    rctx.fillRect(e.x - size, e.y - size, size*2, size*2);
                }
            });
             
            rctx.restore();
        }
 
        replaySlider.addEventListener('input', function() {
            renderReplayFrame(parseInt(this.value));
        });
 
        // --- Message System ---
        function setSystemMsg(text, type = "normal", isEvent = false) {
            if (isEvent) {
                msgState.text = text; msgState.type = type; msgState.priority = 2; msgState.eventTimer = 120;
            } else if (msgState.priority < 2) {
                msgState.text = text; msgState.type = type; msgState.priority = 1;
            }
        }
         
        function clearSystemMsg(force = false) {
            if (force || msgState.priority < 2) {
                msgState.text = "系统就绪 - 点击建筑按钮放置"; msgState.type = "normal"; msgState.priority = 0;
            }
        }
         
        function updateSystemUI() {
            if (msgState.priority === 2) {
                msgState.eventTimer--;
                if (msgState.eventTimer <= 0) { msgState.priority = 0; setSystemMsg("系统就绪 - 点击建筑按钮放置", "normal"); }
            }
            const combinedState = msgState.text + msgState.type;
            if (combinedState !== lastRenderedMsg) {
                sysMsgEl.innerText = msgState.text;
                sysMsgEl.className = "";
                if (msgState.type !== "normal") sysMsgEl.classList.add(msgState.type);
                lastRenderedMsg = combinedState;
            }
             
            // NEW: Peak hour indicator
            const peakHourIndicator = document.getElementById('peak-hour-indicator');
            if (isPeakHour) {
                peakHourIndicator.style.display = 'flex';
                // Flash effect
                if (Math.floor(Date.now() / 500) % 2 === 0) {
                    peakHourIndicator.style.background = 'rgba(255, 102, 0, 0.3)';
                } else {
                    peakHourIndicator.style.background = 'rgba(0, 50, 60, 0.3)';
                }
            } else {
                peakHourIndicator.style.display = 'none';
            }
             
            if (isCriticalState) {
                if (!alarmOverlay.classList.contains('active')) alarmOverlay.classList.add('active');
            } else {
                if (alarmOverlay.classList.contains('active')) alarmOverlay.classList.remove('active');
            }
        }
 
        // --- Initialization ---
        function resize() {
            const rect = container.getBoundingClientRect();
            width = rect.width; height = rect.height;
            canvas.width = width; canvas.height = height;
            cx = width / 2; cy = height / 2;
        }
        window.addEventListener('resize', resize);
        resize();
 
        // --- 存档保存功能（下载文件）---
        function saveGame() {
            if (gameOver) {
                setSystemMsg("游戏已结束，无法保存", "warning", true);
                return;
            }

            try {
                const saveData = {
                    version: '1.0',
                    money: money,
                    currentNetIncome: currentNetIncome,
                    timeScale: timeScale,
                    gameTime: gameTime,
                    viewOffsetX: viewOffsetX,
                    viewOffsetY: viewOffsetY,
                    currentScale: currentScale,
                    totalSpawns: totalSpawns,
                    isCriticalState: isCriticalState,
                    placementMode: placementMode,
                    lastSpawnGameTime: lastSpawnGameTime,
                    lastFactorySpawnTime: lastFactorySpawnTime,
                    lastCommSpawnTime: lastCommSpawnTime,
                    lastIncomeGameTime: lastIncomeGameTime,
                    // 保存游戏状态（成就、科技解锁、记录）
                    gameState: {
                        achievements: gameState.achievements,
                        unlockedTech: gameState.unlockedTech,
                        records: gameState.records,
                        currentUptime: gameState.records.currentUptime
                    },
                    // 保存所有实体
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
                    // 保存所有连线
                    links: links.map(l => {
                        const fromIdx = getEntityIndex(l.from);
                        const toIdx = getEntityIndex(l.to);
                        return { from: fromIdx, to: toIdx, upgraded: l.upgraded };
                    })
                };

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
                
                setSystemMsg("存档已下载！", "success", true);
                showHelpTip("存档文件已保存到下载文件夹");
            } catch (e) {
                console.error("保存失败:", e);
                setSystemMsg("保存失败：" + e.message, "warning", true);
            }
        }

        // --- 存档读取功能（上传文件）---
        function loadGame() {
            try {
                // 创建文件输入元素
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
                            
                            // 验证存档版本
                            if (!saveData.version) {
                                setSystemMsg("无效的存档文件", "warning", true);
                                return;
                            }
                            
                            // 恢复基本状态
                            money = saveData.money || CONFIG.initialMoney;
                            currentNetIncome = saveData.currentNetIncome || 0;
                            timeScale = saveData.timeScale || 1.0;
                            gameTime = saveData.gameTime || 0;
                            viewOffsetX = saveData.viewOffsetX || 0;
                            viewOffsetY = saveData.viewOffsetY || 0;
                            currentScale = saveData.currentScale || CONFIG.initialScale;
                            totalSpawns = saveData.totalSpawns || 0;
                            isCriticalState = saveData.isCriticalState || false;
                            placementMode = saveData.placementMode || null;
                            lastSpawnGameTime = saveData.lastSpawnGameTime || 0;
                            lastFactorySpawnTime = saveData.lastFactorySpawnTime || 0;
                            lastCommSpawnTime = saveData.lastCommSpawnTime || 0;
                            lastIncomeGameTime = saveData.lastIncomeGameTime || 0;
                            
                            // 恢复游戏状态（成就、科技解锁、记录）
                            if (saveData.gameState) {
                                gameState.achievements = saveData.gameState.achievements || gameState.achievements;
                                gameState.unlockedTech = saveData.gameState.unlockedTech || [];
                                gameState.records = saveData.gameState.records || gameState.records;
                            }
                            
                            // 恢复实体
                            sources = (saveData.sources || []).map(s => ({
                                ...s,
                                id: Math.random(),
                                spawnScale: 1,
                                displayLoad: s.load || 0,
                                rotation: 0,
                                heat: s.heat || 0,
                                variant: s.variant || 'standard'
                            }));
                            
                            pylons = (saveData.pylons || []).map(p => ({ ...p, id: Math.random(), spawnScale: 1 }));
                            houses = (saveData.houses || []).map(h => ({ ...h, id: Math.random(), spawnScale: 1 }));
                            batteries = (saveData.batteries || []).map(b => ({ ...b, id: Math.random(), spawnScale: 1, currentOp: 'idle' }));
                            
                            // 恢复连线
                            const allEntities = [...sources, ...pylons, ...houses, ...batteries];
                            links = (saveData.links || []).map(l => {
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
                            gameOver = false;
                            gameOverScreen.classList.remove('active');
                            
                            // 更新UI
                            updatePowerGrid(true);
                            updateUI();
                            takeSnapshot();
                            setTimeScale(timeScale);
                            
                            // 更新放置模式按钮状态
                            if (placementMode) {
                                document.querySelectorAll('.building-btn').forEach(btn => {
                                    if (btn.getAttribute('data-type') === placementMode) {
                                        btn.classList.add('active');
                                    } else {
                                        btn.classList.remove('active');
                                    }
                                });
                            }
                            
                            setSystemMsg("存档已读取！", "success", true);
                            showHelpTip("游戏已从存档恢复");
                        } catch (err) {
                            console.error("读取存档失败:", err);
                            setSystemMsg("读取存档失败：文件格式错误", "warning", true);
                        }
                    };
                    
                    reader.onerror = () => {
                        setSystemMsg("读取文件失败", "warning", true);
                    };
                    
                    reader.readAsText(file);
                };
                
                document.body.appendChild(input);
                input.click();
                document.body.removeChild(input);
                
            } catch (e) {
                console.error("读取失败:", e);
                setSystemMsg("读取失败：" + e.message, "warning", true);
            }
        }

        // --- 辅助函数：获取实体索引 ---
        function getEntityIndex(entity) {
            const allEntities = [...sources, ...pylons, ...houses, ...batteries];
            return allEntities.indexOf(entity);
        }

        // --- 分享功能 ---
        function shareGame() {
            if (gameOver) {
                setSystemMsg("游戏已结束，无法分享", "warning", true);
                return;
            }

            try {
                const shareData = {
                    money: Math.floor(money),
                    population: houses.length,
                    sources: sources.filter(s => s.type === 'source').length,
                    coverage: calculateCoverage(),
                    gameTime: Math.floor(gameTime / 1000) // 转换为秒
                };

                const shareText = `🎮 Neon Grid 电力网格游戏\n💰 资金: $${shareData.money}\n👥 人口: ${shareData.population}\n⚡ 发电设施: ${shareData.sources}个\n📊 供电覆盖率: ${shareData.coverage}%\n⏱️ 游戏时间: ${formatGameTime(shareData.gameTime)}`;

                // 直接复制到剪贴板
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(shareText).then(() => {
                        setSystemMsg("游戏统计已复制到剪贴板！", "success", true);
                        showHelpTip("可以粘贴分享给朋友");
                    }).catch((err) => {
                        console.error("复制失败:", err);
                        // 如果剪贴板API不可用，使用传统方法
                        fallbackShare(shareText);
                    });
                } else {
                    fallbackShare(shareText);
                }
            } catch (e) {
                console.error("分享失败:", e);
                setSystemMsg("分享失败：" + e.message, "warning", true);
            }
        }

        // --- 备用分享方法（传统复制方法） ---
        function fallbackShare(text) {
            try {
                // 创建临时文本框
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.left = '-9999px';
                textarea.style.top = '0';
                document.body.appendChild(textarea);
                textarea.select();
                
                const successful = document.execCommand('copy');
                document.body.removeChild(textarea);
                
                if (successful) {
                    setSystemMsg("游戏统计已复制到剪贴板！", "success", true);
                    showHelpTip("可以粘贴分享给朋友");
                } else {
                    setSystemMsg("复制失败，请手动复制", "warning", true);
                }
            } catch (err) {
                console.error("备用复制方法失败:", err);
                setSystemMsg("复制失败，请手动复制", "warning", true);
            }
        }

        // --- 计算供电覆盖率 ---
        function calculateCoverage() {
            if (houses.length === 0) return 0;
            const poweredCount = houses.filter(h => h.powered).length;
            return Math.floor((poweredCount / houses.length) * 100);
        }

        // --- 格式化游戏时间 ---
        function formatGameTime(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            
            if (hours > 0) {
                return `${hours}小时${minutes}分${secs}秒`;
            } else if (minutes > 0) {
                return `${minutes}分${secs}秒`;
            } else {
                return `${secs}秒`;
            }
        }

        // --- Difficulty Selection System ---
        window.selectDifficulty = function(mode) {
            gameState.mode = mode;
            const modal = document.getElementById('difficulty-modal');
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none'; // 强制隐藏
            }

            // Apply difficulty modifiers
            switch(mode) {
                case 'beginner':
                    gameState.difficultyMultiplier = CONFIG.difficultyBeginnerMoneyMult;
                    CONFIG.peakHourInterval = CONFIG.peakHourInterval / CONFIG.difficultyBeginnerPeakFreqMult;
                    CONFIG.nuclearFailureChance *= CONFIG.difficultyBeginnerFailureMult;
                    CONFIG.initialMoney = 200 * CONFIG.difficultyBeginnerMoneyMult;
                    setSystemMsg("难度：新手模式", "info");
                    break;
                case 'normal':
                    gameState.difficultyMultiplier = 1.0;
                    CONFIG.peakHourInterval = 300000;
                    CONFIG.nuclearFailureChance = 0.05;
                    CONFIG.initialMoney = 200;
                    setSystemMsg("难度：普通模式", "info");
                    break;
                case 'expert':
                    gameState.difficultyMultiplier = CONFIG.difficultyExpertMoneyMult;
                    CONFIG.peakHourInterval = CONFIG.peakHourInterval / CONFIG.difficultyExpertPeakFreqMult;
                    CONFIG.nuclearFailureChance *= CONFIG.difficultyExpertFailureMult;
                    CONFIG.initialMoney = 200 * CONFIG.difficultyExpertMoneyMult;
                    setSystemMsg("难度：专家模式", "warning");
                    break;
            }

            // Start the game with selected difficulty
            restartGame();
        };

        // Make function available globally for onclick handlers
        // window.selectDifficulty = selectDifficulty; // Moved to end of file

        window.restartGame = function() {            gameOver = false; money = CONFIG.initialMoney; currentNetIncome = 0;
            sources = []; pylons = []; houses = []; batteries = []; links = []; particles = [];
            totalSpawns = 0; currentScale = CONFIG.initialScale;
            dragStartNode = null; snapTarget = null; CONFIG.maxAngryHouses = 5;
            gameTime = 0;
            viewOffsetX = 0; viewOffsetY = 0;
            placementMode = null; // 重置放置模式

            lastSpawnGameTime = 0;
            lastFactorySpawnTime = 0;
            lastCommSpawnTime = 0;
            lastIncomeGameTime = 0;

            gameHistory = [];
            lastSnapshotTime = 0;

            isCriticalState = false;
            gameOverScreen.classList.remove('active');

            // 重置按钮状态
            document.querySelectorAll('.building-btn').forEach(btn => {
                btn.classList.remove('active');
            });

            sources.push({
                x: 0, y: 0, radius: 25, type: 'source', id: Math.random(),
                load: 0, heat: 0, capacity: CONFIG.plantCapacity,
                spawnScale: 0, displayLoad: 0, rotation: 0, variant: 'standard'
            });

            currentNetIncome = CONFIG.baseSubsidy - (sources.length * CONFIG.upkeepPerPlant);
            spawnEntity('house');
            updatePowerGrid(true); updateUI();
            takeSnapshot();
            setSystemMsg("系统已重启 - 点击建筑按钮放置", "success", true);
        };
 
        function setTimeScale(scale) {
            timeScale = scale;
            speedBtns.forEach(btn => btn.classList.remove('active'));
            if (scale === 0) speedBtns[0].classList.add('active');
            else if (scale === 0.5) speedBtns[1].classList.add('active');
            else if (scale === 1.0) speedBtns[2].classList.add('active');
            else if (scale === 2.0) speedBtns[3].classList.add('active');
             
            showHelpTip(`速度: ${scale === 0 ? '暂停' : scale + 'x'}`);
        }
 
        function toWorld(screenX, screenY) {
            return { 
                x: (screenX - cx - viewOffsetX) / currentScale, 
                y: (screenY - cy - viewOffsetY) / currentScale 
            };
        }
 
        // --- Helper Functions ---
        function getEntityAt(worldX, worldY, radius = 30) {
            for (let s of sources) if (Math.hypot(worldX - s.x, worldY - s.y) < radius) return s;
            for (let p of pylons) if (Math.hypot(worldX - p.x, worldY - p.y) < radius) return p;
            for (let b of batteries) if (Math.hypot(worldX - b.x, worldY - b.y) < radius) return b;
            for (let h of houses) if (Math.hypot(worldX - h.x, worldY - h.y) < radius) return h;
            return null;
        }

        // --- Context Menu Functions ---
        function showContextMenu(screenX, screenY, entity) {
            // Remove any existing context menu
            const existingMenu = document.querySelector('.context-menu');
            if (existingMenu) existingMenu.remove();

            const menu = document.createElement('div');
            menu.className = 'context-menu';
            menu.style.left = screenX + 'px';
            menu.style.top = screenY + 'px';

            // Add title based on entity type
            const title = document.createElement('h3');
            let entityName = '未知';
            if (entity.variant === 'plant') entityName = '电厂';
            else if (entity.variant === 'nuclear') entityName = '核电站';
            else if (entity.variant === 'wind') entityName = '风力电站';
            else if (entity.variant === 'solar') entityName = '太阳能电站';
            else if (entity.type === 'battery') entityName = '电池';
            else if (entity.type === 'tower') entityName = '电塔';
            else if (entity.type === 'house') entityName = '住宅';
            else if (entity.type === 'factory') entityName = '工厂';
            else if (entity.type === 'commercial') entityName = '商业';
            title.textContent = entityName;
            menu.appendChild(title);

            // Add info section
            const info = document.createElement('div');
            info.className = 'context-menu-info';
            if (entity.variant === 'nuclear') {
                const coolingStatus = entity.coolingSatisfied ? '✅ 冷却充足' : '⚠️ 冷却不足';
                info.innerHTML = `
                    容量: ${entity.capacity.toFixed(1)}<br>
                    负载: ${entity.load.toFixed(1)}<br>
                    ${coolingStatus}<br>
                    冷却电池: ${entity.coolingBatteries}/2
                `;
            } else if (entity.variant === 'wind') {
                const windStatus = entity.windSpeedMultiplier > 1 ? '🌪️ 风速提升' : entity.windSpeedMultiplier < 1 ? '🍃 风速降低' : '🌬️ 正常';
                info.innerHTML = `
                    容量: ${entity.capacity.toFixed(1)}<br>
                    负载: ${entity.load.toFixed(1)}<br>
                    ${windStatus}<br>
                    效率: ${(entity.windSpeedMultiplier * 100).toFixed(0)}%
                `;
            } else if (entity.variant === 'solar') {
                const solarStatus = entity.hasStorageUpgrade ? '🔋 已升级储能' : '☀️ 无储能升级';
                info.innerHTML = `
                    容量: ${entity.capacity.toFixed(1)}<br>
                    负载: ${entity.load.toFixed(1)}<br>
                    ${solarStatus}
                `;
            } else if (entity.type === 'battery') {
                info.innerHTML = `
                    电量: ${entity.energy.toFixed(0)}/${entity.maxEnergy}<br>
                    负载: ${entity.targetLoad.toFixed(1)}<br>
                    状态: ${entity.currentOp === 'charge' ? '充电中' : entity.currentOp === 'discharge' ? '放电中' : '待机'}
                `;
            } else {
                info.innerHTML = `
                    容量: ${entity.capacity ? entity.capacity.toFixed(1) : 'N/A'}<br>
                    负载: ${entity.load.toFixed(1)}
                `;
            }
            menu.appendChild(info);

            // Add upgrade button for solar
            if (entity.variant === 'solar' && !entity.hasStorageUpgrade) {
                const upgradeBtn = document.createElement('button');
                upgradeBtn.className = 'context-menu-btn';
                upgradeBtn.innerHTML = `<span>🔋 升级储能板</span><span class="cost">$${CONFIG.solarStorageUpgradeCost}</span>`;
                upgradeBtn.onclick = () => {
                    upgradeSolarStorage(entity);
                    menu.remove();
                };
                menu.appendChild(upgradeBtn);
            }

            // Add maintenance button for nuclear
            if (entity.variant === 'nuclear' && !entity.maintenanceMode) {
                const maintainBtn = document.createElement('button');
                maintainBtn.className = 'context-menu-btn';
                maintainBtn.innerHTML = `<span>🔧 维护升级</span><span class="cost">$${CONFIG.nuclearMaintenanceUpgradeCost}</span>`;
                maintainBtn.onclick = () => {
                    upgradeNuclearMaintenance(entity);
                    menu.remove();
                };
                menu.appendChild(maintainBtn);
            }

            // Add upgrade button for link (if entity is a link)
            if (entity.from && entity.to) { // It's a link
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
                        if (money >= upgradeCost) {
                            money -= upgradeCost;
                            entity.upgraded = true;
                            entity.maxLoad = CONFIG.upgradedWireLoad;
                            createExplosion((entity.from.x + entity.to.x)/2, (entity.from.y + entity.to.y)/2, CONFIG.colors.wireUpgraded, 15);
                            setSystemMsg(`电线已升级 (-$${upgradeCost})`, "success", true);
                            updatePowerGrid();
                        } else {
                            setSystemMsg("资金不足", "warning", true);
                        }
                        menu.remove();
                    };
                }
                menu.appendChild(upgradeLinkBtn);
            }

            // Add demolish button
            let demolishCost = 0;
            if (entity.variant === 'plant') demolishCost = CONFIG.costPlant * CONFIG.refundRate;
            else if (entity.variant === 'nuclear') demolishCost = CONFIG.costNuclear * CONFIG.refundRate;
            else if (entity.variant === 'wind') demolishCost = CONFIG.costWind * CONFIG.refundRate;
            else if (entity.variant === 'solar') demolishCost = CONFIG.costSolar * CONFIG.refundRate;
            else if (entity.variant === 'repair') demolishCost = CONFIG.costRepairStation * CONFIG.refundRate;
            else if (entity.variant === 'dispatch') demolishCost = CONFIG.costDispatchCenter * CONFIG.refundRate;
            else if (entity.variant === 'energystorage') demolishCost = CONFIG.costEnergyStorage * CONFIG.refundRate;
            else if (entity.type === 'battery') demolishCost = CONFIG.costBattery * CONFIG.refundRate;
            else if (entity.type === 'pylon' || entity.variant === 'tower') demolishCost = CONFIG.costPylon * CONFIG.refundRate;

            const demolishBtn = document.createElement('button');
            demolishBtn.className = 'context-menu-btn danger';
            demolishBtn.innerHTML = `<span>🗑️ 拆除</span><span class="cost">+$${Math.floor(demolishCost)}</span>`;
            demolishBtn.onclick = () => {
                demolishBuilding(entity);
                menu.remove();
            };
            menu.appendChild(demolishBtn);

            document.body.appendChild(menu);

            // Close menu when clicking outside
            setTimeout(() => {
                document.addEventListener('click', function closeMenu(e) {
                    if (!menu.contains(e.target)) {
                        menu.remove();
                        document.removeEventListener('click', closeMenu);
                    }
                });
            }, 0);
        }

        function upgradeSolarStorage(solar) {
            if (money >= CONFIG.solarStorageUpgradeCost) {
                money -= CONFIG.solarStorageUpgradeCost;
                solar.hasStorageUpgrade = true;
                setSystemMsg("太阳能储能板升级完成！夜间保留20%发电效率", "success");
                createExplosion(solar.x, solar.y, '#ffff00', 25);
            } else {
                setSystemMsg("资金不足", "warning");
            }
        }

        function demolishBuilding(entity) {
            // Remove from appropriate array
            if (entity.variant && ['plant', 'nuclear', 'wind', 'solar', 'repair', 'dispatch', 'energystorage'].includes(entity.variant)) {
                const index = sources.indexOf(entity);
                if (index > -1) {
                    sources.splice(index, 1);
                }
                // Also remove from pylons if it's a tower
                if (entity.variant === 'tower') {
                    const pylonIndex = pylons.findIndex(p => p.id === entity.id);
                    if (pylonIndex > -1) pylons.splice(pylonIndex, 1);
                }
            } else if (entity.type === 'battery') {
                const index = batteries.indexOf(entity);
                if (index > -1) batteries.splice(index, 1);
            } else if (entity.type === 'pylon') {
                const index = pylons.indexOf(entity);
                if (index > -1) pylons.splice(index, 1);
            } else if (entity.type === 'house' || entity.type === 'factory' || entity.type === 'commercial') {
                const index = houses.indexOf(entity);
                if (index > -1) houses.splice(index, 1);
            }

            // Remove connected links
            links = links.filter(l => l.from !== entity && l.to !== entity);

            // Refund cost
            let refund = 0;
            if (entity.variant === 'plant') refund = CONFIG.costPlant * CONFIG.refundRate;
            else if (entity.variant === 'nuclear') refund = CONFIG.costNuclear * CONFIG.refundRate;
            else if (entity.variant === 'wind') refund = CONFIG.costWind * CONFIG.refundRate;
            else if (entity.variant === 'solar') refund = CONFIG.costSolar * CONFIG.refundRate;
            else if (entity.variant === 'repair') refund = CONFIG.costRepairStation * CONFIG.refundRate;
            else if (entity.variant === 'dispatch') refund = CONFIG.costDispatchCenter * CONFIG.refundRate;
            else if (entity.variant === 'energystorage') refund = CONFIG.costEnergyStorage * CONFIG.refundRate;
            else if (entity.type === 'battery') refund = CONFIG.costBattery * CONFIG.refundRate;
            else if (entity.type === 'pylon' || entity.variant === 'tower') refund = CONFIG.costPylon * CONFIG.refundRate;

            money += refund;
            setSystemMsg(`已拆除，返还 $${Math.floor(refund)}`, "info");
            createExplosion(entity.x, entity.y, '#ff6666', 20);
            updatePowerGrid();
        }
 
        function distToSegment(p, v, w) {
            const l2 = (w.x - v.x)**2 + (w.y - v.y)**2;
            if (l2 == 0) return Math.hypot(p.x - v.x, p.y - v.y);
            let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
            t = Math.max(0, Math.min(1, t));
            return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
        }
 
        function getLinkAt(x, y, tolerance = 15) {
            const p = {x, y};
            for (let l of links) {
                if (distToSegment(p, l.from, l.to) < tolerance) return l;
            }
            return null;
        }
 
        function isPositionClear(worldX, worldY, buffer) {
            for (let s of sources) if (Math.hypot(worldX - s.x, worldY - s.y) < buffer) return false;
            for (let p of pylons) if (Math.hypot(worldX - p.x, worldY - p.y) < buffer) return false;
            for (let b of batteries) if (Math.hypot(worldX - b.x, worldY - b.y) < buffer) return false;
            for (let h of houses) if (Math.hypot(worldX - h.x, worldY - h.y) < buffer) return false;
            return true;
        }

        function isWindPlacementValid(worldX, worldY) {
            // Wind turbines can only be placed near the edge of the map
            // Get current view bounds
            const viewWidth = width / currentScale;
            const viewHeight = height / currentScale;

            // Calculate bounds based on view center (viewOffsetX, viewOffsetY)
            const minX = viewOffsetX - viewWidth / 2;
            const maxX = viewOffsetX + viewWidth / 2;
            const minY = viewOffsetY - viewHeight / 2;
            const maxY = viewOffsetY + viewHeight / 2;

            // Check if position is within edge distance from any edge
            const distToLeft = Math.abs(worldX - minX);
            const distToRight = Math.abs(worldX - maxX);
            const distToTop = Math.abs(worldY - minY);
            const distToBottom = Math.abs(worldY - maxY);

            return (distToLeft <= CONFIG.windEdgeDistance ||
                    distToRight <= CONFIG.windEdgeDistance ||
                    distToTop <= CONFIG.windEdgeDistance ||
                    distToBottom <= CONFIG.windEdgeDistance);
        }
 
        function getLineIntersection(p1, p2, p3, p4) {
            const det = (p2.x - p1.x) * (p4.y - p3.y) - (p4.x - p3.x) * (p2.y - p1.y);
            if (det === 0) return false; 
            const lambda = ((p4.y - p3.y) * (p4.x - p1.x) + (p3.x - p4.x) * (p4.y - p1.y)) / det;
            const gamma = ((p1.y - p2.y) * (p4.x - p1.x) + (p2.x - p1.x) * (p4.y - p1.y)) / det;
            return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
        }
 
        function checkIntersection(startPos, endPos) {
            for (let l of links) {
                if (l.from === dragStartNode || l.to === dragStartNode || l.from === snapTarget || l.to === snapTarget) continue;
                if (getLineIntersection(startPos, endPos, l.from, l.to)) return true;
            }
            return false;
        }
 
        // --- 建筑按钮触摸支持 ---
        function setupBuildingButtons() {
            const buildingBtns = document.querySelectorAll('.building-btn');
             
            buildingBtns.forEach(btn => {
                // 移动端触摸点击
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    const type = btn.getAttribute('data-type');
                    enterPlacementMode(type);
                });
            });
        }
 
        function placeBuildingAt(worldX, worldY, type) {
            let buffer = 60;
            if (type === 'tower') buffer = 30; // 电塔占用空间更小

            if (!isPositionClear(worldX, worldY, buffer)) {
                createShockwave(worldX, worldY, '#ff3333');
                setSystemMsg("位置无效", "warning", true);
                return;
            }

            // Check wind placement restriction
            if (type === 'wind' && CONFIG.windEdgeOnly && !isWindPlacementValid(worldX, worldY)) {
                createShockwave(worldX, worldY, '#ff3333');
                setSystemMsg("风力电站只能放置在地图边缘区域", "warning", true);
                return;
            }

            let cost = 0;
            if (type === 'plant') cost = CONFIG.costPlant;
            else if (type === 'nuclear') cost = CONFIG.costNuclear;
            else if (type === 'battery') cost = CONFIG.costBattery;
            else if (type === 'wind') cost = CONFIG.costWind;
            else if (type === 'solar') cost = CONFIG.costSolar;
            else if (type === 'tower') cost = 100;
            else if (type === 'repair') cost = CONFIG.costRepairStation;
            else if (type === 'dispatch') cost = CONFIG.costDispatchCenter;
            else if (type === 'energystorage') cost = CONFIG.costEnergyStorage;

            if (money < cost) {
                createShockwave(worldX, worldY, '#ff3333');
                setSystemMsg("资金不足", "warning", true);
                return;
            }
             
            money -= cost;
             
            // 处理发电设施（包括电塔）
            if (type === 'plant' || type === 'nuclear' || type === 'wind' || type === 'solar' || type === 'tower') {
                let capacity, color, name, upkeep, variant;

                if (type === 'plant') {
                    capacity = CONFIG.plantCapacity;
                    color = '#fff';
                    name = '电厂';
                    upkeep = CONFIG.upkeepPerPlant;
                    variant = 'standard';
                } else if (type === 'nuclear') {
                    capacity = CONFIG.nuclearCapacity;
                    color = '#00ff66';
                    name = '核电站';
                    upkeep = CONFIG.nuclearUpkeep;
                    variant = 'nuclear';
                } else if (type === 'wind') {
                    capacity = 10 + Math.random() * 5; // Random 10-15
                    color = '#88ffff';
                    name = '风力电站';
                    upkeep = 0;
                    variant = 'wind';
                } else if (type === 'solar') {
                    capacity = 8 + Math.random() * 4; // Random 8-12
                    color = '#ffff88';
                    name = '太阳能电站';
                    upkeep = 0;
                    variant = 'solar';
                } else if (type === 'tower') {
                    capacity = 0; // 电塔不发电
                    color = '#ff88ff';
                    name = '电塔';
                    upkeep = 0;
                    variant = 'tower';
                }

                const towerId = Math.random();

                // Create base source object
                let sourceObj = {
                    x: worldX, y: worldY,
                    radius: type === 'tower' ? 10 : 25, type: type === 'tower' ? 'tower' : 'source', id: towerId,
                    load: 0, heat: 0,
                    capacity: capacity,
                    spawnScale: 0, displayLoad: 0, rotation: 0,
                    variant: variant,
                    upkeep: upkeep,
                    builtTime: gameState.gameTime
                };

                // Add type-specific properties
                if (type === 'wind') {
                    sourceObj.windSpeedMultiplier = 1.0;
                    sourceObj.lastWindEvent = 0;
                } else if (type === 'solar') {
                    sourceObj.hasStorageUpgrade = false;
                } else if (type === 'nuclear') {
                    sourceObj.coolingBatteries = 0;
                    sourceObj.coolingSatisfied = false;
                    sourceObj.failureChance = CONFIG.nuclearFailureChance;
                    sourceObj.needsRepair = false;
                    sourceObj.maintenanceMode = false;
                    sourceObj.maintenanceEndTime = 0;
                }

                // Add to sources (for grid connection)
                sources.push(sourceObj);
                
                // Add to pylons (for rendering as tower)
                if (type === 'tower') {
                    pylons.push({
                        x: worldX, y: worldY,
                        type: 'pylon', id: towerId,
                        spawnScale: 0, powered: true
                    });
                }
                
                setSystemMsg(`${name}已建造 (-$${cost})`, "success", true);
                createExplosion(worldX, worldY, color, type === 'tower' ? 10 : 20);
            } else if (type === 'battery') {
                batteries.push({
                    x: worldX, y: worldY,
                    type: 'battery', id: Math.random(),
                    energy: 0, maxEnergy: CONFIG.batteryCapacity,
                    spawnScale: 0, powered: false, currentOp: 'idle',
                    targetLoad: 0
                });
                setSystemMsg(`电池已建造 (-$${cost})`, "success", true);
                createExplosion(worldX, worldY, '#00ff00', 15);
            } else if (type === 'repair') {
                // Maintenance Station - Price increases 30% if unlock condition not met
                let actualCost = cost;
                if (houses.length < CONFIG.repairStationUnlockPop) {
                    actualCost = Math.floor(cost * 1.3);
                    if (money < actualCost) {
                        createShockwave(worldX, worldY, '#ff3333');
                        setSystemMsg(`资金不足（未满足解锁条件，价格上涨30%）`, "warning", true);
                        return;
                    }
                    money -= actualCost;
                    setSystemMsg(`维修站已建造（未满足解锁条件，价格+30%） (-$${actualCost})`, "warning", true);
                } else {
                    money -= actualCost;
                    setSystemMsg(`维修站已建造！维护费-${CONFIG.repairStationMaintenanceReduction * 100}%`, "success", true);
                }
                sources.push({
                    x: worldX, y: worldY,
                    radius: 25, type: 'source', id: Math.random(),
                    load: 0, heat: 0,
                    capacity: 0, // Doesn't generate power
                    spawnScale: 0, displayLoad: 0, rotation: 0,
                    variant: 'repair',
                    upkeep: 0,
                    maintenanceReduction: CONFIG.repairStationMaintenanceReduction
                });
                createExplosion(worldX, worldY, '#00ff88', 20);
            } else if (type === 'dispatch') {
                // Dispatch Center - Price increases 30% if unlock condition not met
                let actualCost = cost;
                if (houses.length < CONFIG.dispatchCenterUnlockPop) {
                    actualCost = Math.floor(cost * 1.3);
                    if (money < actualCost) {
                        createShockwave(worldX, worldY, '#ff3333');
                        setSystemMsg(`资金不足（未满足解锁条件，价格上涨30%）`, "warning", true);
                        return;
                    }
                    money -= actualCost;
                    setSystemMsg(`调度中心已建造（未满足解锁条件，价格+30%） (-$${actualCost})`, "warning", true);
                } else {
                    money -= actualCost;
                    setSystemMsg(`调度中心已建造！可切换供电优先级`, "success", true);
                }
                sources.push({
                    x: worldX, y: worldY,
                    radius: 25, type: 'source', id: Math.random(),
                    load: 0, heat: 0,
                    capacity: 0, // Doesn't generate power
                    spawnScale: 0, displayLoad: 0, rotation: 0,
                    variant: 'dispatch',
                    upkeep: 0,
                    priorityMode: 'balanced' // balanced, residential, industrial
                });
                createExplosion(worldX, worldY, '#ffaa00', 20);
            } else if (type === 'energystorage') {
                // Energy Storage Station - Price increases 30% if unlock condition not met
                let actualCost = cost;
                if (batteries.length < CONFIG.energyStorageUnlockBatteryCount) {
                    actualCost = Math.floor(cost * 1.3);
                    if (money < actualCost) {
                        createShockwave(worldX, worldY, '#ff3333');
                        setSystemMsg(`资金不足（未满足解锁条件，价格上涨30%）`, "warning", true);
                        return;
                    }
                    money -= actualCost;
                    setSystemMsg(`储能站已建造（未满足解锁条件，价格+30%） (-$${actualCost})`, "warning", true);
                } else {
                    money -= actualCost;
                    setSystemMsg(`储能站已建造！容量×${CONFIG.energyStorageCapacityMultiplier}，充放电速率×${CONFIG.energyStorageChargeRateMultiplier}`, "success", true);
                }
                sources.push({
                    x: worldX, y: worldY,
                    radius: 25, type: 'source', id: Math.random(),
                    load: 0, heat: 0,
                    capacity: 0, // Doesn't generate power
                    spawnScale: 0, displayLoad: 0, rotation: 0,
                    variant: 'energystorage',
                    upkeep: 0,
                    capacityMultiplier: CONFIG.energyStorageCapacityMultiplier,
                    chargeRateMultiplier: CONFIG.energyStorageChargeRateMultiplier
                });
                setSystemMsg(`储能站已建造！电池容量×${CONFIG.energyStorageCapacityMultiplier}，充放电速率×${CONFIG.energyStorageChargeRateMultiplier}`, "success", true);
                createExplosion(worldX, worldY, '#0088ff', 20);
            }
             
            updatePowerGrid();
             
            // 如果是放置模式，继续保持该模式
            if (placementMode) {
                // 延迟一帧更新提示信息
                setTimeout(() => {
                    if (placementMode) {
                        let buildingName = '';
                        if (placementMode === 'plant') buildingName = '电厂';
                        else if (placementMode === 'nuclear') buildingName = '核电站';
                        else if (placementMode === 'battery') buildingName = '电池';
                        else if (placementMode === 'wind') buildingName = '风力电站';
                        else if (placementMode === 'solar') buildingName = '太阳能电站';
                        else if (placementMode === 'tower') buildingName = '电塔';
                        setSystemMsg(`继续放置${buildingName} - 右键退出`, "highlight");
                    }
                }, 100);
            }
        }
 
        // --- 改进的输入处理 ---
        function getCanvasCoordinates(event) {
            const rect = canvas.getBoundingClientRect();
            let clientX = event.touches ? event.touches[0].clientX : event.clientX;
            let clientY = event.touches ? event.touches[0].clientY : event.clientY;
            return { x: clientX - rect.left, y: clientY - rect.top };
        }
 
        // 触摸手势处理
        function getTouchDistance(e) {
            if (e.touches.length < 2) return 0;
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            return Math.sqrt(dx * dx + dy * dy);
        }
 
        function handleTouchStart(e) {
            if (e.touches.length === 2) {
                isZooming = true;
                touchStartDist = getTouchDistance(e);
                e.preventDefault();
                // 清除长按定时器
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
            } else if (e.touches.length === 1) {
                const touch = e.touches[0];
                lastTouchX = touch.clientX;
                lastTouchY = touch.clientY;

                const rect = canvas.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;

                // 检查是否在实体上
                const worldPos = toWorld(x, y);
                const entity = getEntityAt(worldPos.x, worldPos.y);

                if (entity) {
                    // 如果在实体上，启动长按检测
                    longPressStartPos = { x: worldPos.x, y: worldPos.y };
                    longPressTimer = setTimeout(() => {
                        activateLongPressSelection(worldPos.x, worldPos.y);
                    }, longPressDuration);
                } else {
                    // 如果不在实体上，可能是拖动视图
                    setTimeout(() => {
                        if (!input.isDown && !dragStartNode && !isLongPressActive) {
                            isPanning = true;
                        }
                    }, 100);
                }
            }
        }

        function activateLongPressSelection(worldX, worldY) {
            isLongPressActive = true;

            // 获取触摸的实体类型
            const entity = getEntityAt(worldX, worldY);
            if (!entity) return;

            const entityType = entity.type || entity.variant;

            // 批量选中同类型实体
            selectedEntities = [];

            // 搜索所有同类型实体
            sources.forEach(s => {
                if ((s.type === entityType || s.variant === entityType) &&
                    Math.hypot(s.x - worldX, s.y - worldY) < 500) { // 500范围内
                    selectedEntities.push(s);
                }
            });

            pylons.forEach(p => {
                if (p.type === entityType && Math.hypot(p.x - worldX, p.y - worldY) < 500) {
                    selectedEntities.push(p);
                }
            });

            batteries.forEach(b => {
                if (b.type === entityType && Math.hypot(b.x - worldX, b.y - worldY) < 500) {
                    selectedEntities.push(b);
                }
            });

            houses.forEach(h => {
                if (h.type === entityType && Math.hypot(h.x - worldX, h.y - worldY) < 500) {
                    selectedEntities.push(h);
                }
            });

            if (selectedEntities.length > 0) {
                setSystemMsg(`已选中 ${selectedEntities.length} 个${entityType === 'plant' ? '电厂' : entityType === 'wind' ? '风力电站' : entityType === 'solar' ? '太阳能电站' : entityType === 'nuclear' ? '核电站' : entityType === 'battery' ? '电池' : entityType === 'house' ? '住宅' : entityType === 'factory' ? '工厂' : '商业'}`, "info");
                createExplosion(worldX, worldY, '#00ffff', 30);
            }
        }
 
        function handleTouchMove(e) {
            if (isZooming && e.touches.length === 2) {
                const dist = getTouchDistance(e);
                const scaleFactor = dist / touchStartDist;
                currentScale = Math.max(CONFIG.minScale, Math.min(CONFIG.maxScale, currentScale * scaleFactor));
                touchStartDist = dist;
                e.preventDefault();
                // 清除长按定时器
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
            } else if (isPanning && e.touches.length === 1 && !input.isDown && !isLongPressActive) {
                const touch = e.touches[0];
                const dx = touch.clientX - lastTouchX;
                const dy = touch.clientY - lastTouchY;
                viewOffsetX += dx;
                viewOffsetY += dy;
                lastTouchX = touch.clientX;
                lastTouchY = touch.clientY;
                e.preventDefault();
            } else if (longPressTimer) {
                // 如果移动距离过大，取消长按
                const touch = e.touches[0];
                const dx = touch.clientX - lastTouchX;
                const dy = touch.clientY - lastTouchY;
                const moveDist = Math.sqrt(dx * dx + dy * dy);

                if (moveDist > 10) { // 移动超过10像素取消长按
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
            }
        }
 
        function handleTouchEnd(e) {
            if (e.touches.length === 0) {
                isZooming = false;
                isPanning = false;

                // 清除长按定时器
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }

                // 如果长按激活，可以在这里处理后续操作
                if (isLongPressActive) {
                    isLongPressActive = false;
                    // 可以在这里显示批量操作菜单
                }

                // 清除选中
                selectedEntities = [];
            }
        }
 
        // 鼠标滚轮缩放
        function handleWheel(e) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            currentScale = Math.max(CONFIG.minScale, Math.min(CONFIG.maxScale, currentScale * delta));
        }
 
        // 键盘快捷键
        function handleKeyDown(e) {
            if (e.key === 'Shift') {
                isHighVoltageMode = true;
                if (dragStartNode) {
                    setSystemMsg("高压线模式", "highlight");
                }
            } else if (e.key === 'F11') {
                e.preventDefault();
                toggleFullscreen();
            } else if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                toggleFullscreen();
            }
        }
 
        function handleKeyUp(e) {
            if (e.key === 'Shift') {
                isHighVoltageMode = false;
                if (dragStartNode) {
                    clearSystemMsg();
                }
            }
        }
 
        // 左键操作
        function handleLeftClick(mouseX, mouseY) {
            if (gameOver || isPanning) return;
            const wPos = toWorld(mouseX, mouseY);
            input.worldX = wPos.x; 
            input.worldY = wPos.y;
             
            // 如果在建筑放置模式
            if (placementMode) {
                placeBuildingAt(input.worldX, input.worldY, placementMode);
                return;
            }
             
            // Shift+左键点击电线才升级
            if (isHighVoltageMode) {
                const clickedLink = getLinkAt(input.worldX, input.worldY);
                if (clickedLink && !clickedLink.upgraded) {
                    const dist = Math.hypot(clickedLink.from.x - clickedLink.to.x, clickedLink.from.y - clickedLink.to.y);
                    const cost = Math.floor(dist * CONFIG.costWirePerUnit * CONFIG.costUpgradeMult);
                    if (money >= cost) {
                        money -= cost;
                        clickedLink.upgraded = true;
                        clickedLink.maxLoad = CONFIG.upgradedWireLoad;
                        createExplosion((clickedLink.from.x + clickedLink.to.x)/2, (clickedLink.from.y + clickedLink.to.y)/2, CONFIG.colors.wireUpgraded, 15);
                        setSystemMsg(`电线已升级 (-$${cost})`, "success", true);
                        updatePowerGrid();
                    } else {
                        createShockwave(input.worldX, input.worldY, '#ff3333');
                        setSystemMsg("资金不足", "warning", true);
                    }
                    return;
                }
            }
             
            // 检查是否在实体上（开始拉线）
            const hovered = getEntityAt(input.worldX, input.worldY, 30);
            if (hovered) {
                input.isDown = true;
                dragStartNode = hovered;
                snapTarget = null;
            }
        }
 
        // 右键操作
        function handleRightClick(mouseX, mouseY) {
            if (gameOver) return;
             
            // 如果在建筑放置模式，右键退出
            if (placementMode) {
                exitPlacementMode();
                return;
            }
             
            // 正常的拆除功能
            const wPos = toWorld(mouseX, mouseY);
             
            // 先尝试拆除实体
            const entity = getEntityAt(wPos.x, wPos.y, 30);
            if (entity && (entity.type === 'pylon' || entity.type === 'battery')) {
                deleteEntity(entity);
                createExplosion(entity.x, entity.y, '#ffaa00', 15);
                return;
            }
             
            // 再尝试拆除电线
            const link = getLinkAt(wPos.x, wPos.y);
            if (link) {
                deleteLink(link);
                createExplosion((link.from.x + link.to.x)/2, (link.from.y + link.to.y)/2, '#ffaa00', 10);
            }
        }
 
        function handleInputMove(mouseX, mouseY) {
            input.x = mouseX; input.y = mouseY;
            const wPos = toWorld(mouseX, mouseY);
            input.worldX = wPos.x; input.worldY = wPos.y;
 
            // 如果在建筑放置模式
            if (placementMode) {
                const isValid = isPositionClear(input.worldX, input.worldY, 60);
                let cost = 0;
                let buildingName = '';
                if (placementMode === 'plant') { cost = CONFIG.costPlant; buildingName = '电厂'; }
                else if (placementMode === 'nuclear') { cost = CONFIG.costNuclear; buildingName = '核电站'; }
                else if (placementMode === 'battery') { cost = CONFIG.costBattery; buildingName = '电池'; }
                 
                if (!isValid) {
                    setSystemMsg(`此处无法放置${buildingName}`, "warning");
                } else if (money < cost) {
                    setSystemMsg(`资金不足 (需要$${cost})`, "warning");
                } else {
                    setSystemMsg(`左键放置${buildingName} ($${cost})`, "highlight");
                }
                return;
            }
 
            // 拉线模式
            if (input.isDown && dragStartNode) {
                const entity = getEntityAt(input.worldX, input.worldY, CONFIG.snapDistance);
                snapTarget = (entity && entity !== dragStartNode) ? entity : null;
                validBuildPos = !snapTarget ? isPositionClear(input.worldX, input.worldY, CONFIG.minEntityDist) : true;
                 
                const targetX = snapTarget ? snapTarget.x : input.worldX;
                const targetY = snapTarget ? snapTarget.y : input.worldY;
                isIntersecting = checkIntersection(dragStartNode, {x: targetX, y: targetY});
 
                const dist = Math.hypot(targetX - dragStartNode.x, targetY - dragStartNode.y);
                const isValidLen = dist <= CONFIG.maxWireLength && dist > 10;
                 
                if (isValidLen) {
                    const isHV = isHighVoltageMode;
                    const costMult = isHV ? CONFIG.costUpgradeMult : 1;
                    const wireCost = Math.floor(dist * CONFIG.costWirePerUnit * costMult);
                    let estCost = wireCost + (!snapTarget && validBuildPos ? CONFIG.costPylon : 0);
                    let label = (!snapTarget && validBuildPos) ? "建造电塔" : "连接";
                    if (isHV) label = "高压" + label;
 
                    if (isIntersecting) setSystemMsg("错误: 线路交叉", "warning");
                    else if (money < estCost) setSystemMsg(`成本: $${estCost} (资金不足)`, "warning");
                    else setSystemMsg(`${label} 成本: $${estCost}`, "highlight");
                } else {
                    setSystemMsg("距离无效", "warning");
                }
            } else {
                // 悬停提示
                hoveredEntity = getEntityAt(input.worldX, input.worldY, 30);
                hoveredLink = !hoveredEntity ? getLinkAt(input.worldX, input.worldY) : null;
                 
                if (hoveredEntity) {
                    if (hoveredEntity.type === 'pylon' || hoveredEntity.type === 'battery') {
                        setSystemMsg("右键拆除", "normal");
                    } else {
                        setSystemMsg("左键拖动建造电线", "normal");
                    }
                } else if (hoveredLink) {
                    if (isHighVoltageMode) {
                        // 按住Shift时显示升级提示
                        if (hoveredLink.upgraded) {
                            setSystemMsg("已是高压线", "normal");
                        } else {
                            const dist = Math.hypot(hoveredLink.from.x - hoveredLink.to.x, hoveredLink.from.y - hoveredLink.to.y);
                            const cost = Math.floor(dist * CONFIG.costWirePerUnit * CONFIG.costUpgradeMult);
                            setSystemMsg(`Shift+左键升级 ($${cost})`, "highlight");
                        }
                    } else {
                        // 默认显示删除提示
                        setSystemMsg("右键删除电线", "warning");
                    }
                } else {
                    clearSystemMsg();
                }
            }
        }
 
        function handleInputEnd() {
            if (input.isDown && dragStartNode) {
                const targetPos = snapTarget ? snapTarget : { x: input.worldX, y: input.worldY };
                const dist = Math.hypot(targetPos.x - dragStartNode.x, targetPos.y - dragStartNode.y);
                const isValidLength = dist <= CONFIG.maxWireLength && dist > 10;
                 
                if (isValidLength && !isIntersecting) {
                    const isHV = isHighVoltageMode;
                    const costMult = isHV ? CONFIG.costUpgradeMult : 1;
                    const wireCost = Math.floor(dist * CONFIG.costWirePerUnit * costMult);
                     
                    if (snapTarget) {
                        if (money >= wireCost) tryConnect(dragStartNode, snapTarget, wireCost, isHV);
                        else { createShockwave(input.worldX, input.worldY, '#ff3333'); setSystemMsg("资金不足", "warning", true); }
                    } else if (validBuildPos) {
                        const totalCost = wireCost + CONFIG.costPylon;
                        if (money >= totalCost) tryBuildPylon(input.worldX, input.worldY, dragStartNode, totalCost, isHV);
                        else { createShockwave(input.worldX, input.worldY, '#ff3333'); setSystemMsg("资金不足", "warning", true); }
                    } else { createShockwave(input.worldX, input.worldY, '#ff0000'); setSystemMsg("位置错误", "warning", true); }
                } else { createShockwave(input.worldX, input.worldY, '#ff0000'); setSystemMsg("长度错误", "warning", true); }
            }
            input.isDown = false; dragStartNode = null; snapTarget = null; isIntersecting = false;
            clearSystemMsg();
        }
 
        // 注册事件监听器
        canvas.addEventListener('mousedown', e => {
            const c = getCanvasCoordinates(e);
            if (e.button === 0) { // 左键
                handleLeftClick(c.x, c.y);
            } else if (e.button === 2) { // 右键
                handleRightClick(c.x, c.y);
            }
        });
         
        canvas.addEventListener('mousemove', e => {
            const c = getCanvasCoordinates(e);
            handleInputMove(c.x, c.y);
        });
         
        canvas.addEventListener('mouseup', e => {
            if (e.button === 0) handleInputEnd();
        });
         
        // 触摸事件
        canvas.addEventListener('touchstart', e => { 
            handleTouchStart(e);
            if (e.touches.length === 1 && !isZooming) {
                const c = getCanvasCoordinates(e);
                handleLeftClick(c.x, c.y);
            }
        }, {passive: false});
         
        canvas.addEventListener('touchmove', e => { 
            handleTouchMove(e);
            if (e.touches.length === 1 && !isZooming && !isPanning) {
                const c = getCanvasCoordinates(e); 
                handleInputMove(c.x, c.y); 
            }
        }, {passive: false});
         
        canvas.addEventListener('touchend', e => { 
            handleTouchEnd(e);
            if (!isZooming && !isPanning) {
                handleInputEnd(); 
            }
        });
 
        canvas.addEventListener('wheel', handleWheel, {passive: false});
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
 
        // --- Core Logic ---
        function deleteEntity(entity) {
            let refundTotal = 0;
            const connectedLinks = links.filter(l => l.from === entity || l.to === entity);
            connectedLinks.forEach(l => {
                const dist = Math.hypot(l.from.x - l.to.x, l.from.y - l.to.y);
                const costMult = l.upgraded ? CONFIG.costUpgradeMult : 1;
                refundTotal += Math.floor(Math.floor(dist * CONFIG.costWirePerUnit * costMult) * CONFIG.refundRate);
            });
            if (entity.type === 'pylon') {
                refundTotal += Math.floor(CONFIG.costPylon * CONFIG.refundRate);
                pylons = pylons.filter(p => p !== entity);
            } else if (entity.type === 'battery') {
                refundTotal += Math.floor(CONFIG.costBattery * CONFIG.refundRate);
                batteries = batteries.filter(b => b !== entity);
            }
            links = links.filter(l => l.from !== entity && l.to !== entity);
            money += refundTotal;
            updatePowerGrid();
            setSystemMsg(`返还 +$${refundTotal}`, "success", true);
        }
 
        function deleteLink(link) {
            const dist = Math.hypot(link.from.x - link.to.x, link.from.y - link.to.y);
            const costMult = link.upgraded ? CONFIG.costUpgradeMult : 1;
            const refund = Math.floor(Math.floor(dist * CONFIG.costWirePerUnit * costMult) * CONFIG.refundRate);
            money += refund;
            links = links.filter(l => l !== link);
            updatePowerGrid();
            setSystemMsg(`返还 +$${refund}`, "success", true);
        }
 
        function tryConnect(nodeA, nodeB, cost, isHV = false) {
            if (links.some(l => (l.from === nodeA && l.to === nodeB) || (l.from === nodeB && l.to === nodeA))) {
                setSystemMsg("已经连接", "warning", true);
                return;
            }
            money -= cost;

            // Calculate distance and transmission loss
            const distance = Math.hypot(nodeB.x - nodeA.x, nodeB.y - nodeA.y);
            const loss = calculateTransmissionLoss(distance, isHV);

            const maxLoad = isHV ? CONFIG.upgradedWireLoad : CONFIG.baseWireLoad;
            links.push({
                from: nodeA, to: nodeB,
                active: false, load: 0, heat: 0, spawnProgress: 0,
                maxLoad: maxLoad, upgraded: isHV,
                distance: distance,
                loss: loss,
                isHighVoltage: isHV,
                lastOverloadTime: 0,
                isDamaged: false,
                cascadeCooldown: 0
            });
            if (isHV) {
                 createExplosion((nodeA.x + nodeB.x)/2, (nodeA.y + nodeB.y)/2, CONFIG.colors.wireUpgraded, 15);
            }
            updatePowerGrid();
            setSystemMsg(`已连接 (-$${cost})${loss > 0 ? ` 损耗${(loss * 100).toFixed(0)}%` : ''}`, "normal", true);
        }

        function calculateTransmissionLoss(distance, isHighVoltage) {
            return 0; // Disabled transmission loss
        }
 
        function tryBuildPylon(x, y, parentNode, cost, isHV = false) {
            money -= cost;
            const newPylon = { x: x, y: y, type: 'pylon', powered: false, id: Math.random(), spawnScale: 0 };
            pylons.push(newPylon);

            // Calculate distance and transmission loss
            const distance = Math.hypot(x - parentNode.x, y - parentNode.y);
            const loss = calculateTransmissionLoss(distance, isHV);

            const maxLoad = isHV ? CONFIG.upgradedWireLoad : CONFIG.baseWireLoad;
            links.push({
                from: parentNode, to: newPylon,
                active: false, load: 0, heat: 0, spawnProgress: 0,
                maxLoad: maxLoad, upgraded: isHV,
                distance: distance,
                loss: loss,
                isHighVoltage: isHV,
                lastOverloadTime: 0,
                isDamaged: false,
                cascadeCooldown: 0
            });
            createExplosion(x, y, isHV ? CONFIG.colors.wireUpgraded : CONFIG.colors.powerOn, 10);
            updatePowerGrid();
            setSystemMsg(`已建造 (-$${cost})`, "normal", true);
        }
 
        function spawnEntity(forcedType = null) {
            let attempts = 0;
            const maxAttempts = 100; 
            let currentMinDist = CONFIG.minEntityDist + 10;
            let x, y;
            const worldViewW = width / currentScale;
            const worldViewH = height / currentScale;
 
            do {
                attempts++;
                if (attempts > 50) currentMinDist = CONFIG.minEntityDist * 0.7;
                x = (Math.random() - 0.5) * worldViewW;
                y = (Math.random() - 0.5) * worldViewH;
                if (!isPositionClear(x, y, currentMinDist)) continue;
                if (Math.hypot(x, y) < 150) continue;
                let hitWire = false;
                for (let l of links) {
                    if (distToSegment({x, y}, l.from, l.to) < 20) { hitWire = true; break; }
                }
                if (hitWire) continue;
                break;
            } while (attempts < maxAttempts);
 
            if (attempts >= maxAttempts) return; 
             
            let type = forcedType || 'house';
 
            houses.push({ 
                x: x, y: y, 
                type: type, 
                powered: false, 
                patience: CONFIG.houseMaxPatience, 
                id: Math.random(), 
                spawnScale: 0,
                load: type === 'factory' ? CONFIG.factoryLoad : 1, 
                currentLoad: type === 'commercial' ? CONFIG.commBaseLoad : 1, 
                phase: Math.random() * Math.PI * 2 
            }); 
             
            if (type === 'factory') {
                 setSystemMsg("警告: 检测到工业区", "warning", true);
                 createShockwave(x, y, CONFIG.colors.factory);
            } else if (type === 'commercial') {
                 setSystemMsg("新商业区", "normal", true);
                 createShockwave(x, y, CONFIG.colors.comm);
            }
             
            totalSpawns++;
        }

        // --- NEW: Calculate effective capacity for different energy sources ---
        function checkAchievements() {
            const population = houses.length;

            // Power Pioneer: Reach 100 population
            if (!gameState.achievements.powerPioneer.unlocked && population >= CONFIG.achievementPowerPioneerPop) {
                gameState.achievements.powerPioneer.unlocked = true;
                money += CONFIG.achievementPowerPioneerReward;
                setSystemMsg(`🏆 成就解锁：电力先驱！获得 ${CONFIG.achievementPowerPioneerReward}`, "success", true);
                createExplosion(0, 0, '#ffd700', 40);
            }

            // Clean Energy Master: Clean energy ratio >= 70%
            if (!gameState.achievements.cleanEnergyMaster.unlocked) {
                const cleanEnergySources = sources.filter(s =>
                    ['wind', 'solar'].includes(s.variant)
                ).length;
                const totalSources = sources.length;
                const cleanRatio = totalSources > 0 ? cleanEnergySources / totalSources : 0;

                if (cleanRatio >= CONFIG.achievementCleanEnergyRatio) {
                    gameState.achievements.cleanEnergyMaster.unlocked = true;
                    // Apply discount
                    CONFIG.costWind *= (1 - CONFIG.achievementCleanEnergyDiscount);
                    CONFIG.costSolar *= (1 - CONFIG.achievementCleanEnergyDiscount);
                    setSystemMsg(`🏆 成就解锁：清洁能源大师！风力/太阳能成本-10%`, "success", true);
                    createExplosion(0, 0, '#88ffff', 40);
                }
            }

            // Crisis Expert: Survive 5 disasters
            if (!gameState.achievements.crisisExpert.unlocked && gameState.records.disasterCount >= CONFIG.achievementCrisisExpertCount) {
                gameState.achievements.crisisExpert.unlocked = true;
                CONFIG.costRepairStation *= (1 - CONFIG.achievementCrisisExpertDiscount);
                setSystemMsg(`🏆 成就解锁：危机处理专家！维修站成本-20%`, "success", true);
                createExplosion(0, 0, '#ff8800', 40);
            }
        }

        function checkTechUnlock() {
            // Smart Grid: Total earnings >= 100,000
            if (!gameState.unlockedTech.includes('smartGrid') && gameState.records.totalEarnings >= CONFIG.techSmartGridCost) {
                gameState.unlockedTech.push('smartGrid');
                setSystemMsg(`🔬 科技解锁：智能电网！过载风险-15%`, "success", true);
                createExplosion(0, 0, '#00ff00', 40);
            }

            // Nuclear Tech: 5 nuclear plants
            if (!gameState.unlockedTech.includes('nuclearTech')) {
                const nuclearCount = sources.filter(s => s.variant === 'nuclear').length;
                if (nuclearCount >= CONFIG.techNuclearTechRequirement) {
                    gameState.unlockedTech.push('nuclearTech');
                    CONFIG.nuclearFailureChance = CONFIG.techNuclearTechFailureRate;
                    setSystemMsg(`🔬 科技解锁：核技术升级！故障率降至2%/分钟`, "success", true);
                    createExplosion(0, 0, '#00ff66', 40);
                }
            }
        }

        function runSystemCheck() {
            const issues = [];

            // Check for overload risk links
            links.forEach(link => {
                if (link.active) {
                    const limit = link.maxLoad || CONFIG.baseWireLoad;
                    const loadRatio = link.load / limit;
                    if (loadRatio > 0.8) {
                        issues.push({
                            type: 'overload',
                            item: link,
                            message: `链路过载风险 (${(loadRatio * 100).toFixed(0)}%)`,
                            severity: loadRatio > 0.95 ? 'critical' : 'warning'
                        });
                    }
                }
            });

            // Check for low efficiency sources
            sources.forEach(source => {
                const effectiveCapacity = getEffectiveCapacity(source);
                if (effectiveCapacity > 0 && source.load > effectiveCapacity * 0.9) {
                    issues.push({
                        type: 'overload',
                        item: source,
                        message: `${source.variant === 'plant' ? '电厂' : source.variant === 'nuclear' ? '核电站' : source.variant === 'wind' ? '风力电站' : source.variant === 'solar' ? '太阳能电站' : '设施'}过载`,
                        severity: source.load > effectiveCapacity ? 'critical' : 'warning'
                    });
                }
            });

            // Check for nuclear cooling issues
            sources.filter(s => s.variant === 'nuclear').forEach(nuclear => {
                if (!nuclear.coolingSatisfied) {
                    issues.push({
                        type: 'cooling',
                        item: nuclear,
                        message: '核电站冷却不足',
                        severity: 'critical'
                    });
                }
            });

            // Check for damaged infrastructure
            pylons.filter(p => p.isDamaged).forEach(pylon => {
                issues.push({
                    type: 'damaged',
                    item: pylon,
                    message: '电塔受损',
                    severity: 'critical'
                });
            });

            links.filter(l => l.isDamaged).forEach(link => {
                issues.push({
                    type: 'damaged',
                    item: link,
                    message: '链路损坏',
                    severity: 'critical'
                });
            });

            // Check for nuclear repair needs
            sources.filter(s => s.variant === 'nuclear' && s.needsRepair).forEach(nuclear => {
                issues.push({
                    type: 'repair',
                    item: nuclear,
                    message: '核电站需要维修',
                    severity: 'critical'
                });
            });

            // Store issues for highlighting
            gameState.highlightedIssues = issues;

            // Report results
            if (issues.length === 0) {
                setSystemMsg("✅ 系统检测完成：未发现问题", "success", true);
            } else {
                const criticalCount = issues.filter(i => i.severity === 'critical').length;
                const warningCount = issues.filter(i => i.severity === 'warning').length;
                setSystemMsg(`⚠️ 系统检测完成：发现 ${issues.length} 个问题 (${criticalCount} 个严重, ${warningCount} 个警告)`, "warning", true);
            }

            // Clear highlighting after 5 seconds
            setTimeout(() => {
                gameState.highlightedIssues = [];
            }, 5000);
        }

        function updateRecords() {
            // Update max population
            if (houses.length > gameState.records.maxPopulation) {
                gameState.records.maxPopulation = houses.length;
            }

            // Update current uptime
            if (gameState.lastFailureTime === 0) {
                gameState.records.currentUptime = gameTime;
            } else {
                gameState.records.currentUptime = gameTime - gameState.lastFailureTime;
            }

            // Update longest uptime
            if (gameState.records.currentUptime > gameState.records.longestUptime) {
                gameState.records.longestUptime = gameState.records.currentUptime;
            }

            // Save to localStorage
            localStorage.setItem('neonGridRecords', JSON.stringify(gameState.records));
        }

        function formatTime(ms) {
            if (!ms) return '0秒';
            const seconds = Math.floor(ms / 1000);
            const minutes = Math.floor(seconds / 60);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);

            if (days > 0) return `${days}天${hours % 24}小时`;
            if (hours > 0) return `${hours}小时${minutes % 60}分钟`;
            if (minutes > 0) return `${minutes}分钟${seconds % 60}秒`;
            return `${seconds}秒`;
        }

        function showLeaderboard() {
            const records = JSON.parse(localStorage.getItem('neonGridRecords')) || {
                maxPopulation: 0,
                longestUptime: 0,
                totalEarnings: 0,
                disasterCount: 0
            };

            const modal = document.createElement('div');
            modal.className = 'leaderboard-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h2>🏆 排行榜</h2>
                    <div class="record-row">
                        <span class="record-label">最高人口</span>
                        <span class="record-value">${records.maxPopulation}</span>
                    </div>
                    <div class="record-row">
                        <span class="record-label">最长无故障运行</span>
                        <span class="record-value">${formatTime(records.longestUptime)}</span>
                    </div>
                    <div class="record-row">
                        <span class="record-label">当前无故障运行</span>
                        <span class="record-value">${formatTime(gameState.records.currentUptime)}</span>
                    </div>
                    <div class="record-row">
                        <span class="record-label">应对自然灾害</span>
                        <span class="record-value">${records.disasterCount} 次</span>
                    </div>
                    <button class="close-btn" onclick="this.closest('.leaderboard-modal').remove()">关闭</button>
                </div>
            `;

            document.body.appendChild(modal);
        }

        function takeGridSnapshot() {
            // Create temporary canvas for snapshot
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d');

            // Draw game画面
            tempCtx.drawImage(canvas, 0, 0);

            // Add statistics overlay
            tempCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            tempCtx.fillRect(10, 10, 300, 140);
            tempCtx.strokeStyle = '#00ffff';
            tempCtx.lineWidth = 2;
            tempCtx.strokeRect(10, 10, 300, 140);

            tempCtx.fillStyle = '#00ff00';
            tempCtx.font = 'bold 18px Arial';
            tempCtx.fillText('Neon Grid 电力网格', 25, 40);

            tempCtx.fillStyle = '#ffffff';
            tempCtx.font = '14px Arial';
            tempCtx.fillText(`人口: ${houses.length}`, 25, 65);
            tempCtx.fillText(`资金: $${money.toFixed(2)}`, 25, 85);
            tempCtx.fillText(`秒赚: $${currentNetIncome.toFixed(2)}/s`, 25, 105);
            tempCtx.fillText(`覆盖率: ${Math.floor(calculateCoverage())}%`, 25, 125);

            // Download snapshot
            const link = document.createElement('a');
            link.download = `neon-grid-snapshot-${Date.now()}.png`;
            link.href = tempCanvas.toDataURL();
            link.click();

            setSystemMsg("电网快照已保存！", "success");
        }

        function upgradeNuclearMaintenance(nuclear) {
            if (money >= CONFIG.nuclearMaintenanceUpgradeCost) {
                money -= CONFIG.nuclearMaintenanceUpgradeCost;
                nuclear.maintenanceMode = true;
                nuclear.maintenanceEndTime = gameState.gameTime + CONFIG.nuclearMaintenanceDuration;
                nuclear.maintenanceCostMultiplier = 2.0;
                setSystemMsg("核电站维护已启动，容量衰减暂停1小时", "success");
                createExplosion(nuclear.x, nuclear.y, '#00ff66', 25);
            } else {
                setSystemMsg("资金不足，需要$" + CONFIG.nuclearMaintenanceUpgradeCost, "warning");
            }
        }

        function getEffectiveCapacity(source) {
            let effectiveCapacity = source.capacity;

            // Apply wind speed multiplier
            if (source.variant === 'wind' && source.windSpeedMultiplier) {
                effectiveCapacity *= source.windSpeedMultiplier;
            }

            // Apply solar efficiency based on time of day
            if (source.variant === 'solar') {
                const hour = gameState.gameDate;
                if (hour >= CONFIG.solarDayStart && hour < CONFIG.solarDayEnd) {
                    // Daytime: 100% efficiency
                    effectiveCapacity *= 1.0;
                } else if ((hour >= CONFIG.solarDayStart - CONFIG.solarDawnDuration && hour < CONFIG.solarDayStart) ||
                           (hour >= CONFIG.solarDayEnd && hour < CONFIG.solarDayEnd + CONFIG.solarDuskDuration)) {
                    // Dawn/Dusk: 50% efficiency
                    effectiveCapacity *= 0.5;
                } else {
                    // Nighttime: 0% efficiency (or 20% if upgraded)
                    if (source.hasStorageUpgrade) {
                        effectiveCapacity *= CONFIG.solarStorageEfficiency;
                    } else {
                        effectiveCapacity = 0;
                    }
                }
            }

            // Apply nuclear maintenance mode
            if (source.variant === 'nuclear' && source.maintenanceMode) {
                effectiveCapacity = 0; // No power during maintenance
            }

            // Apply under-maintenance status
            if (source.underMaintenance) {
                effectiveCapacity = 0; // No power during maintenance
            }

            // Apply efficiency bonus (from maintenance completion)
            if (source.efficiencyBonus) {
                effectiveCapacity *= source.efficiencyBonus;
            }

            return effectiveCapacity;
        }

        function updatePowerGrid(silent = false) {
            const prevPowered = new Set();
            pylons.forEach(p => { if(p.powered) prevPowered.add(p); p.powered = false; });
            houses.forEach(h => { if(h.powered) prevPowered.add(h); h.powered = false; });
            batteries.forEach(b => { if(b.powered) prevPowered.add(b); b.powered = false; });
            links.forEach(l => { l.active = false; l.load = 0; });
            sources.forEach(s => s.load = 0); 
 
            let queue = [];
            let visited = new Map(); 
 
            sources.forEach(s => {
                // Check if nuclear needs repair
                if (s.needsRepair) return;
                
                queue.push({ node: s, depth: 0, sourceRoot: s });
                visited.set(s, { depth: 0, parentLink: null });
            });
 
            while (queue.length > 0) {
                let currentObj = queue.shift();
                let u = currentObj.node;
 
                for (let link of links) {
                    // Skip damaged links
                    if (link.isDamaged) continue;

                    let v = (link.from === u) ? link.to : (link.to === u ? link.from : null);
                    if (v) {
                        // Skip damaged towers
                        if (v.type === 'pylon' && v.isDamaged) continue;

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
 
            let nodesByDepth = Array.from(visited.keys()).sort((a, b) => visited.get(b).depth - visited.get(a).depth);
            for (let node of nodesByDepth) {
                if (node.type === 'source' || node.type === 'tower') continue;
                const feedLink = visited.get(node).parentLink;
                if (feedLink) {
                    // Calculate load based on node type
                    let nodeLoad = 0;
                    if (node.type === 'house') nodeLoad = 1;
                    else if (node.type === 'factory') nodeLoad = CONFIG.factoryLoad;
                    else if (node.type === 'commercial') {
                        let baseLoad = node.currentLoad || CONFIG.commBaseLoad;
                        // NEW: Peak hour increases commercial load
                        if (isPeakHour && Math.random() < 0.3) {
                            baseLoad *= CONFIG.peakHourMultiplier;
                        }
                        nodeLoad = baseLoad;
                    }
                    else if (node.type === 'battery') nodeLoad = node.targetLoad || 0;

                    // NEW: Peak hour increases all loads
                    if (isPeakHour) {
                        nodeLoad *= CONFIG.peakHourMultiplier;
                    }

                    let totalLoad = nodeLoad + (node.accumulatedLoad || 0);

                    // Apply transmission loss (load increases due to loss)
                    if (feedLink.loss > 0) {
                        totalLoad = totalLoad / (1 - feedLink.loss); // Increase load to compensate for loss
                    }

                    feedLink.load += totalLoad;
                    let parentNode = (feedLink.from === node) ? feedLink.to : feedLink.from;
                    if (parentNode.type === 'source' || parentNode.type === 'tower') parentNode.load += totalLoad;
                    else {
                        parentNode.accumulatedLoad = (parentNode.accumulatedLoad || 0) + totalLoad;
                    }
                }
                node.accumulatedLoad = 0;
            }
 
            if (!silent) {
                houses.forEach(h => { 
                    if (h.powered && !prevPowered.has(h)) {
                        let col = CONFIG.colors.houseHappy;
                        if(h.type === 'factory') col = CONFIG.colors.factoryHappy;
                        if(h.type === 'commercial') col = CONFIG.colors.commHappy;
                        createExplosion(h.x, h.y, col, h.type === 'house' ? 8 : 15); 
                    }
                });
            }
        }
 
        function update(timestamp) {
            if (!lastTime) lastTime = timestamp;
                    const dt = (timestamp - lastTime) * timeScale;
                    lastTime = timestamp;
                    gameTime += dt;

                    // --- Game Time System (24-hour cycle) ---
                    gameState.gameTime = gameTime;
                    gameState.gameDate = (gameState.gameDate + dt / 60000) % 24; // 每分钟推进1分钟游戏时间
                    gameState.gameDays = Math.floor(gameTime / (24 * 60 * 1000));

                    updateViewBounds();
        
                    if (currentScale > CONFIG.minScale) {
                        const currentWorldWidth = width / currentScale;
                        const newWorldWidth = currentWorldWidth + (CONFIG.viewExpansionRate * dt);
                        currentScale = width / newWorldWidth;
                        if (currentScale < CONFIG.minScale) currentScale = CONFIG.minScale;
                    }
        
                    if (gameOver) return;
        
                    // --- REPLAY SYSTEM UPDATE ---
                    if (gameTime - lastSnapshotTime > 1000) {
                        takeSnapshot();
                        lastSnapshotTime = gameTime;
                        // Update records every second
                        updateRecords();
                        // Check achievements every second
                        checkAchievements();
                        // Check tech unlocks every second
                        checkTechUnlock();
                    }
        
                    // --- NEW: Peak Hour System ---
                    if (gameTime - lastPeakHourTime > CONFIG.peakHourInterval) {
                        lastPeakHourTime = gameTime;
                        isPeakHour = true;
                        setSystemMsg("⚡ 用电高峰时段！用电需求+50%", "warning", true);
                        setTimeout(() => {
                            isPeakHour = false;
                            setSystemMsg("用电高峰结束", "success", true);
                        }, CONFIG.peakHourDuration);
                    }
        
                    // --- NEW: Nuclear Risk & Decay System ---
                    if (gameTime - nuclearCheckTime > 60000) { // Check every minute
                        nuclearCheckTime = gameTime;
                        sources.forEach(s => {
                            if (s.variant === 'nuclear') {
                                // Check cooling system
                                const connectedBatteries = links
                                    .filter(l => l.from === s.id || l.to === s.id)
                                    .map(l => {
                                        const batteryId = l.from === s.id ? l.to : l.from;
                                        return batteries.find(b => b.id === batteryId);
                                    })
                                    .filter(b => b !== undefined && b.powered)
                                    .length;

                                s.coolingBatteries = connectedBatteries;
                                s.coolingSatisfied = connectedBatteries >= CONFIG.nuclearCoolingBatteryCount;

                                if (!s.coolingSatisfied) {
                                    s.failureChance = CONFIG.nuclearCoolingFailureRate;
                                } else {
                                    s.failureChance = CONFIG.nuclearFailureChance;
                                }

                                // Random failure chance
                                if (Math.random() < s.failureChance) {
                                    s.needsRepair = true;
                                    const reason = !s.coolingSatisfied ? "冷却不足" : "系统故障";
                                    setSystemMsg(`⚠️ 核电站${reason}！需要维修！`, "warning", true);
                                }
                            }
                        });
                    }

                    // --- NEW: Wind Power Speed Events ---
                    if (gameTime - nuclearCheckTime > 60000) { // Check every minute
                        sources.filter(s => s.variant === 'wind').forEach(wind => {
                            if (Math.random() < CONFIG.windSpeedEventChance) { // 10% chance
                                const isNight = gameState.gameDate >= 20 || gameState.gameDate < 6;
                                if (isNight) {
                                    wind.windSpeedMultiplier = 1.0; // Night is stable
                                } else {
                                    const event = Math.random() < 0.5 ? 'high' : 'low';
                                    wind.windSpeedMultiplier = event === 'high' ? 1.8 : 0.5;
                                    setSystemMsg(`风速${event === 'high' ? '提升' : '降低'}！效率${event === 'high' ? '+80%' : '-50%'}`, event === 'high' ? 'success' : 'warning', true);
                                    createExplosion(wind.x, wind.y, event === 'high' ? '#88ffff' : '#ff8888', 15);
                                }
                            }
                        });
                    }

                    // --- NEW: Low Demand Event ---
                    const population = houses.length;
                    const isPeakHour = gameState.gameDate >= 18 && gameState.gameDate <= 22;
                    if (population < 200 && !isPeakHour && gameState.activeEvents.length === 0) {
                        if (Math.random() < CONFIG.lowDemandEventChance) { // 30% chance
                            gameState.activeEvents.push({
                                type: 'lowDemand',
                                startTime: gameState.gameTime,
                                duration: 300000, // 5 minutes
                                batteryChargeBonus: 1.2
                            });
                            setSystemMsg("用电低谷期！电池充电效率+20%", "info", true);
                            createExplosion(0, 0, '#00ffaa', 30);
                        }
                    }

                    // --- Clean up expired events ---
                    gameState.activeEvents = gameState.activeEvents.filter(event => {
                        if (gameState.gameTime - event.startTime > event.duration) {
                            if (event.type === 'lowDemand') {
                                setSystemMsg("用电低谷期结束", "info", true);
                            }
                            return false;
                        }
                        return true;
                    });

                    // --- NEW: Maintenance Event ---
                    sources.forEach(source => {
                        if (source.underMaintenance) {
                            // Check if maintenance is complete
                            if (gameTime >= source.maintenanceEndTime) {
                                source.underMaintenance = false;
                                source.efficiencyBonus = source.efficiencyBonus || 1.1; // 10% efficiency boost
                                setSystemMsg(`${source.variant === 'plant' ? '电厂' : source.variant === 'wind' ? '风力电站' : source.variant === 'solar' ? '太阳能电站' : '核电站'}检修完成，效率+10%`, "success", true);
                                createExplosion(source.x, source.y, '#00ff66', 20);
                            }
                        } else if (source.builtTime && !source.maintenanceMode) {
                            const runningTime = gameState.gameTime - source.builtTime;
                            if (runningTime > 3600000) { // Running more than 1 hour
                                if (Math.random() < CONFIG.maintenanceEventChance) { // 5% chance per minute
                                    source.underMaintenance = true;
                                    source.maintenanceEndTime = gameState.gameTime + 30000; // 30 seconds
                                    setSystemMsg(`${source.variant === 'plant' ? '电厂' : source.variant === 'wind' ? '风力电站' : source.variant === 'solar' ? '太阳能电站' : '核电站'}需要检修，临时关闭30秒`, "warning", true);
                                    createExplosion(source.x, source.y, '#ffaa00', 15);
                                }
                            }
                        }
                    });

                    // --- NEW: Natural Disaster Event ---
                    if (population > CONFIG.disasterPopThreshold && gameState.activeEvents.length === 0) {
                        if (Math.random() < CONFIG.disasterEventChance) { // 1% chance per minute
                            const disasterType = Math.random() < 0.5 ? 'storm' : 'typhoon';
                            const disasterName = disasterType === 'storm' ? '暴雨' : '台风';
                            gameState.activeEvents.push({
                                type: disasterType,
                                startTime: gameState.gameTime,
                                duration: 600000, // 10 minutes
                                linkDamageChance: 0.3
                            });
                            setSystemMsg(`灾害预警：${disasterName}来袭！加固电塔！`, "error", true);
                            createExplosion(0, 0, '#ff3333', 40);
                            gameState.records.disasterCount++;
                        }
                    }

                    // Handle disaster damage
                    const disaster = gameState.activeEvents.find(e => e.type === 'storm' || e.type === 'typhoon');
                    if (disaster) {
                        pylons.forEach(pylon => {
                            if (Math.random() < disaster.linkDamageChance * 0.01) { // Check every frame
                                pylon.isDamaged = true;
                                createExplosion(pylon.x, pylon.y, '#ff8800', 15);
                            }
                        });
                    }
        
                    if (gameTime - nuclearDecayCheckTime > 3600000) { // Every hour
                        nuclearDecayCheckTime = gameTime;
                        sources.forEach(s => {
                            if (s.variant === 'nuclear') {
                                // Skip decay if in maintenance mode
                                if (s.maintenanceMode) {
                                    return;
                                }
                                s.capacity = Math.max(10, s.capacity - CONFIG.nuclearDecayRate);
                                if (s.capacity < CONFIG.nuclearCapacity * 0.5) {
                                    setSystemMsg("⚠️ 核电站性能下降，需要维护", "warning", true);
                                }
                            }
                        });
                    }

                    // --- NEW: Nuclear Maintenance End Check ---
                    sources.forEach(s => {
                        if (s.variant === 'nuclear' && s.maintenanceMode) {
                            if (gameTime >= s.maintenanceEndTime) {
                                s.maintenanceMode = false;
                                s.maintenanceCostMultiplier = 1.0;
                                setSystemMsg("核电站维护完成，恢复正常运行", "success");
                                createExplosion(s.x, s.y, '#00ff66', 20);
                            }
                        }
                    });

                    // --- NEW: Achievement System ---
                    checkAchievements();

                    // --- NEW: Tech Tree System ---
                    checkTechUnlock();
        
                    // --- 1. Dynamic Load Update (Commercial) ---
                    houses.forEach(h => {
                        if (h.type === 'commercial') {
                            const sineVal = (Math.sin((gameTime * 0.001) + h.phase) + 1) / 2; 
                            h.currentLoad = CONFIG.commBaseLoad + (sineVal * (CONFIG.commPeakLoad - CONFIG.commBaseLoad));
                        }
                    });
        
                    // --- 2. Battery Control Logic ---
                    let gridStressed = false;
                    let gridRelaxed = true;

                    // Update cascade cooldowns
                    links.forEach(l => {
                        if (l.cascadeCooldown > 0) {
                            l.cascadeCooldown -= dt;
                            if (l.cascadeCooldown < 0) l.cascadeCooldown = 0;
                        }
                    });

                    // Calculate energy storage station bonuses
                    let capacityMultiplier = 1.0;
                    let chargeRateMultiplier = 1.0;
                    sources.filter(s => s.variant === 'energystorage').forEach(station => {
                        capacityMultiplier = station.capacityMultiplier;
                        chargeRateMultiplier = station.chargeRateMultiplier;
                    });

                    sources.forEach(s => {
                        const effectiveCapacity = getEffectiveCapacity(s);
                        if (s.heat > 0 || s.load > effectiveCapacity * 0.95) {
                            gridStressed = true;
                            gridRelaxed = false;
                        } else if (s.load > effectiveCapacity * 0.8) {
                            gridRelaxed = false;
                        }
                    });
        
                    batteries.forEach(b => {
                        if (!b.powered) {
                            b.targetLoad = 0; b.currentOp = 'idle';
                            return;
                        }

                        // Apply energy storage station bonuses
                        const actualMaxEnergy = b.maxEnergy * capacityMultiplier;
                        const actualChargeRate = CONFIG.batteryChargeRate * chargeRateMultiplier;
                        const actualDischargeRate = CONFIG.batteryDischargeRate * chargeRateMultiplier;

                        if (gridStressed && b.energy > 0) {
                            b.currentOp = 'discharge';
                            b.targetLoad = -actualDischargeRate;
                            b.energy -= (actualDischargeRate * 0.05 * timeScale);
                            if (b.energy < 0) b.energy = 0;
                            if (Math.random() < 0.1 * timeScale) {
                                particles.push({ x: b.x, y: b.y, vx: 0, vy: -2, life: 0.4, decay: 0.05, color: '#ffff00', size: 2 });
                            }
                        } else if (gridRelaxed && b.energy < actualMaxEnergy) {
                            b.currentOp = 'charge';
                            // Check for low demand event bonus
                            const lowDemandEvent = gameState.activeEvents.find(e => e.type === 'lowDemand');
                            const chargeBonus = lowDemandEvent ? lowDemandEvent.batteryChargeBonus : 1.0;

                            b.targetLoad = actualChargeRate * chargeBonus;
                            b.energy += (actualChargeRate * chargeBonus * 0.05 * timeScale);
                            if (b.energy > actualMaxEnergy) b.energy = actualMaxEnergy;
                        } else {
                            b.currentOp = 'idle';
                            b.targetLoad = 0;
                        }
                    });
        
                    // --- NEW: Enhanced Economy System ---
                    if (gameTime - lastIncomeGameTime > CONFIG.economyTickRate) {
                        const totalPop = houses.length;
                        const coverage = calculateCoverage();

                        let income = CONFIG.baseSubsidy;

                        // Subsidy scaling
                        if (money < CONFIG.subsidyThreshold) {
                            income *= 2; // Double subsidy for early game
                        } else if (totalPop > CONFIG.subsidyCancelPop) {
                            income = 0; // No subsidy in late game
                        }

                        // Clean energy subsidy
                        const cleanEnergySources = sources.filter(s =>
                            ['wind', 'solar'].includes(s.variant)
                        ).length;
                        const totalSources = sources.length;
                        const cleanEnergyRatio = totalSources > 0 ? cleanEnergySources / totalSources : 0;

                        if (cleanEnergyRatio >= CONFIG.cleanEnergySubsidyThreshold &&
                            gameState.gameDays > gameState.lastSubsidyDay) {
                            gameState.lastSubsidyDay = gameState.gameDays;
                            const dailyIncome = currentNetIncome * 60 * 24; // Daily income estimate
                            const subsidy = Math.abs(dailyIncome) * 0.5; // 50% of daily income
                            money += subsidy;
                            setSystemMsg(`政策补贴：清洁能源占比${(cleanEnergyRatio * 100).toFixed(0)}%，获得 $${subsidy.toFixed(2)}`, "success", true);
                        }

                        houses.forEach(h => {
                            if (h.powered) {
                                let val = CONFIG.incomePerHouse;
                                if (h.type === 'factory') val = CONFIG.incomePerFactory;
                                if (h.type === 'commercial') val = CONFIG.incomePerComm;

                                // Tiered pricing bonus
                                if (coverage >= 100) val *= 1.2;
                                else if (coverage < 50) val *= 0.5;

                                income += val;
                            }
                        });
                         
                        let upkeep = 0;
                        const plantCount = sources.filter(s => s.variant !== 'nuclear' && s.variant !== 'wind' && s.variant !== 'solar').length;

                        // Calculate maintenance reduction from repair stations
                        let maintenanceReduction = 0;
                        sources.filter(s => s.variant === 'repair').forEach(station => {
                            maintenanceReduction += station.maintenanceReduction;
                        });
                        // Cap reduction at 50%
                        maintenanceReduction = Math.min(0.5, maintenanceReduction);

                        sources.forEach((s, index) => {
                            let plantUpkeep = (s.variant === 'nuclear' ? CONFIG.nuclearUpkeep : (s.upkeep || CONFIG.upkeepPerPlant));

                            // Apply maintenance reduction
                            plantUpkeep *= (1 - maintenanceReduction);

                            // Maintenance scaling
                            if (plantCount > CONFIG.maintenanceScaleThreshold && index >= CONFIG.maintenanceScaleThreshold - 1) {
                                plantUpkeep *= CONFIG.maintenanceScaleMultiplier;
                            }

                            upkeep += plantUpkeep;
                        });
                         
                        income -= upkeep;
                        currentNetIncome = income;
                        money += currentNetIncome;
                        lastIncomeGameTime = gameTime;

                        // Update total earnings for tech tree
                        if (currentNetIncome > 0) {
                            gameState.records.totalEarnings += currentNetIncome;
                        }
                    }
        
                    // --- SPAWNING LOGIC (Fixed Intervals) ---
                    const totalPop = houses.length + pylons.length + batteries.length; 
                    
                    // Game phase detection
                    let gamePhase = 'early';
                    if (totalPop >= CONFIG.midGamePop) gamePhase = 'late';
                    else if (totalPop >= CONFIG.earlyGamePop) gamePhase = 'mid';
                     
                    // Adjust House Spawn Rate dynamically to maintain pacing
                    let currentHouseSpawnRate = CONFIG.spawnRate; // 8000
                    if (totalPop >= CONFIG.commUnlockPop) currentHouseSpawnRate = 12000; // Slow down to 12s
                    else if (totalPop >= CONFIG.factoryUnlockPop) currentHouseSpawnRate = 10000; // Slow down to 10s
                     
                    // 1. Houses
                    if (gameTime - lastSpawnGameTime > currentHouseSpawnRate) {
                        spawnEntity('house');
                        lastSpawnGameTime = gameTime;
                    }
                     
                    // 2. Factories (faster in late game)
                    let factoryRate = CONFIG.factorySpawnRate;
                    if (gamePhase === 'late') factoryRate *= 0.7; // 30% faster
                    if (totalPop >= CONFIG.factoryUnlockPop && gameTime - lastFactorySpawnTime > factoryRate) {
                        spawnEntity('factory');
                        lastFactorySpawnTime = gameTime;
                    }
                     
                    // 3. Commercial (faster in late game, more peak load)
                    let commRate = CONFIG.commSpawnRate;
                    if (gamePhase === 'late') commRate *= 0.6; // 40% faster
                    if (totalPop >= CONFIG.commUnlockPop && gameTime - lastCommSpawnTime > commRate) {
                        spawnEntity('commercial');
                        lastCommSpawnTime = gameTime;
                    }
        
                    // Animation & Physics
                    const animSpeed = 0.05 * timeScale * (60/16); 
                    [sources, pylons, houses, batteries].forEach(arr => {
                        arr.forEach(e => {
                            if (e.spawnScale < 1) {
                                e.spawnScale += (1 - e.spawnScale) * 0.1; 
                                if (e.spawnScale > 0.99) e.spawnScale = 1;
                            }
                        });
                    });
        
                    links.forEach(l => {
                        if (l.spawnProgress < 1) {
                            l.spawnProgress += 0.1; 
                            if (l.spawnProgress > 1) l.spawnProgress = 1;
                        }
                    });
        
                    isCriticalState = false;
        
                    sources.forEach(s => {
                        const effectiveCapacity = getEffectiveCapacity(s);
                        s.displayLoad = (s.displayLoad || 0) + (s.load - (s.displayLoad || 0)) * 0.1;
                        s.rotation = (s.rotation || 0) + (0.01 + (s.displayLoad / effectiveCapacity) * 0.05) * timeScale;

                        if (s.load > effectiveCapacity) {
                            s.heat += CONFIG.overheatSpeed * 2 * timeScale;
                            if (timeScale > 0 && Math.random() < 0.1) particles.push({ x: s.x, y: s.y, vx: 0, vy: -2, life: 0.6, decay: 0.05, color: '#ff0000', size: 2 });
                        } else if (s.heat > 0) s.heat -= 0.5 * timeScale;

                        if (s.heat > 80) isCriticalState = true;

                        if (s.heat >= CONFIG.maxHeat) {
                            triggerGameOver("发电机核心熔毁。");
                        }
                    });
        
                    let brokenLinks = [];
                    links.forEach(l => {
                        const limit = l.maxLoad || CONFIG.baseWireLoad;
                        if (l.active) {
                            if (l.load > limit) {
                                l.heat += CONFIG.overheatSpeed * timeScale;
                            } else if (l.heat > 0) l.heat -= 0.2 * timeScale;
        
                            if (l.heat >= CONFIG.maxHeat) {
                                brokenLinks.push(l);
                                createExplosion((l.from.x+l.to.x)/2, (l.from.y+l.to.y)/2, '#ff5500', 20);
                                createShockwave((l.from.x+l.to.x)/2, (l.from.y+l.to.y)/2, '#ff0000');
                                setSystemMsg("警告: 线路故障", "warning", true);
                            }
                        } else l.heat = 0;
                    });
        
                    if (brokenLinks.length > 0) {
                        // Check for cascade failures - DISABLED
                        // brokenLinks.forEach(brokenLink => {
                        //     if (Math.random() < CONFIG.wireCascadeChance) {
                        //         // Find adjacent links
                        //         const adjacentLinks = links.filter(l => {
                        //             return (l.from === brokenLink.from || l.to === brokenLink.to ||
                        //                     l.from === brokenLink.to || l.to === brokenLink.from) &&
                        //                    l !== brokenLink &&
                        //                    !brokenLinks.includes(l) &&
                        //                    l.cascadeCooldown <= 0;
                        //         });

                        //         adjacentLinks.forEach(adjLink => {
                        //             // Trigger cascade overload
                        //             adjLink.heat += CONFIG.maxHeat * 0.7; // Immediate overload
                        //             adjLink.cascadeCooldown = 5000; // 5 second cooldown
                        //             createExplosion((adjLink.from.x + adjLink.to.x) / 2,
                        //                            (adjLink.from.y + adjLink.to.y) / 2,
                        //                            '#ff8800', 15);
                        //         });

                        //         if (adjacentLinks.length > 0) {
                        //             setSystemMsg("链路过载连锁反应！", "error");
                        //         }
                        //     }
                        // });

                        links = links.filter(l => !brokenLinks.includes(l));
                        updatePowerGrid();
                    }
        
                    // NEW: Grace period for angry houses
                    let angryHouses = [];
                    for (let i = houses.length - 1; i >= 0; i--) {
                        let h = houses[i];
                        let alert = false; let critical = false;
                        if (h.powered) {
                            if (h.patience < CONFIG.houseMaxPatience) h.patience += 15 * timeScale;
                            // Remove grace period if powered
                            if (angryGracePeriods.has(h.id)) angryGracePeriods.delete(h.id);
                        } else {
                            h.patience -= 1 * timeScale;
                            if (h.patience < CONFIG.houseMaxPatience * 0.4) alert = true;
                            if (h.patience < CONFIG.houseMaxPatience * 0.3) {
                                critical = true;
                                isCriticalState = true;
                                angryHouses.push(h);
                            }
                        }
                        if (h.patience <= 0) {
                            // Check if still in grace period
                            if (angryGracePeriods.has(h.id) && angryGracePeriods.get(h.id) > Date.now()) {
                                h.patience = CONFIG.houseMaxPatience * 0.3; // Give more time
                                angryGracePeriods.delete(h.id);
                                continue;
                            }
                            
                            h.dead = true; 
                            let col = CONFIG.colors.houseAngry;
                            if(h.type === 'factory') col = CONFIG.colors.factory;
                            if(h.type === 'commercial') col = CONFIG.colors.comm;
                             
                            createExplosion(h.x, h.y, col, 20);
                             
                            // NEW: Track angry count for buffer system
                            const currentAngryCount = angryHouses.length + 1;
                            
                            let msg = "居民离开";
                            if(h.type === 'factory') msg = "工业崩溃";
                            if(h.type === 'commercial') msg = "商业破产";
                             
                            triggerGameOver(`${msg} - 关键故障`);
                            return; // Stop update loop
                        }
                    }
                    h.isAlert = alert; h.isCritical = critical;
                }
            // Dead house removal logic is redundant if game over is triggered, but kept for robustness
            if (houses.some(h => h.dead)) {
                houses = houses.filter(h => !h.dead);
                updatePowerGrid();
            }
 
            for (let i = particles.length - 1; i >= 0; i--) {
                let p = particles[i];
                p.x += p.vx * timeScale; p.y += p.vy * timeScale;
                p.life -= p.decay * timeScale;
                if (p.life <= 0) particles.splice(i, 1);
            }
            updateUI();
            updateSystemUI();
 
        function triggerGameOver(reason) {
            gameOver = true;
            takeSnapshot(); 
            gameOverReason.innerText = reason;
            createExplosion(0, 0, '#ff0000', 50);
             
            // Set slider Range
            replaySlider.max = Math.max(0, gameHistory.length - 1);
            replaySlider.value = 0;
            renderReplayFrame(0);
             
            gameOverScreen.classList.add('active');
        }
 
        function createExplosion(x, y, color, count) {
            if (!isInView(x, y, 100)) return; 
            for(let i=0; i<count; i++) {
                particles.push({ x: x, y: y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, life: 1.0, decay: 0.02 + Math.random() * 0.03, color: color, size: 1 + Math.random() * 3 });
            }
        }
         
        function createShockwave(x, y, color) {
            if (!isInView(x, y, 100)) return;
            particles.push({ x: x, y: y, vx: 0, vy: 0, life: 1.0, decay: 0.05, color: color, size: 0, type: 'shockwave' });
        }
         
        function updateUI() {
            moneyEl.innerText = '$' + Math.floor(money);
            let sign = currentNetIncome >= 0 ? '+' : '';
            incomeEl.innerText = `${sign}$${currentNetIncome.toFixed(2)}/s`;
            incomeEl.style.color = currentNetIncome >= 0 ? '#00ffaa' : '#ff3333';
            const total = houses.length;
            const powered = houses.filter(h => h.powered).length;
            const pct = total === 0 ? 100 : Math.floor((powered/total)*100);
            coverageEl.innerText = pct + '%';
            coverageEl.style.color = pct < 50 ? '#ff3333' : '#00ffff';
            scaleEl.innerText = `${total}`;

            // Update game time display
            const timeDisplay = document.getElementById('time-display');
            if (timeDisplay) {
                const hour = Math.floor(gameState.gameDate);
                const minute = Math.floor((gameState.gameDate - hour) * 60);
                const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

                // Determine time of day icon
                let timeIcon = '🌙';
                if (hour >= 6 && hour < 12) timeIcon = '🌅';
                else if (hour >= 12 && hour < 18) timeIcon = '☀️';
                else if (hour >= 18 && hour < 20) timeIcon = '🌇';

                timeDisplay.innerText = `${timeIcon} ${timeStr}`;

                // Color based on time of day
                if (hour >= 20 || hour < 6) {
                    timeDisplay.style.color = '#88aaff'; // Night
                } else if (hour >= 6 && hour < 8) {
                    timeDisplay.style.color = '#ffcc88'; // Dawn
                } else if (hour >= 8 && hour < 17) {
                    timeDisplay.style.color = '#ffdd44'; // Day
                } else if (hour >= 17 && hour < 20) {
                    timeDisplay.style.color = '#ff8844'; // Dusk
                }
            }
        }
 
        // --- Optimized Rendering ---
        function draw() {
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = CONFIG.colors.bg;
            ctx.fillRect(0, 0, width, height);
             
            ctx.save();
            ctx.translate(cx + viewOffsetX, cy + viewOffsetY);
            ctx.scale(currentScale, currentScale);
             
            // --- 1. Grid ---
            ctx.strokeStyle = CONFIG.colors.grid;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            const gridSz = 50;
            const startX = Math.floor(viewBounds.minX / gridSz) * gridSz;
            const endX = Math.ceil(viewBounds.maxX / gridSz) * gridSz;
            const startY = Math.floor(viewBounds.minY / gridSz) * gridSz;
            const endY = Math.ceil(viewBounds.maxY / gridSz) * gridSz;
             
            for(let x=startX; x<=endX; x+=gridSz) { ctx.moveTo(x, startY); ctx.lineTo(x, endY); }
            for(let y=startY; y<=endY; y+=gridSz) { ctx.moveTo(startX, y); ctx.lineTo(endX, y); }
            ctx.stroke();
            ctx.globalAlpha = 1;
 
            // --- 2. Links (Glow Pass) ---
            ctx.globalCompositeOperation = 'lighter';
            links.forEach(l => {
                if (!isLinkInView(l)) return;
                const limit = l.maxLoad || CONFIG.baseWireLoad;
                 
                if (l === hoveredLink) {
                    // 根据模式显示不同的悬停效果
                    if (isHighVoltageMode && !l.upgraded) {
                        // Shift模式下显示升级预览
                        ctx.strokeStyle = CONFIG.colors.upgradeHighlight;
                        ctx.lineWidth = 12; ctx.globalAlpha = 0.5;
                        ctx.beginPath(); ctx.moveTo(l.from.x, l.from.y); ctx.lineTo(l.to.x, l.to.y); ctx.stroke();
                    } else if (!isHighVoltageMode) {
                        // 默认显示删除预览
                        ctx.strokeStyle = CONFIG.colors.deleteHighlight;
                        ctx.lineWidth = 12; ctx.globalAlpha = 0.5;
                        ctx.beginPath(); ctx.moveTo(l.from.x, l.from.y); ctx.lineTo(l.to.x, l.to.y); ctx.stroke();
                    }
                } else if (l.active) {
                    const loadRatio = Math.min(1.0, l.load / limit);
                     
                    if (l.upgraded) {
                        ctx.strokeStyle = CONFIG.colors.wireUpgradedGlow;
                    } else {
                        const hue = 180 - (loadRatio * 180);
                        ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
                    }
                     
                    if (loadRatio > 0 || l.upgraded) {
                        let thickness = 6 + loadRatio * 6 + Math.sin(Date.now()/200)*2;
                        if (l.upgraded) thickness += 4;
                         
                        ctx.lineWidth = thickness;
                        ctx.globalAlpha = 0.4;
                        ctx.beginPath(); ctx.moveTo(l.from.x, l.from.y); ctx.lineTo(l.to.x, l.to.y); ctx.stroke();
                    }
                }
            });
 
            // --- 3. Links (Core) ---
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1.0;
            links.forEach(l => {
                if (!isLinkInView(l)) return;
                const limit = l.maxLoad || CONFIG.baseWireLoad;
                 
                let endX = l.to.x; let endY = l.to.y;
                if (l.spawnProgress < 1) {
                    endX = l.from.x + (l.to.x - l.from.x) * l.spawnProgress;
                    endY = l.from.y + (l.to.y - l.from.y) * l.spawnProgress;
                }
                ctx.beginPath(); 
                let hue = 180; let lineWidth = 2; let jitter = 0;
                 
                if (l === hoveredLink) {
                    if (isHighVoltageMode && !l.upgraded) {
                        // Shift模式下升级预览
                        ctx.strokeStyle = '#fff'; lineWidth = 3;
                    } else if (!isHighVoltageMode) {
                        // 默认删除预览
                        ctx.strokeStyle = '#ff6666'; lineWidth = 3;
                    } else {
                        // 已升级的线
                        ctx.strokeStyle = l.upgraded ? CONFIG.colors.wireUpgraded : CONFIG.colors.wire;
                        lineWidth = l.upgraded ? 4 : 2;
                    }
                } else {
                    if (l.active) {
                        const loadRatio = Math.min(1.0, l.load / limit);
                         
                        if (l.upgraded) {
                            ctx.strokeStyle = CONFIG.colors.wireUpgraded;
                             lineWidth = 4;
                             if (l.load > limit) {
                                  if (Math.floor(Date.now() / 100) % 2 === 0) ctx.strokeStyle = '#fff';
                                  jitter = 3;
                             }
                        } else {
                            // Standard Wire
                            hue = 180 - (loadRatio * 180);
                            if (l.load > limit) { hue = 0; if (Math.floor(Date.now() / 100) % 2 === 0) hue = 60; lineWidth = 3; jitter = 3; } 
                            else if (loadRatio > 0.8) { lineWidth = 2.5; jitter = 1; }
                            ctx.strokeStyle = `hsl(${hue}, 100%, 75%)`;
                        }
                    } else {
                        ctx.strokeStyle = l.upgraded ? '#5500aa' : CONFIG.colors.wire;
                        if (l.upgraded) lineWidth = 3;
                    }
                    if (l.heat > 0) { jitter += (l.heat / CONFIG.maxHeat) * 5; if (l.heat > CONFIG.maxHeat * 0.5) ctx.strokeStyle = '#ff9999'; }
                }
                 
                ctx.lineWidth = lineWidth; ctx.moveTo(l.from.x, l.from.y);
                if (jitter > 0) {
                    const dist = Math.hypot(l.from.x - endX, l.from.y - endY);
                    const steps = Math.max(1, Math.floor(dist / 40)); 
                    for(let i=1; i<steps; i++) {
                        const t = i / steps;
                        const lx = l.from.x + (endX - l.from.x) * t;
                        const ly = l.from.y + (endY - l.from.y) * t;
                        ctx.lineTo(lx + (Math.random()-0.5)*jitter, ly + (Math.random()-0.5)*jitter);
                    }
                }
                ctx.lineTo(endX, endY); ctx.stroke();
            });
 
            // --- 4. Drag Line ---
            if (input.isDown && dragStartNode) {
                let targetX = input.worldX; let targetY = input.worldY; let isSnap = false;
                if (snapTarget) { targetX = snapTarget.x; targetY = snapTarget.y; isSnap = true; }
                const dist = Math.hypot(targetX - dragStartNode.x, targetY - dragStartNode.y);
                const isValidLen = dist <= CONFIG.maxWireLength && dist > 10;
                 
                const isHV = isHighVoltageMode;
                const costMult = isHV ? CONFIG.costUpgradeMult : 1;
                const wireCost = Math.floor(dist * CONFIG.costWirePerUnit * costMult);
                 
                let estCost = wireCost + (!snapTarget && validBuildPos ? CONFIG.costPylon : 0);
                const canAfford = money >= estCost;
                const isGood = isValidLen && (isSnap || validBuildPos) && !isIntersecting && canAfford;
                const lineColor = isGood ? (isHV ? CONFIG.colors.upgradeHighlight : CONFIG.colors.dragLineValid) : CONFIG.colors.dragLineInvalid;
 
                ctx.beginPath(); ctx.moveTo(dragStartNode.x, dragStartNode.y); ctx.lineTo(targetX, targetY);
                ctx.strokeStyle = lineColor; ctx.lineWidth = 3; ctx.setLineDash(isSnap ? [] : [15, 15]); ctx.stroke(); ctx.setLineDash([]);
                 
                if (isSnap && isGood) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(targetX, targetY, 30, 0, Math.PI*2); ctx.stroke(); }
                 
                ctx.beginPath(); ctx.arc(dragStartNode.x, dragStartNode.y, CONFIG.maxWireLength, 0, Math.PI*2);
                ctx.strokeStyle = isGood ? 'rgba(0, 255, 255, 0.4)' : 'rgba(255, 50, 50, 0.4)';
                ctx.lineWidth = 2; ctx.setLineDash([10, 10]); ctx.lineDashOffset = -Date.now() / 20; ctx.stroke(); ctx.setLineDash([]);
            }
 
            // --- 5. 建筑预览 ---
            if (placementMode && input.worldX !== undefined) {
                let isValid = isPositionClear(input.worldX, input.worldY, 60);

                // Check wind placement restriction
                if (placementMode === 'wind' && CONFIG.windEdgeOnly) {
                    isValid = isValid && isWindPlacementValid(input.worldX, input.worldY);
                }

                let cost = 0;
                if (placementMode === 'plant') cost = CONFIG.costPlant;
                else if (placementMode === 'nuclear') cost = CONFIG.costNuclear;
                else if (placementMode === 'battery') cost = CONFIG.costBattery;
                else if (placementMode === 'wind') cost = CONFIG.costWind;
                else if (placementMode === 'solar') cost = CONFIG.costSolar;
                else if (placementMode === 'tower') cost = 100;

                const canAfford = money >= cost;
                const isGood = isValid && canAfford;

                ctx.globalAlpha = 0.6;
                if (placementMode === 'battery') {
                     ctx.fillStyle = isGood ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
                     ctx.fillRect(input.worldX - 15, input.worldY - 10, 30, 20);
                     ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(input.worldX - 15, input.worldY - 10, 30, 20);
                } else {
                    ctx.beginPath(); ctx.arc(input.worldX, input.worldY, 25, 0, Math.PI*2);
                    ctx.fillStyle = isGood ? (placementMode === 'nuclear' ? 'rgba(0, 255, 100, 0.5)' : 'rgba(0, 255, 0, 0.5)') : 'rgba(255, 0, 0, 0.5)';
                    ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
                }

                // 显示放置范围和覆盖区域
                ctx.globalAlpha = 0.3;
                ctx.setLineDash([5, 5]);

                // Placement buffer (minimum distance)
                ctx.strokeStyle = isGood ? 'rgba(0, 255, 255, 0.5)' : 'rgba(255, 0, 0, 0.5)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(input.worldX, input.worldY, 60, 0, Math.PI * 2);
                ctx.stroke();

                // Coverage radius based on building type
                let coverageRadius = 0;
                let coverageColor = '#00ffff';

                if (placementMode === 'plant' || placementMode === 'nuclear' || placementMode === 'wind' || placementMode === 'solar') {
                    coverageRadius = 200; // Power source coverage
                    coverageColor = '#00ff00';
                } else if (placementMode === 'battery') {
                    coverageRadius = 150; // Battery influence range
                    coverageColor = '#ffff00';
                } else if (placementMode === 'tower') {
                    coverageRadius = 100; // Tower range
                    coverageColor = '#ff00ff';
                }

                if (coverageRadius > 0) {
                    ctx.strokeStyle = isGood ? coverageColor : 'rgba(255, 0, 0, 0.5)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(input.worldX, input.worldY, coverageRadius, 0, Math.PI * 2);
                    ctx.stroke();
                }

                ctx.setLineDash([]);
                ctx.globalAlpha = 1;

                // Show coverage text
                ctx.fillStyle = '#ffffff';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                if (coverageRadius > 0) {
                    ctx.fillText('覆盖范围', input.worldX, input.worldY + coverageRadius + 15);
                }
            }
 
            // --- 6. Entities (Glow) ---
            ctx.globalCompositeOperation = 'lighter';
             
            sources.forEach(s => {
                if (!isInView(s.x, s.y, 50)) return;
                const scale = s.spawnScale || 1;
                ctx.save(); ctx.translate(s.x, s.y); ctx.scale(scale, scale);
                const loadPct = s.load / s.capacity;
                const hue = s.variant === 'nuclear' ? 120 : Math.max(0, 50 - (loadPct * 50));
                ctx.fillStyle = `hsl(${hue}, 100%, 30%)`; 
                const breathe = 1 + Math.sin(Date.now() / 1000) * 0.05 * loadPct;
                ctx.beginPath(); ctx.arc(0, 0, 32 * breathe, 0, Math.PI*2); ctx.fill(); 
                ctx.restore();
            });
            ctx.fillStyle = 'rgba(0, 255, 170, 0.3)'; 
            houses.forEach(h => {
                if (!h.powered || !isInView(h.x, h.y, 30)) return;
                const scale = h.spawnScale || 1;
                ctx.save(); ctx.translate(h.x, h.y); ctx.scale(scale, scale);
                 
                if (h.type === 'factory') {
                    ctx.fillStyle = h.powered ? 'rgba(255, 136, 0, 0.4)' : 'rgba(50, 20, 0, 0.4)';
                    ctx.beginPath(); ctx.rect(-20, -20, 40, 40); ctx.fill();
                } else if (h.type === 'commercial') {
                    ctx.fillStyle = h.powered ? 'rgba(0, 136, 255, 0.4)' : 'rgba(0, 20, 50, 0.4)';
                    ctx.beginPath();
                    for(let i=0; i<6; i++) { const a = i*Math.PI/3; ctx.lineTo(Math.cos(a)*25, Math.sin(a)*25); }
                    ctx.fill();
                } else {
                    ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI*2); ctx.fill();
                }
                ctx.restore();
            });
 
            // --- 7. Entities (Core) ---
            ctx.globalCompositeOperation = 'source-over';
             
            // Batteries
            batteries.forEach(b => {
                if (!isInView(b.x, b.y, 30)) return;
                const scale = b.spawnScale || 1;
                ctx.save(); ctx.translate(b.x, b.y); ctx.scale(scale, scale);
                 
                let color = b.powered ? CONFIG.colors.battery : CONFIG.colors.powerOff;
                if (b.currentOp === 'discharge') color = CONFIG.colors.batteryDraining;
                if (hoveredEntity === b) color = CONFIG.colors.deleteHighlight;
 
                ctx.fillStyle = '#222';
                ctx.fillRect(-15, -10, 30, 20);
                ctx.strokeStyle = color; ctx.lineWidth = 2;
                ctx.strokeRect(-15, -10, 30, 20);
                 
                // Energy Bar
                const pct = b.energy / b.maxEnergy;
                ctx.fillStyle = color;
                ctx.fillRect(-12, -7, 24 * pct, 14);
 
                // Icon / State
                if (b.currentOp === 'charge') {
                    ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.fillText("+", -4, 4);
                } else if (b.currentOp === 'discharge') {
                    ctx.fillStyle = '#000'; ctx.font = '10px monospace'; ctx.fillText("-", -4, 4);
                }
 
                ctx.restore();
            });
 
            // Sources
                        sources.forEach(s => {
                            if (!isInView(s.x, s.y, 50)) return;
                            
                            // Skip tower rendering (rendered with pylons)
                                                        if (s.type === 'tower') return;
                                                        
                                                        const scale = s.spawnScale || 1;
                                                        ctx.save(); ctx.translate(s.x, s.y); ctx.scale(scale, scale);
                                                         
                                                        const isNuc = s.variant === 'nuclear';
                                                        const isWind = s.variant === 'wind';
                                                        const isSolar = s.variant === 'solar';
                                                        
                                                        // Calculate load percentage safely
                                                        let loadPct = 0;
                                                        if (s.capacity && s.capacity > 0) {
                                                            loadPct = Math.min(1, (s.displayLoad || 0) / s.capacity);
                                                        }
                                                        
                                                        let hue = Math.max(0, 50 - (loadPct * 50));
                                                        if (isNuc) hue = 120;
                                                        else if (isWind) hue = 180;
                                                        else if (isSolar) hue = 60;
                                                        
                                                        // NEW: Show repair warning for nuclear
                                                        if (s.needsRepair) {
                                                            ctx.save();
                                                            ctx.strokeStyle = '#ff0000';
                                                            ctx.lineWidth = 3;
                                                            ctx.setLineDash([5, 5]);
                                                            ctx.beginPath();
                                                            ctx.arc(0, 0, 40, 0, Math.PI*2);
                                                            ctx.stroke();
                                                            ctx.restore();
                                                            
                                                            ctx.fillStyle = '#ff0000';
                                                            ctx.font = '12px Arial';
                                                            ctx.fillText('!', -3, 4);
                                                        }
                                                         
                                                        if (s.heat > 80 || loadPct > 0.95) {
                                                            ctx.save();
                                                            ctx.strokeStyle = '#ff0000';
                                                            ctx.lineWidth = 2;
                                                            ctx.beginPath();
                                                            let r = 35 + (Date.now() % 1000) / 20; 
                                                            ctx.arc(0, 0, r, 0, Math.PI*2);
                                                            ctx.stroke();
                                                            ctx.restore();
                                                        }
                            
                                                        // Wind turbine visualization
                                                        if (isWind) {
                                                            ctx.fillStyle = '#88ffff';
                                                            ctx.beginPath();
                                                            ctx.moveTo(0, -25);
                                                            ctx.lineTo(8, 25);
                                                            ctx.lineTo(-8, 25);
                                                            ctx.closePath();
                                                            ctx.fill();
                                                            
                                                            // Rotating blades
                                                            ctx.save();
                                                            ctx.rotate(s.rotation);
                                                            for (let i = 0; i < 3; i++) {
                                                                ctx.beginPath();
                                                                ctx.moveTo(0, 0);
                                                                ctx.lineTo(0, -30);
                                                                ctx.lineWidth = 4;
                                                                ctx.strokeStyle = '#88ffff';
                                                                ctx.stroke();
                                                                ctx.rotate(Math.PI * 2 / 3);
                                                            }
                                                            ctx.restore();
                                                        }
                                                        // Solar panel visualization
                                                        else if (isSolar) {
                                                            ctx.fillStyle = '#ffff88';
                                                            ctx.fillRect(-20, -15, 40, 30);
                                                            ctx.strokeStyle = '#ffaa00';
                                                            ctx.lineWidth = 2;
                                                            ctx.strokeRect(-20, -15, 40, 30);
                                                            
                                                            // Grid lines
                                                            ctx.strokeStyle = '#ffaa00';
                                                            ctx.lineWidth = 1;
                                                            ctx.beginPath();
                                                            for (let i = -15; i <= 15; i += 10) {
                                                                ctx.moveTo(i, -13);
                                                                ctx.lineTo(i, 13);
                                                            }
                                                            ctx.stroke();
                                                        }
                                                        // Standard plant or nuclear
                                                        else {
                                                            ctx.save();
                                                            ctx.rotate(s.rotation * 0.5);
                                                            ctx.strokeStyle = `hsla(${hue}, 100%, 50%, 0.5)`;
                                                            ctx.lineWidth = 2;
                                                            const ringSize = 35;
                                                            // Nuclear visual change: Triangle spin
                                                            if (isNuc) {
                                                                for(let i=0; i<3; i++) {
                                                                    const ang = i * (Math.PI*2/3);
                                                                    ctx.beginPath(); ctx.arc(Math.cos(ang)*ringSize, Math.sin(ang)*ringSize, 5, 0, Math.PI*2); ctx.stroke();
                                                                }
                                                                ctx.beginPath(); ctx.arc(0, 0, ringSize, 0, Math.PI*2); ctx.stroke();
                                                            } else {
                                                                ctx.beginPath();
                                                                ctx.arc(0, 0, ringSize, 0, Math.PI * 0.4); ctx.stroke();
                                                                ctx.beginPath();
                                                                ctx.arc(0, 0, ringSize, Math.PI, Math.PI * 1.4); ctx.stroke();
                                                            }
                                                            ctx.restore();
                                        
                                                            ctx.fillStyle = '#150a00';
                                                            ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI*2); ctx.fill();
                                                            ctx.strokeStyle = isNuc ? '#0f0' : '#421'; ctx.lineWidth = 2; ctx.stroke();
                                        
                                                            const startAngle = -Math.PI / 2;
                                                            const endAngle = startAngle + (Math.PI * 2 * loadPct);
                                                            ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
                                                            ctx.lineWidth = 4;
                                                            ctx.lineCap = 'butt';
                                                            ctx.beginPath();
                                                            ctx.arc(0, 0, 22, startAngle, endAngle);
                                                            ctx.stroke();
                                        
                                                            ctx.save();
                                                            ctx.rotate(-s.rotation); 
                                                            ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
                                                             
                                                            // Nuclear symbol or Fan
                                                            if (isNuc) {
                                                                ctx.beginPath();
                                                                for(let i=0; i<3; i++) {
                                                                    const a = i * (Math.PI*2/3);
                                                                    ctx.moveTo(0,0);
                                                                    ctx.arc(0,0, 15, a, a + 1);
                                                                    ctx.lineTo(0,0);
                                                                }
                                                                ctx.fill();
                                                            } else {
                                                                const coreSize = 10 + (loadPct * 5); 
                                                                ctx.beginPath();
                                                                for(let i=0; i<6; i++) {
                                                                    const ang = (Math.PI/3) * i;
                                                                    ctx.lineTo(Math.cos(ang)*coreSize, Math.sin(ang)*coreSize);                                    }
                                    ctx.fill();
                                }
                                ctx.restore();
                            }
            
                            if (s.heat > 0) {
                                ctx.fillStyle = '#330000';                    ctx.fillRect(-20, -45, 40, 6);
                    ctx.fillStyle = s.heat > 80 ? '#fff' : '#ff0000';
                    ctx.fillRect(-20, -45, 40 * (s.heat/CONFIG.maxHeat), 6);
                }
 
                ctx.restore();
            });
             
            pylons.forEach(p => {
                if (!isInView(p.x, p.y, 15)) return;
                const scale = p.spawnScale || 1;
                ctx.save(); ctx.translate(p.x, p.y); ctx.scale(scale, scale);
                let color = p.powered ? CONFIG.colors.powerOn : CONFIG.colors.powerOff;
                if (p === hoveredEntity) color = CONFIG.colors.deleteHighlight;
                
                // Check if this is a tower (special pylon)
                const isTower = sources.some(s => s.type === 'tower' && s.x === p.x && s.y === p.y);
                
                if (isTower) {
                    // Tower visualization - taller structure
                    ctx.fillStyle = '#333';
                    ctx.fillRect(-5, -25, 10, 50);
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2;
                    ctx.strokeRect(-5, -25, 10, 50);
                    
                    // Cross bars
                    ctx.beginPath();
                    ctx.moveTo(-15, -15);
                    ctx.lineTo(15, -15);
                    ctx.moveTo(-12, 0);
                    ctx.lineTo(12, 0);
                    ctx.moveTo(-15, 15);
                    ctx.lineTo(15, 15);
                    ctx.stroke();
                    
                    // Top light
                    ctx.fillStyle = p.powered ? '#ff0000' : '#660000';
                    ctx.beginPath();
                    ctx.arc(0, -28, 4, 0, Math.PI*2);
                    ctx.fill();
                } else {
                    // Standard pylon
                    ctx.fillStyle = color; 
                    ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI*2); ctx.fill();
                    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.rect(-3, -3, 6, 6); ctx.fill();
                }
                ctx.restore();
            });
 
            houses.forEach(h => {
                if (!isInView(h.x, h.y, 30)) return;
                const scale = h.spawnScale || 1;
                ctx.save(); ctx.translate(h.x, h.y); ctx.scale(scale, scale);
                 
                if (h.type === 'factory') {
                    // --- Factory ---
                    let color = h.powered ? CONFIG.colors.factoryHappy : CONFIG.colors.factoryOff;
                    if (h.isCritical) color = CONFIG.colors.houseAngry;
                    
                    if (h.isCritical) { ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 2; ctx.strokeRect(-25, -25, 50, 50); }
                    if (h.isAlert) { const t = Date.now(); ctx.translate(Math.sin(t/20)*2, Math.cos(t/15)*2); }
                     
                    if (h.isCritical) { ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 2; ctx.strokeRect(-25, -25, 50, 50); }
                    if (h.isAlert) { const t = Date.now(); ctx.translate(Math.sin(t/20)*2, Math.cos(t/15)*2); }
 
                    ctx.fillStyle = color; ctx.fillRect(-15, -15, 30, 30);
                    ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.moveTo(-15, -15); ctx.lineTo(15, 15); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(15, -15); ctx.lineTo(-15, 15); ctx.stroke();
 
                } else if (h.type === 'commercial') {
                    // --- Commercial ---
                    let color = h.powered ? CONFIG.colors.commHappy : CONFIG.colors.commOff;
                    if (h.isCritical) color = CONFIG.colors.houseAngry;
 
                    if (h.isCritical) { ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0,0,30,0,Math.PI*2); ctx.stroke(); }
                     
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    for(let i=0; i<6; i++) { const a = i*Math.PI/3; ctx.lineTo(Math.cos(a)*18, Math.sin(a)*18); }
                    ctx.closePath(); ctx.fill();
                     
                    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2;
                    ctx.stroke();
 
                    // Load Indicator
                    if (h.powered) {
                        const loadPct = ((h.currentLoad || CONFIG.commBaseLoad) - CONFIG.commBaseLoad) / (CONFIG.commPeakLoad - CONFIG.commBaseLoad);
                        const barHeight = 24;
                        ctx.fillStyle = '#001133'; ctx.fillRect(24, -12, 6, barHeight);
                        ctx.fillStyle = '#00ffff';
                        if (loadPct > 0.8 && Math.floor(Date.now()/100)%2===0) ctx.fillStyle = '#fff';
                        const fillH = barHeight * Math.max(0.1, loadPct);
                        ctx.fillRect(24, 12 - fillH, 6, fillH);
                        ctx.strokeStyle = '#0088ff'; ctx.lineWidth = 1; ctx.strokeRect(24, -12, 6, barHeight);
                    }
 
                } else {
                    // --- House ---
                    let color = h.powered ? CONFIG.colors.houseHappy : CONFIG.colors.houseOff;
                    if (h.isCritical) color = CONFIG.colors.houseAngry;
                    if (h.isCritical) { ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI*2); ctx.stroke(); }
                    if (h.isAlert) { const t = Date.now(); ctx.translate(Math.sin(t/20 + h.id*10)*2, Math.cos(t/15 + h.id*10)*2); }
                    ctx.fillStyle = color; 
                    ctx.beginPath(); for (let i=0; i<6; i++) { const ang=(Math.PI*2*i)/6; ctx.lineTo(Math.cos(ang)*15, Math.sin(ang)*15); } ctx.closePath(); ctx.fill();
                    ctx.fillStyle = '#000'; ctx.beginPath(); for (let i=0; i<6; i++) { const ang=(Math.PI*2*i)/6; ctx.lineTo(Math.cos(ang)*8, Math.sin(ang)*8); } ctx.fill();
                }
 
                if (!h.powered) {
                    ctx.strokeStyle = h.isCritical ? '#ff0000' : (h.isAlert ? '#ff5500' : '#888'); 
                    ctx.lineWidth = 4; 
                    ctx.beginPath();
                    const endAngle = (h.patience / CONFIG.houseMaxPatience) * Math.PI * 2 - Math.PI/2;
                    ctx.arc(0, 0, 20, -Math.PI/2, endAngle); ctx.stroke();
                }
                ctx.restore();
            });
 
            ctx.globalCompositeOperation = 'lighter';
            particles.forEach(p => {
                if (!isInView(p.x, p.y, p.size * 2 + 60)) return; 
                if (p.type === 'shockwave') {
                      ctx.strokeStyle = p.color; ctx.lineWidth = 3; ctx.globalAlpha = p.life;
                      ctx.beginPath(); ctx.arc(p.x, p.y, (1.0 - p.life) * 60, 0, Math.PI*2); ctx.stroke();
                } else {
                    ctx.fillStyle = p.color; ctx.globalAlpha = p.life;
                    ctx.beginPath(); ctx.arc(p.x, p.y, p.size || 3, 0, Math.PI*2); ctx.fill();
                }
            });
            ctx.globalAlpha = 1; 
            ctx.globalCompositeOperation = 'source-over';
            ctx.restore(); 
 
            requestAnimationFrame(renderLoop);
        }
 
        function renderLoop(timestamp) {
            update(timestamp);
            draw();
        }
 
        // 启动游戏
        resize();
        setupBuildingButtons();
        updateFullscreenButton();
        requestAnimationFrame(renderLoop);

        // 显示难度选择弹窗（延迟执行确保DOM已加载）
        setTimeout(() => {
            const difficultyModal = document.getElementById('difficulty-modal');
            if (difficultyModal) {
                difficultyModal.classList.remove('hidden');
                difficultyModal.style.display = 'flex'; // 确保显示
            }
        }, 100);

        // 显示初始帮助（在用户选择难度后）
        setTimeout(() => {
            if (gameState.mode) { // Only show help after difficulty is selected
                showHelpTip("点击建筑按钮放置，左键连线，右键拆除", 5000);
            }
        }, 1000);