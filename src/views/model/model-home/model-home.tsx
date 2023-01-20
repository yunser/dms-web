import { Button, Descriptions, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Popover, Space, Spin, Table, Tabs, Tag, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './model-home.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { DownloadOutlined, EllipsisOutlined, ExportOutlined, KeyOutlined, PlusOutlined, ReloadOutlined, StarFilled } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
// import { GitProject } from '../git-project';
import { request } from '@/views/db-manager/utils/http';
// import { ProjectEditor } from '../project-edit';
import { IconButton } from '@/views/db-manager/icon-button';
import { FullCenterBox } from '@/views/common/full-center-box';
import { SwaggerDetail } from '../swagger-detail';
// import { saveAs } from 'file-saver'

export function ModelHome({ event$, onClickItem }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [curProject, setCurProject] = useState(null)
    const [view, setView] = useState('list')
    const [keyword, setKeyword] = useState('')
    // const [curTab, setCurTab] = useState('commit-list')
    const config = {
        host: 'http://localhost:10086',
    }
    const [accessKeys, setAccessKeys] = useState([])
    

    // const event$ = useEventEmitter()

    const [projectItem, setProjectItem] = useState(null)
    const [projectModalVisible, setProjectModalVisible] = useState(false)
    const [createType, setCreateType] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const [modalItem, setModalItem] = useState(false)

    const [treeData, setTreeData ] = useState([])
    const [selectedKeys, setSelectedKeys ] = useState([])
    const [ loading, setLoading ] = useState(false)

    console.log('render/selectedKeys', selectedKeys)
    

    const [list, setList] = useState([])
    const filterdList = useMemo(() => {
        function score(item) {
            if (item.isFavorite) {
                return 100
            }
            return 0
        }
        const sorter = (a, b) => {
            // return score(b) - score(a)
            return a.name.localeCompare(b.name)
        }
        
        if (!keyword) {
            return list.sort(sorter)
        }
        return list
            .filter(p => p.name.toLowerCase().includes(keyword.toLowerCase()))
            .sort(sorter)
    }, [list, keyword])
    
    async function loadList() {
        setLoading(true)
        setTreeData([])
        setAccessKeys([])
        setSelectedKeys([])
        
        let res = await request.post(`${config.host}/swagger/list`, {
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
            const list = res.data.list
            setList(list)
        }
        setLoading(false)
    }

    const models = [
        {
            id: '1',
            name: '列表响应',
        },
        {
            id: '2',
            name: '设备',
        },
        {
            id: '2',
            name: '住户',
        },
    ]

    const dics = [
        {
            id: '1',
            name: '处理状态 handleStatus',
            dic: [
                {
                    label: '未处理',
                    value: '0',
                },
                {
                    label: '已处理',
                    value: '1',
                },
            ]
        },
        {
            id: '2',
            name: '导出状态 exportStatus',
            dic: [
                {
                    label: '未导出',
                    value: '0',
                },
                {
                    label: '已导出',
                    value: '1',
                },
            ],
        },
        {
            id: '3',
            name: 'eventStatus',
            dic: [
                {
                    "label": "开始",
                    "value": "0"
                },
                {
                    "label": "结束",
                    "value": "6"
                }
            ],
        },
        {
            id: '4',
            name: 'contact person type',
            dic: [
                {
                    "label": "紧急联系人",
                    "value": "1"
                },
                {
                    "label": "监护人",
                    "value": "2"
                },
                {
                    "label": "负责人",
                    "value": "3"
                },
                {
                    "label": "亲友，监护人（呼叫）",
                    "value": "4"
                },
                {
                    "label": "亲友，非监护人（呼叫）",
                    "value": "5"
                }
            ],
        },
        {
            id: '5',
            name: 'ModelSubTypeKey',
            dic: [
                {
                    "label": "集抄表",
                    "value": "1"
                },
                {
                    "label": "物联网表",
                    "value": "2"
                },
                {
                    "label": "集中器",
                    "value": "3"
                },
                {
                    "label": "普通水表",
                    "value": "4"
                },
                {
                    "label": "电表",
                    "value": "5"
                }
            ],
        },
        {
            id: '6',
            name: 'DeviceSubTypeKey',
            dic: [
                {
                    "label": "大表",
                    "value": "2"
                },
                {
                    "label": "普表",
                    "value": "3"
                },
                {
                    "label": "集中器",
                    "value": "4"
                },
                {
                    "label": "小表",
                    "value": "5"
                }
            ],
        },
    ]

    function editProject(item) {
        setModalItem(item)
        setModalVisible(true)
    }

    async function deleteProject(item) {
        Modal.confirm({
            title: '',
            // icon: <ExclamationCircleOutlined />,
            content: `${t('delete')}「${item.name}」?`,
            async onOk() {
                let res = await request.post(`${config.host}/swagger/delete`, {
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

    useEffect(() => {
        // loadList()
    }, [])

    const columns = [
        {
            title: '名称',
            dataIndex: 'name',
        }
    ]

    {
        const text = `2 大表
        3 普表
        4 集中器
        5 小表
        `
        const dic = text
            .split('\n')
            .map(item => item.trim())
            .filter(item => item)
            .map(item => {
                const arr = item.split(/\s+/).map(item => item.trim()).filter(item => item)
                console.log('arr', arr)
                return {
                    label: arr[1],
                    value: arr[0],
                }
            })
        console.log('dic', JSON.stringify(dic, null, 4))
    }

    const dicColumns = [
        {
            title: '名称',
            dataIndex: 'name',
            width: 240,
        },
        {
            title: '字典',
            dataIndex: 'dic',
            render(value) {
                if (!value) {
                    return '--'
                }
                return (
                    <div>
                        {value.map(item => {
                            return (
                                <div>{item.value}: {item.label}</div>
                            )
                        })}
                    </div>
                )
            }
        },
    ]

    return (
        <div className={styles.app}>
            <div>实体</div>
            <Table
                dataSource={models}
                columns={columns}
            />
            <div>字典</div>
            <Table
                dataSource={dics}
                columns={dicColumns}
            />

            
            {/* {projectModalVisible &&
                <ProjectEditor
                    config={config}
                    item={projectItem}
                    createType={createType}
                    onCancel={() => {
                        setProjectModalVisible(false)
                    }}
                    onSuccess={() => {
                        setProjectModalVisible(false)
                        loadList()
                    }}
                />
            } */}
            {/* {cloneModalVisible &&
                <ProjectEditor
                    config={config}
                    sourceType="clone"
                    onCancel={() => {
                        setCloneModalVisible(false)
                    }}
                    onSuccess={() => {
                        setCloneModalVisible(false)
                        loadList()
                    }}
                />
            } */}
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
            let res = await request.post(`${config.host}/swagger/create`, {
                ...saveOrUpdateData,
            })
            if (res.success) {
                onSuccess && onSuccess()
            }
        }
        else {
            let res = await request.post(`${config.host}/swagger/update`, {
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
