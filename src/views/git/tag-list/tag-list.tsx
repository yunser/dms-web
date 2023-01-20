import { Button, Descriptions, Dropdown, Empty, Input, Menu, message, Modal, Popover, Select, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './tag-list.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { DeleteOutlined, DownloadOutlined, EllipsisOutlined, PlusOutlined, TagOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
import { request } from '@/views/db-manager/utils/http';
import { IconButton } from '@/views/db-manager/icon-button';
import { TagEditor } from '../tag-edit';
import { FullCenterBox } from '@/views/common/full-center-box';
import { TagPushModal } from '../tag-push';
import { TagDeleteModal } from '../tag-delete';
// import { saveAs } from 'file-saver'

function RemoveTagList({ config, projectPath }) {
    const { t } = useTranslation()

    const [loading, setLoading] = useState(false)
    const [removeTags, setRemoveTags] = useState([])
    const [remotes, setRemotes] = useState([])
    const [curRemote, setCurRemote] = useState('')
    async function loadRemoveTags() {
        setLoading(true)
        setRemoveTags([])
        let res = await request.post(`${config.host}/git/tag/remoteList`, {
            projectPath,
            remoteName: curRemote,
        })
        setLoading(false)
        if (res.success) {
            const list = res.data.list.filter(item => !item.name.endsWith('^{}'))
            setRemoveTags(list)
            
            // refs/tags/20.10.30.1^{}
            // setCurrent(res.data.current)
        }
    }

    async function loadRemotes() {
        let res = await request.post(`${config.host}/git/remote/list`, {
            projectPath,
        })
        // console.log('res', res)
        if (res.success) {
            const remotes = res.data
            setRemotes(remotes)
            if (remotes.length) {
                setCurRemote(remotes[0].name)
            }
            // setCurrent(res.data.current)
        }
    }

    useEffect(() => {
        loadRemotes()
    }, [])

    useEffect(() => {
        if (!curRemote) {
            return
        }
        loadRemoveTags()
    }, [curRemote])

    function deleteRemoteTag(item) {
        Modal.confirm({
            // title: 'Confirm',
            // icon: <ExclamationCircleOutlined />,
            content: `${t('delete')}「${item.name}」?`,
            async onOk() {
                
                let ret = await request.post(`${config.host}/git/tag/deleteRemote`, {
                    projectPath,
                    remoteName: curRemote,
                    name: item.name,
                })
                // console.log('ret', ret)
                if (ret.success) {
                    // message.success('连接成功')
                    // onConnect && onConnect()
                    // onClose && onClose()
                    message.success(t('success'))
                    loadRemoveTags()
                    // onSuccess && onSuccess()
                }
            }
        })
    }

    return (
        <div>
            <Space className={styles.tool}>
                <div>remote:</div>
                <Select
                    value={curRemote}
                    style={{ width: 160 }}
                    onChange={value => {
                        setCurRemote(value)
                    }}
                    options={remotes.map(item => {
                        return {
                            label: item.name,
                            value: item.name,
                        }
                    })}
                />
            </Space>
            <Table
                loading={loading}
                dataSource={removeTags}
                size="small"
                pagination={false}
                columns={[
                    {
                        title: t('name'),
                        dataIndex: 'name',
                    },
                    // {
                    //     title: t('type'),
                    //     dataIndex: 'type',
                    //     render(_value, item) {
                    //         let type
                    //         if (item.name.startsWith('remotes/')) {
                    //             type = 'remote'
                    //         }
                    //         else {
                    //             type = 'local'
                    //         }
                    //         return (
                    //             <div>{type}</div>
                    //         )
                    //     }
                    // },
                    // {
                    //     title: t('git.commit'),
                    //     dataIndex: 'commit',
                    // },
                    // {
                    //     title: t('label'),
                    //     dataIndex: 'label',
                    //     render(value) {
                    //         return (
                    //             <div className={styles.labelCell}>{value}</div>
                    //         )
                    //     }
                    // },
                    {
                        title: t('actions'),
                        dataIndex: 'op',
                        render(_value, item) {
                            return (
                                <div>
                                    <Button
                                        size="small"
                                        onClick={() => {
                                            // setBranchDeleteModalVisible(true)
                                            // setEditBranch(item)
                                            deleteRemoteTag(item)
                                        }}
                                    >{t('delete')}</Button>
                                </div>
                            )
                        }
                    },
                ]}
            />
        </div>
    )
}

export function TagList({ config, event$, projectPath }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()

    const [pushVisible, setPushVisible] = useState(false)
    const [pushTag, setPushTag] = useState('')
    const [tagModalVisible, setTagModalVisible] = useState(false)
    const [tags, setTags] = useState([])
    const [deleteVisible, setDeleteVisible] = useState(false)
    const [deleteItem, setDeleteItem] = useState(null)
    
    // const [current, setCurrent] = useState('')
    const [manageVisible, setManageVisible] = useState(false)

    async function loadTags() {
        let res = await request.post(`${config.host}/git/tag/list`, {
            projectPath,
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
            setTags(res.data.list)
            // setCurrent(res.data.current)
        }
    }

    async function deleteItem2(item) {
        setDeleteItem(item)
        setDeleteVisible(true)
        return
        Modal.confirm({
            title: t('git.tag.delete'),
            // icon: <ExclamationCircleOutlined />,
            content: `${t('git.tag.delete.confirm')}「${item.name}」？`,
            async onOk() {
                
                let res = await request.post(`${config.host}/git/tag/delete`, {
                    projectPath,
                    name: item.name,
                })
                // console.log('ret', ret)
                if (res.success) {
                    // message.success('连接成功')
                    // onConnect && onConnect()
                    message.success(t('success'))
                    // onClose && onClose()
                    // onSuccess && onSuccess()
                    // loadBranches()
                    loadTags()
                    event$.emit({
                        type: 'event_refresh_branch',
                        data: {},
                    })
                    event$.emit({
                        type: 'event_reload_history',
                        data: {
                            commands: res.data.commands,
                        }
                    })
                }
            }
        })
    }

    useEffect(() => {
        loadTags()
    }, [])

    event$.useSubscription(msg => {
        // console.log('CommitList/onmessage', msg)
        // console.log(val);
        if (msg.type == 'event_refresh_tag') {
            // const { json } = msg.data
            // addJsonTab(json)
            loadTags()
        }
    })

    function exportTags() {
        event$.emit({
            type: 'event_show_json',
            data: {
                json: JSON.stringify(tags, null, 4)
            },
        })
    }

    return (
        <div>
            <div className={styles.header}>
                <div>
                    <TagOutlined />
                    {'    '}
                    {t('git.tag')}
                </div>
                <Space>
                    <IconButton
                        tooltip={t('git.tag.create')}
                        onClick={() => {
                            setTagModalVisible(true)
                        }}
                    >
                        <PlusOutlined />
                    </IconButton>
                    <Dropdown
                        trigger={['click']}
                        overlay={
                            <Menu
                                items={[
                                    {
                                        label: t('git.push'),
                                        key: 'push',
                                    },
                                    {
                                        label: t('manage'),
                                        key: 'manage',
                                    },
                                    {
                                        label: t('export_json'),
                                        key: 'export_json',
                                    },
                                ]}
                                onClick={({ key }) => {
                                    if (key == 'export_json') {
                                        exportTags()
                                    }
                                    else if (key == 'manage') {
                                        setManageVisible(true)
                                    }
                                    else if (key == 'push') {
                                        setPushTag(null)
                                        setPushVisible(true)
                                    }
                                }}
                            />
                        }
                    >
                        <IconButton
                            onClick={e => e.preventDefault()}
                        >
                            <EllipsisOutlined />
                        </IconButton>
                    </Dropdown>

                </Space>
            </div>
            {tags.length == 0 ?
                <FullCenterBox
                    height={160}
                >
                    <Empty />
                </FullCenterBox>
            :
                <div className={styles.list}>
                    {tags.map(item => {
                        return (
                            <div 
                                className={styles.item}
                                key={item.name}
                            >
                                <div className={styles.left}>
                                    <div className={styles.status}>
                                        {/* {item.name == current &&
                                            <div className={styles.current}></div>
                                        } */}
                                    </div>
                                    <div className={styles.name}>{item.name}</div>
                                </div>
                                <Space>
                                    <Dropdown
                                        trigger={['click']}
                                        overlay={
                                            <Menu
                                                items={[
                                                    {
                                                        label: t('git.push'),
                                                        key: 'push',
                                                    },
                                                    {
                                                        label: t('git.tag.delete'),
                                                        key: 'delete',
                                                        danger: true,
                                                    },
                                                ]}
                                                onClick={({ key }) => {
                                                    if (key == 'delete') {
                                                        deleteItem2(item)
                                                    }
                                                    else if (key == 'push') {
                                                        setPushVisible(true)
                                                        setPushTag(item.name)
                                                    }
                                                }}
                                            />
                                        }
                                    >
                                        <IconButton
                                            onClick={e => e.preventDefault()}
                                        >
                                            <EllipsisOutlined />
                                        </IconButton>
                                    </Dropdown>
                                </Space>
                            </div>
                        )
                    })}
                </div>
            }
            {tagModalVisible &&
                <TagEditor
                    projectPath={projectPath}
                    config={config}
                    event$={event$}
                    onCancel={() => {
                        setTagModalVisible(false)
                    }}
                    onSuccess={() => {
                        setTagModalVisible(false)
                        loadTags()
                        event$.emit({
                            type: 'event_refresh_commit_list',
                            data: {},
                        })
                    }}
                />
            }
            {manageVisible &&
                <Modal
                    open={true}
                    title={t('git.tag')}
                    width={800}
                    onCancel={() => {
                        setManageVisible(false)
                    }}
                    footer={null}
                >
                    <RemoveTagList
                        projectPath={projectPath}
                        config={config}
                    />
                </Modal>
            }
            {pushVisible &&
                <TagPushModal
                    projectPath={projectPath}
                    config={config}
                    tag={pushTag}
                    event$={event$}
                    onCancel={() => {
                        setPushVisible(false)
                    }}
                    onSuccess={() => {
                        setPushVisible(false)
                        // loadTags()
                        // event$.emit({
                        //     type: 'event_refresh_commit_list',
                        //     data: {},
                        // })
                    }}
                />
            }
            {deleteVisible &&
                <TagDeleteModal
                    projectPath={projectPath}
                    config={config}
                    tag={deleteItem}
                    event$={event$}
                    onCancel={() => {
                        setDeleteVisible(false)
                    }}
                    onSuccess={() => {
                        setDeleteVisible(false)
                        // loadTags()
                        loadTags()
                        event$.emit({
                            type: 'event_refresh_commit_list',
                            data: {},
                        })
                    }}

                />
            }
        </div>
    )
}
