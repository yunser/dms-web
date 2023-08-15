import { Button, Checkbox, Col, DatePicker, Descriptions, Divider, Drawer, Empty, Form, Input, InputNumber, message, Modal, Pagination, Popover, Row, Select, Space, Table, Tabs, Tag } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './logger-detail.module.less';
import _ from 'lodash';
import classNames from 'classnames'
import { useTranslation } from 'react-i18next';
import { Editor } from '@/views/db-manager/editor/Editor';
import storage from '../storage'
import { CodeDebuger } from '../code-debug';
import { uid } from 'uid';
import Item from 'antd/lib/list/Item';
import moment from 'moment';
import { request } from '@/views/db-manager/utils/http';
import ReactJson from 'react-json-view';
import { IconButton } from '@/views/db-manager/icon-button';
import { ExportOutlined } from '@ant-design/icons';
import { getGlobalConfig } from '@/config';
import copy from 'copy-to-clipboard';

const { RangePicker } = DatePicker


function LogCell({ value }) {
    let text
    if (typeof value == 'number') {
        text = `${value}`
        return <div className={styles.num}>{text}</div>
    }
    else if (value == '') {
        return <div className={styles.weak}>empty</div>
    }
    else if (value === '<undefined>') {
        return <div className={styles.weak}>undefined</div>
    }
    else if (typeof value == 'string') {
        text = value
    }
    else if (value === null) {
        return <div className={styles.weak}>NULL</div>
    }
    else if (value === undefined) {
        return <div className={styles.weak}>undefined</div>
    }
    else {
        text = JSON.stringify(value, null, 4)
        console.log('texttext', text)
    }
    return (
        <div><pre className={styles.pre}>{text}</pre></div>
    )
}

function TimeSelector({ value, onChange }) {
    const { t } = useTranslation()
    const [open, setOpen] = useState(false)
    const [tab, setTab] = useState('relative')

    const unitLabels = {
        'minute': t('minute'),
        'hour': t('hour')
    }

    const [date,setDate] = useState(moment().format('YYYY-MM-DD'))
    const [startHour,setStartHour] = useState('00:00')
    const [endHour,setEndHour] = useState('24:00')
    const [startTime,setStartTime] = useState(moment().add(-1, 'hours').format('YYYY-MM-DD HH:mm:ss'))
    const [endTime,setEndTime] = useState(moment().format('YYYY-MM-DD HH:mm:ss'))
    const [centerTime,setCenterTime] = useState(moment().format('YYYY-MM-DD HH:mm:ss'))
    const [offsetMinute,setOffsetMinute] = useState(30)

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
    const hours = []
    for (let hour = 0; hour <= 24; hour++) {
        const timeStart = `${`${hour}`.padStart(2, '0')}:00`
        hours.push({
            label: timeStart,
            value: timeStart,
        })
        if (hour != 24) {
            const timeHalf = `${`${hour}`.padStart(2, '0')}:30`
            hours.push({
                label: timeHalf,
                value: timeHalf,
            })
        }
    }
    function showModal() {
        setTab(value.type)
        setOpen(true)
    }

    let showTimeText
    
    if (value.type == 'today') {
        showTimeText = t('today')
    }
    else if (value.type == 'yesterday') {
        showTimeText = t('yesterday')
    }
    else if (value.type == 'relative') {
        showTimeText = `${value.number} ${unitLabels[value.unit]}`
    }
    else {
        showTimeText = `${startTime}~${endTime}`
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
                        <div>
                            {/* {tab == 'relative' &&
                            } */}
                            <div className={styles.sectionTitle}>{t('relative')}</div>
                            <div className={styles.p}>
                                <div className={styles.c}></div>
                            </div>
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
                                <Button
                                    onClick={() => {
                                        onChange && onChange({
                                            type: 'today',
                                        })
                                        setOpen(false)
                                    }}
                                >
                                    {t('today')}
                                </Button>
                                <Button
                                    onClick={() => {
                                        onChange && onChange({
                                            type: 'yesterday',
                                        })
                                        setOpen(false)
                                    }}
                                >
                                    {t('yesterday')}
                                </Button>
                            </div>
                            {/* {tab == 'custom' &&
                            } */}
                            <div className={styles.sectionTitle}>{t('customize')}</div>
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
                                        
                                    >
                                        {t('ok')}
                                    </Button>
                                </Space>
                            </div>
                            <div className={styles.sectionTitle}>
                                {t('date_time')}
                            </div>
                            <div>
                                <Space>
                                    <DatePicker
                                        value={moment(date)}
                                        onChange={value => {
                                            if (!value) {
                                                return
                                            }
                                            setDate(value?.clone().format('YYYY-MM-DD'))
                                        }}
                                    />
                                    <Select
                                        className={styles.hourSelector}
                                        value={startHour}
                                        options={hours}
                                        onChange={value => {
                                            setStartHour(value)
                                        }}
                                        showSearch={true}
                                        optionFilterProp="label"
                                    />
                                    ~
                                    <Select
                                        className={styles.hourSelector}
                                        value={endHour}
                                        options={hours}
                                        onChange={value => {
                                            setEndHour(value)
                                        }}
                                        showSearch={true}
                                        optionFilterProp="label"
                                    />
                                    <Button
                                        onClick={() => {
                                            const dateM = moment(date)
                                            const start = dateM.clone()
                                                .hour(parseInt(startHour.split(':')[0]))
                                                .minute(parseInt(startHour.split(':')[1]))
                                                .format('YYYY-MM-DD HH:mm:ss')
                                            const end = dateM.clone()
                                                .hour(parseInt(endHour.split(':')[0]))
                                                .minute(parseInt(endHour.split(':')[1]))
                                                .format('YYYY-MM-DD HH:mm:ss')
                                            onChange && onChange({
                                                type: 'custom',
                                                start,
                                                end,
                                            })
                                            setStartTime(start)
                                            setEndTime(end)
                                            setDate(dateM.clone().format('YYYY-MM-DD'))
                                            setOpen(false)
                                        }}
                                        
                                    >
                                        {t('ok')}
                                    </Button>
                                </Space>
                            </div>
                            <div className={styles.sectionTitle}>
                                +=
                            </div>
                            <div>
                                <Space>
                                    <Input
                                        value={centerTime}
                                        onChange={e => {
                                            setCenterTime(e.target.value)
                                        }}
                                    />
                                    ±
                                    <InputNumber
                                        className={styles.hourSelector}
                                        value={offsetMinute}
                                        onChange={value => {
                                            setOffsetMinute(value)
                                        }}
                                    />
                                    {t('minute')}
                                    <Button
                                        onClick={() => {
                                            const centerM = moment(centerTime)
                                            const start = centerM.clone()
                                                .subtract(offsetMinute, 'minutes')
                                                .format('YYYY-MM-DD HH:mm:ss')
                                            const end = centerM.clone()
                                                .add(offsetMinute, 'minutes')
                                                .format('YYYY-MM-DD HH:mm:ss')
                                            onChange && onChange({
                                                type: 'custom',
                                                start,
                                                end,
                                            })
                                            setStartTime(start)
                                            setEndTime(end)
                                            setOpen(false)
                                        }}
                                        
                                    >
                                        {t('ok')}
                                    </Button>
                                </Space>
                            </div>
                        </div>
                    </div>
                } 
                // title="Title" 
                trigger="click"
            >
                <Button
                    onClick={showModal}
                >
                    {showTimeText}
                    {/* {value.type == 'relative' ?
                        <div>{value.number} {unitLabels[value.unit]}</div>
                    :
                        <div>
                            {startTime}~{endTime}
                        </div>
                    } */}
                </Button>
            </Popover>
        </div>
    )
}

export function LoggerDetail({ event$, connectionId, item: detailItem, onNew, }) {

    const config = getGlobalConfig()

    const [time, setTime] = useState({
        type: 'relative',
        // relative
        number: 1,
        unit: 'hour',
        // custom
        start: '',
        end: '',
    })
    
    const quickQueries = (detailItem.quickQueries || []).map(item => {
        return {
            ...item,
            label: item.title,
            value: item.id,
        }
    })

    const { t } = useTranslation()

    const [histories, setHistories] = useState([])

    const [contextList, setContextList] = useState([])
    const [curFile, setCurFile] = useState('')
    const [files, setFiles] = useState([])
    const [list, setList] = useState([])
    // const pageSize = detailItem.type == 'grafana' ? 101 : 20
    const [pageSize, setPageSize] = useState(detailItem.type == 'grafana' ? 101 : 20)
    const [type, setType] = useState('')
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [query, setQuery] = useState('')
    const [queryTime, setQueryTime] = useState('')
    const [loading, setLoading] = useState(false)
    const [keyword, setKeyword] = useState('')
    const [searchKeyword, setSearchKeyword] = useState('')
    const default_limit = 100
    const [limit, setLimit] = useState(default_limit)
    // const [searchLimit, setSearchLimit] = useState(limit)
    const [ts, setTs] = useState('1')
    // 
    const [detail, setDetail] = useState(null)
    const [detailView, setDetailView] = useState('text')
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
            if (time.type == 'today') {
                startTime = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss')
                endTime = moment().format('YYYY-MM-DD HH:mm:ss')
            }
            else if (time.type == 'yesterday') {
                startTime = moment().add(-1, 'days').startOf('day').format('YYYY-MM-DD HH:mm:ss')
                endTime = moment().add(-1, 'days').endOf('day').format('YYYY-MM-DD HH:mm:ss')
            }
            else if (time.type == 'relative') {
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
        const reqData = {
            path: curFile,
            
            keyword: searchKeyword,
            startTime,
            endTime,
            ts,
            page,
            pageSize: detailItem.type == 'grafana' ? (limit || default_limit) : pageSize,
            queryTotal: page == 1,
            type,
            _sls: undefined
        }
        if (detailItem.sls) {
            reqData._sls = detailItem.sls
        }
        if (detailItem.grafana) {
            reqData.grafana = detailItem.grafana
        }
        let res = await request.post(_url, reqData)
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
        setLog(searchKeyword)
    }

    async function setLog(searchKeyword) {
        let res = await request.post(`${config.host}/logger/history/push`, {
            content: searchKeyword,
        })
        if (res.success) {
            loadHistory()
        }
    }

    async function clear() {
        let res = await request.post(detailItem.config.clear.url, {
            path: detailItem.path,})
        if (res.success) {
            loadList()
        }
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

    async function loadHistory() {
        let res = await request.post(`${config.host}/logger/history`, {
            pageSize: 200,
        })
        if (res.success) {
            setHistories(res.data.list)
        }
    }

    useEffect(() => {
        if (detailItem.type == 'file') {
            loadFiles()
        }
        loadHistory()
    }, [])

    useEffect(() => {
        loadList()
    }, [curFile, page, pageSize, time, type, searchKeyword, ts])

    function quickSelect(value) {
        const fItem = quickQueries.find(item => item.id == value)
        console.log('value', value, fItem)
        if (fItem) {
            setKeyword(fItem.content)
            setSearchKeyword(fItem.content)
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
        const reqData = {
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
            id: item.id,
        }
        if (detailItem.sls) {
            reqData._sls = detailItem.sls
        }
        let res = await request.post(detailItem.url, reqData)
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
                            placeholder={t('search')}
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
                        {detailItem.type == 'grafana' &&
                            <InputNumber
                                placeholder="limit"
                                value={limit}
                                onChange={value => {
                                    setLimit(value)
                                }}
                            />
                        }
                        <Select
                            value={null}
                            placeholder={t('quick_search')}
                            className={styles.quickSelect}
                            options={quickQueries}
                            onChange={value => {
                                quickSelect(value)
                            }}
                        />
                        <Select
                            value={null}
                            placeholder={t('history')}
                            className={styles.quickSelect}
                            options={histories.map(item => {
                                return {
                                    label: item.content,
                                    value: item.id,
                                }
                            })}
                            onChange={value => {
                                const fItem = histories.find(item => item.id == value)
                                if (fItem) {
                                    setKeyword(fItem.content)
                                    setSearchKeyword(fItem.content)
                                }
                            }}
                            style={{
                                width: 320,
                            }}
                        />
                        {!!detailItem?.config?.clear &&
                            <Button
                                // size="small"
                                danger
                                onClick={() => {
                                    clear()
                                }}
                            >
                                {t('clear')}
                            </Button>
                        }
                        {/* <Button
                            size="small"
                            onClick={() => {
                                loadList()
                            }}
                        >
                            {t('refresh')}
                        </Button> */}
                    </Space>
                    <Space>
                        <Button
                            size="small"
                            onClick={() => {
                                onNew && onNew()
                            }}
                        >
                            {t('new')}
                        </Button>
                        <IconButton
                            tooltip={t('export_json')}
                            onClick={() => {
                                event$.emit({
                                    type: 'event_show_json',
                                    data: {
                                        json: JSON.stringify(list, null, 4)
                                        // connectionId,
                                    },
                                })
                            }}
                        >
                            <ExportOutlined />
                        </IconButton>
                    </Space>
                </div>
                <div className={styles.pageBox}>
                    <Pagination
                        total={total}
                        current={page}
                        // size="small"
                        pageSize={(detailItem.type == 'grafana') ? (limit || default_limit) : pageSize}
                        // showSizeChanger={false}
                        showTotal={total => `${total} ${t('rows')}`}
                        onChange={(current, _pageSize) => {
                            setPage(current)
                            if (_pageSize != pageSize) {
                                setPageSize(_pageSize)
                            }
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
                                width: 200,
                                render(value, _item, _index) {
                                    if (!value) {
                                        return '--'
                                    }
                                    const m = moment(value)
                                    const minite = moment().diff(m, 'minute') + 1
                                    let tag = ''
                                    if (minite < 60) {
                                        tag = `-${minite} min`
                                    }
                                    else if (minite < 24 * 60) {
                                        const hour = (minite / 60).toFixed(1)
                                        tag = `-${hour} h`
                                    }
                                    return (
                                        <div className={styles.fullCell}>
                                            <div className={styles.timeCell}>
                                                <div
                                                    className={styles.timeValue}
                                                    onClick={() => {
                                                        copy(m.format('YYYY-MM-DD HH:mm:ss'))
                                                        message.info(t('copied'))
                                                    }}
                                                >
                                                    {m.format('MM-DD HH:mm:ss')}
                                                </div>
                                                {!!tag &&
                                                    <Tag className={styles.timeTag}>{tag}</Tag>
                                                }
                                            </div>
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
                                                maxWidth: document.body.clientWidth - 200 - 60 - (detailItem.type == 'file' ? 240 : 0)
                                            }}
                                        >
                                            <div className={styles.tools}>
                                                <Space
                                                    split={<Divider type="vertical" />}
                                                >
                                                    {/* <div>1</div>
                                                    <div>2</div> */}
                                                    <span
                                                        className={styles.view}
                                                        onClick={() => {
                                                            setDetail(item)
                                                            setDetailView('text')
                                                            setDetailVisible(true)
                                                        }}
                                                    >
                                                        {t('view')}
                                                    </span>
                                                    <span
                                                        className={styles.view}
                                                        onClick={() => {
                                                            try {
                                                                JSON.parse(item.content)
                                                            }
                                                            catch (err) {
                                                                message.error('content is not JSON')
                                                                return
                                                            }
                                                            setDetail(item)
                                                            setDetailView('json')
                                                            setDetailVisible(true)
                                                        }}
                                                    >
                                                        {t('json_view')}
                                                    </span>
                                                    <span
                                                        className={styles.view}
                                                        onClick={() => {
                                                            viewContext(item)
                                                        }}
                                                    >
                                                        {t('context')}
                                                    </span>
                                                </Space>
                                            </div>
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
                                                className={styles.contentText}
                                            >{_value}</span>
                                            
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
                    width={800}
                    title={t('detail')}
                    onClose={() => {
                        setDetailVisible(false)
                    }}
                >
                    {detailView == 'text' ?
                        <div>
                            {!!detail._content?.length ?
                                <div className={styles.logSubList}>
                                    {detail._content.map(item => {
                                        return (
                                            <div className={styles.item}>
                                                <LogCell value={item} />
                                            </div>
                                        )
                                    })}
                                </div>
                            :
                                <div>{detail.content}</div>
                            }
                        </div>
                    :
                        <ReactJson 
                            src={JSON.parse(detail.content)}
                            displayDataTypes={false}
                        />
                    }
                </Drawer>
            }
            {contextVisible &&
                <Drawer
                    width={document.body.clientWidth - 240}
                    open={true}
                    title={t('context')}
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
                                title: t('index'),
                                dataIndex: '__index_number__',
                                width: 64,
                                render(value) {
                                    let color
                                    if (value > 0) {
                                        color = 'green'
                                    }
                                    else if (value < 0) {
                                        color = 'red'
                                    }
                                    return (
                                        <div 
                                            // className={classNames(styles.indexNum, {
                                            //     [styles.current]: value == 0
                                            // })}
                                            style={{
                                                color,
                                            }}
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
