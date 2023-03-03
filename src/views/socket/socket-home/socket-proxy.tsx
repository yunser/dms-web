import { Button, Descriptions, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Popover, Radio, Space, Spin, Table, Tabs, Tag, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './socket-proxy.module.less';
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
import { VSplit } from '@/components/v-space';
// import { saveAs } from 'file-saver'

function ClientReceivedMessage({ item, showInfo = false }) {
    return (
        <div className={styles.contentBox}>
            <div>客户端 {item.clientId} 收到：</div>
            <pre className={styles.preContent}>{item.content}</pre>
            {/* {item.contentType == 'hex' &&
                <Tag className={styles.tag}>Hex</Tag>
            }
            <pre className={styles.content}>{item.content}</pre>
            {showInfo &&
                <div className={styles.info}>{item.type == 'received' ? '@' : 'to:'}{item.host}:{item.port}</div>
            } */}
        </div>
    )
}

function ClientSentMessage({ item, showInfo = false }) {
    return (
        <div className={styles.contentBox}>
            <div>客户端 {item.clientId} 发送：</div>
            <pre className={styles.preContent}>{item.content}</pre>
            {/* {item.contentType == 'hex' &&
                <Tag className={styles.tag}>Hex</Tag>
            }
            <pre className={styles.content}>{item.content}</pre>
            {showInfo &&
                <div className={styles.info}>{item.type == 'received' ? '@' : 'to:'}{item.host}:{item.port}</div>
            } */}
        </div>
    )
}

export function SocketProxy({ onClickItem }) {
    const config = getGlobalConfig()
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [logs, setLogs] = useState([])
    const [targetForm] = Form.useForm()
    const [createForm] = Form.useForm()
    const [connecting, setConnecting] = useState(false)
    const [connected, setConnected] = useState(false)
    const [content, setContent] = useState('')
    const [wsStatus, setWsStatus] = useState('disconnected')
    const [serverConfig, setServerConfig] = useState({})
    const comData = useRef({
        connectTime: 0,
        connectionId: '',
        webSocketId: '',
    })

    useEffect(() => {
        initWebSocket()
    }, [])

    
    async function ping() {
        const values = await targetForm.validateFields()
        let res = await request.post(`${config.host}/socket/udp/serverSend`, {
            content: 'ping',
            host: values.host,
            port: values.port,
            connectionId: comData.current.connectionId
        })
        if (res.success) {
            message.success(t('success'))
        }
    }

    async function sendTo() {
        const values = await targetForm.validateFields()
        let res = await request.post(`${config.host}/socket/udp/serverSend`, {
            content,
            host: values.host,
            port: values.port,
            connectionId: comData.current.connectionId
        })
        if (res.success) {
            message.success(t('success'))
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
            
            console.log('msg', msg)
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
            else if (msg.type == 'clientConnected') {
                const { clientId, host, port } = msg.data
                setLogs(list => {
                    // console.log('list.length', list.length)
                    setLogs([
                        {
                            id: msg.id,
                            // content: `${t('close')}`,
                            content: `客户端 ${clientId} 连接到 ${host}:${port}`,
                            // message: msg.message,
                            time: msg.time,
                        },
                        ...list,
                    ])
                    return []
                })
            }
            else if (msg.type == 'clientClose') {
                const { clientId } = msg.data
                setLogs(list => {
                    // console.log('list.length', list.length)
                    setLogs([
                        {
                            id: msg.id,
                            // content: `${t('close')}`,
                            content: `客户端 ${clientId} 关闭`,
                            // message: msg.message,
                            time: msg.time,
                        },
                        ...list,
                    ])
                    return []
                })
            }
            else if (msg.type == 'clientSent') {
                const { clientId, content } = msg.data
                setLogs(list => {
                    // console.log('list.length', list.length)
                    setLogs([
                        {
                            type: 'clientSent',
                            id: msg.id,
                            // content: `${t('close')}`,
                            clientId,
                            content,
                            // content: `客户端 ${clientId} 发送：${content}`,
                            // message: msg.message,
                            time: msg.time,
                        },
                        ...list,
                    ])
                    return []
                })
            }
            else if (msg.type == 'clientReceived') {
                const { clientId, content } = msg.data
                setLogs(list => {
                    // console.log('list.length', list.length)
                    setLogs([
                        {
                            type: 'clientReceived',
                            id: msg.id,
                            // content: `${t('close')}`,
                            // content: `客户端 ${clientId} 收到：${content}`,
                            clientId,
                            content,
                            // message: msg.message,
                            time: msg.time,
                        },
                        ...list,
                    ])
                    return []
                })
            }
            else if (msg.type == 'request') {
                setConnected(true)
                const { request, response, content } = msg.data
                setLogs(list => {
                    // console.log('list.length', list.length)
                    setLogs([
                        {
                            id: msg.id,
                            content,
                            time: msg.time,
                            type: 'request',
                            request,
                            response,
                            // host,
                            // port,
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

    async function createServer() {
        const values = await createForm.validateFields()
        // setConnecting(true)
        let res = await request.post(`${config.host}/socket/proxy/create`, {
            // content,
            host: values.host,
            port: values.port,
            webSocketId: comData.current.webSocketId,
        })
        if (res.success) {
            // onSuccess && onSuccess()
            message.success(t('success'))
            comData.current.connectionId = res.data.connectionId
            // setConnected(true)
            // initWebSocket()
        }
        // setConnecting(false)
    }


    async function exit() {
        setConnected(false)
        let res = await request.post(`${config.host}/socket/proxy/close`, {
            connectionId: comData.current.connectionId
        })
    }

    return (
        <div className={styles.udpServerApp}>
            <div className={styles.layoutLeft}>
                <div className={styles.layoutLeftTop}>
                    <div className={styles.sectionTitle}>
                        {t('socket_proxy')}
                    </div>
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
                    </div>
                    {connected ?
                        <div>   
                            <Space direction="vertical">
                                <Space>
                                    <div>
                                        {t('listening')} {serverConfig.host}:{serverConfig.port}
                                    </div>
                                    <Button
                                        // loading={connecting}
                                        // type="primary"
                                        danger
                                        size="small"
                                        onClick={exit}
                                    >
                                        {t('close')}
                                    </Button>
                                </Space>
                                <div>
                                    
                                </div>
        
                                {/* <Button
                                    // loading={connecting}
                                    type="primary"
                                    onClick={send}
                                >
                                    {t('send')}
                                </Button> */}
                                {/* <div>
                                    {wsStatus}
                                </div> */}
                                
                            </Space>
        
                        </div>
                    :
                        <div className={styles.form}>
                            <Form
                                form={createForm}
                                labelCol={{ span: 8 }}
                                wrapperCol={{ span: 16 }}
                                initialValues={{
                                    host: '0.0.0.0',
                                    port: 6668,
                                    // port: 3306,
                                }}
                                // layout={{
                                //     labelCol: { span: 0 },
                                //     wrapperCol: { span: 24 },
                                // }}
                            >
                                <Form.Item
                                    name="host"
                                    label={t('host')}
                                    rules={[ { required: true, }, ]}
                                >
                                    <Input />
                                </Form.Item>
                                <Form.Item
                                    name="port"
                                    label={t('port')}
                                    rules={[ { required: true, }, ]}
                                >
                                    <InputNumber />
                                </Form.Item>
                                <Form.Item
                                    wrapperCol={{ offset: 8, span: 16 }}
                                >
                                    <Space>
                                        <Button
                                            loading={connecting}
                                            type="primary"
                                            onClick={createServer}
                                        >
                                            {t('create_socket_proxy')}
                                        </Button>
                                    </Space>
                                </Form.Item>
                            </Form>
                            {/* <Input.TextArea
                                value={content}
                                placeholder="发送内容"
                                onChange={e => {
                                    setContent(e.target.value)
                                }}
                            />
                            <div>
                                <Button
                                    loading={connecting}
                                    type="primary"
                                    onClick={send2}
                                >
                                    {t('connect')}
                                </Button>
                            </div> */}
                        </div>
                    }
                </div>
            </div>
            <div className={styles.layoutRight}>
                {/* <div className={styles.rightTopToolBox}>
                    <Button
                        size="small"
                        onClick={() => {
                            closeAllServer()
                        }}
                    >
                        {t('close_all_udp_server')}
                    </Button>
                </div> */}
                <div className={styles.sectionTitle}>{t('log')}</div>

                <VSplit size={16} />
                
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
                                        {(item.type == 'clientSent') ?
                                            <div>
                                                <ClientSentMessage item={item} />
                                            </div>
                                        : (item.type == 'clientReceived') ?
                                            <div>
                                                <ClientReceivedMessage item={item} />
                                            </div>
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
        </div>
    )
}
