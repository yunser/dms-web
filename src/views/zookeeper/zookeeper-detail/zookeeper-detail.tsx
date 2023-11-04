import { Button, Descriptions, Form, Input, message, Modal, Popover, Space, Table, Tabs, Tag, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './zookeeper-detail.module.less';
import _ from 'lodash';
import classNames from 'classnames'
import { useTranslation } from 'react-i18next';
import storage from '@/utils/storage'
import { useInterval } from 'ahooks';
import { request } from '../../db-manager/utils/http';
import moment from 'moment';
import { sleep } from '@yunser/sleep'
import { FileFilled, FileOutlined, FolderFilled, QuestionCircleFilled } from '@ant-design/icons';

function findInTreeData(list, cb) {
    for (let item of list) {
        if (cb(item)) {
            return item
        }
        if (item.children?.length) {
            const fItem = findInTreeData(item.children, cb)
            if (fItem) {
                return fItem
            }
        }
    }
    return null
}

function NodeEditModal({ config, connectionId, onClose, onSuccess, }) {
    const { t } = useTranslation()

    const [form] = Form.useForm()

    return (
        <Modal
            title={'create node'}
            open={true}
            onCancel={onClose}
            maskClosable={false}
            onOk={async () => {
                const values = await form.validateFields()
                let ret = await request.post(`${config.host}/zookeeper/create`, {
                    connectionId,
                    path: values.path,
                })
                if (ret.success) {
                    message.success(t('success'))
                    // onClose && onClose()
                    onSuccess && onSuccess()
                }
            }}
        >
            <Form
                form={form}
                labelCol={{ span: 4 }}
                wrapperCol={{ span: 20 }}
            >
                <Form.Item
                    name="path"
                    label={t('path')}
                    rules={[ { required: true, }, ]}
                >
                    <Input />
                </Form.Item>
            </Form>
        </Modal>
    );
}

function ZKTree({ config, connectionId, onSelectItem, onData }) {

    const [treeData, setTreeData] = useState([])
    const [expandedKeys, setExpandedKeys] = useState([])
    const [editModalVisible, setEditModalVisible] = useState(false)
    
    const treeRef = useRef([])
    useEffect(() => {
        loadTree('/')
    }, [])

    async function loadTree(path) {
        let res = await request.post(`${config.host}/zookeeper/tree`, {
            connectionId,
            path,
        })
        if (res.success) {
            const subTree = res.data.list.map(item => {
                const subPath = (path == '/' ? '' : path) + '/' + item.name
                return {
                    title: (
                        <div
                            onClick={() => {
                                console.log('item', item)
                                loadTree(subPath)
                            }}
                        >
                            <FolderFilled />
                            {subPath}
                        </div>
                    ),
                    key: subPath,
                    name: item.name,
                    path: subPath,
                }
            })
            if (path == '/') {
                setTreeData(subTree)
                treeRef.current = subTree
            }
            else {
                console.log('treeData.length', treeData.length)
                console.log('subTree', subTree)
                const fItem = findInTreeData(treeRef.current, item => item.path == path)
                if (fItem) {
                    // console.log('treeData[fIdx]', treeData[fIdx])
                    if (subTree.length == 0) {
                        // message.info('empty')
                        // return
                        fItem.isLeaf = true
                    }
                    else {
                        fItem.children = subTree
                        fItem.isLeaf = false
                    }
                }
                else {
                    console.log('no_found', )
                }
                // console.log('[...treeData]', [...treeData])
                setTreeData([...treeRef.current])
                treeRef.current = [...treeRef.current]
            }
        }
    }

    return (
        <div>
            <div className={styles.treeToolBox}>
                <Space>
                    <Button
                        size="small"
                        onClick={() => {
                            loadTree('/')
                        }}
                    >
                        刷新
                    </Button>
                    <Button
                        size="small"
                        onClick={() => {
                            setEditModalVisible(true)
                        }}
                    >
                        新增
                    </Button>
                </Space>
            </div>
            <div>
                <Tree
                    treeData={treeData}
                    height={640}
                    autoExpandParent={true}
                    expandedKeys={expandedKeys}
                    onExpand={expandedKeys => {
                        setExpandedKeys(expandedKeys)
                    }}
                    titleRender={node => {
                        return (
                            // <div>{nodeData.name}</div>
                            <div
                                onClick={() => {
                                    // console.log('item', item)
                                    onSelectItem && onSelectItem(node.path)
                                    loadTree(node.path)
                                    if (!expandedKeys.includes(node.key)) {
                                        // expandedKeys.push(node.key)
                                        setExpandedKeys([
                                            ...expandedKeys,
                                            node.key,
                                        ])
                                    }
                                }}
                            >
                                <Space>
                                    {node.isLeaf === true ?
                                        <FileOutlined />
                                    : node.isLeaf === false ?
                                        <FolderFilled />
                                    :
                                        <QuestionCircleFilled />
                                    }
                                    <div className={styles.nodeName}>
                                        {node.name}
                                    </div>
                                </Space>
                            </div>
                        )   
                    }}
                />
            </div>
            {editModalVisible &&
                <NodeEditModal
                    config={config}
                    connectionId={connectionId}
                    onClose={() => {
                        setEditModalVisible(false)
                    }}
                    onSuccess={() => {
                        setEditModalVisible(false)
                        loadTree('/')
                    }}
                />
            }
        </div>
    )
}

export function ZookeeperDetail({ config, data }) {
    const { connectionId, item: detailItem } = data
    const { t } = useTranslation()

    const WsStatusLabelMap = {
        'notConnected': '未连接',
        'error': '异常',
        'connected': '已连接',
    }

    const comData = useRef({
        connectTime: 0,
    })

    const [form] = Form.useForm()
    const [form2] = Form.useForm()
    const [isSub, setIsSub] = useState(false)
    const [subscribeTopic, setSubscribeTopic] = useState('')
    const [list, setList] = useState([])
    const pageSize = 10
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(false)
    const [wsStatus, setWsStatus] = useState('notConnected')
    const [wsAction, setWsAction] = useState('')
    const [detailPath, setDetailPath] = useState('/')
    const [nodeData, setNodeData] = useState('')
    const [nodeDataVisible, setNodeDataVisible] = useState(false)

    async function subscribe() {
        const values = await form2.validateFields();
        const topic = values.channel || '*'
        let res = await request.post(`${config.host}/mqtt/subscribe`, {
            connectionId,
            topic,
        })
        if (res.success) {
            message.success('订阅成功')
            setIsSub(true)
            setSubscribeTopic(topic)
        }
    }

    async function unSubscribe() {
        const values = await form2.validateFields();
        let res = await request.post(`${config.host}/mqtt/unsubscribe`, {
            connectionId,
            topic: subscribeTopic,
        })
        if (res.success) {
            message.success('取消订阅成功')
            setIsSub(false)
        }
    }

    async function publish() {
        const values = await form.validateFields();
        let res = await request.post(`${config.host}/mqtt/publish`, {
            connectionId,
            topic: values.channel,
            message: values.message.replace('{time}', moment().format('YYYY-MM-DD HH:mm:ss')),
        })
        if (res.success) {
            message.success('发布成功')
        }
    }

    function connect() {
        comData.current.connectTime = 0
        initWebSocket()
    }

    // 有一个属性Socket.readyState，
    // 0 - 表示连接尚未建立，
    // 1 - 表示连接已建立，可以进行通信，
    // 2 - 表示连接正在进行关闭，
    // 3 - 表示连接已经关闭或者连接不能打开
    function initWebSocket() {
        let first = true
        const ws = new WebSocket('ws://localhost:10087/')
        
        ws.onclose = async () => {
            console.log('socket/on-close')
            setWsStatus('notConnected')

            if (comData.current.connectTime < 3) {
                comData.current.connectTime++
                const ms = comData.current.connectTime * 2000
                const action = `正在第 ${comData.current.connectTime} 次重试连接，等待 ${ms} ms`
                console.log('time', moment().format('mm:ss'))   
                console.log(action)
                setWsAction(action)
                await sleep(ms)
                initWebSocket()
            }
            else {
                setWsAction('自动重试连接超过 3 次，连接失败')
            }
        }
        ws.onopen = () => {
            comData.current.connectTime = 0
            console.log('onopen', )
            setWsStatus('connected')
            setWsAction('')
            console.log('readyState', ws.readyState)

            ws.send(JSON.stringify({
                type: 'mqttSubscribe',
                data: {
                    // connectionId,
                },
            }))
            console.log('sended')
        }
        ws.onerror = (err) => {
            // setWsStatus('error')
            setWsStatus('notConnected')
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
            
            setList(list => {
                console.log('list.length', list.length)
                setList([
                    {
                        id: msg.id,
                        topic: msg.topic,
                        message: msg.message,
                        time: msg.time,
                    },
                    ...list,
                ])
                return []
            })
        }
        return ws
    }

    useEffect(() => {
        const ws = initWebSocket()
        return () => {
            ws.close()
        }
    }, [])

    async function remove() {
        Modal.confirm({
            content: `${t('delete')}「${detailPath}」?`,
            async onOk() {
                let res = await request.post(`${config.host}/zookeeper/remove`, {
                    connectionId,
                    path: detailPath,
                })
                if (res.success) {
                    setNodeDataVisible(false)
                    setDetailPath('/')
                }
            }
        })
    }

    async function loadData() {
        let res = await request.post(`${config.host}/zookeeper/getData`, {
            connectionId,
            path: detailPath,
        })
        if (res.success) {
            setNodeData(res.data.data)
            setNodeDataVisible(true)
        }
    }

    useEffect(() => {
        form.setFieldsValue({
            channel: 'test/dms-test',
            message: 'dms-msg-content-{time}'
        })
        form2.setFieldsValue({
            channel: 'test/#',
            // message: 'dms-msg-content'
        })
    }, [])

    return (
        <div className={styles.zkBox}>
            <div className={styles.layoutLeft}>
                <div className={styles.header}>
                    WebSocket 状态：{WsStatusLabelMap[wsStatus]}{wsAction}
                    {wsStatus != 'connected' &&
                        <div>
                            <Button onClick={connect}>连接</Button>
                        </div>
                    }
                </div>
                <ZKTree
                    config={config}
                    connectionId={connectionId}
                    // onData={({path, data}) => {
                    //     setDetailPath(path)
                    //     setNodeData(data)
                    // }}
                    onSelectItem={(path) => {
                        setDetailPath(path)
                        setNodeData(null)
                        setNodeDataVisible(false)
                    }}
                />
            </div>
            <div className={styles.layoutRight}>
                <div className={styles.header}>
                    {/* path: */}
                    <div className={styles.detailPath}>
                        {detailPath}
                    </div>
                </div>
                {/* <div>
                data:
                </div> */}
                <div>
                    <Space>
                        <Button
                            size="small"
                            onClick={(e) => {
                                loadData()
                            }}
                        >
                            查看数据
                        </Button>
                        <Button
                            size="small"
                            danger
                            onClick={(e) => {
                                remove()
                            }}
                        >
                            删除
                        </Button>
                    </Space>
                </div>
                {nodeDataVisible &&
                    <div>
                    {nodeData || 'no data'}
                    </div>
                }
            </div>
            {false &&
                <div className={styles.section}>
                    <div className={styles.title}>发布</div>
                    <Form
                        form={form}
                        // {...layout}
                        // name="basic"
                        // initialValues={{
                        //     channel: 'msg/dms-test',
                        //     message: 'dms-msg-content'
                        // }}
                        // onFinish={onFinish}
                        // onFinishFailed={onFinishFailed}
                    >
                        <Form.Item
                            label="主题"
                            name="channel"
                            rules={[ { required: true, } ]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            label="消息"
                            name="message"
                            rules={[ { required: true, } ]}
                        >
                            <Input.TextArea rows={8} />
                        </Form.Item>
                    </Form>
                    <Button
                        type="primary"
                        onClick={() => {
                            publish()
                        }}
                    >
                        发布
                    </Button>

                </div>
            }
            {false &&
                <div className={styles.section}>
                    <div className={styles.toolBox}>
                        <div className={styles.title}>订阅</div>
                        {isSub ?
                            <Space>
                                {subscribeTopic}
                                <Button
                                    size="small"
                                    onClick={() => {
                                        setList([])
                                    }}
                                >
                                    清除
                                </Button>
                                <Button
                                    size="small"
                                    onClick={() => {
                                        unSubscribe()
                                    }}
                                >
                                    取消订阅
                                </Button>
                            </Space>
                        :
                            <div>
                                <Form
                                    form={form2}
                                >
                                    <Form.Item
                                        label="主题"
                                        name="channel"
                                        // rules={[ { required: true, } ]}
                                    >
                                        <Input placeholder="*" />
                                    </Form.Item>
                                </Form>
                                <div className={styles.topics}>
                                    {(detailItem.topics || []).map(item => {
                                        return (
                                            <Tag
                                                className={styles.item}
                                                onClick={() => {
                                                    form2.setFieldsValue({
                                                        channel: item.name,
                                                    })
                                                }}
                                            >
                                                {item.name}
                                            </Tag>
                                        )
                                    })}
                                </div>
                                <Button
                                    type="primary"
                                    onClick={() => {
                                        subscribe()
                                    }}
                                >
                                    订阅
                                </Button>

                            </div>
                        }
                    </div>
                    {/* <div className={styles.help}>暂不支持在界面显示，消息请在后端控制台查看</div> */}
                    <Table
                        loading={loading}
                        dataSource={list}
                        bordered
                        size="small"
                        pagination={false}
                        // pagination={{
                        //     total,
                        //     current: page,
                        //     pageSize,
                        //     showSizeChanger: false,
                        // }}
                        rowKey="id"
                        columns={[
                            {
                                title: t('时间'),
                                dataIndex: 'time',
                                width: 80,
                                render(value) {
                                    return moment(value).format('HH:mm:ss')
                                }
                            },
                            {
                                title: t('topic'),
                                dataIndex: 'topic',
                                width: 200,
                            },
                            {
                                title: t('message'),
                                dataIndex: 'message',
                                // width: 240,
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

                    {/* <hr /> */}

                    {/* <Button
                        type="primary"
                        onClick={() => {
                            pubsub()
                        }}
                    >
                        pubsub
                    </Button> */}

                </div>
            }
            
        </div>
    )
}
