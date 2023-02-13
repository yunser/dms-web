import { Button, Descriptions, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Popover, Radio, Space, Spin, Table, Tabs, Tag, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './udp-client.module.less';
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
// import { saveAs } from 'file-saver'


export function UdpClient({ onClickItem }) {
    // const { defaultJson = '' } = data
    const config = getGlobalConfig()
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [list, setList] = useState([])
    const [form] = Form.useForm()
    const [connecting, setConnecting] = useState(false)
    const [connected, setConnected] = useState(false)
    const [content, setContent] = useState('')
    const [wsStatus, setWsStatus] = useState('disconnected')
    const comData = useRef({
        connectTime: 0,
        connectionId: '',
    })

    function initWebSocket() {
        let first = true
        const ws = new WebSocket('ws://localhost:10087/')
        console.log('initWebSocket')
        console.log('readyState', ws.readyState)
        
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
                type: 'tcpSubscribe',
                data: {
                    connectionId: comData.current.connectionId,
                },
            }))
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
            
            setList(list => {
                console.log('list.length', list.length)
                setList([
                    {
                        id: msg.id,
                        content: msg.content,
                        // message: msg.message,
                        time: msg.time,
                    },
                    ...list,
                ])
                return []
            })
        }
        return ws
    }

    async function ping() {
        const values = await form.validateFields()
        // setConnecting(true)
        let res = await request.post(`${config.host}/socket/udp/send`, {
            content: 'ping',
            host: values.host,
            port: values.port,
        })
        if (res.success) {
            message.success(t('success'))
        }
    }

    async function send2() {
        const values = await form.validateFields()
        // setConnecting(true)
        let res = await request.post(`${config.host}/socket/udp/send`, {
            content,
            host: values.host,
            port: values.port,
        })
        if (res.success) {
            // onSuccess && onSuccess()
            message.success(t('success'))
            // comData.current.connectionId = res.data.connectionId
            // setConnected(true)
            // initWebSocket()
        }
        // setConnecting(false)
    }

    async function send() {
        if (!content) {
            message.error('no content')
            return
        }
        let res = await request.post(`${config.host}/socket/send`, {
            content,
        })
        if (res.success) {
            // onSuccess && onSuccess()
            message.success(t('success'))
            setContent('')
            // setConnected(true)
        }
    }

    async function exit() {
        setConnected(false)
        let res = await request.post(`${config.host}/socket/close`, {
            content,
        })
    }

    return (
        <div className={styles.udpClientApp}>
            <div className={styles.layoutLeft}>
                {connected ?
                    <div>
                        <Space direction="vertical">
                            <div>
                                <Button
                                    // loading={connecting}
                                    // type="primary"
                                    onClick={exit}
                                >
                                    {t('关闭连接')}
                                </Button>
                            </div>
                            <div>
                                
                            </div>
    
                            <Button
                                // loading={connecting}
                                type="primary"
                                onClick={send}
                            >
                                {t('send')}
                            </Button>
                            <div>
                                {wsStatus}
                            </div>
                            <Table
                                loading={loading}
                                dataSource={list}
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
                        </Space>
    
                    </div>
                :
                    <div className={styles.form}>
                        <Form
                            form={form}
                            labelCol={{ span: 8 }}
                            wrapperCol={{ span: 16 }}
                            initialValues={{
                                host: '127.0.0.1',
                                port: 2465,
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
                            {/* <Form.Item
                                wrapperCol={{ offset: 8, span: 16 }}
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
                            </Form.Item> */}
                        </Form>
                        <Input.TextArea
                            value={content}
                            placeholder="发送内容"
                            onChange={e => {
                                setContent(e.target.value)
                            }}
                        />
                        <VSplit size={16} />
                        <div>
                            <Space>
                                <Button
                                    loading={connecting}
                                    type="primary"
                                    onClick={send2}
                                >
                                    {t('send')}
                                </Button>
                                <Button
                                    onClick={() => {
                                        ping()
                                    }}
                                >
                                    {t('ping')}
                                </Button>
                            </Space>
                        </div>
                    </div>
                }
            </div>
        </div>
    )
}
