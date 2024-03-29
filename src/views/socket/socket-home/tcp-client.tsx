import { Button, Checkbox, Descriptions, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Popover, Radio, Select, Space, Spin, Table, Tabs, Tag, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './tcp-client.module.less';
import _, { after } from 'lodash';
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
import { LeftRightLayout } from '@/components/left-right-layout';
import storage from '@/utils/storage';
import { uid } from 'uid';
// import { saveAs } from 'file-saver'


function Content({ item }) {
    
    const [format] = useState('text')
    return (
        <div className={styles.contentBox}>
            {item.contentType == 'hex' &&
                <Tag className={styles.tag}>Hex</Tag>
            }
            {/* <Tag className={styles.tag}>{format}</Tag> */}
            <pre className={classNames(styles.content, styles[item.type])}>{item.content}</pre>
        </div>
    )
}

export function TcpClient({  }) {
    // const { defaultJson = '' } = data
    const config = getGlobalConfig()
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [logs, setLogs] = useState([])
    const [form] = Form.useForm()
    const [connecting, setConnecting] = useState(false)
    const [connected, setConnected] = useState(false)
    const [content, setContent] = useState('')
    const [wsStatus, setWsStatus] = useState('disconnected')
    const [serverConfig, setServerConfig] = useState({})
    const [sendType, setSendType] = useState('text')
    const [hexFormat, setHexFormat] = useState(false)
    const [endOfLineType, setEndOfLineType] = useState('lf')
    const [connections, setConnections] = useState([
        {
            id: '1',
            host: 'hello.yunser.com',
            port: 80,
        },
        // {
        //     id: '2',
        //     host: '127.0.0.1',
        //     port: 1465,
        // },
    ])
    useEffect(() => {
        const list = storage.get('tcp_connections', [])
        if (list.length) {
            setConnections(list)
        }
    }, [])
    const comData = useRef({
        connectTime: 0,
        connectionId: '',
        // webSocket: null,
        webSocketId: '',
    })

    async function _setHexFormat(isHex) {
        let res = await request.post(`${config.host}/socket/tcp/config`, {
            connectionId: comData.current.connectionId,
            hex: isHex,
        })
        if (res.success) {
            message.success(t('success'))
        }
    }

    function initWebSocket(callback) {
        let first = true
        const ws = new WebSocket('ws://localhost:10087/')
        // comData.current.webSocket = ws
        
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
            callback && callback(ws)
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
            if (msg.type == 'message' || msg.type == 'info' || msg.type == 'sent') {
                const { data } = msg
                setLogs(logs => {
                    return [
                        {
                            id: data.id,
                            content: data.content,
                            contentType: data.contentType,
                            // message: msg.message,
                            time: data.time,
                            type: data.type,
                            isTls: !!data.isTls,
                        },
                        ...logs,
                    ]
                })
            }
            else if (msg.type == 'connected') {
                const { data } = msg
                setConnected(true)
                setHexFormat(false)
                setServerConfig({
                    host: data.host,
                    port: data.port,
                })
                setLogs(logs => {
                    return [
                        {
                            id: data.id,
                            // message: msg.message,
                            time: data.time,
                            type: 'connected',
                            content: t('tcp_connected') +  ` ${data.host}:${data.port}`,
                        },
                        ...logs,
                    ]
                })
                // console.log('connections', )
                // setConnections
                setConnections(connections => {
                    console.log('connections', connections)
                    const newConnections = connections.filter(item => {
                        return !(item.host == data.host && item.port == data.port)
                    })
                    newConnections.unshift({
                        id: uid(16),
                        host: data.host,
                        port: data.port,
                    })
                    storage.set('tcp_connections', newConnections)
                    // setConnections(newConnections)
                    return newConnections
                })
            }
            else if (msg.type == 'disconnected') {
                const { data } = msg
                setConnected(false)
                setLogs(logs => {
                    return [
                        {
                            id: data.id,
                            // message: msg.message,
                            time: data.time,
                            type: 'disconnected',
                            content: t('tcp_disconnected'),
                        },
                        ...logs,
                    ]
                })
            }
            else if (msg.type == 'websocketId') {
                const { webSocketId } = msg.data
                comData.current.webSocketId = webSocketId
            }

            // setList(list => {
            //     console.log('list.length', list.length)
            //     return []
            // })
        }
        return ws
    }

    async function connect() {
        const values = await form.validateFields()
        setConnecting(true)
        console.log('websocket init ok', )
        let res = await request.post(`${config.host}/socket/tcp/connect`, {
            host: values.host,
            port: values.port,
            isTls: values.tls,
            webSocketId: comData.current.webSocketId,
        })
        if (res.success) {
            // onSuccess && onSuccess()
            message.success(t('success'))
            const { connectionId } = res.data
            console.log('connectionId', connectionId)
            comData.current.connectionId = connectionId
            // comData.current.webSocket = ws
            // const ws = comData.current.webSocket
            // ws.send(JSON.stringify({
            //     type: 'tcpSubscribe',
            //     data: {
            //         connectionId,
            //     },
            // }))
        }
        // initWebSocket(async (ws) => {
        // })
        setConnecting(false)
    }

    useEffect(() => {
        initWebSocket()
    }, [])

    async function _send(content: string) {
        let res = await request.post(`${config.host}/socket/tcp/send`, {
            connectionId: comData.current.connectionId,
            content,
            contentType: sendType,
        })
        if (res.success) {
            message.success(t('success'))
        }
    }

    async function ping() {
        let res = await request.post(`${config.host}/socket/tcp/send`, {
            connectionId: comData.current.connectionId,
            content: 'ping',
        })
        if (res.success) {
            message.success(t('success'))
        }
    }

    async function closeAllClient() {
        let res = await request.post(`${config.host}/socket/tcp/closeAllClient`, {
        })
        if (res.success) {
            message.success(t('success'))
        }
    }

    async function send() {
        if (!content) {
            message.error('no content')
            return
        }
        // console.log('content?', content.replace(/\n/g, '\r\n'))
        // return
        // CRLF是Carriage-Return Line-Feed的缩写，意思是回车换行，
        // 就是回车(CR, ASCII 13, \r) 换行(LF, ASCII 10, \n)。
        // 换行在有的ASCII码表也用newline（简nl）来进行表示,这里的lf是line feed的概念，意思是一样的。
        // _send(content.replace(/\n/g, '\r\n'))
        const _sendContent = endOfLineType == 'lf' ? content : content.replace(/\n/g, '\r\n')
        _send(_sendContent)
    }

    async function disconnect() {
        let res = await request.post(`${config.host}/socket/tcp/close`, {
            content,
            connectionId: comData.current.connectionId,
        })
        if (res.success) {
            // message.success(t('success'))
        }
    }

    return (
        <div className={styles.tcpClientPage}>
            <div className={styles.layoutLeft}>
                <div className={styles.appName}>{t('tcp_client')}</div>
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
                {connected ?
                    <div>
                        <div>
                            {/* <div>
                                {wsStatus}
                            </div> */}
                            <Space>
                                <div>
                                    {t('connected')} {serverConfig.host}:{serverConfig.port}
                                </div>
                                <Button
                                    // loading={connecting}
                                    danger
                                    // type="primary"
                                    onClick={disconnect}
                                    size="small"
                                >
                                    {t('disconnect')}
                                </Button>
                                <Checkbox
                                    checked={hexFormat}
                                    onChange={e => {
                                        setHexFormat(e.target.checked)
                                        _setHexFormat(e.target.checked)
                                    }}
                                >
                                    {t('hex')}
                                </Checkbox>
                            </Space>
                            <VSplit size={32} />
                            <div>
                                <Input.TextArea
                                    value={content}
                                    rows={8}
                                    onChange={e => {
                                        setContent(e.target.value)
                                    }}
                                />
                            </div>
                            <VSplit size={8} />
                            <LeftRightLayout>
                                <Space>
                                    <Button
                                        // loading={connecting}
                                        type="primary"
                                        size="small"
                                        onClick={send}
                                    >
                                        {t('send')}
                                    </Button>
                                    <Popover
                                        title={t('template')}
                                        content={
                                            <div className={styles.popoverContent}>
                                                <Space>
                                                    <Button
                                                        onClick={() => {
                                                            setContent(`GET / HTTP/1.1\nhost: ${serverConfig.host}:${serverConfig.port}\n\n`)
                                                            setEndOfLineType('crlf')
                                                        }}
                                                    >HTTP Request</Button>
                                                    {/* <Button
                                                        onClick={() => {
                                                            setContent(tpl_http_response_404)
                                                        }}
                                                    >HTTP Response 404</Button> */}
                                                    <Button
                                                        onClick={() => {
                                                            setContent('ping')
                                                            // setEndOfLineType('crlf')
                                                        }}
                                                    >ping</Button>
                                                </Space>
                                            </div>
                                        }
                                    >
                                        <Button
                                            size="small"
                                        >
                                            {t('template')}
                                        </Button>
                                    </Popover>
                                </Space>
                                <Space>
                                    <Tag
                                        className={styles.endOfLineTag}
                                        onClick={() => {
                                            if (endOfLineType == 'lf') {
                                            }
                                            setEndOfLineType(endOfLineType == 'lf' ? 'crlf' : 'lf')
                                        }}
                                    >{endOfLineType.toUpperCase()}</Tag>
                                    {/* <Button
                                        size="small"
                                        onClick={ping}
                                    >
                                        {t('ping')}
                                    </Button> */}
                                    <Select
                                        size="small"
                                        className={styles.sendType}
                                        value={sendType}
                                        onChange={value => {
                                            setSendType(value)
                                        }}
                                        options={[
                                            {
                                                label: t('text'),
                                                value: 'text',
                                            },
                                            {
                                                label: t('hex'),
                                                value: 'hex',
                                            },
                                        ]}
                                    />
                                </Space>
                            </LeftRightLayout>
                        </div>
    
                    </div>
                :
                    <div>
                        <div className={styles.form}>
                            <Form
                                form={form}
                                labelCol={{ span: 8 }}
                                wrapperCol={{ span: 16 }}
                                initialValues={{
                                    host: '127.0.0.1',
                                    port: 1465,
                                    isTls: true,
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
                                    name="tls"
                                    label={t('tls')}
                                    // rules={[ { required: true, }, ]}
                                    valuePropName="checked"
                                >
                                    <Checkbox></Checkbox>
                                </Form.Item>
                                <Form.Item
                                    wrapperCol={{ offset: 8, span: 16 }}
                                    // extra="only support TCP"
                                    // name="passowrd"
                                    // label="Passowrd"
                                    // rules={[{ required: true, },]}
                                >
                                    <Space>
                                        <Button
                                            loading={connecting}
                                            type="primary"
                                            onClick={connect}
                                        >
                                            {t('connect')}
                                        </Button>
                                    </Space>
                                </Form.Item>
                            </Form>
                        </div>
                        <div className={styles.connections}>
                            {connections.map(item => {
                                return (
                                    <div className={styles.item}
                                        key={item.id}
                                        onClick={() => {
                                            form.setFieldsValue({
                                                host: item.host,
                                                port: item.port,
                                            })
                                        }}
                                    >
                                        {item.host}:{item.port}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                }
            </div>
            <div className={styles.layoutRight}>
                <div className={styles.rightTopToolBox}>
                    <Button
                        size="small"
                        onClick={() => {
                            closeAllClient()
                        }}
                    >
                        {t('close_all_tcp_client')}
                    </Button>
                </div>
                <div className={styles.toolBox}>
                    <Button
                        size="small"
                        danger
                        onClick={() => {
                            setLogs([])
                        }}
                    >
                        {t('clear')}
                    </Button>
                </div>
                <Table
                    className={styles.logTable}
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
                        // {
                        //     title: t('type'),
                        //     dataIndex: 'type',
                        //     width: 120,
                        // },
                        {
                            title: t('content'),
                            dataIndex: 'content',
                            // width: 240,
                            render(value, item) {
                                return (
                                    <div>
                                        {(item.type == 'sent' || item.type == 'message') ?
                                            <Content item={item} />
                                            // <pre className={classNames(styles.content, styles[item.type])}>{value}</pre>
                                        : item.type == 'disconnected' ?
                                            <div style={{ color: 'red' }}>{value}</div>
                                        : item.type == 'connected' ?
                                            <div style={{ color: 'green' }}>{value}</div>
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
