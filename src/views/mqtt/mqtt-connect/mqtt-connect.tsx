import { Button, Checkbox, Col, Descriptions, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Popover, Row, Space, Spin, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './mqtt-connect.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';

import storage from '../../db-manager/storage'


import { uid } from 'uid';
import { EllipsisOutlined, ExportOutlined, EyeInvisibleOutlined, EyeOutlined, EyeTwoTone, PlusOutlined, ReloadOutlined, TableOutlined, UnorderedListOutlined } from '@ant-design/icons';


import { request } from '@/views/db-manager/utils/http';
import { IconButton } from '@/views/db-manager/icon-button';
import { FullCenterBox } from '@/views/common/full-center-box';


function InputPassword(props) {
    const [visible, setVisible] = useState(false)
    return (
        <Input
            {...props}
            type={visible ? 'text' : 'password'}
            addonAfter={
                <div>
                    <IconButton
                        size="small"
                        onClick={() => {
                            setVisible(!visible)
                        }}
                    >
                        {visible ? <EyeOutlined /> : <EyeInvisibleOutlined /> }
                    </IconButton>
                </div>
            }
        />
    )
}

export function MqttConnect({ config, event$, onConnect, }) {
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
    const [view, setView] = useState('list')
    const [loading, setLoading] = useState(false)
    // const [form] = Form.useForm()
//     const [code, setCode] = useState(`{
//     "host": "",
//     "user": "",
//     "password": ""
// }`)

    async function loadList() {
        // const connections = storage.get('redis-connections', [])
        setLoading(true)
        let res = await request.post(`${config.host}/mqtt/connection/list`, {
            // projectPath,
            // connectionId,
            // sql: lineCode,
            // tableName,
            // dbName,
            // logger: true,
        }, {
            // noMessage: true,
        })
        // console.log('res', res)
        if (res.success) {
            // setProjects([])
            let connections = res.data.list
            if (connections.length) {
                setConnections(connections.sort((a, b) => {
                    return a.name.localeCompare(b.name)
                }))
            }
        }
        setLoading(false)
    }

    useEffect(() => {
        loadList()
    }, [])

    async function connect(item) {
        // setLoading(true)
        // const values = await form.validateFields()
        const reqData = {
            host: item.host,
            port: item.port,
            user: item.user,
            password: item.password,
            userName: item.userName,
            // remember: values.remember,
        }
        // if (values.remember) {
        //     storage.set('redisInfo', reqData)
        // }
        let ret = await request.post(`${config.host}/mqtt/connect`, reqData)
        // console.log('ret', ret)
        if (ret.success) {
            // message.success('连接成功')
            onConnect && onConnect({
                connectionId: ret.data.connectionId,
                name: item.name,
            })
        }
        // setLoading(false)
        // else {
        //     message.error('连接失败')
        // }
    }

    function deleteItem(item) {
        Modal.confirm({
            content: `${t('delete_confirm')} ${item.name}?`,
            async onOk() {
                // console.log('删除', )
                // let newConnects = connections.filter(item => item.id != data.id)
                // setConnections(newConnects)
                // storage.set('connections', newConnects)
                // loadList()
                let res = await request.post(`${config.host}/mqtt/connection/delete`, {
                    id: item.id,
                })
                console.log('get/res', res.data)
                if (res.success) {
                    message.success(t('success'))
                    // onSuccess && onSuccess()
                    loadList()
                    // loadKeys()
                    // setResult(null)
                    // setResult({
                    //     key: item,
                    //     ...res.data,
                    // })
                    // setInputValue(res.data.value)
                }
            }
        })
    }

    function more(item) {
        return (
            <Dropdown
                trigger={['click']}
                overlay={
                    <Menu
                        items={[
                            {
                                label: t('edit'),
                                key: 'edit',
                            },
                            {
                                label: t('delete'),
                                key: 'delete',
                                danger: true,
                            },
                        ]}
                        onClick={({ key, domEvent }) => {
                            // domEvent.preventDefault()
                            domEvent.stopPropagation()
                            if (key == 'delete') {
                                deleteItem(item)
                                // Modal.confirm({
                                //     content: `${t('delete')}「${item.name || 'Unnamed'}」?`,
                                //     async onOk() {
                                //         await deleteItem(item)
                                //     }
                                // })
                                // let _connections
                                // const connections = storage.get('redis-connections', [])
                                // if (connections.length) {
                                //     _connections = connections
                                // }
                                // else {
                                //     _connections = []
                                // }
                                // _connections = connections.filter((_item => _item.id != item.id))
                                // storage.set('redis-connections', _connections)
                                // message.success(t('success'))
                                // loadList()
                            }
                            else if (key == 'edit') {
                                setModalItem((item))
                                setModalVisible(true)
                            }
                        }}
                    />
                }
            >
                <IconButton>
                    <EllipsisOutlined />
                </IconButton>
            </Dropdown>
        )
    }

    const columns = [
        {
            title: t('name'),
            dataIndex: 'name',
            render(value) {
                return <div>{value || 'Unnamed'}</div>
            },
        },
        {
            title: t('host'),
            dataIndex: 'host',
        },
        {
            title: t('port'),
            dataIndex: 'port',
        },
        {
            title: t('user_name'),
            dataIndex: 'userName',
        },
        {
            title: t('actions'),
            dataIndex: 'actions',
            render(_value, item) {
                return (
                    <div>
                        <Space>
                            <Button
                                size="small"
                                onClick={() => {
                                    connect(item)
                                }}
                            >
                                {t('connect')}
                            </Button>
                            {more(item)}
                            {/* <Button
                                size="small"
                                onClick={() => {
                                    
                                }}
                            >
                                {t('edit')}
                            </Button> */}
                            
                        </Space>
                    </div>
                )
            }
        },
    ]

    return (
        <div className={styles.connectBox}>
            <div className={styles.container}>
                <div style={{
                    marginBottom: 8,
                }}>
                    <Space>
                        <IconButton
                            tooltip={t('refresh')}
                            onClick={loadList}
                        >
                            <ReloadOutlined />
                        </IconButton>
                        {/* <Button
                            size="small"
                            onClick={() => {
                                
                            }}
                        >{t('add')}</Button> */}
                        <IconButton
                            tooltip={t('add')}
                            // size="small"
                            className={styles.refresh}
                            onClick={() => {
                                setModalItem(null)
                                setModalVisible(true)
                            }}
                        >
                            <PlusOutlined />
                        </IconButton>
                        {view == 'list' &&
                            <IconButton
                                tooltip={t('table')}
                                onClick={() => {
                                    setView('table')
                                }}
                            >
                                <TableOutlined />
                            </IconButton>
                        }
                        {view == 'table' &&
                            <IconButton
                                tooltip={t('list')}
                                onClick={() => {
                                    setView('list')
                                }}
                            >
                                <UnorderedListOutlined />
                            </IconButton>
                        }
                        <IconButton
                            tooltip={t('export_json')}
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
                            <ExportOutlined />
                        </IconButton>
                    </Space>
                </div>
                {loading ?
                    <FullCenterBox
                        height={320}
                    >
                        <Spin />
                    </FullCenterBox>
                : connections.length == 0 ?
                    <Empty
                        description="没有记录"
                    />
                : view == 'list' ?
                    <div className={styles.list}>
                        {connections.map((item, index) => {
                            return (
                                <div
                                    key={item.id}
                                    className={classNames(styles.item, {
                                        // [styles.active]: index == activeIndex
                                    })}
                                    onClick={(e) => {
                                        connect(item)
                                    }}
                                    // onDoubleClick={() => {
                                    //     onProject && onProject(item)
                                    // }}
                                >
                                    <Space>
                                        <div className={styles.name}>{item.name}</div>
                                        <div className={styles.info}>{item.host}:{item.port}</div>
                                    </Space>
                                    <Space
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                        }}
                                    >
                                        {more(item)}
                                    </Space>
                                </div>
                            )
                        })}
                    </div>
                :
                    <Table
                        dataSource={connections}
                        pagination={false}
                        columns={columns}
                        bordered
                        size="small"
                        rowKey="id"
                    />
                }
            </div>
            
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
                        loadList()
                    }}
                />
            }
        </div>
    );
}



function DatabaseModal({ config, onCancel, item, onSuccess, onConnect, }) {
    const { t } = useTranslation()

    const editType = item ? 'update' : 'create'
    const [testLoading, setTestLoading] = useState(false)
    const [loading, setLoading] = useState(false)
    const [form] = Form.useForm()
//     const [code, setCode] = useState(`{
//     "host": "",
//     "user": "",
//     "password": ""
// }`)

    

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
                port: null,
                password: '',
                userName: '',
            })
        }
    }, [item])

    async function handleOk() {
        const values = await form.validateFields()
        setLoading(true)
        let _connections
        const saveOrUpdateData = {
            name: values.name || t('unnamed'),
            host: values.host || 'localhost',
            port: values.port || 1883,
            // user: values.user,
            password: values.password || '',
            userName: values.userName,
        }
        if (editType == 'create') {
            // const connections = storage.get('redis-connections', [])
            // if (connections.length) {
            //     _connections = connections
            // }
            // else {
            //     _connections = []
            // }
            // _connections.unshift({
            //     id: uid(32),
                
            //     // db: values.db,
            // })
            let res = await request.post(`${config.host}/mqtt/connection/create`, {
                // id: item.id,
                // data: {
                // }
                ...saveOrUpdateData,
            })
            if (res.success) {
                onSuccess && onSuccess()
            }
        }
        else {
            // const connections = storage.get('redis-connections', [])
            // if (connections.length) {
            //     _connections = connections
            // }
            // else {
            //     _connections = []
            // }
            // const idx = _connections.findIndex(_item => _item.id == item.id)
            // _connections[idx] = {
            //     ..._connections[idx],
            //     ...saveOrUpdateData,
            // }
            let res = await request.post(`${config.host}/mqtt/connection/update`, {
                id: item.id,
                data: {
                    ...saveOrUpdateData,
                    // name: values.name || t('unnamed'),
                    // host: values.host || 'localhost',
                    // port: values.port || 22,
                    // password: values.password,
                    // username: values.username,
                }
            })
            if (res.success) {
                onSuccess && onSuccess()
            }
            
            
        }
        setLoading(false)
        // storage.set('redis-connections', _connections)
        // onSuccess && onSuccess()
        // else {
        //     message.error('Fail')
        // }
    }

    async function handleTestConnection() {
        const values = await form.validateFields()
        setTestLoading(true)
        const reqData = {
            host: values.host || 'localhost',
            port: values.port || 1883,
            // user: values.user,
            password: values.password || '',
            userName: values.userName,
            test: true,
            // remember: values.remember,
        }
        let ret = await request.post(`${config.host}/redis/connect`, reqData)
        // console.log('ret', ret)
        if (ret.success) {
            message.success(t('success'))
        }
        setTestLoading(false)
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
                    <div></div>
                    {/* <Button key="back"
                        loading={testLoading}
                        disabled={testLoading || loading}
                        onClick={handleTestConnection}
                    >
                        {t('test_connection')}
                    </Button> */}
                    <Space>
                        <Button
                            // key="submit"
                            // type="primary"
                            disabled={testLoading || loading}
                            onClick={onCancel}
                        >
                            {t('cancel')}
                        </Button>
                        <Button
                            type="primary"
                            loading={loading}
                            disabled={testLoading || loading}
                            onClick={handleOk}
                        >
                            {t('ok')}
                        </Button>
                    </Space>
                </div>
            )}
        >
            <Form
                form={form}
                labelCol={{ span: 8 }}
                wrapperCol={{ span: 16 }}
                // layout={{
                //     labelCol: { span: 0 },
                //     wrapperCol: { span: 24 },
                // }}
            >
                <Form.Item
                    name="name"
                    label={t('name')}
                    // rules={[ { required: true, }, ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="host"
                    label={t('host')}
                    // rules={[ { required: true, }, ]}
                >
                    <Input
                        placeholder="localhost"
                    />
                </Form.Item>
                <Form.Item
                    name="port"
                    label={t('port')}
                    // rules={[{ required: true, },]}
                >
                    <InputNumber
                        placeholder="1883"
                    />
                </Form.Item>
                {/* <Form.Item
                    name="user"
                    label="User"
                    rules={[{ required: true, },]}
                >
                    <Input />
                </Form.Item> */}
                <Form.Item
                    name="userName"
                    label={t('user_name')}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="password"
                    label={t('password')}
                    // rules={[{ required: true, },]}
                >
                    <InputPassword />
                </Form.Item>
                {/* <Form.Item
                    name="ppppp"
                    label={t('ppppppp')}
                    rules={[{ required: true, },]}
                >
                    <Input.Password
                        size="small"
                        autoComplete="new-password"
                    />
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
