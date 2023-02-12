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
import { VSpacer, VSplit } from '@/components/v-space';
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
                const { data } = msg
                setLogs(logs => {
                    return [
                        {
                            id: data.id,
                            content: t('server_listening') + ` ${data.host}:${data.port}`,
                            time: data.time,
                            type: data.type,
                        },
                        ...logs,
                    ]
                })
            }
            else if (msg.type == 'clientChange') {
                loadClients()
            }
            else if (msg.type == 'client_connected') {
                const { data } = msg
                setLogs(logs => {
                    return [
                        {
                            id: data.id,
                            content: t('client_connected').replace('{client}', data.clientId),
                            time: data.time,
                            type: data.type,
                        },
                        ...logs,
                    ]
                })
                loadClients()
            }
            else if (msg.type == 'client_disconnected') {
                const { data } = msg
                setLogs(logs => {
                    return [
                        {
                            id: data.id,
                            content: t('client_disconnected').replace('{client}', data.clientId),
                            time: data.time,
                            type: data.type,
                        },
                        ...logs,
                    ]
                })
                loadClients()
            }
            else if (msg.type == 'client_message') {
                const { data } = msg
                setLogs(logs => {
                    return [
                        {
                            id: data.id,
                            // content: t('client_received').replace('{client}', data.clientId) + data.content,
                            time: data.time,
                            type: data.type,
                            subType: 'received',
                            clientId: data.clientId,
                            content: data.content,
                        },
                        ...logs,
                    ]
                })
                loadClients()
            }
            else if (msg.type == 'client_send') {
                const { data } = msg
                setLogs(logs => {
                    return [
                        {
                            id: data.id,
                            time: data.time,
                            type: data.type,
                            subType: 'sent',
                            clientId: data.clientId,
                            content: data.content,
                            // content: t('send_to_client').replace('{client}', data.clientId) + ' ' + data.content,
                        },
                        ...logs,
                    ]
                })
                loadClients()
            }
            // else if (msg.type == 'message') {
            //     const { data } = msg
            //     setLogs(logs => {
            //         return [
            //             {
            //                 id: data.id,
            //                 content: data.content,
            //                 // message: msg.message,
            //                 time: data.time,
            //                 type: data.type,
            //                 subType: 'received',
            //                 clientId: data.clientId,
            //                 content: data.content,
            //             },
            //             ...logs,
            //         ]
            //     })
            // }
            else if (msg.type == 'close') {
                setConnected(false)
                const { data } = msg
                setLogs(logs => {
                    return [
                        {
                            id: data.id,
                            content: t('server_close'),
                            time: data.time,
                            type: data.type,
                        },
                        ...logs,
                    ]
                })
            }
            else if (msg.type == 'info' || msg.type == 'sent') {
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

    async function closeAllServer() {
        let res = await request.post(`${config.host}/socket/tcp/closeAllServer`, {
            // content,
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
                <div className={styles.sectionTitle}>
                    {t('tcp_server')}
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
                <div>
                    {connected ?
                        <div>
                            <div>
                                {/* <div>
                                    <Button
                                        // loading={connecting}
                                        // type="primary"
                                        onClick={exit}
                                    >
                                        {t('关闭连接')}
                                    </Button>
                                </div> */}
                                {/* <VSpacer /> */}
                                
                                <Space>
                                    <div>
                                        {t('listening')} {serverConfig.host}:{serverConfig.port}
                                    </div>
                                    <div>
                                        <Button
                                            danger
                                            size="small"
                                            onClick={() => {
                                                closeServer()
                                            }}
                                        >
                                            {t('close_tcp_server')}
                                        </Button>
                                    </div>
                                </Space>
                                
                                <VSplit size={48} />
                                <div className={styles.sectionTitle}>{t('client')}</div>
                                
                                <Table
                                    // loading={loading}
                                    dataSource={clients}
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
                                            title: t('id'),
                                            dataIndex: 'id',
                                            width: 120,
                                            // render(value) {
                                            //     return moment(value).format('HH:mm:ss')
                                            // }
                                        },
                                        {
                                            title: t('connect_time'),
                                            dataIndex: 'connectTime',
                                            width: 120,
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
                                                            {t('disconnect')}
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
                                <VSplit size={48} />
                                <div>
                                    <Input.TextArea
                                        className={styles.textarea}
                                        value={content}
                                        placeholder={t('content')}
                                        rows={8}
                                        onChange={e => {
                                            setContent(e.target.value)
                                        }}
                                    />
                                    <VSplit size={8} />
                                    <div>
                                        <Button
                                            // loading={connecting}
                                            type="primary"
                                            size="small"
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
                                
                            </div>
        
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
                                            {t('create_tcp_server')}
                                        </Button>
                                    </Space>
                                </Form.Item>
                            </Form>
                            
                        </div>
                    }
                </div>
            </div>
            <div className={styles.layoutRight}>
                <div className={styles.rightTopToolBox}>
                    <Button
                        size="small"
                        onClick={() => {
                            closeAllServer()
                        }}
                    >
                        {t('close_all_tcp_server')}
                    </Button>
                </div>
                <Space direction="vertical">

                    <div className={styles.sectionTitle}>{t('log')}</div>
                    <div>
                        <Button
                            danger
                            size="small"
                            onClick={() => {
                                clear()
                            }}
                        >
                            {t('clear')}
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
                                title: t('time'),
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
                                render(value, item) {
                                    // console.log('item', value, item)
                                    return (
                                        <div>
                                            {item.subType == 'sent' ?
                                                <div>
                                                    <div>=> {item.clientId}</div>
                                                    <pre className={styles.content}>
                                                        {item.content}
                                                    </pre>
                                                </div>
                                            : item.subType == 'received' ?
                                                <div>
                                                    <div>{item.clientId}:</div>
                                                    <pre className={styles.content}>
                                                        {item.content}
                                                    </pre>
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
                </Space>

            </div>
        </div>
    )
}
