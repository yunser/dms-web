import { Button, Checkbox, Descriptions, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Popover, Space, Spin, Table, Tabs, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './sql-connect.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { Editor } from '../editor/Editor';
import storage from '../storage'
import { request } from '../utils/http'
import { IconButton } from '../icon-button';
import { DatabaseOutlined, ExportOutlined, FolderOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { uid } from 'uid';
import { CodeDebuger } from '../code-debug';
import { ColorSelector } from '../color-selector';
import copy from 'copy-to-clipboard';
import { FullCenterBox } from '../redis-client';



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
    const colorMap = {
        red: '#f5222d',
        blue: '#1890ff',
        green: '#52c41a',
        orange: '#fa8c16',
    }
    for (let item of list) {
        // let _name = item.name
        function getNode(name, props) {
            return {
                title: (
                    <Space>
                        <DatabaseOutlined
                            style={{
                                color: colorMap[item.color],
                            }}
                        />
                        <div className={styles.treeTitle}>{name}</div>
                    </Space>
                ),
                key: `dbkey-${item.id}`,
                icon() {
                    return (
                        <PlusOutlined />
                    )
                },
                data: item,
                ...props,
            }
        }
        
        if (item.path) {
            // const [key, name] = lastSplit(item.name, '/')
            if (!map[item.path]) {
                map[item.path] = []
            }
            const node = getNode(item.name, {
                type: 'connection',
            })
            map[item.path].push(node)
        }
        else {
            const node = getNode(item.name, {
                type: 'connection',
            })
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

    function sorter(a, b) {
        // console.log('ab', a, b)
        return a.data.name.localeCompare(b.data.name)
        // return a.title.localeCompare(b.title)
    }

    for (let key of Object.keys(map)) {
        treeData.push({
            title: (
                <Space>
                    <FolderOutlined />
                    {key}
                </Space>
            ),
            data: {
                name: key,
            },
            key: `group-${key}`,
            children: map[key].sort(sorter),
            type: 'folder',
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
    return treeData.sort(sorter)
}

function ConnectModal({ config, editType, item, onCancel, onSuccess }) {

    const { t } = useTranslation()

    const [loading, setLoading] = useState(false)
    const [testLoading, setTestLoading] = useState(false)

    const [form] = Form.useForm()
    // const editType = item ? 'update' : 'create'
    useEffect(() => {
        if (item) {
            form.setFieldsValue({
                ...item,
                path: item.path || '',
            })
        }
    }, [item])

    async function save() {
        // storage.set('dbInfo', code)
        // message.success('保存成功')
        const values = await form.validateFields()
        setLoading(true)
        const connections = storage.get('connections', [])
        let newConnects
        const saveOrUpdateData = {
            name: values.name || 'Unnamed',
            host: values.host,
            port: values.port,
            user: values.user,
            password: values.password,
            path: values.path,
            color: values.color,
        }
        if (editType == 'create') {
            // newConnects = [
            //     {
            //         id: uid(32),
            //         ...saveOrUpdateData,
            //     },
            //     ...connections,
            // ]
            let res = await request.post(`${config.host}/mysql/connection/create`, {
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
            // const idx = connections.findIndex(_item => _item.id == item.id)
            // console.log('idx', idx)
            // const newConnect = {
            //     ...item,
            //     ...saveOrUpdateData,
            // }
            // connections[idx] = newConnect
            // newConnects = [
            //     ...connections,
            // ]
            let res = await request.post(`${config.host}/mysql/connection/update`, {
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
        // setConnections(newConnects)
        // storage.set('connections', newConnects)
        // onSuccess && onSuccess()
    }

    async function handleTestConnection() {
        const values = await form.validateFields()
        setTestLoading(true)
        const reqData = {
            host: values.host || 'localhost',
            port: values.port || 6379,
            // user: values.user,
            password: values.password,
            user: values.user,
            // db: values.defaultDatabase || 0,
            test: true,
            // remember: values.remember,
        }
        let ret = await request.post(`${config.host}/mysql/connect`, reqData)
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
            onCancel={onCancel}
            maskClosable={false}
            // onOk={save}
            footer={(
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <Button key="back"
                        loading={testLoading}
                        disabled={loading || testLoading}
                        onClick={handleTestConnection}
                    >
                        {t('test_connection')}
                    </Button>
                    <Space>
                        <Button
                            // key="submit"
                            // type="primary"
                            disabled={loading || testLoading}
                            onClick={onCancel}
                        >
                            {t('cancel')}
                        </Button>
                        <Button
                            type="primary"
                            loading={loading}
                            disabled={loading || testLoading}
                            onClick={save}
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
                    label={t('folder')}
                    // rules={[{ required: true, },]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="color"
                    label={t('color')}
                    // rules={[{ required: true, },]}
                >
                    <ColorSelector />
                </Form.Item>
                {/* <Form.Item name="remember" valuePropName="checked" wrapperCol={{ offset: 8, span: 16 }}>
                    <Checkbox>{t('remember_me')}</Checkbox>
                </Form.Item> */}
            </Form>
        </Modal>
    )
}

export function SqlConnector({ config, onConnnect, onJson }) {
    const { t } = useTranslation()

    // TODO clear
    const [keyword, setKeyword] = useState('')
    const [treeData, setTreeData] = useState([])
    const [expandedKeys, setExpandedKeys] = useState<any[]>([])
    const [modalVisible, setModalVisible] = useState(false)
    const [modalProps, setModalProps] = useState({})
    const timerRef = useRef<number | null>(null)
    const [connecting, setConnecting] = useState(false)
    const [loading, setLoading] = useState(false)
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

    // const treeData = useMemo(() => {

    // }, [connections, keyword])


    async function loadList() {
        // 旧的
        // let connections = storage.get('connections', [])
        setLoading(true)
        let res = await request.post(`${config.host}/mysql/connection/list`, {
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
            if (keyword) {
                connections = connections.filter(item => item.name.toLowerCase().includes(keyword.toLowerCase()))
            }
            // const connections = storage.get('connections', [])
            setConnections(connections)
            if (connections.length) {
                const treeData = list2Tree(connections)
                setTreeData(treeData)
                setExpandedKeys(treeData.map(item => item.key))
            } 
            
        }
        setLoading(false)
    }

    useEffect(() => {
        loadList()
    }, [keyword])

    
    
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

    async function _connect(reqData) {
        setConnecting(true)
        let ret = await request.post(`${config.host}/mysql/connect`, reqData)
        // console.log('ret', ret)
        if (ret.success) {
            // message.success('连接成功')
            onConnnect && onConnnect({
                ...ret.data,
                curConnect: reqData,
            })
        }
        setConnecting(false)
    }

    async function connect(data) {
        const reqData = {
            host: data.host,
            port: data.port,
            user: data.user,
            password: data.password,
            // remember: values.remember,
        }
        await _connect(reqData)
        // if (values.remember) {
            //     storage.set('dbInfo', reqData)
            // }
        
        // else {
        //     message.error('连接失败')
        // }
    }

    function add() {
        setModalVisible(true)
        setModalProps({
            item: null,
            editType: 'create',
        })
        // const newItem = {
        //     id: uid(32),
        //     name: t('unnamed'),
        //     host: '',
        //     port: 3306,
        //     user: '',
        //     password: '',
        // }
        // const newConnects = [
        //     newItem,
        //     ...connections,
        // ]
        // setConnections(newConnects)
        // storage.set('connections', newConnects)
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
                let res = await request.post(`${config.host}/mysql/connection/delete`, {
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

    

    function handleClick(nodeData) {
        // console.log('click', nodeData)
        if (nodeData.type == 'connection') {
            // const data = nodeData.data
            // if (data) {
            //     const { id } = nodeData.data
            //     storage.set('current_connection_id', id)
            // }
        }
        else if (nodeData.type == 'folder') {
            if (expandedKeys.includes(nodeData.key)) {
                setExpandedKeys(expandedKeys.filter(_key => _key != nodeData.key))
            }
            else {
                setExpandedKeys([
                    ...expandedKeys,
                    nodeData.key,
                ])
            }
        }
    }

    function handleDoubleClick(nodeData) {
        console.log('nodeData', nodeData)
        const data = nodeData.data
        if (data) {
            // const { id } = nodeData.data
            // storage.set('current_connection_id', id)
            _connect(nodeData.data)
        }
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


    // const treeData = list2Tree(connections)
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
                <div className={styles.header}>
                    <Space>
                        <IconButton
                            tooltip={t('refresh')}
                            onClick={loadList}
                        >
                            <ReloadOutlined />
                        </IconButton>
                        <IconButton
                            tooltip={t('connection_create')}
                            onClick={add}
                        >
                            <PlusOutlined />
                        </IconButton>
                        <IconButton
                            tooltip={t('connection_export')}
                            onClick={() => {
                                onJson && onJson(JSON.stringify(connections, null, 4))
                            }}
                        >
                            <ExportOutlined />
                        </IconButton>
                    </Space>
                    <div>
                        <Input
                            placeholder={t('search')}
                            value={keyword}
                            allowClear={true}
                            onChange={e => {
                                // const 
                                setKeyword(e.target.value)
                            }}
                        />
                    </div>
                </div>
                <div className={styles.connections}>
                    {/* {connections.map(ConnectionItem)} */}
                    {loading ?
                        <FullCenterBox
                            height={320}
                        >
                            <Spin />
                        </FullCenterBox>
                    : connections.length ?
                        <Tree
                            treeData={treeData}
                            // checkable
                            defaultExpandAll
                            // defaultExpandedKeys={['root']}
                            // expandedKeys={treeData.map(item => item.key)}
                            expandedKeys={expandedKeys}
                            onExpand={(expandedKeys) => {
                                setExpandedKeys(expandedKeys)
                            }}
                            
                            // selectedKeys={curConnect ? [`dbkey-${curConnect.id}`] : []}
                            // defaultCheckedKeys={['0-0-0', '0-0-1']}
                            // onSelect={(selectKeys, info) => {
                            //     console.log('onSelect', info)
                            //     handlerClick(info.node)
                            // }}
                            titleRender={nodeData => {
                                return (
                                    <Dropdown
                                        overlay={(
                                            <Menu
                                                items={[
                                                    {
                                                        label: t('connect'),
                                                        key: 'key_connect',
                                                    },
                                                    {
                                                        label: t('edit'),
                                                        key: 'key_edit',
                                                    },
                                                    {
                                                        label: t('share'),
                                                        key: 'key_share',
                                                    },
                                                    {
                                                        label: t('duplicate'),
                                                        key: 'key_duplicate',
                                                    },
                                                    {
                                                        label: t('delete'),
                                                        key: 'key_delete',
                                                    },
                                                ]}
                                                onClick={async ({ _item, key, keyPath, domEvent }) => {
                                                    if (key == 'key_connect') {
                                                        // console.log('_item', nodeData)
                                                        connect(nodeData.data)
                                                    }
                                                    else if (key == 'key_edit') {
                                                        // console.log('_item', nodeData)
                                                        setModalVisible(true)
                                                        setModalProps({
                                                            editType: 'update',
                                                            item: nodeData.data,
                                                        })
                                                    }
                                                    else if (key == 'key_share') {
                                                        console.log('_item', nodeData.data)
                                                        const { data } = nodeData
                                                        const shareContent = `${t('host')}: ${data.host}
${t('port')}: ${data.port}
${t('user')}: ${data.user}
${t('password')}: ${data.password}`
                                                        copy(shareContent)
                                                        message.info(t('copied'))

                                                    }
                                                    else if (key == 'key_duplicate') {
                                                        console.log('_item', nodeData.data)
                                                        // remove(nodeData.data)
                                                        const { data } = nodeData
                                                        setModalVisible(true)
                                                        setModalProps({
                                                            editType: 'create',
                                                            item: {
                                                                ...data,
                                                                name: data.name + `(${t('clone')})`
                                                            },
                                                        })
                                                    }
                                                    else if (key == 'key_delete') {
                                                        // console.log('_item', nodeData)
                                                        deleteItem(nodeData.data)
                                                    }
                                                }}
                                            >
                                            </Menu>
                                        )}
                                        trigger={['contextMenu']}
                                    >
                                        <div
                                            onDoubleClick={() => {
                                                // console.log('onDoubleClick')
                                                // queryTable(nodeData.key)
                                                if (timerRef.current) {
                                                    clearTimeout(timerRef.current)
                                                }
                                                // console.log('双击')
                                                handleDoubleClick(nodeData)
                                                // onDoubleClick && onDoubleClick()
                                            }}
                                            onClick={() => {
                                                // console.log('onClick')
                                                //先清除一次
                                                if (timerRef.current) {
                                                    clearTimeout(timerRef.current)
                                                }
                                                timerRef.current = window.setTimeout(() => {
                                                    // console.log('单机')
                                                    handleClick(nodeData)
                                                    // onClick && onClick()
                                                }, 200)
                                            }}
                                        >
                                            {nodeData.title}
                                        </div>
                                    </Dropdown>
                                )
                            }}
                            // onCheck={onCheck}
                        />
                    :
                        <div className={styles.emptyBox}>
                            <Empty description={t('connection_empty')}></Empty>
                        </div>
                    }
                </div>
            </div>
            <div className={styles.layoutRight}>
                <CodeDebuger path="src/views/db-manager/sql-connect/sql-connect.tsx" />
            </div>
            {/* <TextArea className={styles.textarea} value={code} rows={4} 
                onChange={e => setCode(e.target.value)} /> */}
            {/* <Button type="primary" onClick={help}>帮助</Button> */}
            {modalVisible &&
                <ConnectModal
                    config={config}
                    {...modalProps}
                    onCancel={() => {
                        setModalVisible(false)
                    }}
                    onSuccess={() => {
                        setModalVisible(false)
                        loadList()
                    }}
                />
            }
            {connecting &&
                <Modal
                    open={true}
                    // centered
                    // title="connecting"
                    title={null}
                    footer={null}
                    onCancel={() => {
                        setConnecting(false)
                    }}
                >
                    {t('connecting')}
                </Modal>
            }
        </div>
    )
}