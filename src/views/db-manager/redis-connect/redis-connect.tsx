import { Button, Checkbox, Col, Descriptions, Empty, Form, Input, InputNumber, message, Modal, Popover, Row, Space, Table, Tabs } from 'antd';
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

export function RedisConnect({ config, event$, onConnnect, }) {
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
    // const [form] = Form.useForm()
//     const [code, setCode] = useState(`{
//     "host": "",
//     "user": "",
//     "password": ""
// }`)

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

    async function  connect(item) {
        setLoading(true)
        // const values = await form.validateFields()
        const reqData = {
            host: item.host,
            port: item.port,
            user: item.user,
            password: item.password,
            db: item.defaultDatabase || 0,
            // remember: values.remember,
        }
        // if (values.remember) {
        //     storage.set('redisInfo', reqData)
        // }
        let ret = await request.post(`${config.host}/redis/connect`, reqData)
        // console.log('ret', ret)
        if (ret.success) {
            // message.success('连接成功')
            onConnnect && onConnnect({
                connectionId: ret.data.connectionId,
                name: item.name,
                defaultDatabase: item.defaultDatabase || 0,
            })
        }
        setLoading(false)
        // else {
        //     message.error('连接失败')
        // }
    }


    return (
        <div className={styles.connectBox}>
            <div style={{
                marginBottom: 8,
            }}>
                <Space>
                    <Button
                        size="small"
                        onClick={() => {
                            setModalVisible(true)
                            setModalItem(null)
                        }}
                    >{t('add')}</Button>
                    <Button
                        size="small"
                        onClick={() => {
                            event$.emit({
                                type: 'event_show_json',
                                data: {
                                    json: JSON.stringify(connections, null, 4)
                                    // connectionId,
                                },
                            })
                        }}
                    >
                        {t('export_json')}
                    </Button>
                </Space>
            </div>
            {connections.length == 0 &&
                <Empty
                    description="没有记录"
                />
            }
            <div className={styles.connections}>
                {connections.map(item => {
                    return (
                        <div
                            key={item.id}
                            className={styles.item}
                        >
                            <div>{item.name || 'Unnamed'}</div>
                            <Space>
                                <Button
                                    size="small"
                                    onClick={() => {
                                        connect(item)
                                    }}
                                >
                                    {t('connect')}
                                </Button>
                                <Button
                                    size="small"
                                    onClick={() => {
                                        setModalVisible(true)
                                        setModalItem((item))
                                    }}
                                >
                                    {t('edit')}
                                </Button>
                                <Button
                                    danger  
                                    size="small"
                                    onClick={() => {
                                        Modal.confirm({
                                            content: `${t('delete')}「${item.name || 'Unnamed'}」?`,
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
                                                message.success(t('success'))
                                                init()
                                            }
                                        })
                                    }}
                                >
                                    {t('delete')}
                                </Button>
                            </Space>
                        </div>
                    )
                })}
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
//     const [code, setCode] = useState(`{
//     "host": "",
//     "user": "",
//     "password": ""
// }`)

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
                defaultDatabase: item.defaultDatabase || 0,
            })
        }
        else {
            form.setFieldsValue({
                name: '',
                host: '',
                port: 6379,
                password: '',
                defaultDatabase: 0,
            })
        }
    }, [item])

    async function handleOk() {
        const values = await form.validateFields()
        // setLoading(true)
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
                defaultDatabase: values.defaultDatabase,
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
                defaultDatabase: values.defaultDatabase,
                // db: values.db,
            }
            
            
        }
        // setLoading(false)
        storage.set('redis-connections', _connections)
            onSuccess && onSuccess()
        // else {
        //     message.error('Fail')
        // }
    }

    async function handleTestConnection() {
        const values = await form.validateFields()
        setLoading(true)
        const reqData = {
            name: values.name,
            host: values.host,
            port: values.port,
            // user: values.user,
            password: values.password,
            db: values.defaultDatabase || 0,
            test: true,
            // remember: values.remember,
        }
        let ret = await request.post(`${config.host}/redis/connect`, reqData)
        // console.log('ret', ret)
        if (ret.success) {
            message.success(t('success'))
        }
        setLoading(false)
    }

    return (
        <Modal
            title={editType == 'create' ? t('connection_create') : t('connection_update')}
            visible={true}
            maskClosable={false}
            onCancel={onCancel}
            // onOk={async () => {
                
            // }}
            footer={(
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <Button key="back"
                        loading={loading}
                        disabled={loading}
                        onClick={handleTestConnection}
                    >
                        Test Connection
                    </Button>
                    <Space>
                        <Button
                            // key="submit"
                            // type="primary"
                            disabled={loading}
                            onClick={onCancel}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            disabled={loading}
                            onClick={handleOk}
                        >
                            OK
                        </Button>
                    </Space>
                </div>
            )}
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
                <Form.Item
                    name="defaultDatabase"
                    label="Default DB"
                    rules={[{ required: true, },]}
                >
                    <InputNumber />
                </Form.Item>
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
