import { Button, Descriptions, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Popover, Radio, Space, Spin, Table, Tabs, Tag, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './http-proxy.module.less';
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
import { _if } from '@/views/db-manager/utils/helper';
// import { saveAs } from 'file-saver'

function Content({ item, showInfo = false }) {
    const [type, setType] = useState('request')
    return (
        <div className={styles.contentBox}>
            <Tabs
                activeKey={type}
                items={[
                    {
                        label: 'request',
                        key: 'request',
                    },
                    {
                        label: 'response',
                        key: 'response',
                    },
                    ..._if(!!item.connect, {
                        label: 'connect',
                        key: 'connect',
                    }),
                ]}
                onChange={key => {
                    setType(key)
                }}
            />
            {type == 'request' &&
                <div>
                    {!!item.request &&
                        <div>
                            <div>{item.request.method} {item.request.path} HTTP/{item.request.httpVersion}</div>
                            <div className={styles.headers}>
                                {item.request.headers.map(header => {
                                    return (
                                        <div className={styles.item}>
                                            <div className={styles.key}>{header.key}</div>
                                            <div className={styles.value}>{header.value}</div>
                                        </div>
                                    )
                                })}
                            </div>
                            <div></div>
                            <pre className={styles.contentPre}>{item.request.content}</pre>
                        </div>
                    }
                </div>
            }
            {type == 'response' &&
                <div>
                    {!!item.response &&
                        <div className={styles.headers}>
                            <div>HTTP/{item.response.httpVersion} {item.response.statusCode} {item.response.statusMessage}</div>
                            <div className={styles.headers}>
                                {item.response.headers.map(header => {
                                    return (
                                        <div className={styles.item}>
                                            <div className={styles.key}>{header.key}</div>
                                            <div className={styles.value}>{header.value}</div>
                                        </div>
                                    )
                                })}
                            </div>
                            <pre className={classNames(styles.contentPre)}>{item.response.content}</pre>
                        </div>
                    }
                </div>
            }
            {type == 'connect' &&
                <div>
                    <div className={styles.connectBox}>
                        <pre className={styles.connectPre}>{item.connect}</pre>
                        <Tag className={styles.tag}>connect</Tag>
                    </div>
                    {!!item.connectEstablished &&
                        <div className={styles.connectBox}>
                            <pre className={styles.connectPre}>{item.connectEstablished}</pre>
                            <Tag className={styles.tag}>Connection Established</Tag>
                        </div>
                    }
                </div>
            }
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

export function HttpProxy({ onClickItem }) {
    const config = getGlobalConfig()
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [type, setType] = useState('http')
    const [loading, setLoading] = useState(false)
    const [detailItem, setDetailItem] = useState(null)
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

    async function downloadRoot() {
        let res = await request.post(`${config.host}/https/proxy/getRootCert`, {})
        if (res.success) {
            // message.success(t('success'))
            const code = res.data.cert
            const blob = new Blob([code], {type: 'text/plain'})
            saveAs(blob, `DMS-root.crt`)
        }
    }

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
                    // isTls: 
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
            // @request
            else if (msg.type == 'request') {
                setConnected(true)
                const { id, time, request, response, connect, connectEstablished, content } = msg.data
                setLogs(list => {
                    // console.log('list.length', list.length)
                    setLogs([
                        {
                            id,
                            content,
                            time,
                            type: 'request',
                            request,
                            response,
                            connect,
                            connectEstablished,
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
        let res = await request.post(`${config.host}/${type}/proxy/create`, {
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

    async function closeAllServer() {
        let res = await request.post(`${config.host}/socket/udp/closeAllServer`, {
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

    async function exit() {
        setConnected(false)
        let res = await request.post(`${config.host}/${type}/proxy/close`, {
            connectionId: comData.current.connectionId
        })
    }

    return (
        <div className={styles.udpServerApp}>
            <div className={styles.layoutLeft}>
                <div className={styles.layoutLeftTop}>
                    <div className={styles.sectionTitle}>
                        {t('http_proxy')}
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
                                {type == 'https' &&
                                    <div className={styles.rooBox}>
                                        <div className={styles.help}>HTTPs 代理需安装并信任自签名根证书</div>

                                        <Button onClick={downloadRoot}>下载证书</Button>
                                    </div>
                                }
        
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
                        <div>
                            <Tabs
                                activeKey={type}
                                items={[
                                    {
                                        label: 'HTTP',
                                        key: 'http',
                                    },
                                    {
                                        label: 'HTTPs',
                                        key: 'https',
                                    },
                                ]}
                                onChange={key => {
                                    setType(key)
                                    createForm.setFieldsValue({
                                        port: key == 'http' ? 6666 : 6667
                                    })
                                }}
                            />
                            <div className={styles.form}>
                                <Form
                                    form={createForm}
                                    labelCol={{ span: 8 }}
                                    wrapperCol={{ span: 16 }}
                                    initialValues={{
                                        host: '0.0.0.0',
                                        port: 6666,
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
                                                {type == 'http' ? t('create_http_proxy') : t('create_https_proxy')}
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
                        </div>
                    }
                </div>
                {/* <div>
                    暂不支持 https
                </div> */}
            </div>
            <div className={styles.layoutRight}>
                <div className={styles.layoutRightTop}>
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
                    
                    <div>
                        <Button
                            danger
                            size="small"
                            onClick={() => {
                                setLogs([])
                                setDetailItem(null)
                            }}
                        >
                            {t('clear')}
                        </Button>
                    </div>
                    <VSplit size={8} />
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
                                title: t('select'),
                                dataIndex: 'select',
                                width: 80,
                                render(_value, item) {
                                    return (
                                        <div>
                                            {!!item.request?.method &&
                                                <Button
                                                    size="small"
                                                    type={detailItem?.id == item.id ? 'primary' : 'default'}
                                                    onClick={() => {
                                                        setDetailItem(item)
                                                    }}
                                                >
                                                    select
                                                </Button>
                                            }
                                        </div>
                                    )
                                }
                            },
                            {
                                title: t('time'),
                                dataIndex: 'time',
                                width: 80,
                                render(value) {
                                    if (!value) {
                                        return <div>--</div>
                                    }
                                    return moment(value).format('HH:mm:ss')
                                }
                            },
                            // {
                            //     title: t('id'),
                            //     dataIndex: 'id',
                            // },
                            // {
                            //     title: t('protocol'),
                            //     dataIndex: 'pro',
                            //     width: 80,
                            //     render(value) {
                            //         return moment(value).format('HH:mm:ss')
                            //     }
                            // },
                            {
                                title: t('method'),
                                dataIndex: ['request', 'method'],
                                // key: 'method',
                                width: 80,
                                render(_value, item) {
                                    return <div>{_value || '--'}</div>
                                }
                            },
                            {
                                title: t('host'),
                                dataIndex: ['request', 'host'],
                                width: 320,
                                ellipsis: true,
                            },
                            {
                                title: t('path'),
                                dataIndex: ['request', 'path'],
                                width: 400,
                                ellipsis: true,
                            },
                            {
                                title: t('result'),
                                dataIndex: 'response',
                                width: 64,
                                render(_value, item) {
                                    const statusCode = item.response?.statusCode
                                    if (!statusCode) {
                                        return <div>--</div>
                                    }
                                    let color = ('' + statusCode).startsWith('2') ? 'green' : 'red'
                                    return <div style={{ color }}>{statusCode}</div>
                                }
                            },
                            // {
                            //     title: t('url'),
                            //     dataIndex: 'url',
                            //     width: 80,
                            //     render(_value, item) {
                            //         return <div>{item.request?.url || '--'}</div>
                            //     }
                            // },
                            {
                                title: t('content'),
                                dataIndex: 'content',
                                // width: 240,
                                render(value, item) {
                                    return (
                                        <div>
                                            {(item.type == 'request') ?
                                                <div>
                                                    
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
                <div className={styles.layoutRightBottom}>
                    {!!detailItem &&
                        <div>
                            <Content item={detailItem} />
                        </div>
                    }
                </div>
            </div>
        </div>
    )
}
