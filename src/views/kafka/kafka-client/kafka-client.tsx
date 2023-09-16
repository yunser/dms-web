import { Button, Descriptions, Drawer, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Popover, Progress, Radio, Space, Spin, Table, Tabs, Tag, Tree } from 'antd';
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
import { SearchUtil } from '@/utils/search';
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

function sunOffset(offsets) {
    let total = 0
    for (let item of offsets) {
        total += parseInt(item.offset)
    }
    return total
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
            {/* <div>收到的消息请查看控制台</div> */}
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
    
    const [curGroupId, setCurGroupId] = useState('dms-group-01')
    const [offsets, setOffsets] = useState([])
    const [topicLoading, setTopicLoading] = useState(false)
    const [curConnection, setCurConnection] = useState(null)
    const [connectionModalVisible, setConnectionModalVisible] = useState(false)
    const [modalItem, setModalItem] = useState(false)

    const [connectionLoading, setConnectionLoading] = useState(false)
    const [connections, setConnections] = useState([])
    const [topics, setTopics] = useState([])
    const [topicKeyword, setTopickeyword] = useState('')
    const filteredTopics = useMemo(() => {
        return SearchUtil.searchLike(topics, topicKeyword, {
            attributes: ['name'],
        })
    }, [topics, topicKeyword])
    const [topicDetail, setTopicDetail] = useState(null)
    const [groups, setGroups] = useState([])
    const [groupLoding, setGroupLoading] = useState(false)
    const [groupItem, setGroupItem] = useState(null)
    const [groupDetailLoading, setGroupDetailLoading] = useState(false)
    const [topic, setTopic] = useState('dms-topic-test')
    const [content, setContent] = useState('这是发送内容')

    const comData = useRef({
        // cursor: 0,
        connectTime: 0,
        connectionId: '',
    })

    useEffect(() => {
        loadConnections()
    }, [])

    async function loadConnections() {
        setConnectionLoading(true)
        let res = await request.post(`${config.host}/kafka/connection/list`, {
            // connectionId,
        })
        setConnectionLoading(false)
        if (res.success) {
            const sorter = (a, b) => {
                return a.name.localeCompare(b.name)
            }
            setConnections(res.data.list.sort(sorter))
        }
    }

    async function loadTopics() {
        setTopicLoading(true)
        let res = await request.post(`${config.host}/kafka/topics`, {
            // connectionId,
        })
        setTopicLoading(false)
        if (res.success) {
            const sorter = (a, b) => {
                return a.name.localeCompare(b.name)
            }
            setTopics(res.data.list.sort(sorter))
        }
    }

    async function loadGroups() {
        setGroupLoading(true)
        let res = await request.post(`${config.host}/kafka/groups`, {
            // connectionId,
        })
        setGroupLoading(false)
        if (res.success) {
            const sorter = (a, b) => {
                return a.groupId.localeCompare(b.groupId)
            }
            setGroups(res.data.list.sort(sorter))
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
            message.success(t('success'))
            // setOffsets(res.data.offsets)
        }
    }

    async function viewConnection(item) {
        setCurConnection(item)
        console.log('item', item)
        let res = await request.post(`${config.host}/kafka/init`, {
            connectionId: item.id,
            clientId: 'dms-client-01',
            groupId: 'dms-group-01',
        })
        if (res.success) {
            loadTopics()
            loadGroups()
        }
    }

    async function viewTopic(item) {
        let res = await request.post(`${config.host}/kafka/topic/detail`, {
            topic: item.name,
        })
        if (res.success) {
            setTopicDetail(res.data)
        }
    }

    async function removeTopic(item) {
        Modal.confirm({
            autoFocusButton: 'cancel',
            content: `确认删除「${item.name}」？`,
            okButtonProps: {
                danger: true,
            },
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

    async function removeGroup(item) {
        Modal.confirm({
            autoFocusButton: 'cancel',
            content: `确认删除「${item.groupId}」？`,
            okButtonProps: {
                danger: true,
            },
            onOk: async () => {
                let res = await request.post(`${config.host}/kafka/group/remove`, {
                    // connectionId,
                    groupId: item.groupId,
                })
                // setGroupDetailLoading(false)
                if (res.success) {
                    message.success(t('success'))
                    loadGroups()
                    // setOffsets(res.data.offsets)
                }
            },
        })
    }

    function deleteItem(item) {
        Modal.confirm({
            content: `${t('delete_confirm')} ${item.name}?`,
            okButtonProps: {
                danger: true,
            },
            async onOk() {
                let res = await request.post(`${config.host}/kafka/connection/delete`, {
                    id: item.id,
                })
                if (res.success) {
                    message.success(t('success'))
                    loadConnections()
                }
            }
        })
    }

    return (
        <div className={styles.kafkaApp}>
            <div className={styles.layoutHeader}>
                <div className={styles.appName}>kafka</div>
            </div>
            {/* <Button onClick={() => {
                init()
            }}>刷新</Button> */}
            <div className={styles.layoutBody}>
                <div>
                    <div className={styles.sectionName}>connections:</div>
                    <Space>
                        <Button
                            size="small"
                            onClick={() => {
                                loadConnections()
                            }}
                        >
                            刷新
                        </Button>
                        <Button
                            size="small"
                            onClick={() => {
                                setModalItem(null)
                                setConnectionModalVisible(true)
                            }}
                        >
                            新增
                        </Button>
                    </Space>

                    <Table
                        loading={connectionLoading}
                        dataSource={connections}
                        pagination={false}
                        rowKey="name"
                        size="small"
                        columns={[
                            {
                                title: 'name',
                                dataIndex: 'name',
                            },
                            {
                                title: t('actions'),
                                dataIndex: '_op',
                                render(_value, item) {
                                    return (
                                        <Space>
                                            <Button
                                                size="small"
                                                onClick={() => {
                                                    viewConnection(item)
                                                }}
                                            >
                                                查看
                                            </Button>
                                            <Button
                                                size="small"
                                                onClick={() => {
                                                    setModalItem(item)
                                                    setConnectionModalVisible(true)
                                                }}
                                            >
                                                编辑
                                            </Button>
                                            <Button
                                                size="small"
                                                danger
                                                onClick={() => {
                                                    deleteItem(item)
                                                }}
                                            >
                                                删除
                                            </Button>
                                        </Space>
                                    )
                                }
                            },
                        ]}
                    />
                </div>
                <div>
                    {!!curConnection &&
                        <div>
                            {curConnection.name}
                        </div>
                    }
                    <div className={styles.sectionName}>topics:</div>
                    <Button
                        onClick={() => {
                            loadTopics()
                        }}
                    >
                        刷新
                    </Button>
                    <div>
                        <Input
                            placeholder='filter'
                            value={topicKeyword}
                            onChange={e => {
                                setTopickeyword(e.target.value)
                            }}
                        />
                    </div>
                    <div className={styles.topics}>
                        <Table
                            loading={topicLoading}
                            dataSource={filteredTopics}
                            pagination={false}
                            rowKey="name"
                            size="small"
                            columns={[
                                {
                                    title: 'name',
                                    dataIndex: 'name',
                                },
                                {
                                    title: t('actions'),
                                    dataIndex: '_op',
                                    render(_value, item) {
                                        return (
                                            <Space>
                                                <Button
                                                    size="small"
                                                    onClick={() => {
                                                        viewTopic(item)
                                                    }}
                                                >
                                                    查看
                                                </Button>
                                                <Button
                                                    size="small"
                                                    danger
                                                    onClick={() => {
                                                        removeTopic(item)
                                                    }}
                                                >
                                                    删除
                                                </Button>
                                            </Space>
                                        )
                                    }
                                },
                            ]}
                        />
                        {/* {topics.map(item => {
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
                        })} */}
                    </div>
                    
                    {!!topicDetail &&
                        <Drawer
                            title="topic detail"
                            open={true}
                            onClose={() => {
                                setTopicDetail(null)
                            }}
                            width={560}
                        >
                            <div className={styles.topicDetail}>
                                <div className={styles.topicName}>{topicDetail.name}</div>
                                <div>
                                    total offset:
                                    {sunOffset(topicDetail.offsets)}
                                </div>
                                <div className={styles.offsets}>
                                    {topicDetail.offsets.map(item => {
                                        return (
                                            <div className={styles.item}>
                                                <div className={styles.name}>
                                                    partition {item.partition}
                                                </div>
                                                <div>offset: {item.offset}</div>
                                                <div>low: {item.low}</div>
                                                <div>high: {item.high}</div>
                                            </div>
                                        )
                                    })}
                                </div>
                                <br />
                                <hr />
                                <br />
                                <div className={styles.groupSectionName}>groups</div>
                                <div className={styles.groups}>
                                    {topicDetail.groups.map(group => {
                                        return (
                                            <div className={styles.item}>
                                                <div className={styles.groupName}>{group.groupId}</div>
                                                {group.partitions.map((partition, partIdx) => {
                                                    const _part = topicDetail.offsets[partIdx]
                                                    let percent = Math.floor(parseInt(partition.offset) / parseInt(_part.offset) * 100)
                                                    return (
                                                        <div className={styles.offsetItem}>
                                                            <Space>
                                                                <div>partition {partition.partition}: </div>
                                                                <div>offset {partition.offset} / {_part.offset}</div>
                                                            </Space>
                                                            <Progress
                                                                className={styles.progress}
                                                                percent={percent}
                                                            />
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )
                                    })}

                                </div>
                            </div>
                        </Drawer>
                    }
                </div>
                <div>
                    {!!curConnection &&
                        <div>
                            {curConnection.name}
                        </div>
                    }
                    <div className={styles.sectionName}>groups:</div>
                        <Button
                            onClick={() => {
                                loadGroups()
                            }}
                        >
                            刷新
                        </Button>
                    <div className={styles.groups}>
                        {/* {groups.map(item => {
                            return (
                                <div
                                    className={styles.item}
                                    onClick={() => {
                                        setGroupItem(item)
                                        loadGroupDetail(item)
                                    }}
                                    key={item.groupId}
                                >
                                    {item.groupId}
                                    <Button
                                        size="small"
                                        danger
                                        onClick={() => {
                                            removeGroup(item)
                                        }}
                                    >
                                        删除
                                    </Button>
                                </div>
                            )
                        })} */}
                        <Table
                            loading={groupLoding}
                            dataSource={groups}
                            pagination={false}
                            rowKey="groupId"
                            size="small"
                            columns={[
                                {
                                    title: 'groupId',
                                    dataIndex: 'groupId',
                                },
                                {
                                    title: t('actions'),
                                    dataIndex: '_op',
                                    render(_value, item) {
                                        return (
                                            <div>
                                                <Space>
                                                    <Button
                                                        size="small"
                                                        // danger
                                                        onClick={() => {
                                                            setGroupItem(item)
                                                            loadGroupDetail(item)
                                                        }}
                                                    >
                                                        查看
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        danger
                                                        onClick={() => {
                                                            removeGroup(item)
                                                        }}
                                                    >
                                                        删除
                                                    </Button>
                                                </Space>
                                            </div>
                                        )
                                    }
                                },
                            ]}
                        />
                    </div>
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
                    <div>group ID: {curGroupId}</div>
                    <KafkaConsumer />
                </div>
            </div>
            {!!groupItem &&
                <Drawer
                    title="group detail"
                    open={true}
                    width={560}
                    onClose={() => {
                        setGroupItem(null)
                    }}
                >
                    {/* <div className={styles.sectionName}>group detail</div> */}
                    {groupDetailLoading ?
                        <Spin />
                    :
                        <div className={styles.groupDetail}>
                            {!!groupItem &&
                                <div>
                                    <div className={styles.groupName}>{groupItem.groupId}</div>
                                    
                                    <div>
                                        {offsets.map(offset => {
                                            return (
                                                <div>
                                                    <div>{offset.topic}</div>
                                                    <div className={styles.partitions}>
                                                        {offset.partitions.map(partition => {
                                                            let percent = Math.floor(parseInt(partition.offset) / parseInt(partition.topicOffset) * 100)
                                                            return (
                                                                <div className={styles.item}>
                                                                    <Space>
                                                                        <div>{partition.offset}/{partition.topicOffset}</div>
                                                                        <div>leg:{partition.topicOffset - partition.offset}</div>
                                                                    </Space>
                                                                    <Progress
                                                                        className={styles.progress}
                                                                        percent={percent}
                                                                    />
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
                </Drawer>
            }
            {connectionModalVisible &&
                <DatabaseModal
                    item={modalItem}
                    config={config}
                    onCancel={() => {
                        setConnectionModalVisible(false)
                    }}
                    onSuccess={() => {
                        setConnectionModalVisible(false)
                        loadConnections()
                    }}
                />
            }
        </div>
    )
}

function DatabaseModal({ config, onCancel, item, onSuccess, onConnect, }) {
    const { t } = useTranslation()

    const editType = item ? 'update' : 'create'
    const [testLoading, setTestLoading] = useState(false)
    const [loading, setLoading] = useState(false)
    const [form] = Form.useForm()
//     const [code, setCode] = useState(`{
//     "host": "",
//     "user": "",
//     "password": ""
// }`)

    

    useEffect(() => {
        if (item) {
            form.setFieldsValue({
                ...item,
            })
        }
        else {
            form.setFieldsValue({
                name: '',
                host: '',
                port: null,
                password: '',
                userName: '',
            })
        }
    }, [item])

    async function handleOk() {
        const values = await form.validateFields()
        setLoading(true)
        let _connections
        const saveOrUpdateData = {
            name: values.name || t('unnamed'),
            host: values.host || 'localhost',
            port: values.port || 9095,
            // password: values.password || '',
            // userName: values.userName,
        }
        if (editType == 'create') {
            // const connections = storage.get('redis-connections', [])
            // if (connections.length) {
            //     _connections = connections
            // }
            // else {
            //     _connections = []
            // }
            // _connections.unshift({
            //     id: uid(32),
                
            //     // db: values.db,
            // })
            let res = await request.post(`${config.host}/kafka/connection/create`, {
                // id: item.id,
                // data: {
                // }
                ...saveOrUpdateData,
            })
            if (res.success) {
                onSuccess && onSuccess()
            }
        }
        else {
            // const connections = storage.get('redis-connections', [])
            // if (connections.length) {
            //     _connections = connections
            // }
            // else {
            //     _connections = []
            // }
            // const idx = _connections.findIndex(_item => _item.id == item.id)
            // _connections[idx] = {
            //     ..._connections[idx],
            //     ...saveOrUpdateData,
            // }
            let res = await request.post(`${config.host}/kafka/connection/update`, {
                id: item.id,
                data: {
                    ...saveOrUpdateData,
                    // name: values.name || t('unnamed'),
                    // host: values.host || 'localhost',
                    // port: values.port || 22,
                    // password: values.password,
                    // username: values.username,
                }
            })
            if (res.success) {
                onSuccess && onSuccess()
            }
            
            
        }
        setLoading(false)
        // storage.set('redis-connections', _connections)
        // onSuccess && onSuccess()
        // else {
        //     message.error('Fail')
        // }
    }

    async function handleTestConnection() {
        const values = await form.validateFields()
        setTestLoading(true)
        const reqData = {
            name: values.name || t('unnamed'),
            host: values.host || 'localhost',
            port: values.port || 9095,
            // password: values.password || '',
            // userName: values.userName,
            // test: true,
            // remember: values.remember,
        }
        let ret = await request.post(`${config.host}/mqtt/connect`, reqData)
        // console.log('ret', ret)
        if (ret.success) {
            message.success(t('success'))
        }
        setTestLoading(false)
    }

    return (
        <Modal
            title={editType == 'create' ? t('connection_create') : t('connection_update')}
            visible={true}
            maskClosable={false}
            onCancel={onCancel}
            // onOk={async () => {
                
            // }}
            footer={(
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <div></div>
                    {/* <Button key="back"
                        loading={testLoading}
                        disabled={testLoading || loading}
                        onClick={handleTestConnection}
                    >
                        {t('test_connection')}
                    </Button> */}
                    <Space>
                        <Button
                            // key="submit"
                            // type="primary"
                            disabled={testLoading || loading}
                            onClick={onCancel}
                        >
                            {t('cancel')}
                        </Button>
                        <Button
                            type="primary"
                            loading={loading}
                            disabled={testLoading || loading}
                            onClick={handleOk}
                        >
                            {t('ok')}
                        </Button>
                    </Space>
                </div>
            )}
        >
            <Form
                form={form}
                labelCol={{ span: 8 }}
                wrapperCol={{ span: 16 }}
            >
                <Form.Item
                    name="name"
                    label={t('name')}
                    // rules={[ { required: true, }, ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="host"
                    label={t('host')}
                    // rules={[ { required: true, }, ]}
                >
                    <Input
                        placeholder="localhost"
                    />
                </Form.Item>
                <Form.Item
                    name="port"
                    label={t('port')}
                    // rules={[{ required: true, },]}
                >
                    <InputNumber
                        placeholder="9095"
                    />
                </Form.Item>
                {/* <Form.Item
                    name="user"
                    label="User"
                    rules={[{ required: true, },]}
                >
                    <Input />
                </Form.Item> */}
                {/* <Form.Item
                    name="userName"
                    label={t('user_name')}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="password"
                    label={t('password')}
                    // rules={[{ required: true, },]}
                >
                    <Input.Password />
                </Form.Item> */}
                {/* <Form.Item
                    name="ppppp"
                    label={t('ppppppp')}
                    rules={[{ required: true, },]}
                >
                    <Input.Password
                        size="small"
                        autoComplete="new-password"
                    />
                </Form.Item> */}
                
                {/* <Form.Item name="remember" valuePropName="checked" wrapperCol={{ offset: 8, span: 16 }}>
                    <Checkbox>Remember me</Checkbox>
                </Form.Item> */}
                {/* <Form.Item
                    wrapperCol={{ offset: 8, span: 16 }}
                >
                    <Space>
                        <Button
                            loading={loading}
                            type="primary"
                            onClick={connect}>{t('connect')}</Button>
                    </Space>
                </Form.Item> */}
            </Form>
        </Modal>
    );
}
