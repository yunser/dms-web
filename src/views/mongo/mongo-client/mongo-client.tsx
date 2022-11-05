import { Button, Checkbox, Col, Descriptions, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Pagination, Popover, Row, Space, Spin, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './mongo-client.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
// import { Editor } from '../editor/Editor';
// import storage from '../../db-manager/storage'
// import { CodeDebuger } from '../code-debug';
import { uid } from 'uid';
import { EllipsisOutlined, ExportOutlined, EyeInvisibleOutlined, EyeOutlined, EyeTwoTone, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { request } from '@/views/db-manager/utils/http';
import { IconButton } from '@/views/db-manager/icon-button';
import { FullCenterBox } from '@/views/db-manager/redis-client';

function removeObjId(obj) {
    const result = {}
    for (let key in obj) {
        if (key != '_id') {
            result[key] = obj[key]
        }
    }
    return result
}

export function MongoClient({ config, event$, connectionId, }) {
    const { t } = useTranslation()
    
    // doc
    const [modalVisible, setModalVisible] = useState(false)
    const [modalItem, setModalItem] = useState(false)
    // col
    const [collectionModalVisible, setCollectionModalVisible] = useState(false)
    const [collectionModalItem, setCollectionModalItem] = useState(null)
    // db
    const [dbModalVisible, setDbModalVisible] = useState(false)
    const [dbModalItem, setDbModalItem] = useState(null)

    const [databases, setDatabases] = useState([])
    const [collections, setCollections] = useState([])
    const [loading, setLoading] = useState(false)
    const [curDb, setCurDb] = useState(null)
    const [curCollection, setCurCollection] = useState(null)
    
    const pageSize = 20
    const [condition, setCondition] = useState('{}')
    const [documentCondition, setDocumentCondition] = useState({})
    const [documents, setDocuments] = useState([])
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)

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
    }
    
    function query() {
        if (!condition) {
            // message.error('请输入查询条件')
            setDocumentCondition({})
            return
        }
        let cond
        try {
            cond = JSON.parse(condition)
        }
        catch (err) {
            message.error('查询条件解析失败')
            return
        }
        setDocumentCondition(cond)
    }

    async function loadDocuments() {
        // const connections = storage.get('redis-connections', [])
        // setLoading(true)
        let res = await request.post(`${config.host}/mongo/documents`, {
            connectionId,
            database: curDb.name,
            collection: curCollection.name,
            skip: (page - 1) * pageSize,
            limit: pageSize,
            conditions: documentCondition,
        }, {
            // noMessage: true,
        })
        // console.log('res', res)
        if (res.success) {
            // setProjects([])
            const { list, total } = res.data
            // let collections = list
            setDocuments(list)
            setTotal(total)
        }
        // setLoading(false)
    }

    async function loadCollections() {
        // const connections = storage.get('redis-connections', [])
        // setLoading(true)
        let res = await request.post(`${config.host}/mongo/collections`, {
            connectionId,
            database: curDb.name,
        }, {
            // noMessage: true,
        })
        // console.log('res', res)
        if (res.success) {
            // setProjects([])
            let collections = res.data.list
            if (collections.length) {
                setCollections(collections.sort((a, b) => {
                    return a.name.localeCompare(b.name)
                }))
            }
        }
        // setLoading(false)
    }

    useEffect(() => {
        if (curDb) {
            loadCollections()
        }
    }, [curDb])

    useEffect(() => {
        if (curDb) {
            loadDocuments()
        }
    }, [curCollection, page, documentCondition])

    const collectionColumns = [
        {
            title: t('name'),
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
                                    setCurCollection(item)
                                }}
                            >
                                {t('select')}
                            </Button>
                            <Button
                                size="small"
                                onClick={() => {
                                    // selectCol(item)
                                    dropCollection(item)
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

    const columns = [
        {
            title: t('name'),
            dataIndex: 'name',
        },
        {
            title: t('sizeOnDisk'),
            dataIndex: 'sizeOnDisk',
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
                                    selectDb(item)
                                }}
                            >
                                {t('select')}
                            </Button>
                        </Space>
                    </div>
                )
            }
        },
    ]

    function updateDocument(item) {
        setModalItem(item)
        setModalVisible(true)
    }

    function removeDocument(item) {
        Modal.confirm({
            // title: 'Confirm',
            // icon: <ExclamationCircleOutlined />,
            content: `${t('delete')}?`,
            async onOk() {
                let res = await request.post(`${config.host}/mongo/document/remove`, {
                    connectionId,
                    database: curDb.name,
                    collection: curCollection.name,
                    id: item._id,
                })
                if (res.success) {
                    message.success(t('success'))
                    // onSuccess && onSuccess()
                    loadDocuments()
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
                }
            }
        })
    }

    return (
        <div className={styles.mongoClient}>
            <div className={styles.layoutLeft}>
                <div>数据库：</div>
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
                            tooltip={t('export_json')}
                            onClick={() => {
                                event$.emit({
                                    type: 'event_show_json',
                                    data: {
                                        json: JSON.stringify(databases, null, 4)
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
                    <div>

                        <div>{curDb.name} 集合：</div>
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
                            </Space>
                        </div>
                        <Table
                            dataSource={collections}
                            pagination={false}
                            columns={collectionColumns}
                            bordered
                            size="small"
                            rowKey="id"
                        />
                    </div>
                }
            </div>
            <div className={styles.layoutRight}>
                {!!curCollection &&
                    <>
                        <div className={styles.header}>
                            <Input.TextArea
                                placeholder="请输入查询条件"
                                value={condition}
                                rows={8}
                                onChange={e => {
                                    setCondition(e.target.value)
                                }}
                            />
                            <div className={styles.btns}>
                                <Space>
                                    <Button
                                        type="primary"
                                        onClick={query}
                                    >查询</Button>
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
                                </Space>
                            </div>
                        </div>
                        <div className={styles.body}>
                            <div>
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
                            <div>{curCollection.name} 文档：</div>
                            <div className={styles.documents}>
                                {documents.map(item => {
                                    return (
                                        <div 
                                            className={styles.item}
                                            key={item._id}
                                        >
                                            <div>{JSON.stringify(item)}</div>
                                            <Button
                                                onClick={() => {
                                                    updateDocument(item)
                                                }}
                                            >
                                                编辑</Button>
                                            <Button
                                                onClick={() => {
                                                    removeDocument(item)
                                                }}
                                            >
                                                删除</Button>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        <div className={styles.footer}>
                            <Pagination
                                current={page}
                                total={total}
                                pageSize={pageSize}
                                showSizeChanger={false}
                                onChange={(page) => {
                                    setPage(page)
                                }}
                            />
                        </div>
                    </>
                }
            </div>
            
            {/* <TextArea className={styles.textarea} value={code} rows={4} 
                onChange={e => setCode(e.target.value)} /> */}
            {/* <Button type="primary" onClick={help}>帮助</Button> */}
            {modalVisible &&
                <DatabaseModal
                    connectionId={connectionId}
                    database={curDb.name}
                    collection={curCollection.name}
                    item={modalItem}
                    config={config}
                    onCancel={() => {
                        setModalVisible(false)
                    }}
                    onSuccess={() => {
                        setModalVisible(false)
                        loadDocuments()
                    }}
                />
            }
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
        </div>
    );
}

function DbModal({ config, onCancel, item, onSuccess, 
    database,
    connectionId,
    onConnnect, }) {
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
    onConnnect, }) {
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

function DatabaseModal({ config, onCancel, item, onSuccess, 
    database,
    collection,
    connectionId,
    onConnnect, }) {
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
