import { Button, Checkbox, Descriptions, Empty, Form, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './websocket-home.module.less';
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
import { FullCenterBox } from '@/views/common/full-center-box';

export function WebSocketHome({ }) {
    const config = getGlobalConfig()
    const { t } = useTranslation()

    const WsStatusLabelMap = {
        'notConnected': t('disconnected'),
        'error': t('connect_error'),
        'connected': t('connected'),
    }
    const [connections, setConnections] = useState([])
    const [contents, setContents] = useState([
        // {
        //     "id": "1",
        //     "name": "订阅用户绑定",
        //     "content": "{\"type\":\"subscribe\",\"data\":{\"topic\":\"msg/mpBindSuccess/1617361602228058\"}}"
        // },
        // {
        //     "id": "2",
        //     "name": "ping",
        //     "content": "ping"
        // }
    ])


    const comData = useRef({
        connectTime: 0,
        socket: null,
        isUserDisconnect: false,
    })

    const [url, setUrl] = useState('ws://127.0.0.1:9001/')
    const [form] = Form.useForm()
    const [form2] = Form.useForm()
    const [connecting, setConnecting] = useState(false)
    const [autoConnect, setAutoConnect] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const [list, setList] = useState([])
    const pageSize = 10
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(false)
    const [wsStatus, setWsStatus] = useState('notConnected')
    const [wsAction, setWsAction] = useState('')

    async function loadConnections() {
        let res = await request.post(`${config.host}/websocket/connection/list`, {
        })
        if (res.success) {
            setConnections(res.data.list)
        }
    }

    async function loadHistory() {
        let res = await request.post(`${config.host}/websocket/history/list`, {
        })
        if (res.success) {
            setContents(res.data.list)
            // setContents([])
        }
    }

    useEffect(() => {
        loadConnections()
        loadHistory()
    }, [])

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
    
    function connect() {
        comData.current.connectTime = 0
        initWebSocket()
    }

    function disconnect() {
        comData.current.isUserDisconnect = true
        comData.current.socket && comData.current.socket.close()
    }

    // 有一个属性Socket.readyState，
    // 0 - 表示连接尚未建立，
    // 1 - 表示连接已建立，可以进行通信，
    // 2 - 表示连接正在进行关闭，
    // 3 - 表示连接已经关闭或者连接不能打开
    function initWebSocket() {
        let first = true
        const ws = new WebSocket(url)
        setConnecting(true)
        ws.onclose = async (e) => {
            console.log('socket/on-close', e)
            setConnecting(false)
            console.log('websocket 断开: ' + e.code + ' ' + e.reason + ' ' + e.wasClean)
            setWsStatus('notConnected')
            console.log('readyState', ws.readyState)
            listAddItem({
                type: 'info',
                message: t('Disconnected from') + ` ${url}`,
            })
            console.log('autoConnect', autoConnect)
            if (autoConnect) {
                if (comData.current.connectTime < 3) {
                    comData.current.connectTime++
                    const second = comData.current.connectTime * 3
                    const action = t('reconnect_info').replace('{times}', '' + comData.current.connectTime)
                        .replace('{time}', `${second} s`)
                    listAddItem({
                        type: 'info',
                        message: action,
                    })
                    console.log('time', moment().format('mm:ss'))   
                    console.log(action)
                    setWsAction(action)
                    await sleep(second * 1000)
                    initWebSocket()
                }
                else {
                    const action = t('reconnect_fail')
                    listAddItem({
                        type: 'info',
                        message: action,
                    })
                    setWsAction(action)
                }
            }
            if (comData.current.isUserDisconnect) {
                comData.current.isUserDisconnect = false
            }
        }
        ws.onopen = () => {
            comData.current.connectTime = 0
            comData.current.socket = ws
            console.log('onopen', )
            setWsStatus('connected')
            setConnecting(false)
            setWsAction('')
            console.log('readyState', ws.readyState)

            // ws.send(JSON.stringify({
            //     type: 'mqttSubscribe',
            //     data: {
            //         // connectionId,
            //     },
            // }))
            // console.log('sended')
            listAddItem({
                // type: 'info',
                type: 'connected',
                message: t('connected_to') + ` ${url}`,
            })
        }
        ws.onerror = (e) => {
            // setWsStatus('error')
            console.log('websocket/onerror', e)
            // console.log('socket errorStr', e.toString())
            console.log('readyState', ws.readyState)
            setWsStatus('notConnected')
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
        comData.current.socket.send(msg)
        listAddItem({
            type: 'sent',
            message: msg,
        })
        

        // let res = await request.post(`${config.host}/mqtt/publish`, {
        //     connectionId,
        //     topic: values.channel,
        //     message: ,
        // })
        // if (res.success) {
        //     message.success('发布成功')
        // }
    }

    return (
        <div className={styles.mqttBox}>
            <div className={styles.layoutLeft}>
                <div className={styles.layoutLeftTop}>
                    {connections.length == 0 ?
                        <FullCenterBox height={240}>
                            <Empty />
                        </FullCenterBox>
                    :
                        <div className={styles.connections}>
                            {connections.map(item => {
                                return (
                                    <div
                                        className={styles.item}
                                        key={item.id}
                                        onClick={() => {
                                            setUrl(item.url)
                                        }}
                                    >
                                        <div className={styles.name}>{item.name}</div>
                                    </div>
                                )
                            })}
                        </div>
                    }
                </div>
                <div className={styles.layoutLeftBottom}>
                    {contents.length == 0 ?
                        <FullCenterBox height={240}>
                            <Empty />
                        </FullCenterBox>
                    :
                        <div className={styles.contents}>
                            {contents.map(item => {
                                return (
                                    <div
                                        className={styles.item}
                                        key={item.id}
                                        onClick={() => {
                                            form.setFieldsValue({
                                                message: item.content,
                                            })
                                        }}
                                    >
                                        <div className={styles.name}>{item.name}</div>
                                    </div>
                                )
                            })}
                        </div>
                    }
                </div>

            </div>
            <div className={styles.layoutMain}>
                {/* <div className={styles.welcome}>
                    {t('welcome')}
                </div> */}
                <div className={styles.header}>
                    <div className={styles.searchBox}>
                        <Input
                            className={styles.input}
                            placeholder="ws://xxx"
                            value={url}
                            onChange={e => {
                                setUrl(e.target.value)
                            }}
                        />
                        {wsStatus != 'connected' ?
                            <div>
                                <Button
                                    type="primary"
                                    loading={connecting}
                                    onClick={connect}>{t('connect')}</Button>
                            </div>
                        :
                            <div>
                                <Button
                                    danger
                                    // type="primary"
                                    onClick={disconnect}>{t('disconnect')}</Button>
                            </div>
                        }
                    </div>
                </div>
                <div className={styles.statusBar}>
                    <Space>
                        <div>{WsStatusLabelMap[wsStatus]}</div>
                        <div>{wsAction}</div>
                    </Space>
                    <Checkbox
                        checked={autoConnect}
                        onChange={e => {
                            setAutoConnect(e.target.checked)
                        }}
                    >
                        {t('auto_connect')}
                    </Checkbox>
                    {/* <Space>
                    </Space> */}
                </div>
                <div className={styles.sections}>
                    <div className={classNames(styles.section, styles.sectionLeft)}>
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
                            onClick={() => {
                                send()
                            }}
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
                                                <Space>
                                                    {item.type == 'sent' &&
                                                        <div className={classNames(styles.iconBox, styles.sent)}>
                                                            <ArrowUpOutlined className={styles.typeIcon} />
                                                        </div>
                                                    }
                                                    {item.type == 'received' &&
                                                        <div className={classNames(styles.iconBox, styles.received)}>
                                                            <ArrowDownOutlined className={styles.typeIcon} />
                                                        </div>
                                                    }
                                                    {item.type == 'info' &&
                                                        <div className={classNames(styles.iconBox, styles.info)}>
                                                            <InfoCircleOutlined className={styles.typeIcon} />
                                                        </div>
                                                    }
                                                    {item.type == 'connected' &&
                                                        <div className={classNames(styles.iconBox, styles.connected)}>
                                                            <CheckCircleOutlined className={styles.typeIcon} />
                                                        </div>
                                                    }
                                                    
                                                    <span className={styles.message}
                                                        onClick={() => {
                                                            copy(value)
                                                            message.info(t('copied'))
                                                        }}
                                                    >{value}</span>
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
        </div>
    )
}
