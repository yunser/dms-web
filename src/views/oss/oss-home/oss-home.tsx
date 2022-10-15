import { Button, Descriptions, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Popover, Space, Spin, Table, Tabs, Tag, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './oss-home.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { DownloadOutlined, EllipsisOutlined, KeyOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
// import { GitProject } from '../git-project';
import { request } from '@/views/db-manager/utils/http';
// import { ProjectEditor } from '../project-edit';
import { IconButton } from '@/views/db-manager/icon-button';
import { FullCenterBox } from '@/views/db-manager/redis-client';
// import { saveAs } from 'file-saver'

export function OssHome({ onClickItem }) {
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
    

    const event$ = useEventEmitter()

    const [projectItem, setProjectItem] = useState(null)
    const [projectModalVisible, setProjectModalVisible] = useState(false)
    const [createType, setCreateType] = useState(false)
    const [modalVisible, setModalVisible] = useState(false)
    const [modalItem, setModalItem] = useState(false)

    const [treeData, setTreeData ] = useState([])
    const [selectedKeys, setSelectedKeys ] = useState([])
    const [ loading, setLoading ] = useState(false)

    console.log('render/selectedKeys', selectedKeys)
    const filterdBuckets = useMemo(() => {

        let filterAccessKeys = accessKeys
        if (selectedKeys.length) {
            const key0 = selectedKeys[0]
            console.log('key0', key0, accessKeys)
            filterAccessKeys = accessKeys.filter(item => item.id == key0)

        }

        let buckets = []
        filterAccessKeys.forEach(ak => {
            for (let bucket of ak.buckets) {
                buckets.push({
                    ...bucket,
                    // accessKey: {
                    // },
                    // 兼容列表点击
                    bucket: bucket.name,
                    accessKeyId: ak.accessKeyId,
                    accessKeySecret: ak.accessKeySecret,
                })
            }
        })

        if (!keyword) {
            return buckets    
        }
        return buckets.filter(p => p.name.toLowerCase().includes(keyword.toLowerCase()))
        // return projects
    }, [accessKeys, keyword, selectedKeys])

    async function loadList() {
        setLoading(true)
        setTreeData([])
        setAccessKeys([])
        setSelectedKeys([])
        
        let res = await request.post(`${config.host}/oss/accessKey/list`, {
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
            const accessKeys = res.data.list
            setAccessKeys(accessKeys)
            const treeData = accessKeys.map(item => {
                return {
                    title: (
                        <div className={styles.treeTitle}>
                            <Space>
                                <KeyOutlined />
                                <div className={styles.name}>{item.name}</div>
                            </Space>

                            <Dropdown
                                trigger={['click']}
                                overlay={
                                    <Menu
                                        items={[
                                            {
                                                label: t('edit'),
                                                key: 'edit',
                                            },
                                            {
                                                label: t('delete'),
                                                key: 'delete',
                                            },
                                        ]}
                                        onClick={({ key }) => {
                                            if (key == 'edit') {
                                                setModalItem(item)
                                                setModalVisible(true)
                                            }
                                            else if (key == 'delete') {
                                                deleteProject(item)
                                            }
                                        }}
                                    />
                                }
                            >
                                <IconButton
                                    // tooltip={t('add')}
                                    className={styles.refresh}
                                    // onClick={() => {
                                    //     setProjectModalVisible(true)
                                    // }}
                                >
                                    <EllipsisOutlined />
                                </IconButton>
                            </Dropdown>
                            {/* <IconButton
                                className={styles.refresh}
                                onClick={() => {
                                    // loadData()
                                    setModalItem(null)
                                    setModalVisible(true)
                                }}
                            >
                                <ReloadOutlined />
                            </IconButton> */}
                        </div>
                    ),
                    key: item.id,
                    data: {
                        ...item,
                    }
                }
            })
            // [
            //     {
            //       title: 'parent 1',
            //       key: '0-0',
            //     },
            //   ];
            setTreeData(treeData)
            // const buckets = []
            // accessKeys.forEach(ak => {
            //     buckets.push(...(ak.buckets || []))
            // })
            // setAccessKeys(buckets)
            // setBuckets(buckets)
            // setProjects(res.data.list.sort((a, b) => {
            //     return a.name.localeCompare(b.name)
            // }))
            // setCurrent(res.data.current)
        }
        setLoading(false)
    }

    useEffect(() => {
        loadList()
    }, [])

    function editProject(item) {
        setProjectModalVisible(true)
        setProjectItem(item)
    }

    async function deleteProject(item) {
        Modal.confirm({
            title: '',
            // icon: <ExclamationCircleOutlined />,
            content: `${t('delete')}「${item.name}」?`,
            async onOk() {
                let res = await request.post(`${config.host}/oss/accessKey/delete`, {
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


    return (
        <div className={styles.gitApp}>
            <div className={styles.layoutLeft}>
                <div className={styles.header}>
                    <Space>
                        <IconButton
                            tooltip={t('refresh')}
                            onClick={() => {
                                loadList()
                            }}
                        >
                            <ReloadOutlined />
                        </IconButton>
                        <IconButton
                            tooltip={t('add')}
                            // className={styles.refresh}
                            onClick={() => {
                                setModalVisible(true)
                                setModalItem(null)
                            }}
                        >
                            <PlusOutlined />
                        </IconButton>
                    </Space>
                </div>
                {loading ?
                    <FullCenterBox
                        height={300}
                    >
                        <Spin />
                    </FullCenterBox>
                :
                    <Tree
                        treeData={treeData}
                        selectedKeys={selectedKeys}
                        onSelect={(selectedKeys, info) => {
                            console.log('onSelect', selectedKeys)
                            setSelectedKeys(selectedKeys)
                        }}
                    />
                }
            </div>
            <div className={styles.layoutRight}>
                {view == 'list' &&
                    <div className={styles.listBox}>
                        <div className={styles.listContent}>
                            <div className={styles.tool}
                                
                            >
                                <Space>
                                    
                                    {/* <Dropdown
                                        trigger={['click']}
                                        overlay={
                                            <Menu
                                                items={[
                                                    {
                                                        label: t('git.clone_from_url'),
                                                        key: 'clone_from_url',
                                                    },
                                                    {
                                                        label: t('git.add_exists_local_repository'),
                                                        key: 'add_exists',
                                                    },
                                                    {
                                                        label: t('git.create_local_repository'),
                                                        key: 'create_git',
                                                    },
                                                ]}
                                                onClick={({ key }) => {
                                                    if (key == 'add_exists') {
                                                        setProjectModalVisible(true)
                                                        setProjectItem(null)
                                                        setCreateType('exists')
                                                    }
                                                    else if (key == 'clone_from_url') {
                                                        setCloneModalVisible(true)
                                                        setProjectItem(null)
                                                        setCreateType('clone')
                                                    }
                                                    else if (key == 'create_git') {
                                                        setProjectModalVisible(true)
                                                        setProjectItem(null)
                                                        setCreateType('init')
                                                    }
                                                }}
                                            />
                                        }
                                    >
                                        <IconButton
                                            // tooltip={t('add')}
                                            className={styles.refresh}
                                            // onClick={() => {
                                            //     setProjectModalVisible(true)
                                            // }}
                                        >
                                            <PlusOutlined />
                                        </IconButton>
                                    </Dropdown> */}
                                </Space>
                            </div>
                            <div>
                                <Input
                                    placeholder={t('filter')}
                                    value={keyword}
                                    allowClear
                                    onChange={e => {
                                        setKeyword(e.target.value)
                                    }}
                                />
                            </div>
                            {/* <div>{keyword}</div> */}
                            {filterdBuckets.length == 0 ?
                                <FullCenterBox
                                    height={320}
                                >
                                    <Empty />
                                </FullCenterBox>
                            :
                                <div className={styles.listWrap}>
                                    <div className={styles.list}>
                                        {filterdBuckets.map(item => {
                                            return (
                                                <div
                                                    key={item.id}
                                                    className={styles.item}
                                                    onClick={() => {
                                                        // setView('detail')
                                                        // setCurProject(item)
                                                        onClickItem && onClickItem(item)
                                                    }}
                                                >
                                                    <div className={styles.name}>{item.name}</div>
                                                    <Space
                                                        onClick={(e) => {
                                                            e.preventDefault()
                                                            e.stopPropagation()
                                                        }}
                                                    >
                                                        {!!item.changes && item.changes > 0 &&
                                                            <div className={styles.branch}>
                                                                <div className={styles.changes}>{item.changes}</div>
                                                            </div>
                                                        }
                                                        {!!item.branch &&
                                                            <div className={styles.branch}>
                                                                <Tag>{item.branch}</Tag>
                                                            </div>
                                                        }
                                                        {/* <Dropdown
                                                            trigger={['click']}
                                                            overlay={
                                                                <Menu
                                                                    items={[
                                                                        {
                                                                            label: t('edit'),
                                                                            key: 'edit',
                                                                        },
                                                                        {
                                                                            label: t('delete'),
                                                                            key: 'delete',
                                                                        },
                                                                    ]}
                                                                    onClick={({ key, domEvent }) => {
                                                                        // domEvent.preventDefault()
                                                                        domEvent.stopPropagation()
                                                                        if (key == 'delete') {
                                                                            deleteProject(item)
                                                                        }
                                                                        else if (key == 'edit') {
                                                                            editProject(item)
                                                                        }
                                                                    }}
                                                                />
                                                            }
                                                        >
                                                            <IconButton
                                                                // tooltip={t('add')}
                                                                className={styles.refresh}
                                                                // onClick={() => {
                                                                //     setProjectModalVisible(true)
                                                                // }}
                                                            >
                                                                <EllipsisOutlined />
                                                            </IconButton>
                                                        </Dropdown> */}
                                                    </Space>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
                }
            </div>
            {/* {view == 'detail' &&
                <GitProject
                    config={config}
                    event$={event$}
                    project={curProject}
                    // projectPath={curProject.path}
                    onList={() => {
                        setView('list')
                    }}
                />
            } */}
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



function DatabaseModal({ config, onCancel, item, onSuccess, onConnnect, }) {
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
            accessKeyId: values.accessKeyId,
            accessKeySecret: values.accessKeySecret,
        }
        if (editType == 'create') {
            let res = await request.post(`${config.host}/oss/accessKey/create`, {
                ...saveOrUpdateData,
            })
            if (res.success) {
                onSuccess && onSuccess()
            }
        }
        else {
            let res = await request.post(`${config.host}/oss/accessKey/update`, {
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
            title={editType == 'create' ? t('access_key.create') : t('access_key.update')}
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
                    name="accessKeyId"
                    label="AccessKey ID"
                    rules={[ { required: true, }, ]}
                >
                    <Input
                        // placeholder="localhost"
                    />
                </Form.Item>
                <Form.Item
                    name="accessKeySecret"
                    label="AccessKey Secret"
                    rules={[ { required: true, }, ]}
                >
                    <Input
                        // placeholder="localhost"
                    />
                </Form.Item>
                {/* <Form.Item
                    name="password"
                    label={t('password')}
                    rules={[{ required: true, },]}
                >
                    <InputPassword />
                </Form.Item> */}
            </Form>
        </Modal>
    );
}
