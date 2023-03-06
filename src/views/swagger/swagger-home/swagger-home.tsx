import { Button, Descriptions, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Popover, Space, Spin, Table, Tabs, Tag, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './swagger-home.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { DownloadOutlined, EllipsisOutlined, ExportOutlined, KeyOutlined, PlusOutlined, QuestionOutlined, ReloadOutlined, StarFilled } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
// import { GitProject } from '../git-project';
import { request } from '@/views/db-manager/utils/http';
// import { ProjectEditor } from '../project-edit';
import { IconButton } from '@/views/db-manager/icon-button';
import { FullCenterBox } from '@/views/common/full-center-box';
import { SwaggerDetail } from '../swagger-detail';
import { getGlobalConfig } from '@/config';
import { SearchUtil } from '@/utils/search';
// import { saveAs } from 'file-saver'

export function SwaggerHome({ event$, onClickItem }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [curProject, setCurProject] = useState(null)
    const [view, setView] = useState('list')
    const [keyword, setKeyword] = useState('')
    // const [curTab, setCurTab] = useState('commit-list')
    const config = getGlobalConfig()
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
        
        // function score(item) {
        //     if (item.isFavorite) {
        //         return 100
        //     }
        //     return 0
        // }
        const sorter = (a, b) => {
            // return score(b) - score(a)
            return a.name.localeCompare(b.name)
        }

        return SearchUtil.searchLike(list, keyword, {
            attributes: ['name', 'url'],
        })
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
        loadList()
    }, [])

    function exportAllKeys() {
        console.log('list', list)
        event$.emit({
            type: 'event_show_json',
            data: {
                json: JSON.stringify(list, null, 4)
                // connectionId,
            },
        })
    }

    return (
        <div className={styles.gitApp}>
            {/* <div className={styles.layoutLeft}>
            </div> */}
            {view == 'list' &&
                <div className={styles.listBox}>
                    <div className={styles.listContent}>
                        <div className={styles.tool}
                            
                        >
                            <Space>
                                <IconButton
                                    tooltip={t('refresh')}
                                    className={styles.refresh}
                                    onClick={() => {
                                        // loadKey()
                                        loadList()
                                    }}
                                >
                                    <ReloadOutlined />
                                </IconButton>
                                <IconButton
                                    tooltip={t('add')}
                                    className={styles.refresh}
                                    onClick={() => {
                                        setModalItem(null)
                                        setModalVisible(true)
                                    }}
                                >
                                    <PlusOutlined />
                                </IconButton>
                                <IconButton
                                    tooltip={t('export_json')}
                                    // size="small"
                                    className={styles.refresh}
                                    onClick={() => {
                                        exportAllKeys()
                                    }}
                                >
                                    <ExportOutlined />
                                </IconButton>
                                <IconButton
                                    size="small"
                                    tooltip={t('help')}
                                    onClick={() => {
                                        event$.emit({
                                            type: 'event_show_help',
                                            data: {
                                                fileName: 'swagger',
                                            },
                                        })
                                    }}
                                >
                                    <QuestionOutlined />
                                </IconButton>
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
                        {filterdList.length == 0 ?
                            <FullCenterBox
                                height={320}
                            >
                                <Empty />
                            </FullCenterBox>
                        :
                            <div className={styles.listWrap}>
                                <div className={styles.list}>
                                    {filterdList.map(item => {
                                        return (
                                            <div
                                                key={item.id}
                                                className={styles.item}
                                                onClick={(e) => {
                                                    if (e.metaKey) {
                                                        if (item.url) {
                                                            window.open(`/swagger/detail?url=${item.url}`, '_blank')
                                                        }
                                                    }
                                                    else {
                                                        setView('detail')
                                                        setCurProject(item)
                                                    }
                                                    // onClickItem && onClickItem(item)
                                                }}
                                            >
                                                <div className={styles.content}>
                                                    <div className={styles.name}>{item.name}</div>
                                                    {!!item.isFavorite &&
                                                        // <IconButton
                                                        //     // tooltip={t('add')}
                                                        //     className={styles.favoriteIcon}
                                                        //     // onClick={() => {
                                                        //     //     setProjectModalVisible(true)
                                                        //     // }}
                                                        // >
                                                        // </IconButton>
                                                        <StarFilled className={styles.favoriteIcon} />
                                                    }
                                                    <div className={styles.url}>{item.url || item.path}</div>
                                                </div>
                                                <Space
                                                    className={styles.right}
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                    }}
                                                >
                                                    {/* {!!item.changes && item.changes > 0 &&
                                                        <div className={styles.branch}>
                                                            <div className={styles.changes}>{item.changes}</div>
                                                        </div>
                                                    }
                                                    {!!item.branch &&
                                                        <div className={styles.branch}>
                                                            <Tag>{item.branch}</Tag>
                                                        </div>
                                                    } */}
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
                                                                        danger: true,
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
                                                    </Dropdown>
                                                </Space>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        }
                    </div>
                </div>
                // <div className={styles.layoutRight}>
                // </div>
            }
            {view == 'detail' &&
                <SwaggerDetail
                    config={config}
                    event$={event$}
                    apiUrl={curProject.url}
                    project={curProject}
                    onHome={() => {
                        setView('list')
                    }}
                    // projectPath={curProject.path}
                    // onList={() => {
                    //     setView('list')
                    // }}
                />
            }
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
