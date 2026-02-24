/**
 * 几何计算模块
 */

/**
 * 计算两条线段的交点
 * @param {Object} p1 - 线段1起点 {x, y}
 * @param {Object} p2 - 线段1终点 {x, y}
 * @param {Object} p3 - 线段2起点 {x, y}
 * @param {Object} p4 - 线段2终点 {x, y}
 * @returns {boolean} 是否相交
 */
export function getLineIntersection(p1, p2, p3, p4) {
    const det = (p2.x - p1.x) * (p4.y - p3.y) - (p4.x - p3.x) * (p2.y - p1.y);
    if (det === 0) return false;
    const lambda = ((p4.y - p3.y) * (p4.x - p1.x) + (p3.x - p4.x) * (p4.y - p1.y)) / det;
    const gamma = ((p1.y - p2.y) * (p4.x - p1.x) + (p2.x - p1.x) * (p4.y - p1.y)) / det;
    return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
}

/**
 * 检查线路是否与现有线路相交
 * @param {Object} startPos - 线路起点 {x, y}
 * @param {Object} endPos - 线路终点 {x, y}
 * @param {Array} links - 现有线路数组
 * @param {Object} dragStartNode - 起始节点
 * @param {Object} snapTarget - 目标节点
 * @returns {boolean} 是否相交
 */
export function checkIntersection(startPos, endPos, links, dragStartNode, snapTarget) {
    for (let l of links) {
        if (l.from === dragStartNode || l.to === dragStartNode || l.from === snapTarget || l.to === snapTarget) continue;
        if (getLineIntersection(startPos, endPos, l.from, l.to)) return true;
    }
    return false;
}

/**
 * 限制数值范围
 * @param {number} value - 输入值
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 限制后的值
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * 线性插值
 * @param {number} start - 起始值
 * @param {number} end - 结束值
 * @param {number} t - 插值因子 (0-1)
 * @returns {number} 插值结果
 */
export function lerp(start, end, t) {
    return start + (end - start) * t;
}

/**
 * 角度转弧度
 * @param {number} degrees - 角度
 * @returns {number} 弧度
 */
export function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * 弧度转角度
 * @param {number} radians - 弧度
 * @returns {number} 角度
 */
export function radToDeg(radians) {
    return radians * (180 / Math.PI);
}

/**
 * 计算两点之间的角度
 * @param {Object} from - 起点 {x, y}
 * @param {Object} to - 终点 {x, y}
 * @returns {number} 角度（弧度）
 */
export function angleBetween(from, to) {
    return Math.atan2(to.y - from.y, to.x - from.x);
}