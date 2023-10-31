import { Button, Descriptions, Drawer, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Popover, Radio, Select, Space, Spin, Table, Tabs, Tag, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './service-home.module.less';
import _, { get } from 'lodash';
import { useTranslation } from 'react-i18next';
import { DownloadOutlined, EllipsisOutlined, KeyOutlined, PlusOutlined, ReloadOutlined, StarFilled } from '@ant-design/icons';
import { request } from '@/views/db-manager/utils/http';
import { IconButton } from '@/views/db-manager/icon-button';
import { getGlobalConfig } from '@/config';
import { SearchUtil } from '@/utils/search';
import axios from 'axios'
import { parseDisk } from '@/views/ssh/ssh-connect';

function checkSuccess(data, field: string) {
    if (field) {
        if (field.startsWith('/') && field.endsWith('/')) {
            const regExp = field.substring(1, field.length - 1)
            return (typeof data == 'string') && new RegExp(regExp).test(data)
                || (typeof data == 'object') && new RegExp(regExp).test(JSON.stringify(data))
        }
        else {
            return (typeof data == 'object') && data[field] == 'success'
        }
    }
    else {
        return true
    }
}

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
    const { t } = useTranslation()
    const [form] = Form.useForm()
    const [connected, setConnected] = useState(false)

    useEffect(() => {
        document.title = t('monitor')
    }, [])

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
    const [ filterPriority, setFilterPriority ] = useState(0)
    const config = getGlobalConfig()
    const comData = useRef({
        result: {
            total: 0,
            success: 0,
            fail: 0,
        }
    })
    const filteredList = useMemo(() => {
        let _list = SearchUtil.searchLike(list, keyword, {
            attributes: ['name', 'url'],
        })
        if (filterPriority) {
            _list = _list.filter(item => item.priority <= filterPriority)
        }
        return _list
        // if (!keyword) {
        //     return projects    
        // }
        // return projects.filter(p => p.name.toLowerCase().includes(keyword.toLowerCase()))
        // return projects
    }, [list, keyword, filterPriority])

    const enableNum = useMemo(() => {
        return filteredList.filter(item => item.enable != false).length
    }, [filteredList])

    async function _testItem(service) {
        const fIdx = list.findIndex(item => item.id == service.id)
        const { type, url, connectionId, contentField } = service
        console.log('url', url)
        list[fIdx]._id = new Date().getTime()
        list[fIdx].loading = true
        setList([...list])
        const startTime = new Date()
        let res
        let isTimeout = false
        let isSuccess
        let responseContent = ''

        if (type == 'database') {
            try {
                res = await axios.post(`${config.host}/mysql/health`, {
                    connectionId,
                }, {
                    timeout: 4000,
                    // noMessage: true,
                })
                isSuccess = true
            }
            catch (err) {
                console.log('err', err)
                isTimeout = err.message && err.message.includes('timeout')
                isSuccess = false
            }
        }
        else if (type == 'redis') {
            try {
                res = await axios.post(`${config.host}/redis/health`, {
                    connectionId,
                }, {
                    timeout: 4000,
                    // noMessage: true,
                })
                isSuccess = true
            }
            catch (err) {
                console.log('err', err)
                isTimeout = err.message && err.message.includes('timeout')
                isSuccess = false
            }
        }
        else if (type == 'ssh-disk') {
            try {
                res = await axios.post(`${config.host}/ssh/diskCheck`, {
                    connectionId,
                }, {
                    timeout: 4000,
                })
                const result = res?.data?.dfResult?.stdout
                if (result) {
                    const disks = parseDisk(result)
                    const alarmDisk = disks.find(disk => disk.percent / 100 > service.alarmValue)
                    if (alarmDisk) {
                        isSuccess = false
                    }
                    else {
                        isSuccess = true
                    }
                }
                else {
                    isSuccess = false
                }
            }
            catch (err) {
                console.log('err', err)
                isTimeout = err.message && err.message.includes('timeout')
                isSuccess = false
            }
        }
        else if (type == 'ping') {
            try {
                res = await axios.post(`${config.host}/ping/pingCheck`, {
                    ip: url,
                }, {
                    timeout: 4000,
                })
                const result = res?.data?.success
                if (result) {
                    isSuccess = true
                }
                else {
                    isSuccess = false
                }
            }
            catch (err) {
                console.log('err', err)
                isTimeout = err.message && err.message.includes('timeout')
                isSuccess = false
            }
        }
        else {
            try {
                res = await axios.post(`${config.host}/http/proxy`, {
                    url,
                }, {
                    timeout: 2 * 1000,
                    // noMessage: true,
                })
            }
            catch (err) {
                console.log('err', err)
                if (err.response) {
                    res = err.response
                }
                isTimeout = err.message && err.message.includes('timeout')
            }
            console.log('res/', res)
            // if ()
            
            isSuccess = res?.status == 200 && checkSuccess(res?.data, service.field)

            // if (service.field) {
            //     isSuccess = res?.status == 200 && (typeof res?.data == 'object') && res?.data[service.field] == 'success'
            // }
            // else {
            //     isSuccess = res && res.status == 200
            // }
        }
        console.log('flow/2', )
        list[fIdx].hasResult = true
        list[fIdx]._id = new Date().getTime()
        list[fIdx].status = isSuccess ? 'ok' : 'fail'
        list[fIdx].time = new Date().getTime() - startTime.getTime()
        list[fIdx].loading = false
        list[fIdx].isTimeout = isTimeout

        if (contentField) {
            if (contentField == 'TEXT') {
                responseContent = (typeof res?.data == 'string') ? res.data : ''
            }
            else {
                function hasValue(value) {
                    return !!value || value === 0
                }
                const value = get(res?.data, contentField)
                responseContent = hasValue(value) ? (typeof value == 'string' ? value : JSON.stringify(value)) : ''
            }
        }
        list[fIdx].responseContent = responseContent

        comData.current.result.success = list.filter(item => item.hasResult && item.status == 'ok').length
        comData.current.result.fail = list.filter(item => item.hasResult && item.status != 'ok').length

        if (res) {
            list[fIdx].response = {
                status: res.status,
                data: res.data,
                isJson: res.headers?.['content-type']?.includes('application/json'),
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
            total: filteredList.filter(item => item.enable !== false).length,
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
            const list = res.data.list
                .map(item => {
                    return {
                        priority: item.priority || 3,
                        ...item,
                    }
                })
                .sort((a, b) => {
                    return a.name.localeCompare(b.name)
                })
            setList(list)
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
            render(name, item) {
                const { enable = true } = item
                return (
                    <div
                        style={{
                            // textDecoration: enable ? 'none' : 'line-through',
                        }}
                    >
                        {name}
                    </div>
                )
            }
        },
        {
            title: '优先级',
            dataIndex: 'priority',
            width: 64,
            render(priority, item) {
                const { enable = true } = item
                if (!enable) {
                    return <div></div>
                }
                const colors = {
                    1: 'red',
                    2: 'orange',
                    3: 'blue',
                    4: 'default',
                    5: 'default',
                }
                return <Tag color={colors[priority]}>{priority}</Tag>
            }
        },
        {
            title: '状态',
            dataIndex: '_id',
            width: 280,
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
                                    style={{ color: colorMap[item.status] }}
                                >
                                    {item.status || '--'}
                                </div>
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
                                {!!item.hasResult &&
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
            title: '返回内容',
            dataIndex: '_id',
            width: 240,
            render(_, item) {
                return (
                    <div>{item.responseContent}</div>
                )
            },
        },
        // {
        //     title: '标签',
        //     dataIndex: 'tags',
        //     width: 240,
        //     // ellipsis: true,
        //     render(value = []) {
        //         return (
        //             <div>
        //                 {value.map(item => {
        //                     return <Tag key={item}>{item}</Tag>
        //                 })}
        //             </div>
        //         )
        //     }
        // },
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
            title: '状态字段',
            dataIndex: 'field',
            width: 80,
        },
        {
            title: '内容字段',
            dataIndex: 'contentField',
            width: 80,
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
                            onClick={() => {
                                setEditItem({
                                    ...item,
                                    id: '', // 根据 ID 判断新增还是编辑
                                })
                                setEditVisible(true)
                            }}
                        >
                            克隆
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
                            setTotalResult({
                                total: 0,
                                success: 0,
                                fail: 0,
                            })
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
            <Space>
                <Input
                    placeholder={t('filter')}
                    className={styles.keywordInput}
                    value={keyword}
                    allowClear
                    onChange={e => setKeyword(e.target.value)}
                />
                <Radio.Group
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                >
                    <Radio.Button value={0}>all</Radio.Button>
                    <Radio.Button value={1}>P1</Radio.Button>
                    <Radio.Button value={2}>P2</Radio.Button>
                    <Radio.Button value={3}>P3</Radio.Button>
                    {/* <Radio.Button value={4}>P4</Radio.Button> */}
                    {/* <Radio.Button value={5}>P5</Radio.Button> */}
                </Radio.Group>
            </Space>
            <div className={styles.statBox}>
                <div className={styles.item}>
                    总：{totalResult.total}
                </div>
                <div className={styles.item}>
                    成功：{totalResult.success}
                </div>
                <div className={styles.item}>
                    失败：
                    <span style={{ color: 'red' }}>{totalResult.fail}</span>
                </div>
                <div className={styles.item}>
                    列表数：{filteredList.length}
                </div>
                <div className={styles.item}>
                    启用：{enableNum}
                </div>
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
                    width={640}
                    onClose={() => {
                        setDetailVisible(false)
                    }}
                    
                >
                    {!!detailItem?.response &&
                        <div className={styles.responseBox}>
                            <div className={styles.header}>
                                <Space>
                                    status: 
                                    <Tag color={detailItem.response.status == 200 ? 'green' : 'red'}>
                                        {detailItem.response.status}
                                    </Tag>
                                </Space>
                            </div>
                            {!!detailItem.response.isJson ?
                                <pre>
                                    {JSON.stringify(detailItem.response.data, null, 4)}
                                </pre>
                            :
                                <pre>
                                    {JSON.stringify(detailItem.response.data)}
                                </pre>
                            }
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

    const editType = item?.id ? 'update' : 'create'
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
                priority: item.priority || 3,
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
                priority: 3,
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
            contentField: values.contentField,
            priority: values.priority,
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
        let isSuccess = res?.status == 200 && checkSuccess(res?.data, values.field)
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
                    <Input />
                </Form.Item>
                <Form.Item
                    name="field"
                    label="状态字段"
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="contentField"
                    label="内容字段"
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="priority"
                    label="优先级（1-5）"
                >
                    <InputNumber />
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
