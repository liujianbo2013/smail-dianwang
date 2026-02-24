/**
 * 游戏配置模块
 * 包含所有游戏常量和配置参数
 */

export const CONFIG = {
    // --- 经济配置 ---
    initialMoney: 200,
    baseSubsidy: 25,
    incomePerHouse: 1,

    // 工厂设置
    factoryUnlockPop: 30,
    factorySpawnRate: 90000, // 1分30秒
    factoryLoad: 5,
    incomePerFactory: 8,

    // 商业设置
    commUnlockPop: 60,
    commSpawnRate: 45000, // 45秒
    commBaseLoad: 2,
    commPeakLoad: 3,
    incomePerComm: 5,

    // 电池设置
    costBattery: 800,
    batteryCapacity: 500,
    batteryChargeRate: 4.0,
    batteryDischargeRate: 6.0,

    // 发电厂设置
    upkeepPerPlant: 10,
    economyTickRate: 1000,
    refundRate: 0.1,
    costPylon: 10,
    costPlant: 1500,

    // 核电站设置
    costNuclear: 6000,
    nuclearCapacity: 60,
    nuclearUpkeep: 50,
    nuclearFailureChance: 0.05, // 每分钟5%
    nuclearDecayRate: 5, // 每小时衰减5
    nuclearCoolingBatteryCount: 2, // 冷却所需电池数
    nuclearCoolingFailureRate: 0.15, // 冷却不足时每分钟15%
    nuclearMaintenanceUpgradeCost: 3000,
    nuclearMaintenanceDuration: 3600000, // 1小时

    // 风力发电设置
    costWind: 2000,
    windCapacity: 12.5, // 平均10-15
    windUpkeep: 0,
    windSpeedEventChance: 0.10, // 每分钟10%
    windSpeedBoost: 0.80, // +80%效率
    windSpeedDrop: 0.50, // -50%效率
    windEdgeOnly: true,
    windEdgeDistance: 200,

    // 太阳能发电设置
    costSolar: 2500,
    solarCapacity: 10, // 平均8-12
    solarUpkeep: 0,
    solarStorageUpgradeCost: 1500,
    solarStorageEfficiency: 0.20, // 夜间保留20%
    solarDayStart: 6, // 6点
    solarDayEnd: 18, // 18点
    solarDawnDuration: 1, // 1小时过渡
    solarDuskDuration: 1,

    // 线路损耗设置
    wireLossThreshold150: 150,
    wireLossThreshold200: 200,
    wireLossThreshold300: 300,
    wireLoss150: 0.10,
    wireLoss200: 0.30,
    wireLoss300: 0.50,
    highVoltageTowerSpacing: 200,

    // 事件设置
    wireCascadeChance: 0.20,
    lowDemandEventChance: 0.30,
    maintenanceEventChance: 0.05,
    disasterEventChance: 0.01,
    disasterPopThreshold: 300,
    cleanEnergySubsidyThreshold: 0.50,

    // 难度设置
    difficultyBeginnerMoneyMult: 1.5,
    difficultyBeginnerPeakFreqMult: 0.5,
    difficultyBeginnerFailureMult: 0.5,
    difficultyExpertMoneyMult: 0.7,
    difficultyExpertPeakFreqMult: 1.5,
    difficultyExpertFailureMult: 1.5,
    difficultyExpertDepreciationRate: 0.10,
    difficultyInflationThreshold: 500,
    difficultyInflationRate: 0.0001,

    // 新建筑设置
    costRepairStation: 2000,
    repairStationUnlockPop: 150,
    repairStationMaintenanceReduction: 0.20,

    costDispatchCenter: 3500,
    dispatchCenterUnlockPop: 250,

    costEnergyStorage: 4000,
    energyStorageUnlockBatteryCount: 8,
    energyStorageCapacityMultiplier: 5,
    energyStorageChargeRateMultiplier: 1.5,

    // 成就阈值
    achievementPowerPioneerPop: 100,
    achievementPowerPioneerReward: 1000,
    achievementCleanEnergyRatio: 0.70,
    achievementCleanEnergyDiscount: 0.10,
    achievementCrisisExpertCount: 5,
    achievementCrisisExpertDiscount: 0.20,

    // 科技树
    techSmartGridCost: 100000,
    techSmartGridOverloadReduction: 0.15,
    techNuclearTechRequirement: 5,
    techNuclearTechFailureRate: 0.02,

    // 线路设置
    costWirePerUnit: 0.1,
    costUpgradeMult: 6.0,
    baseWireLoad: 5,
    upgradedWireLoad: 15,
    maxWireLength: 300,

    // 建筑设置
    snapDistance: 40,
    minEntityDist: 60,
    plantCapacity: 15,
    overheatSpeed: 0.05,
    maxHeat: 100,

    // 发电厂升级设置
    plantLevel2Capacity: 30,
    plantLevel3Capacity: 45,
    plantLevel2Cost: 3000,
    plantLevel3Cost: 6000,
    plantLevel2Upkeep: 20,
    plantLevel3Upkeep: 40,

    // 视图设置
    initialScale: 1.2,
    minScale: 0.1,
    maxScale: 3.0,
    viewExpansionRate: 0.003,

    // 生成设置
    spawnRate: 8000,
    houseMaxPatience: 3500,
    maxAngryHouses: 5,

    // 游戏阶段设置
    earlyGamePop: 100,
    midGamePop: 300,

    // 高峰时段设置
    peakHourInterval: 300000, // 5分钟
    peakHourDuration: 30000, // 30秒
    peakHourMultiplier: 1.5,

    // 补贴设置
    subsidyThreshold: 500,
    subsidyCancelPop: 200,

    // 维护缩放
    maintenanceScaleThreshold: 5,
    maintenanceScaleMultiplier: 1.5,

    // 颜色配置
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
        windSource: '#88ffff',
        solarSource: '#ffff88',
        tower: '#ff88ff',
        datacenter: '#ff00ff',
        hospital: '#ff6666'
    }
};