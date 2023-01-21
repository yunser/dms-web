import { Button, Checkbox, Descriptions, Form, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
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
import { ArrowDownOutlined, ArrowUpOutlined, InfoCircleOutlined, UpOutlined } from '@ant-design/icons';

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}

export function WebSocketHome({ config, data }) {
    const { connectionId } = data
    const { t } = useTranslation()

    const WsStatusLabelMap = {
        'notConnected': t('connect_unknown'),
        'error': t('connect_error'),
        'connected': t('connected'),
    }

    const comData = useRef({
        connectTime: 0,
        socket: null,
    })

    const [url, setUrl] = useState('ws://127.0.0.1:7003/ws')
    const [form] = Form.useForm()
    const [form2] = Form.useForm()
    const [autoConnect, setAutoConnect] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const [list, setList] = useState([])
    const pageSize = 10
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(false)
    const [wsStatus, setWsStatus] = useState('notConnected')
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
    
    function connect() {
        comData.current.connectTime = 0
        initWebSocket()
    }

    function disconnect() {
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
        console.log('initWebSocket')
        console.log('readyState', ws.readyState)
        
        ws.onclose = async (e) => {
            console.log('socket/on-close', e)
            console.log('websocket 断开: ' + e.code + ' ' + e.reason + ' ' + e.wasClean)
            setWsStatus('notConnected')
            console.log('readyState', ws.readyState)
            listAddItem({
                type: 'info',
                message: '连接关闭',
            })
            console.log('autoConnect', autoConnect)
            if (autoConnect) {
                if (comData.current.connectTime < 3) {
                    comData.current.connectTime++
                    const ms = comData.current.connectTime * 2000
                    const action = `正在第 ${comData.current.connectTime} 次重试连接，等待 ${ms} ms`
                    listAddItem({
                        type: 'message',
                        message: action,
                    })
                    console.log('time', moment().format('mm:ss'))   
                    console.log(action)
                    setWsAction(action)
                    await sleep(ms)
                    initWebSocket()
                }
                else {
                    listAddItem({
                        type: 'message',
                        message: '自动重试连接超过 3 次，连接失败',
                    })
                    setWsAction('自动重试连接超过 3 次，连接失败')
                }
            }
            
        }
        ws.onopen = () => {
            comData.current.connectTime = 0
            comData.current.socket = ws
            console.log('onopen', )
            setWsStatus('connected')
            setWsAction('')
            console.log('readyState', ws.readyState)

            // const _xterm = xtermRef.current
            // ws.send(JSON.stringify({
            //     type: 'mqttSubscribe',
            //     data: {
            //         // connectionId,
            //     },
            // }))
            console.log('sended')
            listAddItem({
                type: 'info',
                message: '连接成功',
            })
        }
        ws.onerror = (e) => {
            // setWsStatus('error')
            console.log('websocket/onerror', e)
            // console.log('socket errorStr', e.toString())
            console.log('readyState', ws.readyState)
            setWsStatus('notConnected')
            listAddItem({
                type: 'info',
                message: 'ERROR - 发生错误',
            })
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
            // const _xterm = xtermRef.current
            // if (msg.type == 'res') {
            //     if (first) {
            //         first = false
            //         setConnected(true)
            //     }
            //     _xterm.write(msg.data)
            // }

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

    console.log('render/list', list)

    return (
        <div className={styles.mqttBox}>
            {/* <div className={styles.welcome}>
                {t('welcome')}
            </div> */}
            <div>
                <div className={styles.searchBox}>
                    <Input
                        className={styles.input}
                        value={url}
                        onChange={e => {
                            setUrl(e.target.value)
                        }}
                    />
                    {wsStatus != 'connected' ?
                        <div>
                            <Button
                                type="primary"
                                onClick={connect}>{t('connect')}</Button>
                        </div>
                    :
                        <div>
                            <Button
                                type="primary"
                                onClick={disconnect}>{t('disconnect')}</Button>
                        </div>
                    }
                </div>
            </div>
            <div className={styles.statusBar}>
                <div>
                    {/* WebSocket 状态： */}
                    {WsStatusLabelMap[wsStatus]}{wsAction}</div>
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
                            messageVariables={{ label: '内容' }}
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
                                                {value}
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
