import { Button, Checkbox, Col, DatePicker, Descriptions, Divider, Drawer, Empty, Form, Input, InputNumber, InputRef, message, Modal, Pagination, Popover, Row, Select, Space, Table, Tabs, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { CopyOutlined, ExportOutlined, EyeFilled, HomeOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons';
import { getGlobalConfig } from '@/config';
import copy from 'copy-to-clipboard';
import ReactEcharts from 'echarts-for-react';
import { format } from 'sql-formatter'
import { qs } from 'url-parse';

const { RangePicker } = DatePicker

function hasTrace(content: string) {
    return content.startsWith('trace_')
        || content.startsWith('track_')
}

function splitTrace(content: string) {
    if (content.startsWith('trace_')) {
        const prefix = content.match(/trace_[^\s]+/)[0]
        return [prefix, content.substring(prefix.length)]
    }
    else if (content.startsWith('track_')) {
        const prefix = content.match(/track_[^\s]+/)[0]
        return [prefix, content.substring(prefix.length)]
    }
}

function LogCell({ value }) {
    const { t } = useTranslation()
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
        <div>
            <Button
                onClick={() => {
                    copy(text)
                    message.info(t('copied'))
                }}
            >
                {t('copy')}
            </Button>
            <Button
                onClick={() => {
                    copy(text)
                    message.info(t('copied'))
                }}
            >
                {t('json')}
            </Button>
            <pre className={styles.pre}>{text}</pre>
        </div>
    )
}

// @f.req
function NodeReq({ message = [], doSearch }) {
    const [queryVisible, setQueryVisible] = useState(false)
    const reqObj = message[0]
    let query = {}
    if (reqObj.method == 'GET') {
        console.log('reqObj', reqObj)
        if (reqObj.url.includes('?')) {
            query = qs.parse(reqObj.url.split('?')[1])
            console.log('query', query)
        }
    }
    return (
        // <div className={styles.reqBox}>
        <>
            <Tag className={styles.logItem} color={reqObj.status == 200 ? 'green' : 'red'}>
                {reqObj.status}
            </Tag>
            {!!reqObj['@user'] &&
                <span className={styles.logItem}
                    onClick={() => {
                        doSearch && doSearch(`@user ${reqObj['@user']}`)
                    }}
                >
                    {/* @{reqObj['@user']} */}
                    <UserOutlined />
                </span>
            }
            <span className={styles.logItem}>{reqObj.method}</span>
            <span className={styles.logItem}>{reqObj.url}</span>
            <Tag className={styles.logItem}>{reqObj.time}ms</Tag>
            <span className={styles.logItem}>{reqObj.speed}</span>
            {reqObj.method == 'GET' ?
                <Tag
                    className={styles.linkTag}
                    onClick={() => {
                        setQueryVisible(true)
                    }}
                >queries</Tag>
            :
                <span className={styles.logItem}>{JSON.stringify(reqObj.requestBody)}</span>
            }
            <span className={styles.logItem}>{' ==> '}{JSON.stringify(reqObj.responseBody)}</span>
            {queryVisible &&
                <Drawer
                    title="query"
                    open={true}
                    width={480}
                    onClose={() => {
                        setQueryVisible(false)
                    }}
                >
                    <pre>{JSON.stringify(query, null, 4)}</pre>
                </Drawer>
            }
        </>
    )
}

// @f.sql
function NodeSql({ message: LogMessage = []}) {
    const { t } = useTranslation()
    const [sqlObj] = LogMessage

    const [detailVisible, setDetailVisible] = useState(false)
    const [sql, setSql] = useState('')

    function getLengthColor(length) {
        if (length > 10000) {
            return 'red'
        }
        if (length > 1000) {
            return 'orange'
        }
        return 'default'
    }

    function getTimeColor(time) {
        if (time > 1000) {
            return 'red'
        }
        if (time > 100) {
            return 'orange'
        }
        if (time < 10) {
            return 'green'
        }
        return 'default'
    }

    return (
        // <div className={styles.reqBox}>
        <>
            {/* <Tag className={styles.logItem} color={reqObj.status == 200 ? 'green' : 'red'}>
                {reqObj.status}
            </Tag> */}
            {/* <span className={styles.logItem}>{prefix}</span> */}
            <Tag color={getTimeColor(sqlObj.time)}>{sqlObj.time}ms</Tag>
            <Tag className={styles.logItem} color={getLengthColor(sqlObj.length)}>{sqlObj.length}</Tag>
            <Tag
                className={styles.sqlView}
                onClick={() => {
                    const formatSql = format(sqlObj.sql)
                    copy(formatSql)
                    message.info(t('copied'))
                    setSql(formatSql)
                    setDetailVisible(true)
                }}
            >
                <EyeFilled className={styles.icon} />
                SQL
            </Tag>
            <span className={styles.logItem}>{sqlObj.sql}</span>
            {/* <span className={styles.logItem}>{JSON.stringify(reqObj.reqData)}</span> */}
            {/* <span className={styles.logItem} style={{color: 'blue'}}>{' ==> '}</span> */}
            {/* <span className={styles.logItem}>{JSON.stringify(reqObj.resBody)}</span> */}
            {detailVisible &&
                <Drawer
                    title="SQL"
                    open={true}
                    width={800}
                    onClose={() => {
                        setDetailVisible(false)
                    }}
                >
                    <pre>{sql}</pre>
                </Drawer>
            }
        </>
    )
}

// @f.task
function NodeTask({ message: LogMessage = []}) {
    const { t } = useTranslation()
    const [taskObj] = LogMessage

    function getTimeColor(time) {
        if (time > 1000) {
            return 'red'
        }
        if (time > 100) {
            return 'orange'
        }
        if (time < 10) {
            return 'green'
        }
        return 'default'
    }

    return (
        <>
            <Tag color={getTimeColor(taskObj.time)}>{taskObj.time}ms</Tag>
            <span className={styles.logItem}>{taskObj.message}</span>
        </>
    )
}

// @f.num
function NodeCount({ message: LogMessage = []}) {
    const { t } = useTranslation()
    const [countObj] = LogMessage

    return (
        <>
            <span className={styles.logItem}>{countObj.name}</span>
            <span className={styles.logItem}>{countObj.count}</span>
        </>
    )
}

// @f.time
function NodeTime({ message: LogMessage = []}) {
    const { t } = useTranslation()
    const [countObj] = LogMessage

    return (
        <>
            <span className={styles.logItem}>{countObj.name}</span>
            <span className={styles.logItem}>{countObj.time}</span>
        </>
    )
}

// @f.sleep
function NodeSleep({ message: LogMessage = []}) {
    const [countObj] = LogMessage

    return (
        <>
            <span className={styles.logItem}>{countObj.time}</span>
        </>
    )
}

// @f.prog
function NodeProgress({ message: LogMessage = []}) {
    const [countObj] = LogMessage

    return (
        <>
            <span className={styles.logItem}>{countObj.name}</span>
            <Tag className={styles.logItem}>{countObj.time}ms</Tag>
            <span className={styles.logItem}>{countObj.current}</span>
            <span className={styles.logItem}>/</span>
            <span className={styles.logItem}>{countObj.total}</span>
            {!!countObj.totalPage &&
                <>
                    <span className={styles.logItem}>分页：</span>
                    <span className={styles.logItem}>{countObj.page}</span>
                    <span className={styles.logItem}>/</span>
                    <span className={styles.logItem}>{countObj.totalPage}</span>
                </>
            }
        </>
    )
}

// @f.tbl
function NodeList({ message: LogMessage = []}) {
    const { t } = useTranslation()
    const [listObj] = LogMessage

    const [detailVisible, setDetailVisible] = useState(false)
    const [sql, setSql] = useState('')

    function getLengthColor(length) {
        if (length > 10000) {
            return 'red'
        }
        if (length > 1000) {
            return 'orange'
        }
        return 'default'
    }

    function getTimeColor(time) {
        if (time > 1000) {
            return 'red'
        }
        if (time > 100) {
            return 'orange'
        }
        if (time < 10) {
            return 'green'
        }
        return 'default'
    }

    function ListTable({ list = [] }) {
        if (!list.length) {
            return <span></span>
        }
        const columns = Object.keys(list[0])
            .map(title => {
                return {
                    title,
                }
            })
        return (
            <div>
                <table className={styles.simpleTable}>
                    <tr>
                        {columns.map(col => {
                            return (
                                <th>
                                    {col.title}
                                </th>
                            )
                        })}
                    </tr>
                    {list.map(item => {
                        return (
                            <tr>
                                {columns.map(col => {
                                    return (
                                        <td>
                                            {item[col.title]}
                                        </td>
                                    )
                                })}
                            </tr>
                        )
                    })}
                </table>
            </div>
        )
    }
    return (
        // <div className={styles.reqBox}>
        <>
            {/* <Tag className={styles.logItem} color={reqObj.status == 200 ? 'green' : 'red'}>
                {reqObj.status}
            </Tag> */}
            <span className={styles.logItem}>{listObj.name}</span>
            {listObj.list.length > 0 &&
                <div>
                    <ListTable
                        list={listObj.list}
                    />
                </div>
            }
            {/* <span className={styles.logItem}>{listObj.count}</span> */}
            {/* <Tag color={getTimeColor(countObj.time)}>{countObj.time}ms</Tag> */}
            {/* <Tag className={styles.logItem} color={getLengthColor(sqlObj.length)}>{sqlObj.length}</Tag> */}
            {/* <span className={styles.logItem}>{countObj.message}</span> */}
            {/* <span className={styles.logItem}>{JSON.stringify(reqObj.reqData)}</span> */}
            {/* <span className={styles.logItem} style={{color: 'blue'}}>{' ==> '}</span> */}
            {/* <span className={styles.logItem}>{JSON.stringify(reqObj.resBody)}</span> */}
        </>
    )
}

// @f.error
function NodeError({ message = []}) {
    const errObj = message[0]
    const [errorDetailVisible, setErrorDetailVisible] = useState(false)
    return (
        // <div className={styles.reqBox}>
        <>
            {/* <Tag className={styles.logItem} color={reqObj.status == 200 ? 'green' : 'red'}>
                {reqObj.status}
            </Tag> */}
            <Tag className={styles.logItem}>
                {errObj.name}
            </Tag>
            <span
                className={classNames(styles.logItem, styles.logItemLink)}
                onClick={() => {
                    setErrorDetailVisible(true)
                }}
            >
                {errObj.message}
            </span>
            <span className={styles.logItem}>{errObj.stack}</span>
            {/* <Tag className={styles.logItem}>{reqObj.time}ms</Tag>
            <span className={styles.logItem}>{reqObj.speed}</span>
            <span className={styles.logItem}>{reqObj.requestBody}</span>
            <span className={styles.logItem}>{' ==> '}{reqObj.responseBody}</span> */}
            {errorDetailVisible &&
                <Drawer
                    open={true}
                    width={800}
                    title="错误信息"
                    onClose={() => {
                        setErrorDetailVisible(false)
                    }}
                >
                    <pre>{errObj.stack}</pre>
                </Drawer>
            }

        </>
    )
}

// @f.http
function NodeHttpNew({ message = []}) {
    const [reqObj] = message
    return (
        // <div className={styles.reqBox}>
        <>
            <Tag className={styles.logItem} color={reqObj.status == 200 ? 'green' : 'red'}>
                {reqObj.status}
            </Tag>
            {/* <span className={styles.logItem}>{prefix}</span> */}
            <span className={styles.logItem}>{reqObj.name}</span>
            <span className={styles.logItem}>{reqObj.method}</span>
            <span className={styles.logItem}>{reqObj.url}</span>
            <Tag color={reqObj.time > 1000 ? 'red' : 'default'}>{reqObj.time}ms</Tag>
            <span className={styles.logItem}>{JSON.stringify(reqObj.reqData)}</span>
            <span className={styles.logItem} style={{color: 'blue'}}>{' ==> '}</span>
            <span className={styles.logItem}>{JSON.stringify(reqObj.resBody)}</span>
        </>
    )
}

function NodeHttp({ message = []}) {
    const [prefix, reqObj] = message
    return (
        // <div className={styles.reqBox}>
        <>
            <Tag className={styles.logItem} color={reqObj.status == 200 ? 'green' : 'red'}>
                {reqObj.status}
            </Tag>
            <span className={styles.logItem}>{prefix}</span>
            <span className={styles.logItem}>{reqObj.name}</span>
            <span className={styles.logItem}>{reqObj.url}</span>
            <Tag color={reqObj.time > 1000 ? 'red' : 'default'}>{reqObj.time}ms</Tag>
            <span className={styles.logItem}>{JSON.stringify(reqObj.reqData)}</span>
            <span className={styles.logItem} style={{color: 'blue'}}>{' ==> '}</span>
            <span className={styles.logItem}>{JSON.stringify(reqObj.resBody)}</span>
        </>
    )
}

function NodeLog({ content, doSearch }) {
    let json
    try {
        json = JSON.parse(content)
    } catch (error) {
        return <div>{content}</div>
    }
    const { level, message = [] } = json

    const msgText = JSON.stringify(message)

    let tag
    // let tag2
    // if (message.includes('执行SQL')) {
    //     tag = 'SQL'
    // }
    // else if (message.includes('[Forest]')) {
    //     tag = 'HTTP'
    // }
    // else if (message.includes('[DUBBO]')) {
    //     tag = 'RPC'
    // }
    // else if (message.includes('response===>')) {
    //     tag = 'Res'
    //     if (message.includes('"code":"200"')) {
    //         tag2 = '200'
    //     }
    //     else {
    //         tag2 = 'fail'
    //     }
    // }
    // else if (message.includes('Save RequestBody=>')) {
    //     tag = 'Body'
    // }
    // else if (message.includes('getRemoteAddr ip:')) {
    //     tag = 'IP'
    // }
    let parseType: string
    let format: string
    const formats = {
        '@f.num': {
            tag: 'NUM',
        },
        '@f.tbl': {
            tag: 'LIST',
        },
        '@f.http': {
            tag: 'HTTP',
        },
        '@f.req': {
            tag: 'Req',
        },
        '@f.sql': {
            tag: 'SQL',
        },
        '@f.error': {
            tag: 'Error',
        },
        '@f.time': {
            tag: 'TIME',
        },
        '@f.sleep': {
            tag: 'SLEEP',
        },
        '@f.task': {
            tag: 'TASK',
        },
        '@f.prog': {
            tag: 'Prog',
        },
    }
    if (msgText?.includes('@f.')) {
        format = json.message?.[0]?.format
        if (format && formats[format]) {
            tag = formats[format].tag
        }
    }
    if (msgText.includes('__req')) {
        tag = 'Req'
    }
    else if (msgText.includes('kafka_message_data')) {
        tag = 'MQ'
    }
    else if (msgText.includes('websocket/onMessage')) {
        tag = 'WS'
    }
    else if (msgText.includes('pdms_request/main')) {
        tag = 'HTTP'
        parseType = 'http'
    }
    else if (msgText.includes('http_request/main')) {
        tag = 'HTTP'
        parseType = 'node-http'
    }
    else if (msgText.includes('Executing (default):')) {
        tag = 'SQL'
    }
    
    // else if (msgText.includes('pdms_response/res')) {
    //     tag = 'HTTP<'
    // }
    
    
    let style = {}
    if (level == 'error') {
        style = {
            backgroundColor: '#fadddd'
        }
    }
    else if (level == 'warn') {
        style = {
            backgroundColor: '#ffebc8'
        }
    }
    else if (level == 'debug') {
        style = {
            backgroundColor: '#e5e5e5'
        }
    }

    function stringify(msg) {
        if (typeof msg == 'string') {
            return msg
        }
        return JSON.stringify(msg)
    }

    return (
        <div style={style}>
            {!!tag &&
                <div
                    className={classNames(styles.sqlTag, styles[tag], styles[format ? 'link' : undefined])}
                    onClick={() => {
                        if (!format) {
                            return
                        }
                        doSearch(format)
                    }}
                >
                    {tag}
                </div>
            }
            {/* {!!tag2 &&
                <div className={classNames(styles.sqlTag, styles[tag2])}>
                    {tag2}
                </div>
            } */}
            {format == '@f.req' ?
                <div className={styles.messages}>
                    <NodeReq
                        message={message}
                        doSearch={doSearch}
                    />
                </div>
            : format == '@f.error' ?
                <div className={styles.messages}>
                    <NodeError message={message} />
                </div>
            : format == '@f.sql' ?
                <div className={styles.messages}>
                    <NodeSql message={message} />
                </div>
            : format == '@f.task' ?
                <div className={styles.messages}>
                    <NodeTask message={message} />
                </div>
            : format == '@f.num' ?
                <div className={styles.messages}>
                    <NodeCount message={message} />
                </div>
            : format == '@f.time' ?
                <div className={styles.messages}>
                    <NodeTime message={message} />
                </div>
            : format == '@f.sleep' ?
                <div className={styles.messages}>
                    <NodeSleep message={message} />
                </div>
            : format == '@f.prog' ?
                <div className={styles.messages}>
                    <NodeProgress message={message} />
                </div>
            : format == '@f.tbl' ?
                <div className={styles.messages}>
                    <NodeList message={message} />
                </div>
            : format == '@f.http' ?
                <div className={styles.messages}>
                    <NodeHttpNew message={message} />
                </div>
            : parseType == 'node-http' ?
                <div className={styles.messages}>
                    <NodeHttp message={message} />
                </div>
            :
                <div className={styles.messages}>
                    {/* <Tag>start</Tag> */}
                    {message.map((msg, index) => {
                        if (parseType == 'http' && index == 1) {
                            return (
                                <Tag>{stringify(msg)}</Tag>
                            )
                        }
                        if (parseType == 'http' && index == 4) {
                            return (
                                <Tag color={msg == 200 ? 'green' : 'red'}>{stringify(msg)}</Tag>
                            )
                        }
                        return (
                            <span className={styles.logItem}>{stringify(msg)}</span>
                        )
                    })}
                    {/* <Tag>end</Tag> */}
                </div>
            }
        </div>
    )
}

function JavaLog({ content }) {
    const json = JSON.parse(content)
    const { level, message } = json

    let tag
    let tag2
    if (message.includes('执行SQL')) {
        tag = 'SQL'
    }
    else if (message.includes('[Forest]')) {
        tag = 'HTTP'
    }
    else if (message.includes('[DUBBO]')) {
        tag = 'RPC'
    }
    else if (message.includes('response===>')) {
        tag = 'Res'
        if (message.includes('"code":"200"')) {
            tag2 = '200'
        }
        else {
            tag2 = 'fail'
        }
    }
    else if (message.includes('Save RequestBody=>')) {
        tag = 'Body'
    }
    else if (message.includes('getRemoteAddr ip:')) {
        tag = 'IP'
    }
    else if (message.includes('request /') && message.includes('parameters===>')) {
        tag = 'Req'
    }
    
    let style = {}
    if (level == 'ERROR') {
        style = {
            backgroundColor: '#fadddd'
        }
    }
    else if (level == 'WARN') {
        style = {
            backgroundColor: '#ffebc8'
        }
    }

    return (
        <div style={style}>
            {!!tag &&
                <div className={classNames(styles.sqlTag, styles[tag])}>
                    {tag}
                </div>
            }
            {!!tag2 &&
                <div className={classNames(styles.sqlTag, styles[tag2])}>
                    {tag2}
                </div>
            }
            <span>{message}</span>
        </div>
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
    const hourMinutes = []
    const hourNumbers = []
    for (let hour = 0; hour <= 24; hour++) {
        if (hour < 24) {
            hourNumbers.push(hour)
        }
        const timeStart = `${`${hour}`.padStart(2, '0')}:00`
        hourMinutes.push({
            label: timeStart,
            value: timeStart,
        })
        if (hour != 24) {
            const timeHalf = `${`${hour}`.padStart(2, '0')}:30`
            hourMinutes.push({
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
                            <div>
                                <Button
                                    onClick={() => {
                                        setStartTime(moment(startTime).add(-1, 'hours').format('YYYY-MM-DD HH:mm:ss'))
                                    }}
                                >
                                    {'<=|'} 1 hour
                                </Button>
                                <Button
                                    onClick={() => {
                                        setStartTime(moment(startTime).add(-1, 'hours').format('YYYY-MM-DD HH:mm:ss'))
                                        setEndTime(moment(endTime).add(-1, 'hours').format('YYYY-MM-DD HH:mm:ss'))
                                    }}
                                >
                                    {'<='} 1 hour
                                </Button>
                                <Button
                                    onClick={() => {
                                        setStartTime(moment(startTime).add(1, 'hours').format('YYYY-MM-DD HH:mm:ss'))
                                        setEndTime(moment(endTime).add(1, 'hours').format('YYYY-MM-DD HH:mm:ss'))
                                    }}
                                >
                                    {'=>'} 1 hour
                                </Button>
                                <Button
                                    onClick={() => {
                                        setEndTime(moment(endTime).add(1, 'hours').format('YYYY-MM-DD HH:mm:ss'))
                                    }}
                                >
                                    {'|=>'} 1 hour
                                </Button>
                            </div>
                            <div className={styles.sectionTitle}>
                                {t('date_time')}
                            </div>
                            <div>
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
                                            options={hourMinutes}
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
                                            options={hourMinutes}
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
                                <div className={styles.hours}>
                                    {hourNumbers.map(hour => {
                                        return (
                                            <div>
                                                <Button
                                                    size="small"
                                                    onClick={() => {
                                                        const dateM = moment(date)
                                                        const start = dateM.clone()
                                                            .hour(hour)
                                                            .minute(0)
                                                            .second(0)
                                                            .format('YYYY-MM-DD HH:mm:ss')
                                                        const end = dateM.clone()
                                                            .hour(hour)
                                                            .minute(59)
                                                            .second(59)
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
                                                    {hour}
                                                </Button>
                                            </div>
                                        )
                                    })}
                                </div>
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

    const timeInitValue = {
        type: 'relative',
        // relative
        number: 1,
        unit: 'hour',
        // custom
        start: '',
        end: '',
    }
    const [time, setTime] = useState(detailItem.defaultTime || timeInitValue)
    
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
    const [pageSize, setPageSize] = useState(detailItem.config?.pageSize || (detailItem.type == 'grafana' ? 101 : 20))
    const [type, setType] = useState('')
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [query, setQuery] = useState('')
    const [queryTime, setQueryTime] = useState('')
    const [loading, setLoading] = useState(false)
    const searchInputRef = useRef<InputRef>(null)
    const [keyword, setKeyword] = useState(detailItem.defaultKeyword || '')
    const [searchKeyword, setSearchKeyword] = useState(keyword)
    const default_limit = 100
    const [limit, setLimit] = useState(default_limit)
    // const [searchLimit, setSearchLimit] = useState(limit)
    const [ts, setTs] = useState('1')
    // 
    const [detail, setDetail] = useState(null)
    const [detailView, setDetailView] = useState('text')
    const [detailVisible, setDetailVisible] = useState(false)
    const [chartVisible, setChartVisible] = useState(false)
    const [chartOption, setChartOption] = useState({})
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
        // let res = await request.post(_url, reqData)
        let res = await request.post(`${config.host}/logger/agent`, {
            url: _url,
            requestData: reqData,
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
        setLog(searchKeyword)
    }

    async function setLog(searchKeyword) {
        if (searchKeyword.includes('trace')) {
            return
        }
        if (searchKeyword.includes('track')) {
            return
        }
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
        if (searchInputRef.current) {
            searchInputRef.current.focus()
        }
    }, [searchInputRef.current])   

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

    function doSearch(keyword) {
        setPage(1)
        setKeyword(keyword)
        setSearchKeyword(keyword)
    }

    function handleTraceIdClick(isNewTab: boolean, traceId: string) {
        if (isNewTab) {
            onNew && onNew({
                keyword: traceId,
                time,
            })
        }
        else {
            setPage(1)
            setKeyword(traceId)
            setSearchKeyword(traceId)
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
                            ref={searchInputRef}
                            className={styles.search}
                            value={keyword}
                            placeholder={t('search')}
                            allowClear
                            onChange={(e) => {
                                setKeyword(e.target.value)  
                            }}
                            onSearch={kw => {
                                const filteredKeyword = kw.replaceAll(':', ' ') // SLS 不支持冒号
                                    .replaceAll('"', ' ') // grafana 不支持引号
                                setKeyword(filteredKeyword)
                                setSearchKeyword(filteredKeyword)
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
                            showSearch={true}
                            optionFilterProp="label"
                            style={{
                                width: 320,
                            }}
                        />
                        {!!detailItem.config?.clear &&
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
                        <Button
                            onClick={() => {
                                // clear()
                                setSearchKeyword('')
                                setKeyword('')
                                setType('')
                                setTime(timeInitValue)
                            }}
                        >
                            {t('reset')}
                        </Button>
                        {!!detailItem.home &&
                            <Button
                                onClick={() => {
                                    window.open(detailItem.home, '_blank')
                                }}
                                icon={<HomeOutlined />}
                            >
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
                            icon={<PlusOutlined />}
                        >
                            {t('new')}
                        </Button>
                        <Button
                            size="small"
                            onClick={() => {
                                onNew && onNew({
                                    keyword: searchKeyword,
                                    time,
                                })
                            }}
                            icon={<CopyOutlined />}
                        >
                            {t('duplicate')}
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
                    <div className={styles.query}>
                        <div 
                            className={styles.queryContent}
                            onClick={() => {
                                copy(query)
                                message.info(t('copied'))
                            }}
                        >
                            {query}
                        </div>
                        <div className={styles.queryTime}>{queryTime}</div>
                    </div>
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

                                    let contentObj
                                    try {
                                        contentObj = JSON.parse(value)
                                    }
                                    catch (err) {
                                        // nothing
                                    }

                                    let _value = value
                                    let traceId = ''
                                    if (hasTrace(_value)) {
                                        const arr = splitTrace(value)
                                        _value = arr[1]
                                        traceId = arr[0]
                                    }
                                    const isJavaLog = _value.includes('loggerFqcn')
                                    
                                    let commonTraceId = ''
                                    let commonSpanId = ''
                                    if (_value?.includes('tlogTraceId')) {
                                        commonTraceId = JSON.parse(_value)?.contextMap?.tlogTraceId
                                    }

                                    const isNodeLog = _value.includes('__traceId')
                                    if (_value?.includes('__traceId')) {
                                        try {
                                            commonTraceId = JSON.parse(_value)?.__traceId
                                        }
                                        catch (err) {}
                                        try {
                                            commonSpanId = JSON.parse(_value)?.__spanId
                                        }
                                        catch (err) {}
                                    }
                                    console.log('isNodeLog', isNodeLog)

                                    let nodeWsClientId = ''
                                    // TODO Java 误
                                    if (_value?.includes('client_')) {
                                        try {
                                            let msg = JSON.parse(_value)?.message
                                            if (msg?.find) {
                                                nodeWsClientId = msg.find(item => item?.includes('client_'))
                                            }
                                        }
                                        catch (err) {
                                            console.error('err', err)
                                        }
                                    }

                                    let commonRaw
                                    if (item.raw) {
                                        commonRaw = item.raw
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
                                                            console.log('item/', item)
                                                            try {
                                                                const jsonObj = JSON.parse(item.content)
                                                                console.log('jsonObj', jsonObj)
                                                                if (jsonObj.__traceId && jsonObj.message) {
                                                                    item._content = jsonObj.message
                                                                }
                                                            }
                                                            catch (err) {
                                                                // nothing
                                                            }
                                                            setDetail(item)
                                                            setDetailView('text')
                                                            setDetailVisible(true)
                                                        }}
                                                    >
                                                        {t('view')}
                                                    </span>
                                                    {!!contentObj &&
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
                                                    }
                                                    <span
                                                        className={styles.view}
                                                        onClick={() => {
                                                            viewContext(item)
                                                        }}
                                                    >
                                                        {t('context')}
                                                    </span>
                                                    {!!commonTraceId &&
                                                        <span
                                                            className={styles.viewTrace}
                                                            onClick={(e) => {
                                                                handleTraceIdClick(e.metaKey || e.ctrlKey, commonTraceId)
                                                            }}
                                                        >
                                                            <div className={styles.commonTraceId}>Trace ID</div>
                                                            {commonTraceId}
                                                        </span>
                                                    }
                                                    {!!commonSpanId &&
                                                        <span
                                                            className={styles.viewTrace}
                                                            onClick={(e) => {
                                                                handleTraceIdClick(e.metaKey || e.ctrlKey, commonSpanId)
                                                            }}
                                                        >
                                                            <div className={styles.commonTraceId}>Span ID</div>
                                                            {commonSpanId}
                                                        </span>
                                                    }
                                                    {!!nodeWsClientId &&
                                                        <span
                                                            className={styles.viewTrace}
                                                            onClick={(e) => {
                                                                handleTraceIdClick(e.metaKey || e.ctrlKey, nodeWsClientId)
                                                            }}
                                                        >
                                                            <div className={styles.commonTraceId}>WS Client</div>
                                                            {nodeWsClientId}
                                                        </span>
                                                    }
                                                    {!!commonRaw &&
                                                        <span
                                                            className={styles.view}
                                                            onClick={(e) => {
                                                                // try {
                                                                //     JSON.parse(item.content)
                                                                // }
                                                                // catch (err) {
                                                                //     message.error('raw is not JSON')
                                                                //     return
                                                                // }
                                                                console.log('commonRaw', commonRaw)
                                                                setDetail(commonRaw)
                                                                setDetailView('jsonObj')
                                                                setDetailVisible(true)
                                                            }}
                                                        >
                                                            Raw
                                                        </span>
                                                    }
                                                </Space>
                                            </div>
                                            {!!traceId &&
                                                <span className={styles.traceId}
                                                    onClick={e => {
                                                        handleTraceIdClick(e.metaKey || e.ctrlKey, traceId)
                                                    }}
                                                >{traceId}</span>
                                            }
                                            {isNodeLog ?
                                                <div>
                                                    <NodeLog
                                                        content={_value}
                                                        doSearch={doSearch}
                                                    />
                                                </div>
                                            : isJavaLog ?
                                                <div>
                                                    <JavaLog content={_value} />
                                                </div>
                                            :
                                                <span
                                                    className={styles.contentText}
                                                >
                                                    {_value}
                                                </span>
                                            }
                                            
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
                <div className={styles.footer}>
                    <div className={styles.name}>
                        {detailItem.name}
                    </div>
                    <Button
                        onClick={() => {
                            console.log('list/', list)
                            const chartData = list
                                .filter(item => item.content?.includes('@f.num'))
                                .map(item => {
                                    console.log('item', item)
                                    const [numObj] = JSON.parse(item.content).message
                                    console.log('numObj', numObj)
                                    return {
                                        time: moment(item.time).format('YYYY-MM-DD HH:mm:ss'),
                                        name: numObj.name,
                                        count: numObj.count || 0,
                                    }
                                })
                                .reverse()
                            console.log('chartData', chartData)
                            setChartOption({
                                tooltip: {
                                    trigger: 'item',
                                    // formatter: '{b}: {c} ({d}%)'
                                },
                                xAxis: {
                                    type: 'category',
                                    data: chartData.map(item => item.time)
                                },
                                yAxis: {
                                    type: 'value'
                                },
                                series: [
                                    {
                                        data: chartData.map(item => item.count),
                                        type: 'bar'
                                    }
                                ]
                            })
                            setChartVisible(true)
                        }}
                    >
                        数量
                    </Button>
                    <Button
                        onClick={() => {
                            console.log('list/', list)
                            setChartOption({
                                tooltip: {
                                    trigger: 'item',
                                    formatter: '{b}: {c} ({d}%)'
                                },
                                xAxis: {
                                    type: 'category',
                                    data: list.map(item => item.time)
                                },
                                yAxis: {
                                    type: 'value'
                                },
                                series: [
                                    {
                                        data: list.map(item => 1),
                                        type: 'bar'
                                    }
                                ]
                            })
                            setChartVisible(true)
                        }}
                    >
                        时间点
                    </Button>
                    <Button
                        onClick={() => {
                            console.log('list/', list)

                            const chartData = list.map(item => {
                                console.log('item', item)
                                const [reqObj] = JSON.parse(item.content).message
                                console.log('reqObj', reqObj)
                                return {
                                    time: item.time,
                                    num: reqObj.time || 0,
                                    status: reqObj.status,
                                }
                            })
                            .reverse()
                            setChartOption({
                                tooltip: {
                                    trigger: 'item',
                                    formatter: '{b}: {c} ({d}%)'
                                },
                                xAxis: {
                                    type: 'category',
                                    data: chartData.map(item => item.time)
                                },
                                yAxis: {
                                    type: 'value'
                                },
                                series: [
                                    {
                                        data: chartData.map(item => {
                                            return {
                                                value: item.num,
                                                itemStyle: {
                                                    color: item.status == 200 ? 'green' : 'red',
                                                },
                                            }
                                        }),
                                        type: 'bar'
                                    }
                                ]
                            })
                            setChartVisible(true)
                        }}
                    >
                        请求时间
                    </Button>
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
                    : detailView == 'jsonObj' ?
                        <ReactJson 
                            src={detail}
                            displayDataTypes={false}
                        />
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
                                    if (hasTrace(_value)) {
                                        const arr = splitTrace(value)
                                        _value = arr[1]
                                        traceId = arr[0]
                                    }
                                    return (
                                        <div className={styles.content}
                                            style={{
                                                maxWidth: document.body.clientWidth - 640
                                            }}
                                        >
                                            {!!traceId &&
                                                <span className={styles.traceId}
                                                    onClick={e => {
                                                        handleTraceIdClick(e.metaKey || e.ctrlKey, traceId)
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
            {chartVisible &&
                <Drawer
                    title="图表"
                    open={true}
                    width={800}
                    onClose={() => {
                        setChartVisible(false)
                    }}
                >
                    <ReactEcharts
                        style={{ height: '240px' }}
                        option={chartOption}
                        lazyUpdate={true}
                    />
                </Drawer>
            }
        </div>
    )
}
