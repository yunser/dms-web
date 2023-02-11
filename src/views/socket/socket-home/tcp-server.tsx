import { Button, Descriptions, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Popover, Radio, Space, Spin, Table, Tabs, Tag, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './tcp-server.module.less';
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


export function TcpServer({  }) {
    // const { defaultJson = '' } = data
    const config = getGlobalConfig()
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [logs, setLogs] = useState([])
    const [form] = Form.useForm()
    const [connecting, setConnecting] = useState(false)
    // 服务的状态
    const [connected, setConnected] = useState(false)
    const [content, setContent] = useState('')
    // WebSocket 的状态
    const [wsStatus, setWsStatus] = useState('notConnected')
    const [serverConfig, setServerConfig] = useState({})
    const comData = useRef({
        connectTime: 0,
        connectionId: '',
        webSocketId: '',
    })
    const [clients, setClients] = useState([])

    async function loadClients() {
        let res = await request.post(`${config.host}/socket/tcp/clients`, {
            content,
        })
        if (res.success) {
            setClients(res.data.list)
            // onSuccess && onSuccess()
            // message.success(t('success'))
            // setContent('')
            // setConnected(true)
        }
    }

    function initWebSocket(connectionId) {
        let first = true
        const ws = new WebSocket('ws://localhost:10087/')
        console.log('initWebSocket')
        console.log('readyState', ws.readyState)
        
        ws.onclose = async () => {
            console.log('socket/on-close')
            setWsStatus('notConnected')
            
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
            
            if (msg.type == 'websocketId') {
                const { webSocketId } = msg.data
                comData.current.webSocketId = webSocketId
            }
            else if (msg.type == 'listening') {
                setConnected(true)
            }
            else if (msg.type == 'clientChange') {
                loadClients()
            }
            else if (msg.type == 'close') {
                setConnected(false)
            }
            else if (msg.type == 'message' || msg.type == 'info' || msg.type == 'sent') {
                const { data } = msg
                setLogs(logs => {
                    return [
                        {
                            id: data.id,
                            content: data.content,
                            // message: msg.message,
                            time: data.time,
                            type: data.type,
                        },
                        ...logs,
                    ]
                })
            }

            // setLogs(list => {
            //     console.log('list.length', list.length)
            //     setLogs([
            //         {
            //             id: msg.id,
            //             content: msg.content,
            //             // message: msg.message,
            //             time: msg.time,
            //         },
            //         ...list,
            //     ])
            //     return []
            // })
        }
        return ws
    }

    useEffect(() => {
        initWebSocket()
    }, [])

    async function createServer() {
        const values = await form.validateFields()
        // setConnecting(true)
        let res = await request.post(`${config.host}/socket/tcp/createServer`, {
            // content,
            host: values.host,
            port: values.port,
            webSocketId: comData.current.webSocketId,
        })
        if (res.success) {
            // onSuccess && onSuccess()
            message.success(t('success'))
            // comData.current.connectionId = res.data.connectionId
            // setConnected(true)
            setServerConfig({
                host: values.host,
                port: values.port,
            })
            // initWebSocket(res.data.connectionId)
        }
        // setConnecting(false)
    }

    async function closeClient(item) {
        let res = await request.post(`${config.host}/socket/tcp/closeClient`, {
            // content,
            id: item.id,
        })
        if (res.success) {
            // onSuccess && onSuccess()
            message.success(t('success'))
            // comData.current.connectionId = res.data.connectionId
            // setConnected(true)
            loadClients()
            // initWebSocket(res.data.connectionId)
        }
    }

    function clear() {
        setLogs([])
    }

    async function send() {
        if (!content) {
            message.error('no content')
            return
        }
        let res = await request.post(`${config.host}/socket/tcp/serverSend`, {
            content,
        })
        if (res.success) {
            // onSuccess && onSuccess()
            message.success(t('success'))
            // setContent('')
            // setConnected(true)
        }
    }

    async function closeServer() {
        setConnected(false)
        let res = await request.post(`${config.host}/socket/tcp/closeServer`, {
            content,
        })
    }

    return (
        <div className={styles.tcpServerApp}>
            <div className={styles.layoutLeft}>
                <div>
                    TCP 服务端
                </div>
                <div>
                    {wsStatus != 'connected' &&
                        <div>WebSocket 已断开，请刷新页面后使用
                            <Button
                                onClick={() => {
                                    window.location.reload()
                                }}
                            >刷新页面</Button>
                        </div>
                    }
                </div>
                <div>
                    {connected ?
                        <div>
                            <Space direction="vertical">
                                {/* <div>
                                    <Button
                                        // loading={connecting}
                                        // type="primary"
                                        onClick={exit}
                                    >
                                        {t('关闭连接')}
                                    </Button>
                                </div> */}
                                <div>
                                    正在监听 {serverConfig.host}:{serverConfig.port}
                                    
                                </div>
                                <div>
                                    <Button
                                        danger
                                        onClick={() => {
                                            closeServer()
                                        }}
                                    >
                                        关闭服务
                                    </Button>
                                </div>
                                <div>客户端：</div>
                                <Table
                                    // loading={loading}
                                    dataSource={clients}
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
                                            title: t('id'),
                                            dataIndex: 'id',
                                            // width: 80,
                                            // render(value) {
                                            //     return moment(value).format('HH:mm:ss')
                                            // }
                                        },
                                        {
                                            title: t('connectTime'),
                                            dataIndex: 'connectTime',
                                            width: 80,
                                            render(value) {
                                                return moment(value).format('HH:mm:ss')
                                            }
                                        },
                                        // {
                                        //     title: t('type'),
                                        //     dataIndex: 'type',
                                        //     // width: 240,
                                        // },
                                        // {
                                        //     title: t('content'),
                                        //     dataIndex: 'content',
                                        //     // width: 240,
                                        // },
                                        // {
                                        //     title: '',
                                        //     dataIndex: '_empty',
                                        // },
                                        {
                                            title: t('actions'),
                                            dataIndex: '__actions',
                                            // width: 80,
                                            render(_value, item) {
                                                return (
                                                    <Space>
                                                        <Button
                                                            size="small"
                                                            danger
                                                            onClick={() => {
                                                                closeClient(item)
                                                            }}
                                                        >
                                                            断开
                                                        </Button>
                                                    </Space>
                                                )
                                            }
                                        },
                                    ]}
                                    onChange={({ current }) => {
                                        // setPage(current)
                                    }}
                                />
                                <div>
                                    <Input.TextArea
                                        value={content}
                                        placeholder="发送内容"
                                        onChange={e => {
                                            setContent(e.target.value)
                                        }}
                                    />
                                    <div>
                                        <Button
                                            // loading={connecting}
                                            type="primary"
                                            onClick={send}
                                        >
                                            {t('send')}
                                        </Button>
                                    </div>
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
                                form={form}
                                labelCol={{ span: 8 }}
                                wrapperCol={{ span: 16 }}
                                initialValues={{
                                    host: '0.0.0.0',
                                    port: 1465,
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
                                            {t('createServer')}
                                        </Button>
                                    </Space>
                                </Form.Item>
                            </Form>
                            
                        </div>
                    }
                </div>
            </div>
            <div>
                <div>日志</div>
                <div>
                    <Button
                        danger
                        size="small"
                        onClick={() => {
                            clear()
                        }}
                    >
                        清空
                    </Button>
                </div>
                <Table
                    loading={loading}
                    dataSource={logs}
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
                            title: t('type'),
                            dataIndex: 'type',
                            // width: 240,
                        },
                        {
                            title: t('content'),
                            dataIndex: 'content',
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

            </div>
        </div>
    )
}
