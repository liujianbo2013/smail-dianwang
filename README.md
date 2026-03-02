。# 因为堆积了太多石山，已永久停止更新。[新的](https://github.com/liujianbo2013/smail-dianwang-new)
# Neon Grid: Drag & Drop - 项目概览

## 项目类型

这是一个基于 Web 的电力网格建设与管理类模拟经营游戏，采用单文件 HTML 架构（HTML + CSS + JavaScript）。

## 技术栈

- **前端技术**: 纯 HTML5 Canvas + CSS3 + Vanilla JavaScript
- **字体**: Google Fonts - Share Tech Mono
- **部署**: GitHub Pages (CNAME: smail-dianwang.jianbo.qzz.io)
- **构建**: 无需构建工具，直接在浏览器中运行

## 项目结构

```
smail-dianwang/
├── index.html      # 完整游戏代码（HTML/CSS/JS）
├── README.md       # 项目文档（中文）
├── CNAME          # 自定义域名配置
<<<<<<< HEAD
└── AGENTS.md      # 本文件
=======
>>>>>>> 58f98856c58b26be8dfc4930a9f6d310f05b80ed
```

## 核心功能模块

### 1. 资源管理系统
- 资金系统：初始资金 200 美元，通过建筑收入获得
- 收入来源：居民建筑（1$/秒）、工厂（8$/秒）、商业建筑（5$/秒）
- 支出项：建筑建造成本、维护费、电线升级费用
- 经济结算周期：1 秒（`economyTickRate`）

### 2. 电力设施建设
- **电厂**（Plant）：成本 $1500，产能 15 单位，维护费 $10/周期
- **核电站**（Nuclear）：成本 $6000，产能 60 单位，维护费 $50/周期
- **电池**（Battery）：成本 $800，容量 500 单位，充电 4/秒，放电 6/秒
- **风力电站**（Wind）：成本 $2000，受风速影响
- **太阳能电站**（Solar）：成本 $2500，可升级储能
- **电塔**（Tower）：成本 $100，用于延长电线连接距离

### 3. 电网系统
- 电线连接：最大长度 300（`maxWireLength`），吸附距离 40（`snapDistance`）
- 电线负载：基础 5（`baseWireLoad`），升级后 15（`upgradedWireLoad`）
- 过载检测：过载时触发警报层闪烁
- 高压模式：Shift 键触发，可放置高压线

### 4. 用电建筑生成
- **居民建筑**（House）：初始解锁，8 秒/个，基础负载
- **工厂**（Factory）：人口达 30 解锁，90 秒/个，固定 5 单位负载
- **商业建筑**（Commercial）：人口达 60 解锁，45 秒/个，2-3 单位波动负载

### 5. 游戏控制系统
- **时间流速**：暂停、0.5x、1x、2x 四档速度
- **视图控制**：放大、缩小、重置视图、全屏模式
- **难度选择**：新手、普通、专家三种模式

### 6. 存档与分享
- **存档功能**：保存游戏状态到 JSON 文件
- **读取功能**：从 JSON 文件加载游戏存档
- **分享功能**：复制游戏统计到剪贴板

### 7. 游戏结束与回放
- 失败条件：愤怒建筑数量达到阈值（`maxAngryHouses`）
- 回放系统：游戏结束后可通过时间滑块查看历史状态

## 核心数据结构

### 游戏状态（gameState）
```javascript
{
    mode: 'normal',           // 难度模式
    difficultyMultiplier: 1.0, // 难度倍率
    gameDate: 0,              // 游戏日期（0-23小时）
    gameDays: 0,              // 游戏天数
    activeEvents: [],         // 活跃事件
    achievements: {...},      // 成就系统
    unlockedTech: [],         // 科技树解锁
    records: {...},           // 记录统计
    gridHealth: 100           // 电网健康度
}
```

### 实体类型
- **sources**: 发电设施（电厂、核电站、风力、太阳能）
- **pylons**: 电塔
- **houses**: 用电建筑（居民、工厂、商业）
- **batteries**: 电池设施
- **links**: 电线连接
- **particles**: 视觉特效粒子

### 关键配置（CONFIG）
- `maxAngryHouses`: 5（最大愤怒建筑数）
- `maxWireLength`: 300（最大电线长度）
- `snapDistance`: 40（吸附距离）
- `baseWireLoad`: 5（基础电线负载）
- `upgradedWireLoad`: 15（升级电线负载）
- `economyTickRate`: 1000（经济结算周期）

## 操作说明

### 鼠标操作
- **左键点击建筑按钮**：进入放置模式
- **左键点击地图**：放置建筑
- **右键点击**：取消放置模式
- **拖拽**：在两个建筑间拉电线
- **Shift + 拖拽**：放置高压线
- **滚轮**：缩放视图
- **右键点击实体**：打开上下文菜单（升级/拆除）

### 触摸操作
- **单指拖动**：平移视图
- **双指缩放**：缩放视图
- **长按**：批量选择模式（800ms 触发）

## 视觉设计

### 配色方案
- 主色调：青色（#00ffff）
- 背景色：深黑（#000000）
- 警告色：红色（#ff3333）
- 成功色：绿色（#00ff88）
- 核电站色：绿色（#00ff66）
- 风力色：淡青（#88ffff）
- 太阳能色：淡黄（#ffff88）
- 电塔色：品红（#ff88ff）

### UI 组件
- 顶部面板：系统消息、统计数据
- 游戏区域：Canvas 画布、视图控制按钮、警报层
- 底部面板：建筑工具栏、速度控制、游戏控制

## 游戏循环

### 主循环函数
- `update()`: 更新游戏状态（每帧调用）
- `draw()`: 渲染游戏画面（每帧调用）
- `updatePowerGrid()`: 计算电网负载和供电状态
- `updateUI()`: 更新界面显示

### 定时器
- 经济结算：每 1000ms
- 建筑生成：居民 8 秒、工厂 90 秒、商业 45 秒
- 回放快照：每 5000ms
- 用电高峰：每 300 秒触发

## 难度系统

### 新手模式（Beginner）
- 初始资金 +50%
- 高峰频率 -50%
- 故障概率 -50%

### 普通模式（Normal）
- 标准游戏参数
- 初始资金 $200

### 专家模式（Expert）
- 初始资金 -30%
- 高峰频率 +50%
- 故障概率 +50%

## 开发规范

### 代码风格
- 使用 4 空格缩进
- 驼峰命名法（camelCase）
- 常量使用全大写（CONFIG）
- 中文注释和 UI 文本

### 函数命名
- 事件处理函数：on + 事件名（如 `onClick`）
- 更新函数：update + 模块名（如 `updateUI`）
- 渲染函数：draw + 对象名（如 `drawEntity`）
- 辅助函数：get/set + 属性名（如 `getEntityAt`）

### 状态管理
- 全局状态变量定义在文件顶部
- UI 元素引用在初始化部分获取
- 游戏数据与 UI 渲染分离

## 测试与调试

### 浏览器兼容性
- Chrome/Edge（推荐）
- Firefox
- Safari
- 移动端浏览器

### 调试技巧
- 使用浏览器控制台查看日志
- 游戏历史快照可用于回放调试
- `showHelpTip()` 函数用于显示调试信息

<<<<<<< HEAD
## 待办功能（README.md 中列出）
- [ ] 增加更多玩法
- [ ] 增加存档保存、读取功能（已实现）
- [ ] 增加分享功能（已实现）

=======
>>>>>>> 58f98856c58b26be8dfc4930a9f6d310f05b80ed
## 贡献指南

### 提交代码
1. Fork 项目仓库
2. 修改代码
3. 提交 Pull Request

### 提出建议
- 通过 GitHub Issues 提交

## 原型参考

游戏原型灵感来源于：[@织色燕 的 【迷你电网】自制拉电线小游戏](https://www.bilibili.com/video/BV1BR6yBRE5K)

## 许可信息

- 项目主页：https://github.com/liujianbo2013/smail-dianwang
- 游戏地址：https://smail-dianwang.jianbo.qzz.io
<<<<<<< HEAD
- 赞助链接：https://afdian.com/a/ljb13
=======
- 赞助链接：https://afdian.com/a/ljb13
>>>>>>> 58f98856c58b26be8dfc4930a9f6d310f05b80ed
