/**
 * 辅助函数模块
 */

import { CONFIG } from '../core/config.js';

/**
 * 将屏幕坐标转换为世界坐标
 */
export function toWorld(screenX, screenY, cx, cy, viewOffsetX, viewOffsetY, currentScale) {
    return {
        x: (screenX - cx - viewOffsetX) / currentScale,
        y: (screenY - cy - viewOffsetY) / currentScale
    };
}

/**
 * 获取画布坐标
 */
export function getCanvasCoordinates(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    const clientX = event.touches ? event.touches[0].clientX : event.clientX;
    const clientY = event.touches ? event.touches[0].clientY : event.clientY;
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

/**
 * 检查点是否在视窗内
 */
export function isInView(x, y, radius, viewBounds) {
    return x + radius > viewBounds.minX &&
           x - radius < viewBounds.maxX &&
           y + radius > viewBounds.minY &&
           y - radius < viewBounds.maxY;
}

/**
 * 检查线路是否在视窗内
 */
export function isLinkInView(link, viewBounds) {
    const minX = Math.min(link.from.x, link.to.x);
    const maxX = Math.max(link.from.x, link.to.x);
    const minY = Math.min(link.from.y, link.to.y);
    const maxY = Math.max(link.from.y, link.to.y);
    return maxX > viewBounds.minX &&
           minX < viewBounds.maxX &&
           maxY > viewBounds.minY &&
           minY < viewBounds.maxY;
}

/**
 * 更新视窗边界
 */
export function updateViewBounds(width, height, cx, cy, viewOffsetX, viewOffsetY, currentScale) {
    const margin = 100;
    return {
        minX: (0 - cx - viewOffsetX) / currentScale - margin,
        maxX: (width - cx - viewOffsetX) / currentScale + margin,
        minY: (0 - cy - viewOffsetY) / currentScale - margin,
        maxY: (height - cy - viewOffsetY) / currentScale + margin
    };
}

/**
 * 检查位置是否空闲
 */
export function isPositionClear(worldX, worldY, buffer, sources, pylons, batteries, houses) {
    for (let s of sources) {
        if (Math.hypot(worldX - s.x, worldY - s.y) < buffer) return false;
    }
    for (let p of pylons) {
        if (Math.hypot(worldX - p.x, worldY - p.y) < buffer) return false;
    }
    for (let b of batteries) {
        if (Math.hypot(worldX - b.x, worldY - b.y) < buffer) return false;
    }
    for (let h of houses) {
        if (Math.hypot(worldX - h.x, worldY - h.y) < buffer) return false;
    }
    return true;
}

/**
 * 检查风力电站放置位置是否有效
 */
export function isWindPlacementValid(worldX, worldY, width, height, viewOffsetX, viewOffsetY, currentScale) {
    const viewWidth = width / currentScale;
    const viewHeight = height / currentScale;

    const minX = viewOffsetX - viewWidth / 2;
    const maxX = viewOffsetX + viewWidth / 2;
    const minY = viewOffsetY - viewHeight / 2;
    const maxY = viewOffsetY + viewHeight / 2;

    const distToLeft = Math.abs(worldX - minX);
    const distToRight = Math.abs(worldX - maxX);
    const distToTop = Math.abs(worldY - minY);
    const distToBottom = Math.abs(worldY - maxY);

    return (distToLeft <= CONFIG.windEdgeDistance ||
            distToRight <= CONFIG.windEdgeDistance ||
            distToTop <= CONFIG.windEdgeDistance ||
            distToBottom <= CONFIG.windEdgeDistance);
}

/**
 * 获取指定位置的实体
 */
export function getEntityAt(worldX, worldY, radius, sources, pylons, batteries, houses) {
    for (let s of sources) {
        if (Math.hypot(worldX - s.x, worldY - s.y) < radius) return s;
    }
    for (let p of pylons) {
        if (Math.hypot(worldX - p.x, worldY - p.y) < radius) return p;
    }
    for (let b of batteries) {
        if (Math.hypot(worldX - b.x, worldY - b.y) < radius) return b;
    }
    for (let h of houses) {
        if (Math.hypot(worldX - h.x, worldY - h.y) < radius) return h;
    }
    return null;
}

/**
 * 获取实体索引
 */
export function getEntityIndex(entity, sources, pylons, houses, batteries) {
    const allEntities = [...sources, ...pylons, ...houses, ...batteries];
    return allEntities.indexOf(entity);
}

/**
 * 计算供电覆盖率
 */
export function calculateCoverage(houses) {
    if (houses.length === 0) return 0;
    const poweredCount = houses.filter(h => h.powered).length;
    return Math.floor((poweredCount / houses.length) * 100);
}

/**
 * 格式化游戏时间
 */
export function formatGameTime(seconds) {
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

/**
 * 格式化时间
 */
export function formatTime(ms) {
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

/**
 * 生成唯一ID
 */
export function generateId() {
    return Math.random();
}

/**
 * 计算两点距离
 */
export function distance(p1, p2) {
    return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

/**
 * 计算点到线段的距离
 */
export function distToSegment(p, v, w) {
    const l2 = (w.x - v.x) ** 2 + (w.y - v.y) ** 2;
    if (l2 == 0) return Math.hypot(p.x - v.x, p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
}

/**
 * 获取指定位置的线路
 */
export function getLinkAt(x, y, links, tolerance = 15) {
    const p = { x, y };
    for (let l of links) {
        if (distToSegment(p, l.from, l.to) < tolerance) return l;
    }
    return null;
}

/**
 * 获取触摸距离
 */
export function getTouchDistance(e) {
    if (e.touches.length < 2) return 0;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}