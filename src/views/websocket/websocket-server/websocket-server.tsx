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
        'notConnected': t('disconnected'),
        'error': t('connect_error'),
        'connected': t('connected'),
    }

    const comData = useRef({
        connectTime: 0,
        socket: null,
        isUserDisconnect: false,
        connectionId: '',
    })

    const [url, setUrl] = useState('ws://127.0.0.1:10087/')
    const [port, setPort] = useState(9001)
    const [form] = Form.useForm()
    const [form2] = Form.useForm()
    const [autoConnect, setAutoConnect] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)

    const [clients, setClients] = useState([])

    const [list, setList] = useState([])
    const pageSize = 10
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(false)
    const [wsStatus, setWsStatus] = useState('disconnected')
    const [wsAction, setWsAction] = useState('')

    function listAddItem(item) {
        setList(list => {
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
            const { connectionId } = res.data.connectionId
            comData.current.connectionId = connectionId
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
        console.log('initWebSocket')
        console.log('readyState', ws.readyState)
        
        ws.onclose = async (e) => {
            // console.log('socket/on-close', e)
            // console.log('websocket 断开: ' + e.code + ' ' + e.reason + ' ' + e.wasClean)
            // setWsStatus('disconnected')
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
            // let msg
            // try {
            //     msg = JSON.parse(text)
            // }
            // catch (err) {
            //     console.log('JSON.parse err', err)
            //     return
            // }
            listAddItem({
                type: 'received',
                message: text,
            })
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
        })
        if (res.success) {
            message.success(t('success'))
        }
    }

    console.log('render/list', list)

    return (
        <div className={styles.mqttBox}>
            {/* <div className={styles.welcome}>
                {t('welcome')}
            </div> */}
            <div>
                <div className={styles.searchBox}>
                    <InputNumber
                        className={styles.input}
                        value={port}
                        onChange={value => {
                            setPort(value)
                        }}
                    />
                    {wsStatus != 'connected' ?
                        <div>
                            <Button
                                type="primary"
                                onClick={createWebSockerServer}
                            >
                                {/* {t('connect')} */}
                                创建 WebSocket 服务
                            </Button>
                        </div>
                    :
                        <div>
                            <Button
                                danger
                                onClick={closeWebSocketServer}
                            >
                                {/* {t('disconnect')} */}
                                关闭 WebSocket 服务
                            </Button>
                        </div>
                    }
                </div>
            </div>
            <div className={styles.statusBar}>
                <Space>
                    <div>{WsStatusLabelMap[wsStatus]}</div>
                    <div>{wsAction}</div>
                </Space>
                {/* <Checkbox
                    checked={autoConnect}
                    onChange={e => {
                        setAutoConnect(e.target.checked)
                    }}
                >
                    {t('auto_connect')}
                </Checkbox> */}
                {/* <Space>
                </Space> */}
            </div>
            <div className={styles.sections}>
                <div className={classNames(styles.section, styles.sectionLeft)}>
                    <div>客户端</div>
                    <div>
                        <Button
                            onClick={() => {
                                loadClients()
                            }}
                        >刷新</Button>
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
                                // width: 80,
                                // render(value) {
                                //     return moment(value).format('HH:mm:ss')
                                // }
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
                <div className={classNames(styles.section, styles.sectionCenter)}>
                    {/* <div className={styles.title}>发布</div> */}
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
                <div className={classNames(styles.section, styles.sectionRight)}>
                    <div className={styles.toolBox}>
                        <Space>
                            <Button
                                size="small"
                                onClick={() => {
                                    setList([])
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
                            dataSource={list}
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
                                                {item.type == 'sent' &&
                                                    <ArrowUpOutlined className={styles.typeIcon} />
                                                }
                                                {item.type == 'received' &&
                                                    <ArrowDownOutlined className={styles.typeIcon} />
                                                }
                                                {item.type == 'info' &&
                                                    <InfoCircleOutlined className={styles.typeIcon} />
                                                }
                                                {item.type == 'connected' &&
                                                    <CheckCircleOutlined className={styles.typeIcon} />
                                                }
                                                
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
            </div>
            
        </div>
    )
}
