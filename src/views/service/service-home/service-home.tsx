import { Button, Descriptions, Drawer, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Popover, Space, Spin, Table, Tabs, Tag, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './service-home.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { DownloadOutlined, EllipsisOutlined, KeyOutlined, PlusOutlined, ReloadOutlined, StarFilled } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
// import { GitProject } from '../git-project';
import { request } from '@/views/db-manager/utils/http';
// import { ProjectEditor } from '../project-edit';
import { IconButton } from '@/views/db-manager/icon-button';
import { FullCenterBox } from '@/views/common/full-center-box';
import { getGlobalConfig } from '@/config';
import { SearchUtil } from '@/utils/search';
// import { saveAs } from 'file-saver'

export function ServiceHome({ onClickItem }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [form] = Form.useForm()
    const [connecting, setConnecting] = useState(false)
    const [connected, setConnected] = useState(false)

    // total
    const [totalResult, setTotalResult] = useState({
        total: 0,
        success: 0,
        fail: 0,
    })
    // detail
    const [detailVisible, setDetailVisible] = useState(false)
    const [detailItem, setDetailItem] = useState(null)
    // 新增编辑
    const [editItem, setEditItem] = useState(false)
    const [editVisible, setEditVisible] = useState(false)

    const [content, setContent] = useState('')
    const [list, setList] = useState([])
    const [ keyword, setKeyword ] = useState('')
    const config = getGlobalConfig()

    const filteredList = useMemo(() => {
        return SearchUtil.searchLike(list, keyword, {
            attributes: ['name', 'url'],
        })
        
        // if (!keyword) {
        //     return projects    
        // }
        // return projects.filter(p => p.name.toLowerCase().includes(keyword.toLowerCase()))
        // return projects
    }, [list, keyword])

    async function checkAll() {
        console.log('filteredList', filteredList)
        // for (let i = 0; i < filteredList.length; i++) {
        //     const 
        // }
        const result = {
            total: 0,
            success: 0,
            fail: 0,
        }
        setTotalResult({
            ...result,
        })
        for (let service of filteredList) {
            if (service.enable === false) {
                continue
            }
            const fIdx = list.findIndex(item => item.id == service.id)
            const { url } = service
            console.log('url', url)
            list[fIdx]._id = new Date().getTime()
            list[fIdx].loading = true
            setList([...list])
            const res = await request.post(`${config.host}/http/proxy`, {
                url,
            }, {
                noMessage: true,
            })
            console.log('res', res)
            // if ()
            const isSuccess = res.status == 200
            result.total += 1
            if (isSuccess) {
                result.success += 1
            }
            else {
                result.fail += 1
            }
            list[fIdx]._id = new Date().getTime()
            list[fIdx].loading = false
            list[fIdx].status = isSuccess ? 'ok' : 'fail'
            list[fIdx].response = {
                status: res.status,
                data: res.data,
            }
            setTotalResult({
                ...result,
            })
            setList([...list])
        }
    }

    async function loadList() {
        const values = await form.validateFields()
        // setConnecting(true)
        let res = await request.post(`${config.host}/service/list`, {
            // host: values.host,
            // port: values.port,
            path: '',
        })
        if (res.success) {
            // onSuccess && onSuccess()
            // message.success(t('success'))
            // setConnected(true)
            setList(res.data.list.sort((a, b) => {
                return a.name.localeCompare(b.name)
            }))
        }
        // setConnecting(false)
    }

    useEffect(() => {
        loadList()
    }, [])


    async function exit() {
        setConnected(false)
        let res = await request.post(`${config.host}/file/close`, {
            content,
        })
    }

    const columns = [
        {
            title: '服务名称',
            dataIndex: 'name',
            width: 240,
        },
        {
            title: '状态',
            dataIndex: '_id',
            width: 160,
            render(value = true, item) {
                return (
                    <div>
                        {item.loading &&
                            <Spin />
                        }
                        {/* <div style={{ color: value ? 'green' : 'red' }}>{value ? '是' : '否'}</div> */}
                        <Space>
                            <div style={{ color: item.status == 'ok' ? 'green' : 'red' }}>{item.status || '--'}</div>
                            <Button
                                size="small"
                                onClick={() => {
                                    setDetailItem(item)
                                    setDetailVisible(true)
                                }}
                            >
                                查看结果
                            </Button>
                            {/* <Button
                                size="small"
                            >
                                检测
                            </Button> */}
                        </Space>
                    </div>
                )
            }
        },
        {
            title: 'URL',
            dataIndex: 'url',
            width: 480,
            ellipsis: true,
            render(value) {
                return (
                    <a href={value} target="_blank">{value}</a>
                )
            }
        },
        {
            title: '启用',
            dataIndex: 'enable',
            width: 240,
            render(value = true) {
                return (
                    <div style={{ color: value ? 'green' : 'red' }}>{value ? '是' : '否'}</div>
                )
            }
        },
        // {
        //     title: '操作',
        //     dataIndex: 'url',
        // },
        {
            title: '',
            dataIndex: '__empty__',
        },
    ]

    return (
        <div className={styles.app}>
            <div>
                <Space>
                    <IconButton
                        className={styles.refresh}
                        onClick={() => {
                            loadList()
                        }}
                    >
                        <ReloadOutlined />
                    </IconButton>
                    <Button
                        size="small"
                        onClick={() => {
                            checkAll()
                        }}
                    >
                        一键检测
                    </Button>
                    <Button
                        size="small"
                        onClick={() => {
                            setEditVisible(true)
                        }}
                    >
                        新增
                    </Button>
                </Space>
            </div>
            <div>
                <Input
                    className={styles.keywordInput}
                    value={keyword}
                    allowClear
                    onChange={e => setKeyword(e.target.value)}
                />
            </div>
            <div>成功：{totalResult.success}；
                        
                失败：
                <span style={{ color: 'red' }}>{totalResult.fail}</span>
            </div>
            <Table
                dataSource={filteredList}
                columns={columns}
                bordered
                size="small"
                rowKey="id"
                pagination={false}
            />
            {detailVisible &&
                <Drawer
                    title="详情"
                    open={true}
                    onClose={() => {
                        setDetailVisible(false)
                    }}
                    
                >
                    {!!detailItem?.response &&
                        <div>
                            <div>status: {detailItem.response.status}</div>
                            <div>
                                {JSON.stringify(detailItem.response.data)}
                            </div>
                        </div>
                    }
                </Drawer>
            }
            {editVisible &&
                <DatabaseModal
                    item={editItem}
                    config={config}
                    onCancel={() => {
                        setEditVisible(false)
                    }}
                    onSuccess={() => {
                        setEditVisible(false)
                        loadList()
                    }}
                />
            }
        </div>
    )
}



function DatabaseModal({ config, onCancel, item, onSuccess, onConnect, }) {
    const { t } = useTranslation()

    const editType = item ? 'update' : 'create'
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
                defaultDatabase: item.defaultDatabase || 0,
            })
        }
        else {
            form.setFieldsValue({
                name: '',
                host: '',
                port: null,
                password: '',
                defaultDatabase: null,
                userName: '',
            })
        }
    }, [item])

    async function handleOk() {
        const values = await form.validateFields()
        // setLoading(true)
        let _connections
        const saveOrUpdateData = {
            name: values.name || t('unnamed'),
            url: values.url,
        }
        if (editType == 'create') {
            let res = await request.post(`${config.host}/service/create`, {
                ...saveOrUpdateData,
            })
            if (res.success) {
                onSuccess && onSuccess()
            }
        }
        else {
            let res = await request.post(`${config.host}/service/update`, {
                id: item.id,
                data: {
                    ...saveOrUpdateData,
                }
            })
            if (res.success) {
                onSuccess && onSuccess()
            }
        }
    }

    async function handleTestConnection() {
        const values = await form.validateFields()
        setLoading(true)
        const reqData = {
            host: values.host,
            port: values.port || 22,
            username: values.username,
            password: values.password,
            test: true,
            // remember: values.remember,
        }
        let ret = await request.post(`${config.host}/ssh/connect`, reqData)
        // console.log('ret', ret)
        if (ret.success) {
            message.success(t('success'))
        }
        setLoading(false)
    }

    return (
        <Modal
            title={editType == 'create' ? t('create') : t('update')}
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
                        loading={loading}
                        disabled={loading}
                        onClick={handleTestConnection}
                    >
                        {t('test_connection')}
                    </Button> */}
                    <Space>
                        <Button
                            // key="submit"
                            // type="primary"
                            disabled={loading}
                            onClick={onCancel}
                        >
                            {t('cancel')}
                        </Button>
                        <Button
                            type="primary"
                            disabled={loading}
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
                    name="url"
                    label="URL"
                    rules={[ { required: true, }, ]}
                >
                    <Input
                        // placeholder="localhost"
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
}
