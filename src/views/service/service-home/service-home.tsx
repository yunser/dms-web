import { Button, Descriptions, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Popover, Space, Spin, Table, Tabs, Tag, Tree } from 'antd';
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
            list[fIdx]._id = new Date().getTime()
            list[fIdx].loading = false
            list[fIdx].status = res.status == 200 ? 'OK' : 'fail'
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
                            <div>{item.status || '--'}</div>
                            <Button
                                size="small"
                            >
                                检测
                            </Button>
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
            <Table
                dataSource={filteredList}
                columns={columns}
                bordered
                size="small"
                pagination={false}
            />
        </div>
    )
}

