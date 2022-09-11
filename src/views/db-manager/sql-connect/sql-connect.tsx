import { Button, Checkbox, Descriptions, Empty, Form, Input, InputNumber, message, Modal, Popover, Space, Table, Tabs, Tree } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './sql-connect.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { Editor } from '../editor/Editor';
import storage from '../storage'
import { request } from '../utils/http'
import { IconButton } from '../icon-button';
import { DatabaseOutlined, ExportOutlined, FolderOutlined, PlusOutlined } from '@ant-design/icons';
import { uid } from 'uid';
import { CodeDebuger } from '../code-debug';


function lastSplit(text: string, sep: string) {
    const idx = text.lastIndexOf(sep)
    if (idx == -1) {
        return [text]
    }
    return [
        text.substring(0, idx),
        text.substring(idx + 1),
    ]
}

function list2Tree(list) {
    const unGroupList = []
    const map = {}
    for (let item of list) {
        // let _name = item.name
        function getNode(name) {
            return {
                title: (
                    <Space>
                        <DatabaseOutlined />
                        {name}
                    </Space>
                ),
                key: `dbkey-${item.id}`,
                icon() {
                    return (
                        <PlusOutlined />
                    )
                },
                data: item,
            }
        }
        
        if (item.path) {
            // const [key, name] = lastSplit(item.name, '/')
            if (!map[item.path]) {
                map[item.path] = []
            }
            const node = getNode(item.name)
            map[item.path].push(node)
        }
        else {
            const node = getNode(item.name)
            unGroupList.push(node)
        }
    }
    const treeData = [
        // {
        //     title: 'UnGroup',
        //     key: 'root',
        //     children: unGroupList,
        // }
    ]
    for (let key of Object.keys(map)) {
        treeData.push({
            title: (
                <Space>
                    <FolderOutlined />
                    {key}
                </Space>
            ),
            key: `group-${key}`,
            children: map[key],
        })
    }
    // treeData.push({
    //     title: (
    //         <Space>
    //             <FolderOutlined />
    //             UnGroup
    //         </Space>
    //     ),
    //     key: `group-default-0`,
    //     children: unGroupList,
    // })
    treeData.push(...unGroupList)
    return treeData
}


export function SqlConnector({ config, onConnnect, onJson }) {
    const { t } = useTranslation()

    const [curConnect, setCurConnect] = useState(null)
    const [connections, setConnections] = useState([
        // {
        //     id: '1',
        //     name: 'first',
        //     host: 'HHH',
        //     port: 3306,
        //     user: 'UUU',
        //     password: 'PPP',
        // },
        // {
        //     id: '2',
        //     name: 'second',
        //     host: 'HHH2',
        //     port: 3306,
        //     user: 'UUU',
        //     password: 'PPP',
        // },
    ])

    function loadConnect(data) {
        form.setFieldsValue({
            ...data,
            path: data.path || '',
        })
        setCurConnect(data)
        setEditType('update')
    }

    async function init() {
        const connections = storage.get('connections', [])
        if (connections.length) {
            setConnections(connections)
            const curConneId = storage.get('current_connection_id')
            let curConn
            if (curConneId) {
                curConn = connections.find(item => item.id === curConneId)
            }
            if (curConn) {
                loadConnect(curConn)
            }
            else {
                loadConnect(connections[0])
            }
        }   
    }

    useEffect(() => {
        init()
    }, [])

    const [loading, setLoading] = useState(false)
    const [form] = Form.useForm()
//     const [code, setCode] = useState(`{
//     "host": "",
//     "user": "",
//     "password": ""
// }`)
    const [editType, setEditType] = useState('create')

//     useEffect(() => {
// //         console.log('onMouneed', storage.get('dbInfo', `{
// //     "host": "",
// //     "user": "",
// //     "password": ""
// // }`))
//         const dbInfo = storage.get('dbInfo', {
//             "host": "",
//             "user": "",
//             "password": "",
//             port: 3306,
//             remember: true,
//         })
//         // setCode(storage.get('dbInfo', `{
//         //     "host": "",
//         //     "user": "",
//         //     "password": ""
//         // }`))
//         form.setFieldsValue(dbInfo)
//     }, [])

    async function  connect() {
        const values = await form.validateFields()
        setLoading(true)
        const reqData = {
            host: values.host,
            port: values.port,
            user: values.user,
            password: values.password,
            // remember: values.remember,
        }
        // if (values.remember) {
        //     storage.set('dbInfo', reqData)
        // }
        let ret = await request.post(`${config.host}/mysql/connect`, reqData)
        // console.log('ret', ret)
        if (ret.success) {
            // message.success('连接成功')
            onConnnect && onConnnect({
                ...ret.data,
                curConnect,
            })
        }
        setLoading(false)
        // else {
        //     message.error('连接失败')
        // }
    }

    function add() {
        const newItem = {
            id: uid(32),
            name: 'Unnamed',
            host: '',
            port: 3306,
            user: '',
            password: '',
        }
        const newConnects = [
            newItem,
            ...connections,
        ]
        setConnections(newConnects)
        storage.set('connections', newConnects)
        loadConnect(newItem)
    }

    function remove() {
        Modal.confirm({
            content: `${t('delete_confirm')} ${curConnect.name}?`,
            // okText: '确认',
            // cancelText: '取消',
            onOk() {
                // console.log('删除', )
                let newConnects = connections.filter(item => item.id != curConnect.id)
                setConnections(newConnects)
                storage.set('connections', newConnects)
                if (newConnects.length) {
                    loadConnect(newConnects[0])
                }
            }
        })
    }

    async function save() {
        // storage.set('dbInfo', code)
        // message.success('保存成功')
        const values = await form.validateFields()
        let newConnects
        if (editType == 'create') {
            newConnects = [
                {
                    id: uid(32),
                    name: values.name || 'Unnamed',
                    host: values.host,
                    port: values.port,
                    user: values.user,
                    password: values.password,
                },
                ...connections,
            ]
        }
        else {
            const idx = connections.findIndex(item => item.id == curConnect.id)
            console.log('idx', idx)
            const newConnect = {
                ...curConnect,
                name: values.name || 'Unnamed',
                host: values.host,
                port: values.port,
                user: values.user,
                password: values.password,
                path: values.path,
            }
            connections[idx] = newConnect
            newConnects = [
                ...connections,
            ]
            setCurConnect(newConnect)
        }
        setConnections(newConnects)
        storage.set('connections', newConnects)
    }

    function help() {
        window.open('https://project.yunser.com/products/167b35305d3311eaa6a6a10dd443ff08', '_blank')
    }

    function ConnectionItem(item) {
        return (
            <div
                className={styles.item}
                key={item.id}
            >
                122
            </div>
        )
    }


    const treeData = list2Tree(connections)
    // const treeData = [
    //     {
    //         title: 'root',
    //         key: 'root',
    //         children: connections.map(item => {
    //             return {
    //                 title: (
    //                     <Space>
    //                         <DatabaseOutlined />
    //                         {item.name}
    //                     </Space>
    //                 ),
    //                 key: `dbkey-${item.id}`,
    //                 icon() {
    //                     return (
    //                         <PlusOutlined />
    //                     )
    //                 },
    //                 data: item,
    //             }
    //         })
    //     }
    // ]
    // const treeData =
    
    // console.log('useId', useId)
    // const ida = useId()
    // console.log('ida', ida)

    return (
        <div className={styles.connectBox}>
            <div className={styles.layoutLeft}>
                {/* {curConnect.id} */}
                <div className={styles.header}>
                    <Space>
                        <IconButton
                            onClick={add}
                            tooltip={t('connection_create')}
                        >
                            <PlusOutlined />
                        </IconButton>
                        <IconButton
                            onClick={() => {
                                onJson && onJson(JSON.stringify(connections, null, 4))
                            }}
                            tooltip={t('connection_export')}
                        >
                            <ExportOutlined />
                        </IconButton>
                    </Space>
                </div>
                <div className={styles.connections}>
                    {/* {connections.map(ConnectionItem)} */}
                    {connections.length ?
                        <Tree
                            treeData={treeData}
                            // checkable
                            defaultExpandAll
                            // defaultExpandedKeys={['root']}
                            expandedKeys={treeData.map(item => item.key)}
                            selectedKeys={curConnect ? [`dbkey-${curConnect.id}`] : []}
                            // defaultCheckedKeys={['0-0-0', '0-0-1']}
                            onSelect={(selectKeys, info) => {
                                console.log('onSelect', info.node)
                                const data = info.node.data
                                if (data) {
                                    const { id } = info.node.data
                                    storage.set('current_connection_id', id)
                                    loadConnect(data)
                                }
                            }}
                            // onCheck={onCheck}
                        />
                    :
                        <div className={styles.emptyBox}>
                            <Empty description="No Connects"></Empty>
                        </div>
                    }
                </div>
            </div>
            <div className={styles.layoutRight}>

                <div className={styles.content}>
                    <Form
                        form={form}
                        labelCol={{ span: 8 }}
                        wrapperCol={{ span: 16 }}
                        initialValues={{
                            port: 3306,
                        }}
                        // layout={{
                        //     labelCol: { span: 0 },
                        //     wrapperCol: { span: 24 },
                        // }}
                    >
                        <Form.Item
                            name="name"
                            label={t('name')}
                            rules={[]}
                        >
                            <Input />
                        </Form.Item>
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
                            rules={[{ required: true, },]}
                        >
                            <InputNumber />
                        </Form.Item>
                        <Form.Item
                            name="user"
                            label={t('user')}
                            rules={[{ required: true, },]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="password"
                            label={t('password')}
                            rules={[{ required: true, },]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="path"
                            label={t('path')}
                            // rules={[{ required: true, },]}
                        >
                            <Input />
                        </Form.Item>
                        {/* <Form.Item name="remember" valuePropName="checked" wrapperCol={{ offset: 8, span: 16 }}>
                            <Checkbox>{t('remember_me')}</Checkbox>
                        </Form.Item> */}
                        <Form.Item
                            wrapperCol={{ offset: 8, span: 16 }}
                            // name="passowrd"
                            // label="Passowrd"
                            // rules={[{ required: true, },]}
                        >
                            <Space>
                                <Button
                                    type="primary"
                                    onClick={connect}
                                >
                                    {t('connect')}
                                </Button>
                                <Button onClick={save}>
                                    {t('save')}
                                </Button>
                                {editType == 'update' &&
                                    <Button
                                        danger
                                        onClick={remove}
                                    >
                                        {t('delete')}
                                    </Button>
                                }
                            </Space>
                        </Form.Item>
                    </Form>
                    <CodeDebuger path="src/views/db-manager/sql-connect/sql-connect.tsx" />
                </div>
            </div>
            {/* <TextArea className={styles.textarea} value={code} rows={4} 
                onChange={e => setCode(e.target.value)} /> */}
            {/* <Button type="primary" onClick={help}>帮助</Button> */}
        </div>
    );
}