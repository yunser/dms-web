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
            number: 60,
            unit: 'minute',
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
                                                    {item.number} 分钟
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
                        <div>{value.number} 分钟</div>
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
        number: 15,
        unit: 'minute',
        // custom
        start: '',
        end: '',
    })
    

    const { t } = useTranslation()
    const [contextList, setContextList] = useState([])
    const [list, setList] = useState([])
    const pageSize = detailItem.type == 'grafana' ? 101 : 20
    const [type, setType] = useState('')
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [query, setQuery] = useState('')
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
        let res = await request.post(detailItem.url, {
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
            const { list, total, query } = res.data
            setList(list)
            if (total != null) {
                setTotal(total)
            }
            setQuery(query)
        }
        setLoading(false)
    }

    useEffect(() => {
        loadList()
    }, [page, time, type, searchKeyword, ts])

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
            __pack_id__: item.__pack_id__   ,
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
            <div className={styles.header}
            >
                <Space>
                    <TimeSelector
                        value={time}
                        onChange={time => {
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
                <div className={styles.query}>{query}</div>
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
                                            maxWidth: document.body.clientWidth - 240
                                        }}
                                    >
                                        {!!traceId &&
                                            <span className={styles.traceId}
                                                onClick={() => {
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
            <div></div>
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
