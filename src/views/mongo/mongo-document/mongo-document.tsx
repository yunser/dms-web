import { Button, Checkbox, Col, Descriptions, Drawer, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Pagination, Popover, Row, Space, Spin, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './mongo-document.module.less';
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

export function MongoDocument({ config, curDb, curCollection, event$, connectionId, }) {
    const { t } = useTranslation()
    
    // doc
    const [modalVisible, setModalVisible] = useState(false)
    const [modalType, setModalType] = useState('create')
    const [modalItem, setModalItem] = useState(false)
    // doc detail
    const [docDetailModalVisible, setDocDetailModalVisible] = useState(false)
    const [docDetailModalItem, setDocDetailModalItem] = useState(null)

    const pageSize = 10
    const [condition, setCondition] = useState('{}')
    const [documentCondition, setDocumentCondition] = useState({})
    const [documentLoading, setDocumentLoading] = useState(false)
    const [documents, setDocuments] = useState([])
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)

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
        setPage(1)
        setDocumentCondition(cond)
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
    }, [curDb, curCollection, page, documentCondition])


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

    return (
        <div className={styles.documentBox}>
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
                        <IconButton
                            // size="small"
                            tooltip={t('export_json')}
                            onClick={() => {
                                event$.emit({
                                    type: 'event_show_json',
                                    data: {
                                        json: JSON.stringify(documents, null, 4)
                                    },
                                })
                            }}
                        >
                            <ExportOutlined />
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
                    showSizeChanger={false}
                    onChange={(page) => {
                        setPage(page)
                    }}
                    showTotal={(total) => {
                        return `${total} ${t('rows')}`
                    }}
                />
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
        </div>
    );
}

function DatabaseModal({ config, editType, onCancel, item, onSuccess, 
    database,
    collection,
    connectionId,
    onConnnect, }) {
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
