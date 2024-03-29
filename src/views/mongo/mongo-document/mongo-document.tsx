import { Button, Checkbox, Col, Descriptions, Drawer, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Pagination, Popover, Row, Select, Space, Spin, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './mongo-document.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
// import { Editor } from '@/views/db-manager/editor/Editor';
// import storage from '../../db-manager/storage'
// import { CodeDebuger } from '../code-debug';
import { uid } from 'uid';
import { DownloadOutlined, EllipsisOutlined, ExportOutlined, EyeInvisibleOutlined, EyeOutlined, EyeTwoTone, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { request } from '@/views/db-manager/utils/http';
import { IconButton } from '@/views/db-manager/icon-button';
import { FullCenterBox } from '@/views/common/full-center-box';
import { Editor } from '@/views/db-manager/editor/Editor';

function removeObjId(obj) {
    const result = {}
    for (let key in obj) {
        if (key != '_id') {
            result[key] = obj[key]
        }
    }
    return result
}

export function MongoDocument({ config, curDb, curCollection, event$, connectionId, detailItem, }) {
    const { t } = useTranslation()
    
    // doc
    const [modalVisible, setModalVisible] = useState(false)
    const [modalType, setModalType] = useState('create')
    const [modalItem, setModalItem] = useState(false)
    // doc detail
    const [docDetailModalVisible, setDocDetailModalVisible] = useState(false)
    const [docDetailModalItem, setDocDetailModalItem] = useState(null)
    // update
    const [updateQuery, setUpdateQuery] = useState({})
    const [updateModalVisible, setUpdateModalVisible] = useState(false)
    // remove by query
    const [removeQuery, setRemoveQuery] = useState({})
    const [removeModalVisible, setRemoveModalVisible] = useState(false)

    const [pageSize, setPageSize] = useState(10)
    // const [condition, _setCondition] = useState('{}')
    const comData = useRef({
        condition: '{}',
        editor: null
    })
    function setCondition(value) {
        comData.current?.editor?.setValue(value)
    }
    
    const [documentCondition, setDocumentCondition] = useState({})
    const [documentLoading, setDocumentLoading] = useState(false)
    const [documents, setDocuments] = useState([])
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)

    function query() {
        const { condition } = comData.current 
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
        setPage(1)
        setDocumentCondition(cond)
    }

    function resetQuery() {
        setCondition('{}')
        setDocumentCondition({})
    }

    function formatQuery() {
        const { condition } = comData.current
        setCondition(JSON.stringify(JSON.parse(condition), null, 4))
    }

    function queryAndUpdate() {
        const { condition } = comData.current
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
        setUpdateQuery(cond)
        setUpdateModalVisible(true)
    }

    function queryAndRemove() {
        const { condition } = comData.current
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
        setRemoveQuery(cond)
        setRemoveModalVisible(true)
    }

    async function loadDocuments() {
        setDocumentLoading(true)
        let res = await request.post(`${config.host}/mongo/documents`, {
            connectionId,
            database: curDb.name,
            collection: curCollection.name,
            skip: (page - 1) * pageSize,
            limit: pageSize,
            conditions: documentCondition,
        })
        if (res.success) {
            const { list, total } = res.data
            setDocuments(list)
            setTotal(total)
        }
        setDocumentLoading(false)
    }

    useEffect(() => {
        if (curDb) {
            loadDocuments()
        }
    }, [curDb, curCollection, page, pageSize, documentCondition])


    // useEffect(() => {
    //     if (page != 1) {
    //         setPage(1)
    //     }
    // }, [curCollection, page])


    function updateDocument(item) {
        setModalItem(item)
        setModalType('update')
        setModalVisible(true)
    }

    function duplicateDocument(item) {
        setModalItem(item)
        setModalType('create')
        setModalVisible(true)
    }

    function viewDocument(item) {
        setDocDetailModalItem(item)
        setDocDetailModalVisible(true)
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

    function removeAllDocument() {
        // console.log('documents', documents)
        // return
        Modal.confirm({
            // title: 'Confirm',
            // icon: <ExclamationCircleOutlined />,
            content: `${t('delete_current_page')}?`,
            async onOk() {
                let res = await request.post(`${config.host}/mongo/document/remove`, {
                    connectionId,
                    database: curDb.name,
                    collection: curCollection.name,
                    ids: documents.map(item => item._id),
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

    return (
        <div className={styles.documentBox}>
            <div className={styles.header}>
                <div className={styles.editor}>
                    {/* <Input.TextArea
                        placeholder="请输入查询条件"
                        value={condition}
                        rows={8}
                        onChange={e => {
                            setCondition(e.target.value)
                        }}
                    /> */}
                    <Editor
                        lang="json"
                        // value={condition}
                        value="{}"
                        // event$={event$}
                        onChange={value => {
                            comData.current.condition = value
                        }}
                        onEditor={editor => {
                            // setEditor(editor)
                            comData.current.editor = editor
                        }}
                    />
                </div>
                <div className={styles.btns}>
                    <Space>
                        <Button
                            type="primary"
                            size="small"
                            onClick={query}
                        >
                            {t('query')}
                        </Button>
                        <IconButton
                            tooltip={t('add')}
                            // size="small"
                            className={styles.refresh}
                            onClick={() => {
                                setModalItem(null)
                                setModalType('create')
                                setModalVisible(true)
                            }}
                        >
                            <PlusOutlined />
                        </IconButton>
                        <Dropdown
                            overlay={
                                <Menu
                                    onClick={info => {
                                        if (info.key == 'export_json') {
                                            event$.emit({
                                                type: 'event_show_json',
                                                data: {
                                                    json: JSON.stringify(documents, null, 4)
                                                },
                                            })
                                        }
                                        else if (info.key == 'export_json_lines') {
                                            const content = documents.map(item => JSON.stringify(item)).join('\n')
                                            event$.emit({
                                                type: 'event_show_text',
                                                data: {
                                                    text: content,
                                                },
                                            })
                                        }
                                    }}
                                    items={[
                                        {
                                            label: t('export_json'),
                                            key: 'export_json',
                                        },
                                        {
                                            label: t('export_json_lines'),
                                            key: 'export_json_lines',
                                        },
                                    ]}
                                />
                            }
                        >
                            {/* <Button>
                                <Space>
                                Button
                                <DownOutlined />
                                </Space>
                            </Button> */}
                            <IconButton
                                size="small"
                            >
                                <DownloadOutlined />   
                            </IconButton>
                        </Dropdown>
                        <Button
                            size="small"
                            onClick={formatQuery}
                        >
                            {t('format')}
                        </Button>
                        <Button
                            size="small"
                            onClick={resetQuery}
                        >
                            {t('reset_query')}
                        </Button>
                        <Select
                            className={styles.quickSelect}
                            value={''}
                            style={{ width: 240 }}
                            size="small"
                            options={(detailItem.quickQueries || []).map(item => {
                                return {
                                    label: item.title,
                                    value: item.id,
                                }
                            })}
                            onChange={(value) => {
                                const fItem = (detailItem.quickQueries || []).find(item => item.id == value)
                                console.log('fItem', fItem)
                                if (fItem) {
                                    setCondition(fItem.content)
                                }
                            }}
                        />
                    </Space>
                    <Space>
                        <Button
                            // type="primary"
                            size="small"
                            onClick={queryAndUpdate}
                        >
                            {t('update')}
                        </Button>
                        <Button
                            size="small"
                            danger
                            onClick={() => {
                                queryAndRemove()
                            }}
                        >
                            {t('delete')}
                        </Button>

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
                {documentLoading ?
                    <FullCenterBox>
                        <Spin />
                    </FullCenterBox>
                : documents.length == 0 ?
                    <FullCenterBox>
                        <Empty />
                    </FullCenterBox>
                :
                    <div className={styles.documents}>
                        {documents.map(item => {
                            return (
                                <div 
                                    className={styles.item}
                                    key={item._id}
                                >
                                    <div className={styles.content}
                                        onClick={() => {
                                            viewDocument(item)
                                        }}
                                    >{JSON.stringify(item)}</div>
                                    <Space>
                                        <Button
                                            size="small"
                                            onClick={() => {
                                                viewDocument(item)
                                            }}
                                        >
                                            {t('view')}
                                        </Button>
                                        <Button
                                            size="small"
                                            onClick={() => {
                                                duplicateDocument(item)
                                            }}
                                        >
                                            {t('duplicate')}
                                        </Button>
                                        <Button
                                            size="small"
                                            onClick={() => {
                                                updateDocument(item)
                                            }}
                                        >
                                            {t('edit')}
                                        </Button>
                                        <Button
                                            size="small"
                                            danger
                                            onClick={() => {
                                                removeDocument(item)
                                            }}
                                        >
                                            {t('delete')}
                                        </Button>
                                    </Space>
                                </div>
                            )
                        })}
                    </div>
                }
            </div>
            <div className={styles.footer}>
                <Pagination
                    current={page}
                    total={total}
                    pageSize={pageSize}
                    size="small"
                    // showSizeChanger={false}
                    onChange={(page, pageSize) => {
                        setPage(page)
                        setPageSize(pageSize)
                    }}
                    showTotal={(total) => {
                        return `${total} ${t('rows')}`
                    }}
                />
                <Button
                    size="small"
                    danger
                    onClick={removeAllDocument}
                >
                    {t('delete_current_page')}
                </Button>
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
                    editType={modalType}
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
            {docDetailModalVisible &&
                <Drawer
                    open={true}
                    title={t('row')}
                    onClose={() => {
                        setDocDetailModalVisible(false)
                    }}
                >
                    <div className={styles.code}>
                        <pre>{JSON.stringify(docDetailModalItem, null, 4)}</pre>
                    </div>
                </Drawer>
            }
            {updateModalVisible &&
                <UpdateModal
                    config={config}
                    connectionId={connectionId}
                    database={curDb}
                    collection={curCollection}
                    query={updateQuery}
                    onClose={() => {
                        setUpdateModalVisible(false)
                    }}
                />
            }
            {removeModalVisible &&
                <RemoveModal
                    config={config}
                    connectionId={connectionId}
                    database={curDb}
                    collection={curCollection}
                    query={removeQuery}
                    onClose={() => {
                        setRemoveModalVisible(false)
                    }}
                />
            }
        </div>
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
    const defaultSql = item ? JSON.stringify(removeObjId(item), null, 4) : '{}'
    const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
    const [code, setCode] = useState(defaultSql)
    const [code2, setCode2] = useState(defaultSql)
    const comData = useRef({
        data: defaultSql,
    })

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
            // console.log('values', values)
            let res = await request.post(`${config.host}/mongo/document/create`, {
                connectionId,
                database,
                collection,
                data: JSON.parse(comData.current.data),
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
                data: JSON.parse(comData.current.data),
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
            title={editType == 'create' ? t('mongo.document.create') : t('mongo.document.update')}
            visible={true}
            maskClosable={false}
            onCancel={onCancel}
            width={800 + 24 * 2}
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
            {/* <Form
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
            </Form> */}
            <div className={styles.editorBox}>
                <Editor
                    lang="json"
                    value={code}
                    // event$={event$}
                    // onChange={value => setCode2(value)}
                    onChange={value => {
                        comData.current.data = value
                    }}
                    onEditor={editor => {
                        setEditor(editor)
                    }}
                />
            </div>
        </Modal>
    );
}

function UpdateModal({ config, connectionId, database, collection, query, onClose }) {
    const { t } = useTranslation()
    const [updateData, setUpdateData] = useState('{}')

    async function update() {
        let res = await request.post(`${config.host}/mongo/document/updateByQuery`, {
            connectionId,
            database: database.name,
            collection: collection.name,
            query,
            data: JSON.parse(updateData),
            // ...saveOrUpdateData,
        })
        if (res.success) {
            message.success(t('success'))
        }
    }

    return (
        <Drawer
            title={t('query_and_update')}
            open={true}
            width={800}
            onClose={onClose}
        >
            <div className={styles.sectionBox}>
                <div className={styles.title}>{t('query')}:</div>
                <Input.TextArea
                    value={JSON.stringify(query, null, 4)}
                    rows={8}
                    disabled
                    // onChange={e => {
                    //     setUpdateData(e.target.value)
                    // }}
                />
            </div>
            {/* <pre>{JSON.stringify(query, null, 4)}</pre> */}
            <div className={styles.sectionBox}>
                <div className={styles.title}>{t('update_data')}:</div>
                <Input.TextArea
                    value={updateData}
                    rows={8}
                    onChange={e => {
                        setUpdateData(e.target.value)
                    }}
                />
                <div className={styles.btnBox}>
                    <Button
                        type="primary"
                        onClick={update}
                    >
                        {t('update')}
                    </Button>
                </div>
            </div>
        </Drawer>
    )
}

function RemoveModal({ config, connectionId, database, collection, query, onClose }) {
    const { t } = useTranslation()
    // const [updateData, setUpdateData] = useState('{}')

    async function update() { 
        let res = await request.post(`${config.host}/mongo/document/removeByQuery`, {
            connectionId,
            database: database.name,
            collection: collection.name,
            query,
            // data: JSON.parse(updateData),
            // ...saveOrUpdateData,
        })
        if (res.success) {
            message.success(t('success'))
        }
    }

    return (
        <Drawer
            title={t('query_and_delete')}
            open={true}
            width={800}
            onClose={onClose}
        >
            <div className={styles.sectionBox}>
                <div className={styles.title}>{t('query')}:</div>
                <Input.TextArea
                    value={JSON.stringify(query, null, 4)}
                    rows={8}
                    disabled
                    // onChange={e => {
                    //     setUpdateData(e.target.value)
                    // }}
                />
            </div>
            {/* <pre>{JSON.stringify(query, null, 4)}</pre> */}
            <div className={styles.sectionBox}>
                <div className={styles.btnBox}>
                    <Button
                        type="primary"
                        onClick={update}
                        danger
                    >
                        {t('delete')}
                    </Button>
                </div>
            </div>
        </Drawer>
    )
}