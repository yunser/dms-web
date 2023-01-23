import { Button, Checkbox, Col, Descriptions, Empty, Form, Input, InputNumber, message, Modal, Popover, Row, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './redis-pubsub.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { Editor } from '@/views/db-manager/editor/Editor';
import { request } from '@/views/db-manager/utils/http';
import { uid } from 'uid';
import Item from 'antd/lib/list/Item';
import moment from 'moment';

export function PubSubModal({ config, event$, connectionId, onCancel, }) {
    const { t } = useTranslation()
    const [form] = Form.useForm()
    const [form2] = Form.useForm()
    const [isSub, setIsSub] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const [list, setList] = useState([])
    const pageSize = 10
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    
    const [loading, setLoading] = useState(false)
    // const [form] = Form.useForm()
//     const [code, setCode] = useState(`{
//     "host": "",
//     "user": "",
//     "password": ""
// }`)



    async function pubsub() {
        let res = await request.post(`${config.host}/redis/pubsub`, {
            connectionId,
        })
        if (res.success) {
            // message.success('发布成功')
        }
    }

    async function subscribe() {
        const values = await form2.validateFields();
        let res = await request.post(`${config.host}/redis/subscribe`, {
            connectionId,
            channel: values.channel || '*',
        })
        if (res.success) {
            message.success('订阅成功')
            setIsSub(true)
        }
    }

    async function unSubscribe() {
        const values = await form2.validateFields();
        let res = await request.post(`${config.host}/redis/unSubscribe`, {
            connectionId,
            channel: values.channel || '*',
        })
        if (res.success) {
            message.success('取消订阅成功')
            setIsSub(false)
        }
    }

    async function publish() {
        const values = await form.validateFields();
        let res = await request.post(`${config.host}/redis/publish`, {
            connectionId,
            channel: values.channel,
            message: values.message,
        })
        if (res.success) {
            message.success('发布成功')
        }
    }

    function initWebSocket() {
        let first = true
        const ws = new WebSocket('ws://localhost:10087/')
        ws.onclose = () => {
            console.log('close socket')
        }
        ws.onopen = () => {
            console.log('onopen', )

            ws.send(JSON.stringify({
                type: 'redisSubscribe',
                data: {
                    connectionId,
                },
            }))
            console.log('sended')
        }
        ws.onerror = () => {
            console.log('socket error')
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
                        channel: msg.channel,
                        message: msg.message,
                        time: msg.time,
                    },
                    ...list,
                ])
                return []
            })
        }
        return ws
    }

    useEffect(() => {
        const ws = initWebSocket()
        return () => {
            ws.close()
        }
    }, [])


    useEffect(() => {
        // loadList()
    }, [page])

    

    return (
        <Modal
            title={t('redis.pubsub')}
            open={true}
            width={1200}
            onCancel={onCancel}
            footer={null}
            maskClosable={false}
        >
            
            <div className={styles.sections}>
                <div className={styles.section}>
                    <div className={styles.title}>{t('redis.publish')}</div>
                    <Form
                        form={form}
                        // {...layout}
                        // name="basic"
                        // initialValues={{ remember: true }}
                        // onFinish={onFinish}
                        // onFinishFailed={onFinishFailed}
                    >
                        <Form.Item
                            label={t('redis.channel')}
                            name="channel"
                            rules={[ { required: true, } ]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            label={t('message')}
                            name="message"
                            rules={[ { required: true, } ]}
                        >
                            <Input.TextArea rows={8} />
                        </Form.Item>
                    </Form>
                    <Button
                        type="primary"
                        onClick={() => {
                            publish()
                        }}
                    >
                        {t('redis.publish')}
                    </Button>

                </div>
                <div className={styles.section}>
                    <div className={styles.title}>{t('redis.subscribe')}</div>
                    {isSub ?
                        <Space>
                            <Button
                                type="primary"
                                onClick={() => {
                                    unSubscribe()
                                }}
                            >
                                取消订阅
                            </Button>
                            <Button
                                size="small"
                                onClick={() => {
                                    setList([])
                                }}
                            >
                                清除
                            </Button>

                        </Space>
                    :
                        <div>
                            <Form
                                form={form2}
                            >
                                <Form.Item
                                    label={t('redis.channel')}
                                    name="channel"
                                    // rules={[ { required: true, } ]}
                                >
                                    <Input placeholder="*" />
                                </Form.Item>
                            </Form>
                            <Button
                                type="primary"
                                onClick={() => {
                                    subscribe()
                                }}
                            >
                                {t('redis.subscribe')}
                            </Button>

                        </div>
                    }

                    {/* <div className={styles.help}>暂不支持在界面显示，消息请在后端控制台查看</div> */}
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
                                title: t('time'),
                                dataIndex: 'time',
                                width: 240,
                                render(value) {
                                    return moment(value).format('HH:mm:ss')
                                }
                            },
                            {
                                title: t('redis.channel'),
                                dataIndex: 'channel',
                                width: 240,
                            },
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
        </Modal>
    )
}
