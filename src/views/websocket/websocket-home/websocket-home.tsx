import { Button, Descriptions, Form, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
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
        'notConnected': '未连接',
        'error': '异常',
        'connected': '已连接',
    }

    const comData = useRef({
        connectTime: 0,
        socket: null,
    })

    const [url, setUrl] = useState('ws://127.0.0.1:7003/ws')
    const [form] = Form.useForm()
    const [form2] = Form.useForm()
    const [isSub, setIsSub] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const [list, setList] = useState([])
    const pageSize = 10
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(false)
    const [wsStatus, setWsStatus] = useState('notConnected')
    const [wsAction, setWsAction] = useState('')
    
    function connect() {
        comData.current.connectTime = 0
        initWebSocket()
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
            // let msg
            // try {
            //     msg = JSON.parse(text)
            // }
            // catch (err) {
            //     console.log('JSON.parse err', err)
            //     return
            // }
            
            setList(list => {
                console.log('list.length', list.length)
                setList([
                    {
                        id: uid(8),
                        // topic: msg.topic,
                        message: text,
                        time: moment().format('YYYY-MM-DD HH:mm:ss'),
                    },
                    ...list,
                ])
                return []
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
        comData.current.socket.send(values.message.replace('{time}', moment().format('YYYY-MM-DD HH:mm:ss')))

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
                    {wsStatus != 'connected' &&
                        <div>
                            <Button
                                type="primary"
                                onClick={connect}>连接</Button>
                        </div>
                    }
                </div>
            </div>
            <div>
                WebSocket 状态：{WsStatusLabelMap[wsStatus]}{wsAction}
            </div>
            <div className={styles.sections}>
                <div className={styles.section}>
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
                            label="内容"
                            name="message"
                            rules={[ { required: true, } ]}
                        >
                            <Input.TextArea rows={8} />
                        </Form.Item>
                    </Form>
                    <Button
                        type="primary"
                        onClick={() => {
                            send()
                        }}
                    >
                        发送
                    </Button>

                </div>
                <div className={styles.section}>
                    <Space>
                        <Button
                            size="small"
                            onClick={() => {
                                setList([])
                            }}
                        >
                            清除
                        </Button>
                    </Space>

                    {/* <div className={styles.help}>暂不支持在界面显示，消息请在后端控制台查看</div> */}
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
                                title: t('时间'),
                                dataIndex: 'time',
                                width: 80,
                                render(value) {
                                    return moment(value).format('HH:mm:ss')
                                }
                            },
                            // {
                            //     title: t('topic'),
                            //     dataIndex: 'topic',
                            //     width: 200,
                            // },
                            {
                                title: t('message'),
                                dataIndex: 'message',
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
