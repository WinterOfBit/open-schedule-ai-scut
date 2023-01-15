async function scheduleTimer({
                                 providerRes,
                                 parserRes = {}
                             } = {}) {
    //准备函数
    /**
     * 从教务系统的api里根据id查询信息....
     * @param id
     * @returns {Promise<Document>}
     */
    async function jwDOMApiQuery(id) {
        const APIUrl = 'http://jw.scut.edu.cn/zhinan/cms/category/getCategoryInfo.do'
        const IndexUrl = 'http://jw.scut.edu.cn/zhinan/cms/category/index.do'

        let fetched = await fetch(APIUrl, {
            method: 'POST',
            mode: 'cors',
            body: `id=${id}`,
            headers: {
                'Referer': `${IndexUrl}?id=${id}`,
                'Content-Type': ' application/x-www-form-urlencoded;charset=UTF-8'
            }
        })
        let json = await fetched.json()
        return json['list']
    }

    let defaultResult = {
        startWithSunday: false,
        forenoon: 4,
        afternoon: 4,
        night: 3
    }

    //读取作息时间设置
    if (await AIScheduleConfirm('是否需要自动导入作息安排？')) {
        //准备
        const SectionTimeScheduleId = 'f25701314e913361014e91450b510010'

        /**
         * 把汉字数字转为int 就那几个数字我不如用switch......
         * @param cnNum 汉字
         * @returns {number|null}
         */
        function toInt(cnNum) {
            switch (cnNum) {
                case '一': return 1
                case '二': return 2
                case '三': return 3
                case '四': return 4
                case '五': return 5
                case '六': return 6
                case '七': return 7
                case '八': return 8
                case '九': return 9
                case '十': return 10
                case '十一': return 11
                case '十二': return 12
                case '十三': return 13
                case '十四': return 14
                case '十五': return 15
                default: return null
            }
        }
        /**
         * 把dom中长得奇奇怪怪的如2:00-3:00的时间范围改为如['2:00', '3:00']
         * @param timeStr
         */
        function parseTimeRange(timeStr) {
            let trimmed = timeStr
                .replace(/\s*/g, "")
                .trim()
                .replaceAll('：', ':')
            let sp = trimmed.split("－") //踏马的能搞出这么多奇怪的符号难为你了
            return [sp[0], sp[1]]
        }
        /**
         * 针对❀工特有意义不明的作息安排不显示的第12节课的修复
         * @param sections
         */
        function section12Fix(sections = []) {
            if (sections.length === 11) {
                sections.sort(function (a, b) {
                    return a.section - b.section
                })

                let section12 = {
                    section: 12
                }

                let section11 = sections[10]

                //有现成的轮子干嘛不用 工具对象
                let tmp_date = new Date(`2023/1/16 ${section11.endTime}:00`)
                tmp_date.setMinutes(tmp_date.getMinutes() + 10)
                section12['startTime'] = `${tmp_date.getHours()}:${tmp_date.getMinutes()}`

                tmp_date.setMinutes(tmp_date.getMinutes() + 45)
                section12['endTime'] = `${tmp_date.getHours()}:${tmp_date.getMinutes()}`

                sections.push(section12)
            }
        }
        /**
         * 将形如 第二节课 的名称识别为数字如2
         * @param name
         */
        function parseSectionIndex(name) {
            let index1 = name.indexOf('第')
            let index2 = name.indexOf('节')
            return toInt(name.substring(index1 + 1, index2))
        }

        try {
            let sections = []

            //课程表中猜出的校区
            let location = parserRes.something.location

            if (!await AIScheduleConfirm({
                contentText: `正在导入作息安排\n请确认：该学期使用${location}的作息时间吗？`,
                cancelText: '否，选择其他校区',
                confirmText: '确认'
            })) { //猜错了，重新选
                location = await AIScheduleSelect({
                    contentText: '请选择你的校区',
                    selectList: [
                        '大学城校区',
                        '国际校区',
                        '五山校区',
                    ]
                })
            }

            let scheduleTabIndex = /五山校区/.exec(location) ? '1' : '2'

            let queryList = await jwDOMApiQuery(SectionTimeScheduleId)
            let timeScheduleDOM = (new DOMParser()).parseFromString(queryList[0]['content'], 'text/html')
            let tbody = timeScheduleDOM.getElementsByTagName('tbody')[0]

            for (let timeScheduleLine of tbody.getElementsByTagName('tr')) {
                let cells = timeScheduleLine.getElementsByTagName('td')
                let intro = cells[0].innerText

                let sectionIndexCatch = /第.+节课/.exec(intro)
                if (sectionIndexCatch) {
                    let sectionIndex = parseSectionIndex(sectionIndexCatch[0])
                    let scheduleCell = cells[scheduleTabIndex].textContent
                    let time = parseTimeRange(scheduleCell)

                    let section = {
                        section: sectionIndex,
                        startTime: time[0],
                        endTime: time[1]
                    }

                    sections.push(section)
                }
            }

            section12Fix(sections)
            defaultResult['sections'] = sections

        } catch (error) {
            console.error(error)
            await AIScheduleAlert('作息时间导入失败！使用默认设置')
        }
    }

    //读取校历
    if (await AIScheduleConfirm('是否自动导入校历？')) {
        //原计划为使用pdf.js读取最新校历识别，过于复杂，改为直接写死
        /*
        const DateScheduleId = 'f25701314e913361014e91456f810011'

        try {
            let dateScheduleDOM = await jwDOMApiQuery(DateScheduleId)
            console.log(dateScheduleDOM)

            let latestVersionUrl = dateScheduleDOM[0]['downUrl']

            let pdfData = await fetch(latestVersionUrl, {
                mode: 'cors'
            })
        } catch (error) {
            console.error(error)
            await AIScheduleAlert('校历导入失败！使用默认设置')
        }
         */

        //现在使用人工更新此表的方式啦
        const SchoolCalender = {
            '2020-2021': {
                1: {
                    totalWeek: 20,
                    startDate: '2020/8/31'
                },
                2: {
                    totalWeek: 19,
                    startDate: '2021/3/1'
                }
            },
            '2021-2022': {
                1: {
                    totalWeek: 20,
                    startDate: '2021/8/30'
                },
                2: {
                    totalWeek: 20,
                    startDate: '2022/2/21'
                }
            },
            '2022-2023': {
                1: {
                    totalWeek: 19,
                    startDate: '2022/8/29'
                },
                2: {
                    totalWeek: 20,
                    startDate: '2023/2/20'
                }
            },
            '2023-2024': {
                1: {
                    totalWeek: 20,
                    startDate: '2023/8/28'
                },
                2: {
                    totalWeek: 19,
                    startDate: '2024/2/26'
                }
            },
            '2024-2025': {
                1: {
                    totalWeek: 20,
                    startDate: '2024/8/26'
                },
                2: {
                    totalWeek: 20,
                    startDate: '2025/2/24'
                }
            }
        }

        let academicYear = parserRes.something.academicYear
        let semester = parserRes.something.semester

        defaultResult['totalWeek'] = SchoolCalender[academicYear][semester].totalWeek
        defaultResult['startSemester'] = (new Date(SchoolCalender[academicYear][semester].startDate)).getTime()
    }

    return defaultResult
}