import { Button, Checkbox, Descriptions, Empty, Form, Input, InputNumber, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './redis-connect.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { Editor } from '../editor/Editor';
import storage from '../../db-manager/storage'
import { request } from '../utils/http'
import { CodeDebuger } from '../code-debug';
import { uid } from 'uid';

export function RedisConnect({ config, onConnnect, }) {
    const { t } = useTranslation()
    const [modalVisible, setModalVisible] = useState(false)
    const [modalItem, setModalItem] = useState(false)
    const [connections, setConnections] = useState([
        // {
        //     id: '1',
        //     name: 'XXX',
        // },
        // {
        //     id: '2',
        //     name: 'XXX2',
        // },
    ])
    const [loading, setLoading] = useState(false)
    const [form] = Form.useForm()
    const [code, setCode] = useState(`{
    "host": "",
    "user": "",
    "password": ""
}`)

    async function init() {
        const connections = storage.get('redis-connections', [])
        if (connections.length) {
            setConnections(connections)
            // const curConneId = storage.get('current_connection_id')
            // let curConn
            // if (curConneId) {
            //     curConn = connections.find(item => item.id === curConneId)
            // }
            // if (curConn) {
            //     loadConnect(curConn)
            // }
            // else {
            //     loadConnect(connections[0])
            // }
        }   
    }

    useEffect(() => {
        init()
    }, [])

    useEffect(() => {
//         console.log('onMouneed', storage.get('redisInfo', `{
//     "host": "",
//     "user": "",
//     "password": ""
// }`))
        const redisInfo = storage.get('redisInfo', {
            "host": "",
            "user": "",
            "password": "",
            port: 6379,
            remember: true,
        })
        // setCode(storage.get('redisInfo', `{
        //     "host": "",
        //     "user": "",
        //     "password": ""
        // }`))
        form.setFieldsValue(redisInfo)
    }, [])

    async function  connect(item) {
        setLoading(true)
        // const values = await form.validateFields()
        const reqData = {
            host: item.host,
            port: item.port,
            user: item.user,
            password: item.password,
            db: 0,
            // remember: values.remember,
        }
        // if (values.remember) {
        //     storage.set('redisInfo', reqData)
        // }
        let ret = await request.post(`${config.host}/redis/connect`, reqData)
        // console.log('ret', ret)
        if (ret.success) {
            // message.success('连接成功')
            onConnnect && onConnnect()
        }
        setLoading(false)
        // else {
        //     message.error('连接失败')
        // }
    }


    return (
        <div className={styles.connectBox}>
            {connections.length == 0 &&
                <Empty
                    description="没有记录"
                />
            }
            <div>
                {connections.map(item => {
                    return (
                        <div>
                            <Space>
                                <div>{item.name || 'Unnamed'}</div>
                                <Button
                                    size="small"
                                    onClick={() => {
                                        connect(item)
                                    }}
                                >连接</Button>
                                <Button
                                    size="small"
                                    onClick={() => {
                                        setModalVisible(true)
                                        setModalItem((item))
                                    }}
                                >编辑</Button>
                                <Button
                                    size="small"
                                    onClick={() => {
                                        Modal.confirm({
                                            // title: 'Confirm',
                                            // icon: <ExclamationCircleOutlined />,
                                            content: `删除「${item.name || 'Unnamed'}」`,
                                            // okText: '确认',
                                            // cancelText: '取消',
                                            async onOk() {
                                                let _connections
                                                const connections = storage.get('redis-connections', [])
                                                if (connections.length) {
                                                    _connections = connections
                                                }
                                                else {
                                                    _connections = []
                                                }
                                                _connections = connections.filter((_item => _item.id != item.id))
                                                storage.set('redis-connections', _connections)
                                                message.success('Success')
                                                init()
                                            }
                                        })
                                    }}
                                >删除</Button>
                            </Space>
                        </div>
                    )
                })}
                <Button
                    onClick={() => {
                        setModalVisible(true)
                        setModalItem(null)
                    }}
                >新增</Button>
            </div>
            {false &&
                <div className={styles.content}>
                    
                    
                </div>
            }
            {/* <TextArea className={styles.textarea} value={code} rows={4} 
                onChange={e => setCode(e.target.value)} /> */}
            {/* <Button type="primary" onClick={help}>帮助</Button> */}
            {modalVisible &&
                <DatabaseModal
                    item={modalItem}
                    config={config}
                    onCancel={() => {
                        setModalVisible(false)
                    }}
                    onSuccess={() => {
                        setModalVisible(false)
                        init()
                    }}
                />
            }
        </div>
    );
}



function DatabaseModal({ config, onCancel, item, onSuccess, onConnnect, }) {
    const { t } = useTranslation()

    const editType = item ? 'update' : 'create'
    const [loading, setLoading] = useState(false)
    const [form] = Form.useForm()
    const [code, setCode] = useState(`{
    "host": "",
    "user": "",
    "password": ""
}`)

//     useEffect(() => {
// //         console.log('onMouneed', storage.get('redisInfo', `{
// //     "host": "",
// //     "user": "",
// //     "password": ""
// // }`))
//         const redisInfo = storage.get('redisInfo', {
//             "host": "",
//             "user": "",
//             "password": "",
//             port: 6379,
//             remember: true,
//         })
//         // setCode(storage.get('redisInfo', `{
//         //     "host": "",
//         //     "user": "",
//         //     "password": ""
//         // }`))
//         form.setFieldsValue(redisInfo)
//     }, [])

    

    useEffect(() => {
        if (item) {
            form.setFieldsValue({
                ...item,
            })
        }
        else {
            form.setFieldsValue({
                name: '',
                host: '',
                port: 6379,
                password: '',
                db: 0,
            })
        }
    }, [item])

    return (
        <Modal
            title={editType == 'create' ? '新增实例' : '编辑实例'}
            visible={true}
            maskClosable={false}
            onCancel={onCancel}
            onOk={async () => {
                const values = await form.validateFields()
                let _connections
                if (editType == 'create') {
                    const connections = storage.get('redis-connections', [])
                    if (connections.length) {
                        _connections = connections
                    }
                    else {
                        _connections = []
                    }
                    _connections.unshift({
                        id: uid(32),
                        name: values.name,
                        host: values.host,
                        port: values.port,
                        // user: values.user,
                        password: values.password,
                        // db: values.db,
                    })
                }
                else {
                    const connections = storage.get('redis-connections', [])
                    if (connections.length) {
                        _connections = connections
                    }
                    else {
                        _connections = []
                    }
                    const idx = _connections.findIndex(_item => _item.id == item.id)
                    _connections[idx] = {
                        ..._connections[idx],
                        name: values.name,
                        host: values.host,
                        port: values.port,
                        // user: values.user,
                        password: values.password,
                        // db: values.db,
                    }
                    
                    
                }
                storage.set('redis-connections', _connections)
                    onSuccess && onSuccess()
                // else {
                //     message.error('Fail')
                // }
            }}
        >
            <Form
                form={form}
                labelCol={{ span: 8 }}
                wrapperCol={{ span: 16 }}
                initialValues={{
                    port: 6379,
                    db: 0,
                }}
                // layout={{
                //     labelCol: { span: 0 },
                //     wrapperCol: { span: 24 },
                // }}
            >
                <Form.Item
                    name="name"
                    label="Name"
                    rules={[ { required: true, }, ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="host"
                    label="Host"
                    rules={[ { required: true, }, ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="port"
                    label="Port"
                    rules={[{ required: true, },]}
                >
                    <InputNumber />
                </Form.Item>
                {/* <Form.Item
                    name="user"
                    label="User"
                    rules={[{ required: true, },]}
                >
                    <Input />
                </Form.Item> */}
                <Form.Item
                    name="password"
                    label="Password"
                    rules={[{ required: true, },]}
                >
                    <Input />
                </Form.Item>
                {/* <Form.Item
                    name="db"
                    label="DB"
                    rules={[{ required: true, },]}
                >
                    <InputNumber />
                </Form.Item> */}
                {/* <Form.Item name="remember" valuePropName="checked" wrapperCol={{ offset: 8, span: 16 }}>
                    <Checkbox>Remember me</Checkbox>
                </Form.Item> */}
                {/* <Form.Item
                    wrapperCol={{ offset: 8, span: 16 }}
                >
                    <Space>
                        <Button
                            loading={loading}
                            type="primary"
                            onClick={connect}>{t('connect')}</Button>
                    </Space>
                </Form.Item> */}
            </Form>
        </Modal>
    );
}
