import { Button, Checkbox, Col, Descriptions, Drawer, Empty, Form, Input, InputNumber, message, Modal, Pagination, Popover, Row, Select, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './logger-detail.module.less';
import _ from 'lodash';
import classNames from 'classnames'
import { useTranslation } from 'react-i18next';
import { Editor } from '../editor/Editor';
import storage from '../storage'
import { CodeDebuger } from '../code-debug';
import { uid } from 'uid';
import Item from 'antd/lib/list/Item';
import moment from 'moment';
import { request } from '@/views/db-manager/utils/http';

const unitLabels = {
    'minute': '分钟',
    'hour': '小时'
}

const quickQueries = [
    {
        label: '__req',
        value: '__req',
    },
    {
        label: 'event_alarm_998832937149672657',
        value: 'event_alarm_998832937149672657',
    },
]

function TimeSelector({ value, onChange }) {
    
    const [open, setOpen] = useState(false)
    const [tab, setTab] = useState('relative')

    const [startTime,setStartTime] = useState(moment().add(-1, 'hours').format('YYYY-MM-DD HH:mm:ss'))
    const [endTime,setEndTime] = useState(moment().format('YYYY-MM-DD HH:mm:ss'))

    const quickTimes = [
        {
            number: 1,
            unit: 'minute',
        },
        {
            number: 5,
            unit: 'minute',
        },
        {
            number: 10,
            unit: 'minute',
        },
        {
            number: 15,
            unit: 'minute',
        },
        {
            number: 30,
            unit: 'minute',
        },
        {
            number: 1,
            unit: 'hour',
        },
        {
            number: 3,
            unit: 'hour',
        },
        {
            number: 6,
            unit: 'hour',
        },
        {
            number: 12,
            unit: 'hour',
        },
        {
            number: 24,
            unit: 'hour',
        },
    ]

    function showModal() {
        setTab(value.type)
        setOpen(true)
    }

    return (
        <div>
            <Popover
                open={open}
                onOpenChange={open => {
                    if (open) {
                        setTab(value.type)
                    }
                    setOpen(open)
                }}
                content={
                    <div className={styles.timeBox}>
                        <Tabs
                            activeKey={tab}
                            defaultActiveKey="1"
                            onChange={key => {
                                setTab(key)
                            }}
                            items={[
                                {
                                    label: `相对`,
                                    key: 'relative',
                                },
                                {
                                    label: `自定义`,
                                    key: 'custom',
                                },
                            ]}
                        />
                        <div>
                            {tab == 'relative' &&
                                <div className={styles.times}>
                                    {quickTimes.map(item => {
                                        return (
                                            <div>
                                                <Button
                                                    onClick={() => {
                                                        onChange && onChange({
                                                            type: 'relative',
                                                            number: item.number,
                                                            unit: item.unit,
                                                        })
                                                        setOpen(false)
                                                    }}
                                                >
                                                    {item.number} {unitLabels[item.unit]}
                                                </Button>
                                            </div>
                                        )
                                    })}
                                </div>
                            }
                            {tab == 'custom' &&
                                <div>
                                    <Space>
                                        <Input
                                            value={startTime}
                                            onChange={e => {
                                                setStartTime(e.target.value)
                                            }}
                                            style={{ width: 240 }}
                                        />
                                        <div>~</div>
                                        <Input
                                            value={endTime}
                                            onChange={e => {
                                                setEndTime(e.target.value)
                                            }}
                                            style={{ width: 240 }}
                                        />
                                        <Button
                                            onClick={() => {
                                                onChange && onChange({
                                                    type: 'custom',
                                                    start: startTime,
                                                    end: endTime,
                                                })
                                                setOpen(false)
                                            }}
                                            
                                        >确定</Button>
                                    </Space>
                                </div>
                            }
                        </div>
                    </div>
                } 
                // title="Title" 
                trigger="click"
            >
                <Button
                    onClick={showModal}
                >
                    {value.type == 'relative' ?
                        <div>{value.number} {unitLabels[value.unit]}</div>
                    :
                        <div>
                            {startTime}~{endTime}
                        </div>
                    }
                </Button>
            </Popover>
        </div>
    )
}

export function LoggerDetail({ event, connectionId, item: detailItem, onConnnect, }) {

    const config = {
        host: 'http://localhost:7003',
    }

    const [time, setTime] = useState({
        type: 'relative',
        // relative
        number: 1,
        unit: 'hour',
        // custom
        start: '',
        end: '',
    })
    

    const { t } = useTranslation()
    const [contextList, setContextList] = useState([])
    const [curFile, setCurFile] = useState('')
    const [files, setFiles] = useState([])
    const [list, setList] = useState([])
    const pageSize = detailItem.type == 'grafana' ? 101 : 20
    const [type, setType] = useState('')
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [query, setQuery] = useState('')
    const [queryTime, setQueryTime] = useState('')
    const [loading, setLoading] = useState(false)
    const [keyword, setKeyword] = useState('')
    const [searchKeyword, setSearchKeyword] = useState('')
    const [ts, setTs] = useState('1')
    // 
    const [detail, setDetail] = useState(null)
    const [detailVisible, setDetailVisible] = useState(false)
    // 
    const [contextVisible, setContextVisible] = useState(false)

    async function loadList() {
        if (detailItem.type == 'file' && !curFile) {
            return
        }
        setLoading(true)
        // const _startTime = moment().add(-1, 'hours').format('YYYY-MM-DD HH:mm:ss')
        // const _endTime = moment().format('YYYY-MM-DD HH:mm:ss')

        let startTime
        let endTime
        if (time) {
            if (time.type == 'relative') {
                startTime = moment().add(-time.number, time.unit).format('YYYY-MM-DD HH:mm:ss')
                endTime = moment().format('YYYY-MM-DD HH:mm:ss')
            }
            else {
                startTime = time.start
                endTime = time.end
            }
        }
        let _url = detailItem.url
        if (detailItem.type == 'file') {
            _url = detailItem.url + `/log/readline`
        }
        let res = await request.post(_url, {
            path: curFile,
            
            keyword: searchKeyword,
            startTime,
            endTime,
            ts,
            page,
            pageSize,
            queryTotal: page == 1,
            type,
        })
        if (res.success) {
            const { list, total, query, timeRange } = res.data
            setList(list)
            if (total != null) {
                setTotal(total)
            }
            setQuery(query)
            setQueryTime(timeRange)
        }
        setLoading(false)
    }

    async function loadFiles() {
        // setLoading(true)

        let res = await request.post(detailItem.url + '/log/list', {
            path: detailItem.path,
        })
        if (res.success) {
            const { list, total, } = res.data
            setFiles(list)
            // if (total != null) {
            //     setTotal(total)
            // }
            // setQuery(query)
            // setQueryTime(timeRange)
        }
        // setLoading(false)
    }

    useEffect(() => {
        if (detailItem.type == 'file') {
            loadFiles()
        }
    }, [])

    useEffect(() => {
        loadList()
    }, [curFile, page, time, type, searchKeyword, ts])

    function quickSelect(value) {
        const fItem = quickQueries.find(item => item.value == value)
        if (fItem) {
            setKeyword(fItem.value)
            setSearchKeyword(fItem.value)
        }
    }

    function viewContext(item) {
        loadContext(item)
        setContextVisible(true)
    }

    async function loadContext(item) {
        console.log('loadContext', )
        // let startTime
        // let endTime
        // if (time) {
        //     if (time.type == 'relative') {
        //         startTime = moment().add(-time.number, time.unit).format('YYYY-MM-DD HH:mm:ss')
        //         endTime = moment().format('YYYY-MM-DD HH:mm:ss')
        //     }
        //     else {
        //         startTime = time.start
        //         endTime = time.end
        //     }
        // }
        let res = await request.post(detailItem.url, {
            keyword: searchKeyword,
            // startTime,
            // endTime,
            ts,
            page,
            pageSize,
            queryTotal: page == 1,
            type,
            context: true,
            __pack_meta__: item.__pack_meta__,
            __pack_id__: item.__pack_id__,
            contextTime: item.ts,
        })
        if (res.success) {
            const { list, total, query } = res.data
            setContextList(list)

            // if (total != null) {
            //     setTotal(total)
            // }
            // setQuery(query)
        }
    }
    
    return (
        <div className={styles.infoBox}>
            {detailItem.type == 'file' &&
                <div className={styles.layoutLeft}>
                    <div className={styles.files}>
                        {files.map(item => {
                            return (
                                <div
                                    className={styles.item}
                                    key={item.name}
                                    onClick={() => {
                                        setCurFile(item.path)
                                    }}
                                >{item.name}</div>
                            )
                        })}
                    </div>
                </div>
            }
            <div className={styles.layoutRight}>
                <div className={styles.header}
                >
                    <Space>
                        <TimeSelector
                            value={time}
                            onChange={time => {
                                setPage(1)
                                setTime(time)
                            }}
                        />
                        <Select
                            // size="small"
                            className={styles.type}
                            value={type}
                            allowClear={type != ''}
                            onChange={type => {
                                // type == undefined when clear
                                setPage(1)
                                setType(type || '')
                            }}
                            options={[
                                {
                                    label: 'All',
                                    value: '',
                                },
                                {
                                    label: 'Error',
                                    value: 'error',
                                },
                                // {
                                //     label: 'Info',
                                //     value: 'info',
                                // },
                            ]}
                        />
                        <Input.Search
                            className={styles.search}
                            value={keyword}
                            placeholder="搜索"
                            allowClear
                            onChange={(e) => {
                                setKeyword(e.target.value)  
                            }}
                            onSearch={kw => {
                                setSearchKeyword(kw)
                                setPage(1)
                                setTs('' + new Date().getTime())
                            }}
                        />
                        <Select
                            value={''}
                            className={styles.quickSelect}
                            options={quickQueries}
                            onChange={value => {
                                quickSelect(value)
                            }}
                        />
                        {/* <Button
                            size="small"
                            onClick={() => {
                                loadList()
                            }}
                        >
                            {t('refresh')}
                        </Button> */}
                    </Space>
                </div>
                <div className={styles.pageBox}>
                    <Pagination
                        total={total}
                        current={page}
                        pageSize={pageSize}
                        showSizeChanger={false}
                        showTotal={total => `共 ${total} 条记录`}
                        onChange={(current) => {
                            setPage(current)
                        }}
                        // size="small"
                    />
                    <div className={styles.query}>{query} {queryTime}</div>
                </div>
                <div className={styles.body}>
                    {/* <div className={styles.logList}></div> */}
                    <Table
                        loading={loading}
                        dataSource={list}
                        bordered
                        size="small"
                        pagination={false}
                        columns={[
                            {
                                title: '',
                                dataIndex: '_source_',
                                width: 24,
                                render(value) {
                                    return (
                                        <div className={styles.fullCell}>
                                            <div className={classNames(styles.dot, value == 'stderr' ? styles.error : styles.out)}></div>
                                        </div>
                                    )
                                }
                            },
                            {
                                title: t('time'),
                                dataIndex: 'time',
                                width: 170,
                                render(value) {
                                    if (!value) {
                                        return '--'
                                    }
                                    return (
                                        <div className={styles.fullCell}>
                                            <div className={styles.timeValue}>{moment(value).format('YYYY-MM-DD HH:mm:ss')}</div>
                                        </div>
                                    )
                                }
                            },
                            {
                                title: t('content'),
                                dataIndex: 'content',
                                // width: 640,
                                render(value, item) {
                                    let _value = value
                                    let traceId = ''
                                    if (_value.startsWith('track_')) {
                                        _value = value.substring(15)
                                        traceId = value.substring(0, 15)
                                    }
                                    return (
                                        <div className={styles.content}
                                            style={{
                                                maxWidth: document.body.clientWidth - 240 - (detailItem.type == 'file' ? 240 : 0)
                                            }}
                                        >
                                            {!!traceId &&
                                                <span className={styles.traceId}
                                                    onClick={() => {
                                                        setPage(1)
                                                        setKeyword(traceId)
                                                        setSearchKeyword(traceId)
                                                    }}
                                                >{traceId}</span>
                                            }
                                            <span
                                            >{_value}</span>
                                            <span
                                                className={styles.view}
                                                onClick={() => {
                                                    setDetail(item)
                                                    setDetailVisible(true)
                                                }}
                                            >查看</span>
                                            <span
                                                className={styles.view}
                                                onClick={() => {
                                                    viewContext(item)
                                                }}
                                            >上下文</span>
                                        </div>
                                    )
                                }
                            },
                            // {
                            //     title: '',
                            //     dataIndex: '_empty',
                            // },
                        ]}
                    />
                    
                </div>
            </div>
            {detailVisible &&
                <Drawer
                    open={true}
                    title="详情"
                    onClose={() => {
                        setDetailVisible(false)
                    }}
                >
                    {detail.content}
                </Drawer>
            }
            {contextVisible &&
                <Drawer
                    width={document.body.clientWidth - 240}
                    open={true}
                    title="上下文"
                    onClose={() => {
                        setContextVisible(false)
                    }}
                >
                    <Table
                        loading={loading}
                        dataSource={contextList}
                        bordered
                        size="small"
                        pagination={false}
                        columns={[
                            // {
                            //     title: '',
                            //     dataIndex: '_source_',
                            //     width: 24,
                            //     render(value) {
                            //         return (
                            //             <div className={styles.fullCell}>
                            //                 <div className={classNames(styles.dot, value == 'stderr' ? styles.error : styles.out)}></div>
                            //             </div>
                            //         )
                            //     }
                            // },
                            {
                                title: 'index',
                                dataIndex: '__index_number__',
                                render(value) {
                                    return (
                                        <div 
                                            className={classNames(styles.indexNum, {
                                                [styles.current]: value == 0
                                            })}
                                        >{value}</div>
                                    )
                                }
                            },
                            {
                                title: t('time'),
                                dataIndex: 'time',
                                width: 170,
                                render(value) {
                                    return (
                                        <div className={styles.fullCell}>
                                            <div className={styles.timeValue}>{moment(value).format('YYYY-MM-DD HH:mm:ss')}</div>
                                        </div>
                                    )
                                }
                            },
                            {
                                title: t('content'),
                                dataIndex: 'content',
                                // width: 640,
                                render(value, item) {
                                    let _value = value
                                    let traceId = ''
                                    if (_value.startsWith('track_')) {
                                        _value = value.substring(15)
                                        traceId = value.substring(0, 15)
                                    }
                                    return (
                                        <div className={styles.content}
                                            style={{
                                                maxWidth: document.body.clientWidth - 640
                                            }}
                                        >
                                            {!!traceId &&
                                                <span className={styles.traceId}
                                                    onClick={() => {
                                                        setPage(1)
                                                        setKeyword(traceId)
                                                        setSearchKeyword(traceId)
                                                    }}
                                                >{traceId}</span>
                                            }
                                            <span
                                            >{_value}</span>
                                            {/* <span
                                                className={styles.view}
                                                onClick={() => {
                                                    setDetail(item)
                                                    setDetailVisible(true)
                                                }}
                                            >查看</span> */}
                                            {/* <span
                                                className={styles.view}
                                                onClick={() => {
                                                    viewContext(item)
                                                }}
                                            >上下文</span> */}
                                        </div>
                                    )
                                }
                            },
                            // {
                            //     title: '',
                            //     dataIndex: '_empty',
                            // },
                        ]}
                    />
                    {/* {detail.content} */}
                </Drawer>
            }
        </div>
    )
}
