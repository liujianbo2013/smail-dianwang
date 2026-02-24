/**
 * UI更新模块
 * 负责更新游戏界面显示
 */

import { CONFIG } from '../core/config.js';
import { calculateCoverage } from '../utils/helpers.js';

/**
 * UI更新器
 */
export class UIUpdater {
    constructor(runtimeState) {
        this.runtimeState = runtimeState;
        this.moneyEl = document.getElementById('money-display');
        this.incomeEl = document.getElementById('income-display');
        this.coverageEl = document.getElementById('coverage-display');
        this.scaleEl = document.getElementById('scale-display');
        this.sysMsgEl = document.getElementById('system-msg');
        this.alarmOverlay = document.getElementById('alarm-overlay');
        this.peakHourIndicator = document.getElementById('peak-hour-indicator');
        this.timeDisplay = document.getElementById('time-display');
    }

    /**
     * 更新UI
     */
    updateUI() {
        const { money, currentNetIncome, houses } = this.runtimeState;

        // 资金显示
        this.moneyEl.innerText = '$' + Math.floor(money);

        // 收入显示
        let sign = currentNetIncome >= 0 ? '+' : '';
        this.incomeEl.innerText = `${sign}$${currentNetIncome.toFixed(2)}/s`;
        this.incomeEl.style.color = currentNetIncome >= 0 ? '#00ffaa' : '#ff3333';

        // 覆盖率显示
        const total = houses.length;
        const powered = houses.filter(h => h.powered).length;
        const pct = total === 0 ? 100 : Math.floor((powered / total) * 100);
        this.coverageEl.innerText = pct + '%';
        this.coverageEl.style.color = pct < 50 ? '#ff3333' : '#00ffff';

        // 规模显示
        this.scaleEl.innerText = `${total}`;

        // 时间显示
        this.updateTimeDisplay();
    }

    /**
     * 更新时间显示
     */
    updateTimeDisplay() {
        if (!this.timeDisplay) return;

        const { gameState } = this.runtimeState;
        const hour = Math.floor(gameState.gameDate);
        const minute = Math.floor((gameState.gameDate - hour) * 60);
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

        // 确定时间图标
        let timeIcon = '🌙';
        if (hour >= 6 && hour < 12) timeIcon = '🌅';
        else if (hour >= 12 && hour < 18) timeIcon = '☀️';
        else if (hour >= 18 && hour < 20) timeIcon = '🌇';

        this.timeDisplay.innerText = `${timeIcon} ${timeStr}`;

        // 根据时间设置颜色
        if (hour >= 20 || hour < 6) {
            this.timeDisplay.style.color = '#88aaff'; // 夜晚
        } else if (hour >= 6 && hour < 8) {
            this.timeDisplay.style.color = '#ffcc88'; // 黎明
        } else if (hour >= 8 && hour < 17) {
            this.timeDisplay.style.color = '#ffdd44'; // 白天
        } else if (hour >= 17 && hour < 20) {
            this.timeDisplay.style.color = '#ff8844'; // 黄昏
        }
    }

    /**
     * 更新系统消息UI
     */
    updateSystemUI() {
        const { msgState, isCriticalState, isPeakHour } = this.runtimeState;

        // 更新消息计时器
        if (msgState.priority === 2) {
            msgState.eventTimer--;
            if (msgState.eventTimer <= 0) {
                msgState.priority = 0;
                this.setSystemMsg("系统就绪 - 点击建筑按钮放置", "normal");
            }
        }

        // 更新消息显示
        const combinedState = msgState.text + msgState.type;
        if (combinedState !== this.runtimeState.lastRenderedMsg) {
            this.sysMsgEl.innerText = msgState.text;
            this.sysMsgEl.className = "";
            if (msgState.type !== "normal") {
                this.sysMsgEl.classList.add(msgState.type);
            }
            this.runtimeState.lastRenderedMsg = combinedState;
        }

        // 更新高峰时段指示器
        if (this.peakHourIndicator) {
            if (isPeakHour) {
                this.peakHourIndicator.style.display = 'flex';
                if (Math.floor(Date.now() / 500) % 2 === 0) {
                    this.peakHourIndicator.style.background = 'rgba(255, 102, 0, 0.3)';
                } else {
                    this.peakHourIndicator.style.background = 'rgba(0, 50, 60, 0.3)';
                }
            } else {
                this.peakHourIndicator.style.display = 'none';
            }
        }

        // 更新警报覆盖层
        if (isCriticalState) {
            if (!this.alarmOverlay.classList.contains('active')) {
                this.alarmOverlay.classList.add('active');
            }
        } else {
            if (this.alarmOverlay.classList.contains('active')) {
                this.alarmOverlay.classList.remove('active');
            }
        }
    }

    /**
     * 设置系统消息
     */
    setSystemMsg(text, type = "normal", isEvent = false) {
        const { msgState } = this.runtimeState;

        if (isEvent) {
            msgState.text = text;
            msgState.type = type;
            msgState.priority = 2;
            msgState.eventTimer = 120;
        } else if (msgState.priority < 2) {
            msgState.text = text;
            msgState.type = type;
            msgState.priority = 1;
        }
    }

    /**
     * 清除系统消息
     */
    clearSystemMsg(force = false) {
        const { msgState } = this.runtimeState;

        if (force || msgState.priority < 2) {
            msgState.text = "系统就绪 - 点击建筑按钮放置";
            msgState.type = "normal";
            msgState.priority = 0;
        }
    }

    /**
     * 显示帮助提示
     */
    showHelpTip(text, duration = 2000) {
        const helpTip = document.getElementById('help-tip');
        if (!helpTip) return;

        helpTip.textContent = text;
        helpTip.classList.add('show');

        setTimeout(() => {
            helpTip.classList.remove('show');
        }, duration);
    }

    /**
     * 更新速度按钮
     */
    updateSpeedButtons(timeScale, speedBtns) {
        speedBtns.forEach(btn => btn.classList.remove('active'));

        if (timeScale === 0) speedBtns[0].classList.add('active');
        else if (timeScale === 0.5) speedBtns[1].classList.add('active');
        else if (timeScale === 1.0) speedBtns[2].classList.add('active');
        else if (timeScale === 2.0) speedBtns[3].classList.add('active');
    }

    /**
     * 更新建筑按钮状态
     */
    updateBuildingButtons(placementMode) {
        document.querySelectorAll('.building-btn').forEach(btn => {
            if (btn.getAttribute('data-type') === placementMode) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    /**
     * 显示游戏结束界面
     */
    showGameOver(reason) {
        const gameOverScreen = document.getElementById('game-over');
        const gameOverReason = document.getElementById('game-over-reason');

        if (gameOverReason) {
            gameOverReason.innerText = reason;
        }

        if (gameOverScreen) {
            gameOverScreen.classList.add('active');
        }
    }

    /**
     * 隐藏游戏结束界面
     */
    hideGameOver() {
        const gameOverScreen = document.getElementById('game-over');
        if (gameOverScreen) {
            gameOverScreen.classList.remove('active');
        }
    }

    /**
     * 更新全屏按钮
     */
    updateFullscreenButton(isFullscreen) {
        const btn = document.getElementById('fullscreen-btn');
        if (!btn) return;

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
}