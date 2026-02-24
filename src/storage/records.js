/**
 * 排行榜记录模块
 * 负责游戏记录的保存和显示
 */

import { formatTime } from '../utils/helpers.js';

/**
 * 记录系统
 */
export class RecordsSystem {
    constructor(runtimeState) {
        this.runtimeState = runtimeState;
        this.storageKey = 'neonGridRecords';
    }

    /**
     * 更新记录
     */
    updateRecords() {
        const { houses, gameState, gameTime, lastFailureTime } = this.runtimeState;

        // 更新最高人口
        if (houses.length > gameState.records.maxPopulation) {
            gameState.records.maxPopulation = houses.length;
        }

        // 更新当前运行时间
        if (lastFailureTime === 0) {
            gameState.records.currentUptime = gameTime;
        } else {
            gameState.records.currentUptime = gameTime - lastFailureTime;
        }

        // 更新最长运行时间
        if (gameState.records.currentUptime > gameState.records.longestUptime) {
            gameState.records.longestUptime = gameState.records.currentUptime;
        }

        // 保存到localStorage
        this.saveRecords();
    }

    /**
     * 保存记录到localStorage
     */
    saveRecords() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.runtimeState.gameState.records));
        } catch (e) {
            console.error("保存记录失败:", e);
        }
    }

    /**
     * 从localStorage加载记录
     */
    loadRecords() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error("加载记录失败:", e);
        }

        return {
            maxPopulation: 0,
            longestUptime: 0,
            totalEarnings: 0,
            disasterCount: 0
        };
    }

    /**
     * 显示排行榜
     */
    showLeaderboard() {
        const records = this.loadRecords();
        const { gameState } = this.runtimeState;

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

    /**
     * 清除记录
     */
    clearRecords() {
        try {
            localStorage.removeItem(this.storageKey);
            this.runtimeState.gameState.records = {
                maxPopulation: 0,
                longestUptime: 0,
                totalEarnings: 0,
                disasterCount: 0
            };
            this.runtimeState.setSystemMsg("记录已清除", "success", true);
        } catch (e) {
            console.error("清除记录失败:", e);
            this.runtimeState.setSystemMsg("清除记录失败", "warning", true);
        }
    }
}