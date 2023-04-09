import { Button, Descriptions, Drawer, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Popover, Select, Space, Spin, Table, Tabs, Tag, Tree } from 'antd';
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
import axios from 'axios'

function getColor(time) {
    if (time > 1000) {
        return 'red'
    }
    if (time > 500) {
        return 'orange'
    }
    return undefined
}

export function ServiceHome({ onClickItem }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [form] = Form.useForm()
    const [connecting, setConnecting] = useState(false)
    const [connected, setConnected] = useState(false)

    useEffect(() => {
        document.title = t('monitor')
    }, [])

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
    const comData = useRef({
        result: {
            total: 0,
            success: 0,
            fail: 0,
        }
    })
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

    async function _testItem(service) {
        const fIdx = list.findIndex(item => item.id == service.id)
        const { url } = service
        console.log('url', url)
        list[fIdx]._id = new Date().getTime()
        list[fIdx].loading = true
        setList([...list])
        const startTime = new Date()
        let res
        let isTimeout = false
        try {
            res = await axios.post(`${config.host}/http/proxy`, {
                url,
            }, {
                timeout: 4000,
                // noMessage: true,
            })
        }
        catch (err) {
            console.log('err', err)
            isTimeout = err.message && err.message.includes('timeout')
        }
        console.log('res', res)
        // if ()
        let isSuccess
        if (service.field) {
            isSuccess = res?.status == 200 && (typeof res?.data == 'object') && res.data[service.field] == 'success'
        }
        else {
            isSuccess = res && res.status == 200
        }
        
        list[fIdx].hasResult = true
        list[fIdx]._id = new Date().getTime()
        list[fIdx].time = new Date().getTime() - startTime.getTime()
        list[fIdx].loading = false
        list[fIdx].status = isSuccess ? 'ok' : 'fail'
        list[fIdx].isTimeout = isTimeout

        comData.current.result.success = list.filter(item => item.hasResult && item.status == 'ok').length
        comData.current.result.fail = list.filter(item => item.hasResult && item.status != 'ok').length

        if (res) {
            list[fIdx].response = {
                status: res.status,
                data: res.data,
            }
        }
        setTotalResult({
            ...comData.current.result,
        })
        setList([...list])
    }

    async function retryItem(item) {
        console.log('重试', item)
        _testItem(item)
    }

    async function removeItem(item) {
        Modal.confirm({
            title: '',
            // icon: <ExclamationCircleOutlined />,
            content: `${t('delete')}「${item.name}」?`,
            async onOk() {
                let res = await request.post(`${config.host}/service/remove`, {
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

    async function checkAll() {
        console.log('filteredList', filteredList)
        // for (let i = 0; i < filteredList.length; i++) {
        //     const 
        // }
        comData.current.result = {
            total: 0,
            success: 0,
            fail: 0,
        }
        setTotalResult({
            ...comData.current.result,
        })
        for (let service of filteredList) {
            if (service.enable === false) {
                continue
            }
            await _testItem(service)
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
            width: 240,
            render(value = true, item) {
                const colorMap = {
                    ok: 'green',
                    fail: 'red'
                }
                return (
                    <div>
                        {item.loading ?
                            <Spin />
                        :
                            <Space>
                                <div
                                    className={styles.status} 
                                    style={{ color: colorMap[item.status] }}>{item.status || '--'}</div>
                                {!!item.hasResult &&
                                    <>
                                        {item.isTimeout ?
                                            <div style={{color: 'red'}}>超时</div>
                                        :
                                            <div style={{color: getColor(item.time)}}>{item.time}ms</div>
                                        }
                                    </>
                                }
                                {item.hasResult &&
                                    <Button
                                        size="small"
                                        // disabled={! item.status}
                                        onClick={() => {
                                            setDetailItem(item)
                                            setDetailVisible(true)
                                        }}
                                        >
                                        查看结果
                                    </Button>
                                }
                                {(item.hasResult && item.status != 'ok') &&
                                    <Button
                                        size="small"
                                        // disabled={! item.status}
                                        onClick={() => {
                                            retryItem(item)
                                        }}
                                    >
                                        重试
                                    </Button>
                                }
                                {/* <Button
                                    size="small"
                                >
                                    检测
                                </Button> */}
                                {!item.hasResult &&
                                    <Button
                                        size="small"
                                        // disabled={! item.status}
                                        onClick={() => {
                                            retryItem(item)
                                        }}
                                    >
                                        检测
                                    </Button>
                                }
                            </Space>
                        }
                        {/* <div style={{ color: value ? 'green' : 'red' }}>{value ? '是' : '否'}</div> */}
                    </div>
                )
            }
        },
        {
            title: '标签',
            dataIndex: 'tags',
            width: 240,
            // ellipsis: true,
            render(value = []) {
                return (
                    <div>
                        {value.map(item => {
                            return <Tag key={item}>{item}</Tag>
                        })}
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
            title: '字段',
            dataIndex: 'field',
            width: 80,
            // render(value = true) {
            //     return (
            //         <div style={{ color: value ? 'green' : 'red' }}>{value ? '是' : '否'}</div>
            //     )
            // }
        },
        {
            title: '启用',
            dataIndex: 'enable',
            width: 80,
            render(value = true) {
                return (
                    <div style={{ color: value ? 'green' : 'red' }}>{value ? '是' : '否'}</div>
                )
            }
        },
        {
            title: '操作',
            dataIndex: 'url',
            render(value, item) {
                return (
                    <Space>
                        <Button
                            size="small"
                            onClick={() => {
                                setEditItem(item)
                                setEditVisible(true)
                            }}
                        >
                            编辑
                        </Button>
                        <Button
                            size="small"
                            danger
                            onClick={() => {
                                removeItem(item)
                            }}
                        >
                            删除
                        </Button>
                    </Space>
                )
            }
        },
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
                            setEditItem(null)
                            setEditVisible(true)
                        }}
                    >
                        新增
                    </Button>
                </Space>
            </div>
            <div>
                <Input
                    placeholder={t('filter')}
                    className={styles.keywordInput}
                    value={keyword}
                    allowClear
                    onChange={e => setKeyword(e.target.value)}
                />
            </div>
            <div className={styles.statBox}>
                成功：{totalResult.success}；
                        
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
            field: values.field,
            enable: values.enable == false ? false : true,
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

        // const startTime = new Date()
        let res
        let isTimeout = false
        try {
            res = await axios.post(`${config.host}/http/proxy`, {
                url: values.url,
            }, {
                timeout: 4000,
                // noMessage: true,
            })
        }
        catch (err) {
            console.log('err', err)
            isTimeout = err.message && err.message.includes('timeout')
        }
        setLoading(false)
        console.log('res', res)
        // if ()
        let isSuccess
        if (values.field) {
            isSuccess = res?.status == 200 && (typeof res?.data == 'object') && res.data[values.field] == 'success'
        }
        else {
            isSuccess = res && res.status == 200
        }
        if (isSuccess) {
            message.success(t('success'))
        }
        else {
            message.error(t('fail'))
        }
        // const reqData = {
        //     host: values.,
        //     port: values.port || 22,
        //     username: values.username,
        //     password: values.password,
        //     test: true,
        //     // remember: values.remember,
        // }
        // let ret = await request.post(`${config.host}/ssh/connect`, reqData)
        // // console.log('ret', ret)
        // if (ret.success) {
        //     message.success(t('success'))
        // }
        
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
                    {/* <div></div> */}
                    <Button key="back"
                        loading={loading}
                        disabled={loading}
                        onClick={handleTestConnection}
                    >
                        {t('test')}
                    </Button>
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
                <Form.Item
                    name="field"
                    label="字段"
                    // rules={[ { required: true, }, ]}
                >
                    <Input
                        // placeholder="localhost"
                    />
                </Form.Item>
                <Form.Item
                    name="enable"
                    label="启用"
                    // rules={[ { required: true, }, ]}
                >
                    <Select
                        options={[
                            {
                                label: '启用',
                                value: true,
                            },
                            {
                                label: '不启用',
                                value: false,
                            },
                        ]}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
}
