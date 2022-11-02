import { Button, Descriptions, Dropdown, Empty, Input, Menu, message, Modal, Popover, Space, Spin, Table, Tabs, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './git-stat.module.less';
import _, { cloneDeep } from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { BranchesOutlined, CopyOutlined, DownloadOutlined, EllipsisOutlined, ExportOutlined, PlusOutlined, TagOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
import { request } from '@/views/db-manager/utils/http';
import { DiffText } from '../git-diff';
import moment from 'moment';
import { FullCenterBox } from '@/views/db-manager/redis-client';
// import { saveAs } from 'file-saver'
import { Gitgraph } from '@gitgraph/react'
import { CopyButton } from '@/views/db-manager/copy-button';
import { IconButton } from '@/views/db-manager/icon-button';
import { ResetModal } from '../reset-modal';
import { useVirtualList } from 'ahooks'
import { TagEditor } from '../tag-edit';
import { BranchModal } from '../branch-modal';
import ReactEcharts from 'echarts-for-react';
// import echarts from 'echarts'


function CalenderChart({ list }) {

    const chartOption = useMemo(() => {

        let dateMap = {}
        for (let commit of list) {
            const m = moment(commit.date)
            const date = m.format('YYYY-MM-DD')
            if (!dateMap[date]) {
                dateMap[date] = 0
            }
            dateMap[date]++
        }
        const data = []
        const times = []
        for (let i = 0; i < 360; i++) {
            const m = moment().add(-i, 'days')
            const date = m.format('YYYY-MM-DD')
            times.push(date)
            data.push(dateMap[date] || 0)
        }
        return {
            tooltip: {
                // show: true,
                trigger: 'axis',
            },
            xAxis: {
              type: 'category',
              data: times,
              boundaryGap: true,
            },
            yAxis: {
              type: 'value'
            },
            series: [
              {
                data: data.reverse(),
                type: 'line',
                name: '提交数量',
              }
            ]
          }
    }, [list])

    function getVirtulData(year) {
        // year = year || '2017';
        // var date = +echarts.number.parseDate(year + '-01-01');
        // var end = +echarts.number.parseDate(+year + 1 + '-01-01');
        // var dayTime = 3600 * 24 * 1000;
        const data = [];
        // for (var time = date; time < end; time += dayTime) {
        //   data.push([
        //     echarts.format.formatTime('yyyy-MM-dd', time),
        //     Math.floor(Math.random() * 10000)
        //   ]);
        // }
        // return data;
        for (let i = 0; i < 90; i++) {
            const m = moment().add(- i, 'days')
            data.push([
                m.format('YYYY-MM-DD'),
                Math.floor(Math.random() * 10000),
            ])
        }
        return data
      }


    return (
        <ReactEcharts
            style={{ height: '400px'}}
            option={chartOption}
            lazyUpdate={true}
            // onEvents={{
            //     'click': (e) => {
            //         console.log(e)
            //         setItem(e.data)
            //     }
            // }}
        />
    )
}

export function GitStat({ config, event$, projectPath,  }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()

    const [listLoading, setListLoading] = useState(false)
    const [list, setList] = useState([])


    

    

    async function loadList() {
        setListLoading(true)
        // loadTags()
        let res = await request.post(`${config.host}/git/commit/list`, {
            projectPath,
            // connectionId,
            // sql: lineCode,
            // tableName,
            // dbName,
            // logger: true,
        }, {
            // noMessage: true,
        })
        // console.log('res', res)
        if (res.success) {
            const list = res.data
            setList(list)
        }
        setListLoading(false)
    }

    


    useEffect(() => {
        loadList()
    }, [])

    event$.useSubscription(msg => {
        // console.log('CommitList/onmessage', msg)
        // console.log(val);
        if (msg.type == 'event_refresh_commit_list') {
            // const { json } = msg.data
            // addJsonTab(json)
            loadList()
        }
        else if (msg.type == 'event_refresh_branch') {
            // const { json } = msg.data
            // addJsonTab(json)
            loadList()
        }
    })

    // event$.useSubscription(msg => {
    //     console.log('CommitList/onmessage', msg)
    //     // console.log(val);
        
    // })


    console.log('render/list', list)
    const stat = useMemo(() => {
        // {
        //     "hash": "727bfac6ad159647701f1265bc89fdd6c5c33759",
        //     "date": "2022-10-12T16:32:36+08:00",
        //     "message": "fix(uni-nav-bar): nvue 下，fixed 不生效的bug",
        //     "refs": "HEAD -> master, origin/master, origin/HEAD",
        //     "body": "",
        //     "author_name": "mehaotian",
        //     "author_email": "490272692@qq.com"
        // }
        const totalCommit = list.length
        let yearCommit = 0
        let quarterCommit = 0
        let monthCommit = 0
        const yearAgo = moment().add(-1, 'years')
        const quarterAgo = moment().add(-3, 'months')
        const monthAgo = moment().add(-1, 'months')
        let monthUserNum = 0
        let monthUserMap = {}
        let quarterUserNum = 0
        let quarterUserMap = {}
        let yearUserNum = 0
        let yearUserMap = {}

        for (let commit of list) {
            const m = moment(commit.date)
            if (m.isAfter(yearAgo)) {
                yearCommit++
                if (!yearUserMap[commit.author_email]) {
                    yearUserMap[commit.author_email] = 1
                    yearUserNum++
                }
            }
            if (m.isAfter(quarterAgo)) {
                quarterCommit++
                if (!quarterUserMap[commit.author_email]) {
                    quarterUserMap[commit.author_email] = 1
                    quarterUserNum++
                }
            }
            if (m.isAfter(monthAgo)) {
                monthCommit++
                if (!monthUserMap[commit.author_email]) {
                    monthUserMap[commit.author_email] = 1
                    monthUserNum++
                }
            }
        }
        return {
            totalCommit,
            yearCommit,
            quarterCommit,
            monthCommit,
            monthUserNum,
            quarterUserNum,
            yearUserNum,
        }
    }, [list])

    const showList = useMemo(() => {
        // console.log('列表', list, branchs)
        // list hash "489deea0f6bf7e90a7434f4ae22c5e17214bdf5d"
        // branchs commit: "489deea"
        // console.log('tags', tags)
        const newList = cloneDeep(list)
        for (let item of newList) {
            // tag: v0.0.1, tag: first
            const refs = item.refs.split(',')
            const tags = []
            for (let ref of refs) {
                // console.log('ref', ref)
                if (ref.includes('tag')) {
                    tags.push(ref.split(':')[1])
                }
            }
            item.tags = tags
        }
        for (let item of newList) {
            const refs = item.refs.split(',').filter(item => item)
            const branches = []
            for (let ref of refs) {
                // console.log('ref', ref)
                if (!ref.includes('tag')) {
                    branches.push({
                        name: ref,
                    })
                }
            }
            // console.log('branches', branches)
            item.branches = branches
        }
        // for (let branch of branchs) {
        //     const idx = newList.findIndex(item => item.hash.startsWith(branch.commit))
        //     if (idx != -1) {
        //         if (!newList[idx].branchs) {
        //             newList[idx].branchs = []
        //         }
        //         newList[idx].branchs.push(branch)
        //     }
        // }
        return newList
            // .splice(0, 100)
    }, [list])

    const containerRef = useRef(null);
    const wrapperRef = useRef(null);
    // const originalList = useMemo(() => Array.from(Array(99999).keys()), []);
    const [vList] = useVirtualList(showList, {
        containerTarget: containerRef,
        wrapperTarget: wrapperRef,
        itemHeight: 32,
        overscan: 10,
    });
    // console.log('showList.le', showList.length)
    // console.log('vList', vList)

    // console.log('showList', showList)

    // return (
    //     <div>
    //         <Gitgraph>
    //             {(gitgraph) => {
    //                 // Simulate git commands with Gitgraph API.
    //                 const master = gitgraph.branch("master");
    //                 master.commit("Initial commit");

    //                 const develop = master.branch("develop");
    //                 develop.commit("Add TypeScript");

    //                 const aFeature = develop.branch("a-feature");
    //                 aFeature
    //                 .commit("Make it work")
    //                 .commit("Make it right")
    //                 .commit("Make it fast");

    //                 develop.merge(aFeature);
    //                 develop.commit("Prepare v1");

    //                 master.merge(develop).tag("v1.0.0");
    //             }}
    //         </Gitgraph>
    //     </div>
    // )
    // console.log('curCommit.message', curCommit?.message.replace(/\\n/, '\n'))

    
    return (
        <div className={styles.commitBox}>
            {/* <Button
                onClick={() => {
                    loadList()
                }}
            >
                刷新
            </Button> */}
            {listLoading ?
                <FullCenterBox>
                    <Spin />
                </FullCenterBox>
            : showList.length == 0 ?
                <FullCenterBox
                    // height={160}
                >
                    <Empty />
                </FullCenterBox>
            :
                <div>
                    {!!stat &&
                        <div>
                            <div className={styles.exportBox}>
                                <IconButton
                                    tooltip={t('export_json')}
                                    // size="small"
                                    className={styles.refresh}
                                    onClick={() => {
                                        event$.emit({
                                            type: 'event_show_json',
                                            data: {
                                                json: JSON.stringify(list, null, 4)
                                                // connectionId,
                                            },
                                        })
                                        // exportAllKeys()
                                    }}
                                >
                                    <ExportOutlined />
                                </IconButton>
                            </div>
                            <div className={styles.stats}>
                                <div className={styles.item}>过去 1 月提交数：{stat.monthCommit}</div>
                                <div className={styles.item}>过去 3 月提交数：{stat.quarterCommit}</div>
                                <div className={styles.item}>过去 1 年提交数：{stat.yearCommit}</div>
                                <div className={styles.item}>总提交数：{stat.totalCommit}</div>
                                <div className={styles.item}>过去 1 月维护人员数量：{stat.monthUserNum}</div>
                                <div className={styles.item}>过去 3 月维护人员数量：{stat.quarterUserNum}</div>
                                <div className={styles.item}>过去 1 年维护人员数量：{stat.yearUserNum}</div>
                            </div>

                            <CalenderChart
                                list={list}
                            />
                            
                        </div>
                    }
                </div>
            }
            {/* <div className={styles.layoutTop}>
            </div>
            <div className={styles.layoutBottom}>
            </div> */}
        </div>
    )
}