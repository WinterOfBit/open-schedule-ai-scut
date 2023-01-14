function scheduleHtmlParser(html) {
    /**
     * 将形如 1-2 的数字范围转为数组，不考虑类似2-1的情形，也懒得检测
     * @param range
     * @param separator 分割符，默认 "-"
     */
    function numberRangeToArray(range = "", separator = '-') {
        let result = []
        let sp = range.split(separator)

        for (let value = parseInt(sp[0]), i = 0; value <= parseInt(sp[1]); value++, i++) {
            result[i] = value
        }

        return result
    }

    /**
     * 使用正则处理课程细节内容
     * @param info
     */
    function readInfo(info) {
        if (info.includes("周数：")) { //匹配设置周数
            let weeks = []
            if (info.includes('-')) { //匹配形如 周数：1-2周
                let regExec = /\d+-\d+/.exec(info)
                weeks = numberRangeToArray(regExec[0])
            } else { //匹配形如 周数：1周
                let regExec = /\d+/.exec(info)
                weeks[0] = parseInt(regExec[0])
            }

            return ["weeks", weeks]
        } else if (info.includes("校区")) { //设置地点
            return ["position", info.replace("校区：", "").replace("上课地点", "")]
        } else if (info.includes("教师")) {
            return ["teacher", info.replace("教师：", "")]
        } else {
            return null
        }
    }

    function trim(text) {
        return text.replace(/\s*/, '').replace('\n', '').replace(' ', '').trim()
    }

    let result = []

    let xq_bodies = $('#xq_1, #xq_2, #xq_3, #xq_4, #xq_5, #xq_6, #xq_7')

    $(xq_bodies).each(function (day, body) {
        //console.log('Scanning ' + $(body).attr('id'))
        let current_sections = null

        $(body).find('td').each(function (i, tdElem) {
            let id = $(tdElem).attr('id')

            if (id == null) { //匹配课程细节
                let course = { //课程实例
                    name: "", // 课程名称
                    position: "", // 上课地点
                    teacher: "", // 教师名称
                    weeks: [], // 周数
                    day: 0, // 星期
                    sections: [] // 节次
                }

                let timetable_con = $(tdElem).find('div.timetable_con')
                course.name = $(timetable_con).find('span.title').text()
                course.sections = current_sections
                course.day = day+1
                //console.log('匹配课程细节' + course.name)

                $(timetable_con).find('p font').each(function (k, infoNode) {
                    let text = trim($(infoNode).text())

                    let detail = readInfo(text)
                    if (detail) {
                        course[detail[0]] = detail[1]
                    }
                })

                result.push(course)
            } else if (id.startsWith('jc_')) { //匹配节数设置，注意，理论上此入口先被遍历，但是为了优雅写在后面
                let sections_str = $(tdElem).find('span.festival').text()
                //console.log('匹配节数设置' + $(tdElem).find('span.festival').text())
                current_sections = numberRangeToArray(sections_str)
                //console.log('匹配节数设置' + current_sections)
            }
        })
    })

    return result
}