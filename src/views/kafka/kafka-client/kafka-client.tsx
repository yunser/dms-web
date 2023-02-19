import { Button, Descriptions, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Popover, Radio, Space, Spin, Table, Tabs, Tag, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './kafka-client.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { DownloadOutlined, EllipsisOutlined, KeyOutlined, PlusOutlined, ReloadOutlined, StarFilled } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
// import { GitProject } from '../git-project';
import { request } from '@/views/db-manager/utils/http';
// import { ProjectEditor } from '../project-edit';
import { IconButton } from '@/views/db-manager/icon-button';
import { FullCenterBox } from '@/views/common/full-center-box';
import moment from 'moment';
import { getGlobalConfig } from '@/config';
// import { saveAs } from 'file-saver'

function Content({ item, showInfo = false }) {
    return (
        <div className={styles.contentBox}>
            {item.contentType == 'hex' &&
                <Tag className={styles.tag}>Hex</Tag>
            }
            <pre className={styles.content}>{item.content}</pre>
            {/* {showInfo &&
                <div className={styles.info}>{item.type == 'received' ? '@' : 'to:'}{item.host}:{item.port}</div>
            } */}
        </div>
    )
}

function KafkaConsumer() {
    const [topic, setTopic] = useState('dms-topic-test')
    const config = getGlobalConfig()
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [connecting, setConnecting] = useState(false)
    const [connected, setConnected] = useState(false)
    const [content, setContent] = useState('')
    const [wsStatus, setWsStatus] = useState('disconnected')
    const [serverConfig, setServerConfig] = useState({})
    const [logs, setLogs] = useState([])
    const comData = useRef({
        connectTime: 0,
        connectionId: '',
        webSocketId: '',
    })

    useEffect(() => {
        initWebSocket()
    }, [])

    async function subscribe() {
        // setGroupDetailLoading(true)
        let res = await request.post(`${config.host}/kafka/subscribe`, {
            // connectionId,
            webSocketId: comData.current.webSocketId,
            topic,
        })
        // setGroupDetailLoading(false)
        if (res.success) {
            // message.success('')
            // setOffsets(res.data.offsets)
        }
    }

    

    function initWebSocket() {
        let first = true
        const ws = new WebSocket('ws://localhost:10087/')
        
        ws.onclose = async () => {
            console.log('socket/on-close')
            setWsStatus('disconnected')
            console.log('readyState', ws.readyState)

            // if (comData.current.connectTime < 3) {
            //     comData.current.connectTime++
            //     const ms = comData.current.connectTime * 2000
            //     const action = `正在第 ${comData.current.connectTime} 次重试连接，等待 ${ms} ms`
            //     console.log('time', moment().format('mm:ss'))   
            //     console.log(action)
            //     setWsAction(action)
            //     await sleep(ms)
            //     initWebSocket()
            // }
            // else {
            //     setWsAction('自动重试连接超过 3 次，连接失败')
            // }
        }
        ws.onopen = () => {
            setWsStatus('connected')
            // return
            comData.current.connectTime = 0
            console.log('onopen', )
            // setWsAction('')
            console.log('readyState', ws.readyState)

            ws.send(JSON.stringify({
                type: 'getWebSocketId',
                data: {},
            }))
            // ws.send(JSON.stringify({
            //     type: 'tcpSubscribe',
            //     data: {
            //         connectionId: comData.current.connectionId,
            //     },
            // }))
            console.log('sended')
        }
        ws.onerror = (err) => {
            // setWsStatus('error')
            setWsStatus('disconnected')
            console.log('socket error', err)
            console.log('readyState', ws.readyState)
            // if (ws.)

            // if 

        }
        ws.onmessage = (event) => {
            const text = event.data.toString()
            console.log('onmessage', text)
            // {"channel":"msg:timer","message":"2023-01-18 22:21:10"}
            // 接收推送的消息
            let msg
            try {
                msg = JSON.parse(text)
            }
            catch (err) {
                console.log('JSON.parse err', err)
                return
            }
            

            if (msg.type == 'websocketId') {
                const { webSocketId } = msg.data
                comData.current.webSocketId = webSocketId
            }
            else if (msg.type == 'listening') {
                setConnected(true)
                const { host, port } = msg.data
                setServerConfig({
                    host: host,
                    port: port,
                })
                setLogs(list => {
                    // console.log('list.length', list.length)
                    setLogs([
                        {
                            id: msg.id,
                            content: `listening ${host}:${port}`,
                            // message: msg.message,
                            time: msg.time,
                        },
                        ...list,
                    ])
                    return []
                })
            }
            else if (msg.type == 'close') {
                setConnected(false)
                const { host, port } = msg.data
                setServerConfig({
                    host: host,
                    port: port,
                })
                setLogs(list => {
                    // console.log('list.length', list.length)
                    setLogs([
                        {
                            id: msg.id,
                            content: `${t('close')}`,
                            // message: msg.message,
                            time: msg.time,
                        },
                        ...list,
                    ])
                    return []
                })
            }
            else if (msg.type == 'message') {
                setConnected(true)
                const { host, port, content } = msg.data
                setLogs(list => {
                    // console.log('list.length', list.length)
                    setLogs([
                        {
                            id: msg.id,
                            content,
                            time: msg.time,
                            type: 'received',
                            host,
                            port,
                        },
                        ...list,
                    ])
                    return []
                })
            }
            else if (msg.type == 'sent') {
                setConnected(true)
                const { host, port, content } = msg.data
                setLogs(list => {
                    // console.log('list.length', list.length)
                    setLogs([
                        {
                            id: msg.id,
                            content,
                            time: msg.time,
                            type: 'sent',
                            host,
                            port,
                        },
                        ...list,
                    ])
                    return []
                })
            }
        }
        return ws
    }

    return (
        <div>
            {wsStatus != 'connected' &&
                <div>WebSocket 已断开，请刷新页面后使用
                    <Button
                        size="small"
                        onClick={() => {
                            window.location.reload()
                        }}
                    >刷新页面</Button>
                </div>
            }
            kafka consumer
            <div>收到的消息请查看控制台</div>
            <div>
                <Input
                    value={topic}
                    onChange={e => {
                        setTopic(e.target.value)
                    }}
                />
            </div>
            <Button onClick={subscribe}>
                订阅
            </Button>


            <Table
                loading={loading}
                dataSource={logs}
                bordered
                size="small"
                // pagination={false}
                pagination={{
                    // total,
                    // current: page,
                    pageSize: 20,
                    // showSizeChanger: false,
                }}
                rowKey="id"
                columns={[
                    {
                        title: t('time'),
                        dataIndex: 'time',
                        width: 80,
                        render(value) {
                            return moment(value).format('HH:mm:ss')
                        }
                    },
                    {
                        title: t('content'),
                        dataIndex: 'content',
                        // width: 240,
                        render(value, item) {
                            return (
                                <div>
                                    {(item.type == 'received' || item.type == 'sent') ?
                                        <Content item={item} showInfo />
                                    :
                                        <div>{value}</div>
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
                onChange={({ current }) => {
                    // setPage(current)
                }}
            />
            
        </div>
    )
}

export function KafkaClient({ onClickItem }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const config = getGlobalConfig()
    const [socketType, setSocketType] = useState('udp_server')
    
    const [offsets, setOffsets] = useState([])
    const [topics, setTopics] = useState([])
    const [groups, setGroups] = useState([])
    const [groupItem, setGroupItem] = useState(null)
    const [groupDetailLoading, setGroupDetailLoading] = useState(false)
    const [topic, setTopic] = useState('dms-topic-test')
    const [content, setContent] = useState('这是发送内容')

    const comData = useRef({
        // cursor: 0,
        connectTime: 0,
        connectionId: '',
    })

    async function loadTopics() {
        let res = await request.post(`${config.host}/kafka/topics`, {
            // connectionId,
        })
        if (res.success) {
            const sorter = (a, b) => {
                return a.name.localeCompare(b.name)
            }
            setTopics(res.data.list.sort(sorter))
        }
    }

    async function loadGroups() {
        let res = await request.post(`${config.host}/kafka/groups`, {
            // connectionId,
        })
        if (res.success) {
            const sorter = (a, b) => {
                return a.groupId.localeCompare(b.groupId)
            }
            setGroups(res.data.list.sort(sorter))
        }
    }

    async function init() {
        let res = await request.post(`${config.host}/kafka/init`, {
            // connectionId,
        }, {
            // noMessage: true,
            // timeout: 2000,
        })
        if (res.success) {
            loadTopics()
            loadGroups()
            // setErr('')
            // setCurSchema('')
        }
        else {
            // setErr('Connect rrror')
        }
    }

    async function loadGroupDetail(item) {
        setGroupDetailLoading(true)
        let res = await request.post(`${config.host}/kafka/groupDetail`, {
            // connectionId,
            groupId: item.groupId,

        })
        setGroupDetailLoading(false)
        if (res.success) {
            setOffsets(res.data.offsets)
        }
    }

    async function send() {
        // setGroupDetailLoading(true)
        let res = await request.post(`${config.host}/kafka/send`, {
            // connectionId,
            topic,
            content,

        })
        // setGroupDetailLoading(false)
        if (res.success) {
            // setOffsets(res.data.offsets)
        }
    }

    async function removeTopic(item) {
        Modal.confirm({
            autoFocusButton: 'cancel',
            content: `确认删除「${item.name}」？`,
            onOk: async () => {
                let res = await request.post(`${config.host}/kafka/topic/remove`, {
                    // connectionId,
                    topic: item.name,
                })
                // setGroupDetailLoading(false)
                if (res.success) {
                    message.success(t('success'))
                    loadTopics()
                    // setOffsets(res.data.offsets)
                }
            },
        })
    }

    useEffect(() => {
        init()
    }, [])

    return (
        <div className={styles.kafkaApp}>
            <div className={styles.appName}>kafka</div>
            <Button onClick={() => {
                init()
            }}>刷新</Button>
            <div className={styles.layoutBody}>
                <div>
                    
                    <div className={styles.sectionName}>topics:</div>
                    <div className={styles.topics}>
                        {topics.map(item => {
                            return (
                                <div
                                    className={styles.item}
                                    key={item.name}
                                >
                                    {item.name}
                                    <Button
                                        size="small"
                                        danger
                                        onClick={() => {
                                            removeTopic(item)
                                        }}
                                    >
                                        删除
                                    </Button>
                                </div>
                            )
                        })}
                    </div>
                </div>
                <div>
                    
                    <div className={styles.sectionName}>groups:</div>
                    <div className={styles.groups}>
                        {groups.map(item => {
                            return (
                                <div
                                    className={styles.item}
                                    onClick={() => {
                                        setGroupItem(item)
                                        loadGroupDetail(item)
                                    }}
                                    >{item.groupId}</div>
                            )
                        })}
                    </div>
                </div>
                <div>
                    <div className={styles.sectionName}>group detail</div>
                    {groupDetailLoading ?
                        <Spin />
                    :
                        <div>
                            {!!groupItem &&
                                <div>
                                    {groupItem.groupId}:
                                    <div>
                                        {offsets.map(offset => {
                                            return (
                                                <div>
                                                    <div>{offset.topic}</div>
                                                    <div className={styles.partitions}>
                                                        {offset.partitions.map(partition => {
                                                            return (
                                                                <div className={styles.item}>
                                                                    <Space>
                                                                        <div>{partition.offset}/{partition.topicOffset}</div>
                                                                        <div>leg:{partition.topicOffset - partition.offset}</div>
                                                                    </Space>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            }

                        </div>
                    }
                </div>
                <div>
                    <div className={styles.sectionName}>发送消息</div>
                    <div>
                        <Input
                            value={topic}
                            onChange={e => {
                                setTopic(e.target.value)
                            }}
                        />
                    </div>
                    <Input.TextArea
                        value={content}
                        onChange={e => {
                            setContent(e.target.value)
                        }}
                    />
                    <Button
                        onClick={() => {
                            send()
                        }}
                    >
                        发送
                    </Button>

                </div>
                <div>
                    <div className={styles.sectionName}>接收消息</div>
                    <KafkaConsumer />
                </div>
            </div>
        </div>
    )
}
