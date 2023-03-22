import { Button, Checkbox, Col, Descriptions, Drawer, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Pagination, Popover, Radio, Row, Space, Spin, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './mongo-client.module.less';
import _, { after } from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
// import { Editor } from '@/views/db-manager/editor/Editor';
// import storage from '../../db-manager/storage'
// import { CodeDebuger } from '../code-debug';
import { uid } from 'uid';
import { EllipsisOutlined, ExportOutlined, EyeInvisibleOutlined, EyeOutlined, EyeTwoTone, InfoCircleOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { request } from '@/views/db-manager/utils/http';
import { IconButton } from '@/views/db-manager/icon-button';
import { FullCenterBox } from '@/views/common/full-center-box';
import { MongoDocument } from '../mongo-document';
import { MongoIndex } from '../mongo-index';

function ServerInfoModal({ config, connectionId, onCancel }) {

    const { t } = useTranslation()

    const [loading, setLoading] = useState(false)
    const [serverInfo, setServerInfo] = useState(null)

    async function loadServerInfo() {
        let ret = await request.post(`${config.host}/mongo/serverInfo`, {
            connectionId,
        })
        // console.log('ret', ret)
        if (ret.success) {
            setServerInfo(ret.data)
            // message.success('连接成功')
            // onConnect && onConnect({
            //     connectionId: ret.data.connectionId,
            //     name: item.name,
            // })
        }
    }
    
    useEffect(() => {
        loadServerInfo()
    }, [])

    return (
        <Modal
            title={t('server_info')}
            open={true}
            onCancel={onCancel}
        >
            {!!serverInfo &&
                <div>{t('version')}: {serverInfo.version}</div>
            }
        </Modal>
    )
}

function removeObjId(obj) {
    const result = {}
    for (let key in obj) {
        if (key != '_id') {
            result[key] = obj[key]
        }
    }
    return result
}

export function MongoClient({ config, event$, connectionId, item: detailItem }) {
    const { t } = useTranslation()
    
    // col
    const [collectionModalVisible, setCollectionModalVisible] = useState(false)
    const [collectionModalItem, setCollectionModalItem] = useState(null)
    // db
    const [dbModalVisible, setDbModalVisible] = useState(false)
    const [dbModalItem, setDbModalItem] = useState(null)

    const [infoVisible, setInfoVisible] = useState(false)

    const [databases, setDatabases] = useState([])
    const [collectionLoading, setCollectionLoading] = useState(false)
    const [collections, setCollections] = useState([])
    const [loading, setLoading] = useState(false)
    const [curDb, setCurDb] = useState(null)
    // const [curCollection_will, setCurCollection] = useState(null)

    const [activeTabId, setActiveTabId] = useState('')
    const [tabs, setTabs] = useState([])
    const [tab, setTab] = useState('document')
    // const [tab, setTab] = useState('index')
    
    async function loadDatabases() {
        // const connections = storage.get('redis-connections', [])
        setLoading(true)
        let res = await request.post(`${config.host}/mongo/databases`, {
            connectionId,
        }, {
            // noMessage: true,
        })
        // console.log('res', res)
        if (res.success) {
            // setProjects([])
            let connections = res.data.list
            if (connections.length) {
                setDatabases(connections.sort((a, b) => {
                    return a.name.localeCompare(b.name)
                }))
            }
        }
        setLoading(false)
    }

    useEffect(() => {
        loadDatabases()
    }, [])

    async function selectDb(item) {
        setCurDb(item)
        // setCurCollection(null)
    }
    
    function dropDb(item) {
        Modal.confirm({
            // title: 'Confirm',
            // icon: <ExclamationCircleOutlined />,
            content: `${t('delete')}「${item.name}」?`,
            async onOk() {
                let res = await request.post(`${config.host}/mongo/database/drop`, {
                    connectionId,
                    database: item.name,
                })
                if (res.success) {
                    message.success(t('success'))
                    loadDatabases()
                    if (curDb && item.name == curDb.name) {
                        setCurDb(null)
                        // setCurCollection(null)
                    }
                }
            }
        })
    }

    async function loadCollections() {
        setCollectionLoading(true)
        let res = await request.post(`${config.host}/mongo/collections`, {
            connectionId,
            database: curDb.name,
        })
        if (res.success) {
            let collections = res.data.list
            if (collections.length) {
                setCollections(collections.sort((a, b) => {
                    return a.name.localeCompare(b.name)
                }))
            }
        }
        setCollectionLoading(false)
    }

    useEffect(() => {
        if (curDb) {
            loadCollections()
        }
    }, [curDb])

    const collectionColumns = [
        {
            title: t('mongo.collection.name'),
            dataIndex: 'name',
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
                                    // selectCol(item)
                                    // setCurCollection(item)
                                    // console.log('item', item)
                                    const id = uid(32)
                                    setTabs([
                                        ...tabs,
                                        {
                                            id,
                                            title: item.name,
                                            collection: item
                                        }
                                    ])
                                    setActiveTabId(id)
                                }}
                            >
                                {t('select')}
                            </Button>
                            {/* <Button
                                size="small"
                                danger
                                onClick={() => {
                                    // selectCol(item)
                                    clearCollection(item)
                                }}
                            >
                                {t('clear')}
                            </Button>
                            <Button
                                size="small"
                                danger
                                onClick={() => {
                                    // selectCol(item)
                                    dropCollection(item)
                                }}
                            >
                                {t('drop')}
                            </Button> */}
                            <Dropdown
                                overlay={
                                    <Menu
                                        onClick={({ key }) => {
                                            if (key == 'clear') {
                                                clearCollection(item)
                                            }
                                            else if (key == 'drop') {
                                                dropCollection(item)
                                            }
                                        }}
                                        items={[
                                            {
                                                label: t('clear'),
                                                danger: true,
                                                key: 'clear',
                                            },
                                            {
                                                label: t('drop'),
                                                danger: true,
                                                key: 'drop',
                                            },
                                        ]}
                                    />
                                }
                            >
                                <IconButton
                                    onClick={e => e.preventDefault()}
                                >
                                    <EllipsisOutlined />
                                </IconButton>
                                {/* <a
                                >
                                </a> */}
                            </Dropdown>
                        </Space>
                    </div>
                )
            }
        },
    ]

    const columns = [
        {
            title: t('mongo.database.name'),
            dataIndex: 'name',
        },
        // {
        //     title: t('sizeOnDisk'),
        //     dataIndex: 'sizeOnDisk',
        // },
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
                                    selectDb(item)
                                }}
                            >
                                {t('select')}
                            </Button>
                            <Button
                                size="small"
                                danger
                                onClick={() => {
                                    // selectCol(item)
                                    dropDb(item)
                                }}
                            >
                                {t('drop')}
                            </Button>
                        </Space>
                    </div>
                )
            }
        },
    ]

    function clearCollection(item) {
        Modal.confirm({
            // title: 'Confirm',
            // icon: <ExclamationCircleOutlined />,
            content: `${t('clear')}「${item.name}」?`,
            async onOk() {
                let res = await request.post(`${config.host}/mongo/collection/clear`, {
                    connectionId,
                    database: curDb.name,
                    collection: item.name,
                })
                if (res.success) {
                    message.success(t('success'))
                    loadCollections()
                    // if (curCollection_will && item.name == curCollection_will.name) {
                    //     setCurCollection(null)
                    // }
                }
            }
        })
    }

    function dropCollection(item) {
        Modal.confirm({
            // title: 'Confirm',
            // icon: <ExclamationCircleOutlined />,
            content: `${t('delete')}「${item.name}」?`,
            async onOk() {
                let res = await request.post(`${config.host}/mongo/collection/drop`, {
                    connectionId,
                    database: curDb.name,
                    collection: item.name,
                })
                if (res.success) {
                    message.success(t('success'))
                    loadCollections()
                    // if (curCollection_will && item.name == curCollection_will.name) {
                    //     setCurCollection(null)
                    // }
                }
            }
        })
    }

    function closeTabByKey(targetKey) {
        // console.log('closeTabByKey', key)
        // setTabs(tabs.filter(item => item.key != key))
        for (let i = 0; i < tabs.length; i++) {
            if (tabs[i].id === targetKey) {
                tabs.splice(i, 1)
                break
            }
        }
        // if (tabs.length == 0) {
        //     tabs.push(tab_workbench)
        // }
        setTabs([
            ...tabs,
        ])
        setActiveTabId(tabs[tabs.length - 1].id)
    }

    const onEdit = (targetKey: string, action: string) => {
        // this[action](targetKey);
        if (action === 'add') {
            // let tabKey = '' + new Date().getTime()
            // setActiveKey(tabKey)
            // setTabs([
            //     ...tabs,
            //     {
            //         title: 'SQL',
            //         key: tabKey,
            //         defaultSql: '',
            //     }
            // ])
            // _this.setState({
            //     activeKey: tabKey,
            //     tabs: tabs.concat([{

            //     }]),
            // })
        }
        else if (action === 'remove') {
            closeTabByKey(targetKey)
        }
    }

    return (
        <div className={styles.mongoClient}>
            <div className={styles.layoutLeft}>
                {/* <div>数据库：</div> */}
                <div style={{
                    marginBottom: 8,
                }}>
                    <Space>
                        <IconButton
                            tooltip={t('refresh')}
                            onClick={loadDatabases}
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
                                setDbModalItem(null)
                                setDbModalVisible(true)
                            }}
                        >
                            <PlusOutlined />
                        </IconButton>
                        <IconButton
                            tooltip={t('info')}
                            onClick={() => {
                                setInfoVisible(true)
                            }}
                        >
                            <InfoCircleOutlined />
                        </IconButton>
                        <IconButton
                            tooltip={t('export_json')}
                            onClick={() => {
                                event$.emit({
                                    type: 'event_show_json',
                                    data: {
                                        json: JSON.stringify(databases, null, 4)
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
                : databases.length == 0 ?
                    <Empty
                        description="没有记录"
                    />
                :
                    <Table
                        dataSource={databases}
                        pagination={false}
                        columns={columns}
                        bordered
                        size="small"
                        rowKey="id"
                    />
                }
            </div>
            <div className={styles.layoutCenter}>
                {!!curDb &&
                    <>
                        <div className={styles.header}>
                            <div>{curDb.name} {t('mongo.collections')}</div>
                        </div>
                        <div className={styles.body}>

                            <div style={{
                                marginBottom: 8,
                            }}>
                                <Space>
                                    <IconButton
                                        tooltip={t('refresh')}
                                        onClick={loadCollections}
                                    >
                                        <ReloadOutlined />
                                    </IconButton>
                                    <IconButton
                                        tooltip={t('add')}
                                        // size="small"
                                        className={styles.refresh}
                                        onClick={() => {
                                            setCollectionModalItem(null)
                                            setCollectionModalVisible(true)
                                        }}
                                    >
                                        <PlusOutlined />
                                    </IconButton>
                                    <IconButton
                                        tooltip={t('export_json')}
                                        onClick={() => {
                                            event$.emit({
                                                type: 'event_show_json',
                                                data: {
                                                    json: JSON.stringify(collections, null, 4)
                                                    // connectionId,
                                                },
                                            })
                                        }}
                                    >
                                        <ExportOutlined />
                                    </IconButton>
                                </Space>
                            </div>
                            {/* {collectionLoading ?
                                <FullCenterBox>
                                    <Spin />
                                </FullCenterBox>
                            :
                            } */}
                            <Table
                                loading={collectionLoading}
                                dataSource={collections}
                                pagination={false}
                                columns={collectionColumns}
                                bordered
                                size="small"
                                rowKey="id"
                            />
                        </div>
                    </>
                }
            </div>
            <div className={styles.layoutRight}>
                <div className={styles.header}>
                    <Tabs
                        onEdit={onEdit}
                        activeKey={activeTabId}
                        hideAdd={true}
                        onChange={key => {
                            setActiveTabId(key)
                        }}
                        size="small"
                        type="editable-card"
                        style={{
                            height: '100%',
                        }}
                        items={tabs.map(item => {
                            return {
                                label: (
                                    <div>
                                        {/* {item.data.error ?
                                            <CloseCircleOutlined className={styles.failIcon} />
                                        :
                                            <CheckCircleOutlined className={styles.successIcon} />
                                        } */}
                                        {item.title}
                                    </div>
                                ),
                                key: item.id,
                                // closable: item.closable !== false,
                            }
                        })}
                    />
                </div>
                <div className={styles.body}>
                    {tabs.map(item => {
                        return (
                            <div className={styles.documentBox}
                                style={{
                                    display: item.id == activeTabId ? undefined : 'none',
                                }}
                            >
                                <div className={styles.header}>
                                    <div>
                                        {item.collection.name} 
                                        {/* {t('mongo.documents')} */}
                                    </div>
                                    <Radio.Group
                                        value={tab}
                                        onChange={e => {
                                            setTab(e.target.value)
                                        }}
                                            // buttonStyle="solid"
                                    >
                                        <Radio.Button value="document">{t('mongo.documents')}</Radio.Button>
                                        <Radio.Button value="index">{t('mongo.indexes')}</Radio.Button>
                                    </Radio.Group>
                                </div>
                                <div className={styles.body}>
                                    {tab == 'document' &&
                                        <MongoDocument
                                            config={config}
                                            event$={event$}
                                            connectionId={connectionId}
                                            curCollection={item.collection}
                                            curDb={curDb}
                                            detailItem={detailItem}
                                        />
                                    }
                                    {tab == 'index' &&
                                        <MongoIndex
                                            config={config}
                                            event$={event$}
                                            connectionId={connectionId}
                                            curCollection={item.collection}
                                            curDb={curDb}
                                        />
                                    }
                                    {/* <Button
                                        onClick={async () => {
                                            let res = await request.post(`${config.host}/mongo/mock`, {
                                                connectionId,
                                                // database: curDb.name,
                                            }, {
                                                // noMessage: true,
                                            })
                                        }}
                                    >mock 数据</Button> */}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
            
            {/* <TextArea className={styles.textarea} value={code} rows={4} 
                onChange={e => setCode(e.target.value)} /> */}
            {/* <Button type="primary" onClick={help}>帮助</Button> */}
            {collectionModalVisible &&
                <CollectionModal
                    connectionId={connectionId}
                    database={curDb.name}
                    item={collectionModalItem}
                    config={config}
                    onCancel={() => {
                        setCollectionModalVisible(false)
                    }}
                    onSuccess={() => {
                        setCollectionModalVisible(false)
                        loadCollections()
                    }}
                />
            }
            {dbModalVisible &&
                <DbModal
                    connectionId={connectionId}
                    item={dbModalItem}
                    config={config}
                    onCancel={() => {
                        setDbModalVisible(false)
                    }}
                    onSuccess={() => {
                        setDbModalVisible(false)
                        loadDatabases()
                    }}
                />
            }
            {infoVisible &&
                <ServerInfoModal
                    config={config}
                    connectionId={connectionId}
                    onCancel={() => {
                        setInfoVisible(false)
                    }}
                />
            }
        </div>
    );
}

function DbModal({ config, onCancel, item, onSuccess, 
    database,
    connectionId,
    onConnect, }) {
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
                // ...item,
                data: JSON.stringify(removeObjId(item)),
            })
        }
        else {
            form.setFieldsValue({
                data: '{}',
            })
        }
    }, [item])

    async function handleOk() {
        const values = await form.validateFields()
        setLoading(true)
        let _connections
        const saveOrUpdateData = {
        }
        if (editType == 'create') {
            let res = await request.post(`${config.host}/mongo/database/create`, {
                connectionId,
                database: values.name,
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
            let res = await request.post(`${config.host}/mongo/collection/update`, {
                connectionId,
                id: item._id,
                database,
                collection: values.name,
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

    return (
        <Modal
            title={editType == 'create' ? t('新增数据库') : t('编辑数据库')}
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
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
                // layout={{
                //     labelCol: { span: 0 },
                //     wrapperCol: { span: 24 },
                // }}
            >
                <Form.Item
                    name="name"
                    label={t('name')}
                    rules={[ { required: true, }, ]}
                >
                    <Input />
                </Form.Item>
            </Form>
        </Modal>
    );
}

function CollectionModal({ config, onCancel, item, onSuccess, 
    database,
    connectionId,
    onConnect, }) {
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
                // ...item,
                data: JSON.stringify(removeObjId(item)),
            })
        }
        else {
            form.setFieldsValue({
                data: '{}',
            })
        }
    }, [item])

    async function handleOk() {
        const values = await form.validateFields()
        setLoading(true)
        let _connections
        const saveOrUpdateData = {
        }
        if (editType == 'create') {
            let res = await request.post(`${config.host}/mongo/collection/create`, {
                connectionId,
                database,
                collection: values.name,
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
            let res = await request.post(`${config.host}/mongo/collection/update`, {
                connectionId,
                id: item._id,
                database,
                collection: values.name,
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

    return (
        <Modal
            title={editType == 'create' ? t('新增集合') : t('编辑集合')}
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
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
                // layout={{
                //     labelCol: { span: 0 },
                //     wrapperCol: { span: 24 },
                // }}
            >
                <Form.Item
                    name="name"
                    label={t('name')}
                    rules={[ { required: true, }, ]}
                >
                    <Input />
                </Form.Item>
            </Form>
        </Modal>
    );
}

function DatabaseModal({ config, editType, onCancel, item, onSuccess, 
    database,
    collection,
    connectionId,
    onConnect, }) {
    const { t } = useTranslation()

    // const editType = item ? 'update' : 'create'
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
                // ...item,
                data: JSON.stringify(removeObjId(item)),
            })
        }
        else {
            form.setFieldsValue({
                data: '{}',
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
            port: values.port || 6379,
            // user: values.user,
            password: values.password,
            userName: values.userName,
            defaultDatabase: values.defaultDatabase || 0,
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
            console.log('values', values)
            let res = await request.post(`${config.host}/mongo/document/create`, {
                connectionId,
                database,
                collection,
                data: JSON.parse(values.data),
                // ...saveOrUpdateData,
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
            let res = await request.post(`${config.host}/mongo/document/update`, {
                connectionId,
                id: item._id,
                database,
                collection,
                data: JSON.parse(values.data),
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

    return (
        <Modal
            title={editType == 'create' ? t('新增记录') : t('编辑记录')}
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
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
                // layout={{
                //     labelCol: { span: 0 },
                //     wrapperCol: { span: 24 },
                // }}
            >
                <Form.Item
                    name="data"
                    label={t('data')}
                    rules={[ { required: true, }, ]}
                >
                    <Input.TextArea
                        rows={8}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
}
