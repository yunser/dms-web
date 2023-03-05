import { Button, Checkbox, Descriptions, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Popover, Radio, Select, Space, Spin, Table, Tabs, Tag, Tree } from 'antd';
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
import { LeftRightLayout } from '@/components/left-right-layout';
// import { saveAs } from 'file-saver'


function ToUTF8(str) {
    var result = new Array();

    var k = 0;
    for (var i = 0; i < str.length; i++) {
        var j = encodeURI(str[i]);
        if (j.length==1) {
            // 未转换的字符
            result[k++] = j.charCodeAt(0);
        } else {
            // 转换成%XX形式的字符
            var bytes = j.split("%");
            for (var l = 1; l < bytes.length; l++) {
                result[k++] = parseInt("0x" + bytes[l]);
            }
        }
    }

    return result;
}

function decodeUtf8(bytes) {
    var encoded = "";
    for (var i = 0; i < bytes.length; i++) {
        encoded += '%' + bytes[i].toString(16);
    }
    return decodeURIComponent(encoded);
}

function utf82Hex(code) {
    const nums = ToUTF8(code)
    console.log('nums', nums)
    const hex = nums.map(num => (num).toString(16)).join('')
    return hex
}

function hex2utf8(code) {
    let arr = []
    
    for (let i = 0; i < code.length; i += 2) {
        var str = code.substr(i, 2) // 16 进制
        arr.push(parseInt(str, 16))
        // var n = parseInt(str, 16) // 10 进制
        // this.result += String.fromCharCode(n)
    }
    console.log('arr?', arr.join(' '))
    return decodeUtf8(arr)
}

// console.log('hex/utf82Hex', utf82Hex('我'))
// console.log('hex/hex2utf8', hex2utf8(utf82Hex('我')))
  

function Content({ item }) {

    const [format, setFormat] = useState('text')
    const [content, setContent] = useState(item.content)

    return (
        <div className={styles.contentBox}>
            {/* {item.contentType == 'hex' &&
                <Tag className={styles.tag}>Hex</Tag>
            } */}
            <Tag
                className={styles.tag}
                onClick={() => {
                    const newFormat = format == 'text' ? 'hex' : 'text'
                    setFormat(newFormat)
                    let newContent
                    if (newFormat == 'text') {
                        if (item.contentType == 'hex') {
                            newContent = hex2utf8(item.content)
                        }
                        else {
                            newContent = item.content
                        }
                    }
                    else {
                        if (item.contentType == 'hex') {
                            newContent = item.content
                        }
                        else {
                            newContent = utf82Hex(item.content)
                        }
                    }
                    setContent(newContent)
                }}
            >
                {format}</Tag>
            <pre className={styles.content}>{content}</pre>
        </div>
    )
}

export function TcpServer({  }) {
    // const { defaultJson = '' } = data
    const config = getGlobalConfig()
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [logs, setLogs] = useState([])
    const [form] = Form.useForm()
    const [connecting, setConnecting] = useState(false)
    const [hexFormat, setHexFormat] = useState(false)
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
    const [sendTarget, setSendTarget] = useState('')
    const [sendType, setSendType] = useState('text')

    async function loadClients() {
        let res = await request.post(`${config.host}/socket/tcp/clients`, {
            connectionId: comData.current.connectionId,
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
                            contentType: data.contentType,
                        },
                        ...logs,
                    ]
                })
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
                            contentType: data.contentType,
                            // content: t('send_to_client').replace('{client}', data.clientId) + ' ' + data.content,
                        },
                        ...logs,
                    ]
                })
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
            hex: hexFormat,
        })
        if (res.success) {
            // onSuccess && onSuccess()
            message.success(t('success'))
            comData.current.connectionId = res.data.connectionId
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
        const reqData = {
            connectionId: comData.current.connectionId,
            id: undefined,
        }
        if (item) {
            reqData.id = item.id
        }
        let res = await request.post(`${config.host}/socket/tcp/closeClient`, reqData)
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
            connectionId: comData.current.connectionId,
            content,
            clientId: sendTarget,
            contentType: sendType,
        })
        if (res.success) {
            message.success(t('success'))
        }
    }

    async function pingClient(item) {
        let res = await request.post(`${config.host}/socket/tcp/serverSend`, {
            connectionId: comData.current.connectionId,
            content: 'ping',
            clientId: item.id,
        })
        if (res.success) {
            message.success(t('success'))
        }
    }

    async function closeServer() {
        setConnected(false)
        let res = await request.post(`${config.host}/socket/tcp/closeServer`, {
            connectionId: comData.current.connectionId,
        })
        if (res.success) {
            message.success(t('success'))
        }
    }

    async function _setHexFormat(isHex) {
        let res = await request.post(`${config.host}/socket/tcp/serverConfig`, {
            connectionId: comData.current.connectionId,
            hex: isHex,
        })
        if (res.success) {
            message.success(t('success'))
        }
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
                                
                                <VSplit size={48} />
                                <div className={styles.sectionTitle}>{t('client')}</div>
                                
                                <div>
                                    <Button
                                        size="small"
                                        danger
                                        onClick={() => {
                                            closeClient()
                                        }}
                                    >
                                        {t('disconnect_all')}
                                    </Button>
                                </div>
                                <VSplit size={8} />
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
                                                            type={item.id == sendTarget ? 'primary' : 'default'}
                                                            onClick={() => {
                                                                if (item.id == sendTarget) {
                                                                    setSendTarget('')
                                                                }
                                                                else {
                                                                    setSendTarget(item.id)
                                                                }
                                                            }}
                                                        >
                                                            {/* 发送消息 */}
                                                            {t('send')}
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            onClick={() => {
                                                                pingClient(item)
                                                            }}
                                                        >
                                                            {t('ping')}
                                                        </Button>
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
                                        <div className={styles.sendText}>{t('send_message_to')} {sendTarget ? sendTarget : t('all_client')}</div>
                                    </LeftRightLayout>
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
                        pagination={{
                            // total,
                            // current: page,
                            pageSize: 40,
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
                            // },
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
                                                    <div>to: {item.clientId}</div>
                                                    <Content item={item} />
                                                </div>
                                            : item.subType == 'received' ?
                                                <div>
                                                    <div>from: {item.clientId}</div>
                                                    {/* <pre className={styles.content}>
                                                        {item.content}
                                                    </pre> */}
                                                    <Content item={item} />
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
