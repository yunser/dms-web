import { Button, Descriptions, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Popover, Space, Spin, Table, Tabs, Tag, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './production-home.module.less';
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

export function ProductionHome({ event$, onClickItem }) {
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

    const [images, setImages ] = useState([])
    const [treeData, setTreeData ] = useState([])
    const [selectedKeys, setSelectedKeys ] = useState([])
    const [ loading, setLoading ] = useState(false)
    const [activeIndex,setActiveIndex] = useState(0)

    console.log('render/selectedKeys', selectedKeys)
    

    const [list, setList] = useState([])

    async function loadList() {
        setLoading(true)
        setTreeData([])
        setAccessKeys([])
        setSelectedKeys([])
        
        let res = await request.post(`${config.host}/file/read`, {
            path: '/Users/yunser/.yunser/dms-cli/weapp.json',
        }, {
            // noMessage: true,
        })
        // console.log('res', res)
        if (res.success) {
            // setProjects([])
            const list = JSON.parse(res.data.content)
            setList(list)
            if (list[0]) {
                showItem(list[0])
            }
        }
        setLoading(false)
    }

    useEffect(() => {
        loadList()
    }, [])

    function showItem(item) {
        setImages(item.images.sort((a, b) => {
            return a.name.localeCompare(b.name)
        }))
    }
    // const path = ''

    return (
        <div className={styles.app}>
            <div className={styles.layoutLeft}>
                <Button
                    onClick={() => {
                        loadList()
                    }}
                >刷新</Button>
                {list.map(item => {
                    return (
                        <div
                            onClick={() => {
                                showItem(item)
                            }}
                        >
                            {item.name}
                        </div>
                    )
                })}
                <hr />
                {images.map(item => {
                    return (
                        <div className={styles.item}>
                            
                            <div className={styles.name}>{item.name}</div>
                        </div>
                    )
                })}
            </div>
            <div className={styles.layoutRight}>
                <div className={styles.list}>
                    {images.map(item => {
                        return (
                            <div className={styles.item}>
                                
                                <div className={styles.name}>{item.name}</div>
                                <img
                                    className={styles.img}
                                    src={`${config.host}/file/imagePreview?sourceType=local&path=${encodeURIComponent(item.path)}`}
                                />
                            </div>
                        )
                    })}
                </div>
            </div>

            
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
