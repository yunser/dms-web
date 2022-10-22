import { Button, Descriptions, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Popover, Space, Spin, Table, Tabs, Tag, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './json-table.module.less';
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
import { FullCenterBox } from '@/views/db-manager/redis-client';
import moment from 'moment';
// import { saveAs } from 'file-saver'


function JsonTableViewer({ item, config }) {

    const [list, setList] = useState([])
    // const columns = [
    //     {
    //         title: '实例名称',
    //         dataIndex: 'instanceName',
    //     },
    //     {
    //         title: '到期时间',
    //         dataIndex: 'expiredTime',
    //     },
    // ]
    const columns = useMemo(() => {
        return item.columns.map(item => {
            const textRender = (value) => {
                return <div>{value}</div>
            }
            const dateRender = (value) => {
                const m = moment(value)
                return <div>{m.format('YYYY-MM-DD HH:mm:ss')}</div>
            }
            return {
                ...item,
                render: item.render == 'DATE' ? dateRender : textRender
            }
        })
    }, [item])

    async function loadData() {
        // const values = await form.validateFields()
        // setConnecting(true)
        let res = await request.post(`${config.host}/file/read`, {
            path: item.path,
        })
        if (res.success) {
            const list = JSON.parse(res.data.content)
            setList(list)
            // onSuccess && onSuccess()
            // message.success(t('success'))
            // setConnected(true)
        }
        // setConnecting(false)
    }

    useEffect(() => {
        loadData()
    }, [])

    return (
        <div>
            <Table
                dataSource={list}
                columns={columns}
                bordered
            />
        </div>
    )
}

export function JsonTable({ config, onClickItem }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [form] = Form.useForm()
    const [connecting, setConnecting] = useState(false)
    const [connected, setConnected] = useState(false)
    const [content, setContent] = useState('')

    const [detailItem, setDetailItem] = useState(null)
    const [detailVisible, setDetailVisible] = useState(false)

    const [list, setList] = useState([
        {
            name: 'ECS',
            path: '/Users/yunser/app/dms-projects/aliyun-cli/ecs.json',
            columns: [
                {
                    title: '实例名称',
                    dataIndex: 'instanceName',
                },
                {
                    title: '到期时间',
                    dataIndex: 'expiredTime',
                    render: 'DATE',
                },
            ],
        },
        {
            name: 'RDS',
            path: '/Users/yunser/app/dms-projects/aliyun/rds.json',
            columns: [
                {
                    title: '实例名称',
                    dataIndex: 'DBInstanceDescription',
                },
                {
                    title: '到期时间',
                    dataIndex: 'expireTime',
                    render: 'DATE',
                },
            ],
        },
    ])

    const columns = [
        {
            title: '名称',
            dataIndex: 'name',
            width: 160,
        },
        {
            title: '操作',
            dataIndex: 'op',
            render(_value, item) {
                return (
                    <div>
                        <a
                            onClick={() => {
                                setDetailVisible(true)
                                setDetailItem(item)
                            }}
                        >
                            查看</a>
                    </div>
                )
            }
        },
        {
            title: '',
            dataIndex: '__empty',
        },
    ]

    return (
        <div className={styles.container}>
            {/* 111 */}
            <Table
                dataSource={list}
                columns={columns}
                bordered
            />
            {detailVisible &&
                <Modal
                    title="详情"
                    open={true}
                    width={1200}
                    footer={null}
                    onCancel={() => {
                        setDetailVisible(false)
                    }}
                >
                    <JsonTableViewer
                        config={config}
                        item={detailItem}
                    />
                </Modal>
            }
        </div>
    )
}

