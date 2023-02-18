import { Button, Checkbox, Descriptions, Form, Input, InputNumber, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './websocket-server.module.less';
import _ from 'lodash';
import classNames from 'classnames'
import { useTranslation } from 'react-i18next';
import storage from '@/utils/storage'
import { useInterval } from 'ahooks';
import { request } from '../../db-manager/utils/http';
import moment from 'moment';
import { uid } from 'uid';
import { ArrowDownOutlined, ArrowUpOutlined, CheckCircleOutlined, InfoCircleOutlined, UpOutlined } from '@ant-design/icons';
import copy from 'copy-to-clipboard';
import { sleep } from '@yunser/sleep'
import { getGlobalConfig } from '@/config';

export function WebSocketServer({ }) {
    const { t } = useTranslation()

    const config = getGlobalConfig()
    
    const WsStatusLabelMap = {
        'disconnected': t('disconnected'),
        'error': t('connect_error'),
        'connected': t('connected'),
    }

    const comData = useRef({
        connectTime: 0,
        socket: null,
        isUserDisconnect: false,
        connectionId: '',
        messages: [],
    })

    const [url, setUrl] = useState('ws://127.0.0.1:10087/')
    const [host, setHost] = useState('0.0.0.0')
    const [port, setPort] = useState(9001)
    const [form] = Form.useForm()
    const [form2] = Form.useForm()
    const [autoConnect, setAutoConnect] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)

    const [sendTarget, setSendTarget] = useState('')
    const [clients, setClients] = useState([])

    // const 
    const [messages, setMessages] = useState([])

    function addMessage(item) {
        setMessages(messages => {
            return [
                item,
                ...messages,
            ]
        })
    }

    const pageSize = 10
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(false)
    const [wsStatus, setWsStatus] = useState('disconnected')
    const [wsAction, setWsAction] = useState('')

    function listAddItem(item) {
        setMessages(list => {
            console.log('list.lengthV2', list.length)
            return [
                {
                    ...item,
                    id: uid(8),
                    time: moment().format('YYYY-MM-DD HH:mm:ss'),
                },
                ...list,
            ]
            return []
        })
    }

    async function loadClients() {
        let res = await request.post(`${config.host}/websocket/clients`, {
            port,
        })
        if (res.success) {
            setClients(res.data.list)
        }
    }
    
    async function createWebSockerServer() {
        let res = await request.post(`${config.host}/websocket/createServer`, {
            port,
        })
        if (res.success) {
            comData.current.connectTime = 0
            const { connectionId } = res.data
            comData.current.connectionId = connectionId
            console.log('res/connectionId', connectionId)
            initWebSocket(connectionId)
            message.success(t('success'))
        }
    }

    async function closeWebSocketServer() {
        
        let res = await request.post(`${config.host}/websocket/closeServer`, {
            connectionId: comData.current.connectionId,
        })
        if (res.success) {
            comData.current.isUserDisconnect = true
            comData.current.socket && comData.current.socket.close()
            
            setWsStatus('disconnected')
        }
    }

    // 有一个属性Socket.readyState，
    // 0 - 表示连接尚未建立，
    // 1 - 表示连接已建立，可以进行通信，
    // 2 - 表示连接正在进行关闭，
    // 3 - 表示连接已经关闭或者连接不能打开
    function initWebSocket(connectionId) {
        let first = true
        const ws = new WebSocket(url)
        
        ws.onclose = async (e) => {
            console.log('socket/on-close', e)
            console.log('websocket 断开: ' + e.code + ' ' + e.reason + ' ' + e.wasClean)
            setWsStatus('disconnected')
            // console.log('readyState', ws.readyState)
            // listAddItem({
            //     type: 'info',
            //     message: t('Disconnected from') + ` ${url}`,
            // })
            // console.log('autoConnect', autoConnect)
            // if (autoConnect) {
            //     if (comData.current.connectTime < 3) {
            //         comData.current.connectTime++
            //         const second = comData.current.connectTime * 3
            //         const action = t('reconnect_info').replace('{times}', '' + comData.current.connectTime)
            //             .replace('{time}', `${second} s`)
            //         listAddItem({
            //             type: 'info',
            //             message: action,
            //         })
            //         console.log('time', moment().format('mm:ss'))   
            //         console.log(action)
            //         setWsAction(action)
            //         await sleep(second * 1000)
            //         initWebSocket(connectionId)
            //     }
            //     else {
            //         const action = t('reconnect_fail')
            //         listAddItem({
            //             type: 'info',
            //             message: action,
            //         })
            //         setWsAction(action)
            //     }
            // }
            // if (comData.current.isUserDisconnect) {
            //     comData.current.isUserDisconnect = false
            // }
        }
        ws.onopen = () => {
            comData.current.connectTime = 0
            comData.current.socket = ws
            console.log('onopen', )
            setWsStatus('connected')
            setWsAction('')
            console.log('readyState', ws.readyState)

            ws.send(JSON.stringify({
                type: 'websocketServerSubscribe',
                data: {
                    connectionId,
                },
            }))
            loadClients()
            // console.log('sended')
            // listAddItem({
            //     // type: 'info',
            //     type: 'connected',
            //     message: t('connected_to') + ` ${url}`,
            // })
        }
        ws.onerror = (e) => {
            // setWsStatus('error')
            console.log('websocket/onerror', e)
            // console.log('socket errorStr', e.toString())
            console.log('readyState', ws.readyState)
            setWsStatus('disconnected')
            // listAddItem({
            //     type: 'info',
            //     message: 'ERROR - 发生错误',
            // })
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
            if (msg.type == 'clientConnect') {
                const { id, time, clientId } = msg.data
                addMessage({
                    clientId,
                    message: `客户端 ${clientId} 连接`,
                    time,
                    id,
                    type: 'info',
                })
                loadClients()
            }
            if (msg.type == 'clientClose') {
                const { id, time, clientId } = msg.data
                addMessage({
                    clientId,
                    message: `客户端 ${clientId} 断开连接`,
                    time,
                    id,
                    type: 'info',
                })
                loadClients()
            }
            // {"type":"reveiveMessage","data":{"clientId":"64a817df944b533e","content":"123"}}
            if (msg.type == 'reveiveMessage') {
                const { id, time, clientId, message } = msg.data
                // loadClients()
                console.log('原来有', messages.length)
                addMessage({
                    clientId,
                    message,
                    time,
                    id,
                })
            }
            // listAddItem({
            //     type: 'received',
            //     message: text,
            // })
        }
        return ws
    }

    useEffect(() => {
        // const ws = initWebSocket()
        return () => {
            // ws.close()
        }
    }, [])


    // useEffect(() => {
    //     // loadList()
    // }, [page])
    

    useEffect(() => {
        form.setFieldsValue({
            channel: 'msg/dms-test',
            // message: 'dms-msg-content-{time}'
            message: 'ping'
        })
        form2.setFieldsValue({
            channel: 'msg/#',
            // message: 'dms-msg-content'
        })
    }, [])

    async function send() {
        const values = await form.validateFields();
        const msg = values.message.replace('{time}', moment().format('YYYY-MM-DD HH:mm:ss'))

        let res = await request.post(`${config.host}/websocket/sendToClient`, {
            // connectionId: comData.current.connectionId,
            content: msg,
            clinetId: sendTarget,
        })
        if (res.success) {
            message.success(t('success'))
        }
    }

    async function closeAllClient(item) {
        let res = await request.post(`${config.host}/websocket/closeClient`, {
            // connectionId: comData.current.connectionId,
            // id: item.id,
        })
        if (res.success) {
            message.success(t('success'))
        }
    }

    async function closeClinet(item) {
        let res = await request.post(`${config.host}/websocket/closeClient`, {
            // connectionId: comData.current.connectionId,
            id: item.id,
        })
        if (res.success) {
            message.success(t('success'))
        }
    }

    return (
        <div className={styles.wsBox}>
            {/* <div className={styles.welcome}>
                {t('welcome')}
            </div> */}
            <div className={styles.header}>
                <Space>
                    <Space>
                        <div>{WsStatusLabelMap[wsStatus]}</div>
                        <div>{wsAction}</div>
                    </Space>
                    <div className={styles.searchBox}>
                        <Input
                            className={styles.host}
                            size="small"
                            value={host}
                            disabled={wsStatus == 'connected'}
                            onChange={e => {
                                setHost(e.target.value)
                            }}
                        />
                        <InputNumber
                            className={styles.port}
                            value={port}
                            size="small"
                            disabled={wsStatus == 'connected'}
                            onChange={value => {    
                                setPort(value)
                            }}
                        />
                        {wsStatus != 'connected' ?
                            <div>
                                <Button
                                    size="small"
                                    type="primary"
                                    onClick={createWebSockerServer}
                                >
                                    {t('create_websocket_server')}
                                </Button>
                            </div>
                        :
                            <div>
                                <Button
                                    danger
                                    size="small"
                                    onClick={closeWebSocketServer}
                                >
                                    {t('close_websocket_server')}
                                </Button>
                            </div>
                        }
                    </div>
                </Space>
            </div>
            {/* <div className={styles.statusBar}>
                
                <Checkbox
                    checked={autoConnect}
                    onChange={e => {
                        setAutoConnect(e.target.checked)
                    }}
                >
                    {t('auto_connect')}
                </Checkbox>
            </div> */}
            <div className={styles.sections}>
                <div className={classNames(styles.section, styles.sectionLeft)}>
                    <div className={styles.sectionTitle}>
                        {t('client')}
                    </div>
                    <div className={styles.tableTool}>
                        <Space>
                            <Button
                                size="small"
                                onClick={() => {
                                    loadClients()
                                }}
                            >
                                {t('refresh')}
                            </Button>
                            <Button
                                size="small"
                                danger
                                onClick={() => {
                                    closeAllClient()
                                }}
                            >
                                {t('disconnect_all')}
                            </Button>
                        </Space>
                    </div>
                    <Table
                        // loading={loading}
                        dataSource={clients}
                        bordered
                        size="small"
                        pagination={false}
                        // pagination={{
                        //     // total,
                        //     // current: page,
                        //     pageSize,
                        //     showSizeChanger: false,
                        // }}
                        rowKey="id"
                        columns={[
                            {
                                title: t('id'),
                                dataIndex: 'id',
                            },
                            {
                                title: t('connect_time'),
                                dataIndex: 'connectTime',
                                // width: 240,
                                // render(value, item) {
                                //     return (
                                //         <div>
                                //             {item.type == 'sent' &&
                                //                 <ArrowUpOutlined className={styles.typeIcon} />
                                //             }
                                //             {item.type == 'received' &&
                                //                 <ArrowDownOutlined className={styles.typeIcon} />
                                //             }
                                //             {item.type == 'info' &&
                                //                 <InfoCircleOutlined className={styles.typeIcon} />
                                //             }
                                //             {item.type == 'connected' &&
                                //                 <CheckCircleOutlined className={styles.typeIcon} />
                                //             }
                                            
                                //             <span className={styles.message}
                                //                 onClick={() => {
                                //                     copy(value)
                                //                     message.info(t('copied'))
                                //                 }}
                                //             >{value}</span>
                                //         </div>
                                //     )
                                // }
                            },
                            {
                                title: t('actions'),
                                dataIndex: '_op',
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
                                                发送消息
                                            </Button>
                                            <Button
                                                size="small"
                                                danger
                                                onClick={() => {
                                                    closeClinet(item)
                                                }}
                                            >
                                                断开
                                            </Button>
                                        </Space>
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
                
                <div className={classNames(styles.section, styles.sectionRight)}>
                    <div className={styles.sectionTitle}>
                        {t('log')}
                    </div>
                    <div className={styles.tableTool}>
                        <Space>
                            <Button
                                size="small"
                                onClick={() => {
                                    setMessages([])
                                }}
                            >
                                {t('clear')}
                            </Button>
                        </Space>
                    </div>

                    {/* <div className={styles.help}>暂不支持在界面显示，消息请在后端控制台查看</div> */}
                    <div className={styles.table}>

                        <Table
                            loading={loading}
                            dataSource={messages}
                            bordered
                            size="small"
                            // pagination={false}
                            pagination={{
                                // total,
                                // current: page,
                                pageSize,
                                showSizeChanger: false,
                            }}
                            rowKey="id"
                            columns={[
                                // {
                                //     title: t('id'),
                                //     dataIndex: 'id',
                                //     width: 80,
                                // },
                                {
                                    title: t('client_id'),
                                    dataIndex: 'clientId',
                                    width: 80,
                                },
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
                                //     width: 200,
                                //     render(value) {
                                //         return (
                                //             <div>
                                //                 {value}
                                //                 {value == 'sent' &&
                                //                     <ArrowUpOutlined className={styles.typeIcon} />
                                //                 }
                                //                 {value == 'received' &&
                                //                     <ArrowDownOutlined className={styles.typeIcon} />
                                //                 }
                                //                 {value == 'info' &&
                                //                     <InfoCircleOutlined className={styles.typeIcon} />
                                //                 }
                                //             </div>
                                //         )
                                //     }
                                // },
                                {
                                    title: t('message'),
                                    dataIndex: 'message',
                                    // width: 240,
                                    render(value, item) {
                                        return (
                                            <div>
                                                {/* {item.type == 'sent' &&
                                                    <ArrowUpOutlined className={styles.typeIcon} />
                                                }
                                                {item.type == 'received' &&
                                                    <ArrowDownOutlined className={styles.typeIcon} />
                                                } */}
                                                {item.type == 'info' &&
                                                    <InfoCircleOutlined className={styles.typeIcon} />
                                                }
                                                {/* {item.type == 'connected' &&
                                                    <CheckCircleOutlined className={styles.typeIcon} />
                                                } */}
                                                
                                                <span className={styles.message}
                                                    onClick={() => {
                                                        copy(value)
                                                        message.info(t('copied'))
                                                    }}
                                                >{value}</span>
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
                <div className={classNames(styles.section, styles.sectionCenter)}>
                    {/* <div className={styles.title}>发布</div> */}
                    <div className={styles.sendText}>{t('send_message_to')} {sendTarget ? sendTarget : t('all_client')}</div>
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
                            // label="内容"
                            messageVariables={{ label: t('content') }}
                            name="message"
                            rules={[ { required: true, } ]}
                        >
                            <Input.TextArea rows={16} />
                        </Form.Item>
                    </Form>
                    <Button
                        type="primary"
                        onClick={send}
                        disabled={wsStatus != 'connected'}
                    >
                        {t('send')}
                    </Button>
                </div>
            </div>
            
        </div>
    )
}
