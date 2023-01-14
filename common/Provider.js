async function scheduleHtmlProvider(iframeContent = "", frameContent = "", dom = document) {
    // 加载AIScheduleTools
    await loadTool('AIScheduleTools')
    await AIScheduleAlert('确认开始导入吗?')

    let scheduler_content = dom.getElementById("kblist_table")

    //未找到元素
    if (!scheduler_content) {
        await AIScheduleAlert(`没有找到课表内容喔！
        请确认您已登录、选择好学期、学年，并点击了"查询"按钮
        请确认课程表内容已经显示在了屏幕上喵！`)

        return 'do not continue'
    } else {
        await AIScheduleAlert("识别成功，正在导入....")
        return scheduler_content.getElementById('table2')
    }
}