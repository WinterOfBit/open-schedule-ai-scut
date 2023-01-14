/**
 * 未提供api，填填知道的
 * @returns {{totalWeek: number, afternoon: number, night: number, startWithSunday: boolean, forenoon: number}}
 */
function scheduleTimer() {
    // 返回时间配置JSON，所有项都为可选项，如果不进行时间配置，请返回空对象
    return {
        totalWeek: 20,
        startWithSunday: false,
        forenoon: 4,
        afternoon: 4,
        night: 4,
    }
}