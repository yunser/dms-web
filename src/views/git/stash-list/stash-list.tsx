import { Button, Descriptions, Dropdown, Empty, Input, Menu, message, Modal, Popover, Select, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './stash-list.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { DeleteOutlined, DownloadOutlined, DownOutlined, EllipsisOutlined, PlusOutlined, RightOutlined, TagOutlined, UpOutlined, WalletOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
import { request } from '@/views/db-manager/utils/http';
import { IconButton } from '@/views/db-manager/icon-button';
import { TagEditor } from '../tag-edit';
import { FullCenterBox } from '@/views/common/full-center-box';
import { TagPushModal } from '../tag-push';
import { TagDeleteModal } from '../tag-delete';
import copy from 'copy-to-clipboard';
import { StashEditor } from '../stash-edit';
// import { saveAs } from 'file-saver'


export function StashList({ config, event$, projectPath }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()

    const [pushVisible, setPushVisible] = useState(false)
    const [pushTag, setPushTag] = useState('')
    const [tagModalVisible, setTagModalVisible] = useState(false)
    const [tags, setTags] = useState([])
    const [deleteVisible, setDeleteVisible] = useState(false)
    const [deleteItem, setDeleteItem] = useState(null)
    const [detailVisible, setDetailVisible] = useState(false)
    // const [current, setCurrent] = useState('')
    const [manageVisible, setManageVisible] = useState(false)

    async function loadTags() {
        let res = await request.post(`${config.host}/git/stash/list`, {
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

    async function deleteAll() {
        // setDeleteItem(item)
        // setDeleteVisible(true)
        // return
        Modal.confirm({
            title: t('git.stash.delete'),
            // icon: <ExclamationCircleOutlined />,
            content: `${t('git.stash.delete.confirm')} ${t('all')}？`,
            okButtonProps: {
                danger: true,
            },
            async onOk() {
                
                let res = await request.post(`${config.host}/git/stash/clear`, {
                    projectPath,
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
                    // event$.emit({
                    //     type: 'event_refresh_branch',
                    //     data: {},
                    // })
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

    async function deleteItem2(item) {
        // setDeleteItem(item)
        // setDeleteVisible(true)
        // return
        Modal.confirm({
            title: t('git.stash.delete'),
            // icon: <ExclamationCircleOutlined />,
            content: `${t('git.stash.delete.confirm')}「${item.message}」？`,
            async onOk() {
                
                let res = await request.post(`${config.host}/git/stash/delete`, {
                    projectPath,
                    index: item.index,
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
                    // event$.emit({
                    //     type: 'event_refresh_branch',
                    //     data: {},
                    // })
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

    async function apply(item) {
        let res = await request.post(`${config.host}/git/stash/apply`, {
            projectPath,
            index: item.index,
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
                type: 'event_refresh_status',
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

    return (
        <div>
            <div className={styles.header}>
                <div className={styles.title}
                    onClick={() => {
                        setDetailVisible(!detailVisible)
                    }}
                >
                    <WalletOutlined />
                    {'    '}
                    {t('git.stash.list')}
                </div>
                <Space>
                    {detailVisible ?
                        <IconButton
                            tooltip={t('hide_content')}
                            onClick={() => {
                                setDetailVisible(false)
                            }}
                        >
                            <UpOutlined />
                        </IconButton>
                    :
                        <IconButton
                            tooltip={t('show_content')}
                            onClick={() => {
                                setDetailVisible(true)
                            }}
                            style={{
                                opacity: tags.length > 0 ? 1 : 0.2,
                            }}
                        >
                            <RightOutlined />
                        </IconButton>
                    }
                    <IconButton
                        tooltip={t('git.stash.create')}
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
                                    // {
                                    //     label: t('manage'),
                                    //     key: 'manage',
                                    // },
                                    {
                                        label: t('export_json'),
                                        key: 'export_json',
                                    },
                                    {
                                        label: t('clear_all'),
                                        key: 'clear_all',
                                        danger: true,
                                    },
                                ]}
                                onClick={({ key }) => {
                                    if (key == 'export_json') {
                                        exportTags()
                                    }
                                    else if (key == 'manage') {
                                        setManageVisible(true)
                                    }
                                    else if (key == 'clear_all') {
                                        deleteAll()
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
            {detailVisible &&
                <div>
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
                                            </div>
                                            <div className={styles.name}>{item.message}</div>
                                        </div>
                                        <Space>
                                            <Dropdown
                                                trigger={['click']}
                                                overlay={
                                                    <Menu
                                                        items={[
                                                            {
                                                                label: t('git.stash.apply'),
                                                                key: 'apply',
                                                            },
                                                            {
                                                                label: t('git.stash.delete'),
                                                                key: 'delete',
                                                                danger: true,
                                                            },
                                                        ]}
                                                        onClick={({ key }) => {
                                                            if (key == 'delete') {
                                                                deleteItem2(item)
                                                            }
                                                            else if (key == 'apply') {
                                                                // setPushVisible(true)
                                                                // setPushTag(item.name)
                                                                apply(item)
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
                </div>
            }
            {tagModalVisible &&
                <StashEditor
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
                            type: 'event_refresh_branch',
                            data: {},
                        })
                        event$.emit({
                            type: 'event_refresh_status',
                            data: {},
                        })
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
