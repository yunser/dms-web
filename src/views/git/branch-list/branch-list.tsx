import { Button, Descriptions, Dropdown, Empty, Input, Menu, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './branch-list.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { ArrowDownOutlined, ArrowRightOutlined, ArrowUpOutlined, BranchesOutlined, DeleteOutlined, DownloadOutlined, EllipsisOutlined, PlusOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
import { request } from '@/views/db-manager/utils/http';
import { IconButton } from '@/views/db-manager/icon-button';
import { FullCenterBox } from '@/views/common/full-center-box';
import { BranchDeleteModal } from '../branch-delete';
import { BranchModal } from '../branch-modal';
import moment from 'moment';
import copy from 'copy-to-clipboard';
// import { saveAs } from 'file-saver'

export function BranchList({ config, event$, projectPath, onBranch }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()

    const [branchDeleteModalVisible, setBranchDeleteModalVisible] = useState(false)
    const [editBranch, setEditBranch] = useState(null)
    const [current, setCurrent] = useState('')
    const [allBranches, setAllBranches] = useState([])
    const [branches, setBranches] = useState([])

    const [branchModalRemote, setBranchModaRemote] = useState('')
    const [branchModalVisible, setBranchModalVisible] = useState(false)

    // const [manageVisible, setManageVisible] = useState(true)
    const [manageVisible, setManageVisible] = useState(false)
    async function loadBranches() {
        let res = await request.post(`${config.host}/git/branch`, {
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

            // const branchs = []
            onBranch && onBranch(res.data.list)
            setAllBranches(res.data.list)
            setBranches(res.data.list.filter(item => {
                // 不显示远程的分支
                if (item.name.startsWith(('remotes/'))) {
                    return false
                }
                return true
            }))
            setCurrent(res.data.current)
        }
    }

    useEffect(() => {
        loadBranches()
    }, [])

    event$.useSubscription(msg => {
        // console.log('CommitList/onmessage', msg)
        // console.log(val);
        if (msg.type == 'event_refresh_branch') {
            // const { json } = msg.data
            // addJsonTab(json)
            loadBranches()
        }
    })

    async function deleteItem(item) {
        setBranchDeleteModalVisible(true)
        setEditBranch(item)
    }

    async function switchItem(item) {
        // Modal.confirm({
        //     title: '切换分支',
        //     // icon: <ExclamationCircleOutlined />,
        //     content: `确定将你的工作副本切换为「${item.name}」？`,
        //     async onOk() {
                
        //     }
        // })
        let res = await request.post(`${config.host}/git/checkout`, {
            projectPath,
            branchName: item.name,
        })
        // console.log('ret', ret)
        if (res.success) {
            // message.success('连接成功')
            // onConnect && onConnect()
            message.success(t('success'))
            // onClose && onClose()
            // onSuccess && onSuccess()
            loadBranches()
            event$.emit({
                type: 'event_reload_history',
                data: {
                    commands: res.data.commands,
                }
            })
            event$.emit({
                type: 'event_refresh_commit_list',
                data: {
                    commands: res.data.commands,
                }
            })
        }
    }

    function exportBranches() {
        event$.emit({
            type: 'event_show_json',
            data: {
                json: JSON.stringify(branches, null, 4)
            },
        })
    }

    return (
        <div className={styles.branchBox}>
            <div className={styles.header}>
                <div>
                    <BranchesOutlined />
                    {'    '}
                    {t('git.branches')}
                </div>
                <Space>
                    <IconButton
                        tooltip={t('git.branch.create')}
                        onClick={() => {
                            setBranchModaRemote('')
                            setBranchModalVisible(true)
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
                                        exportBranches()
                                    }
                                    else if (key == 'manage') {
                                        setManageVisible(true)
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
            {branches.length == 0 ?
                <FullCenterBox
                    height={160}
                >
                    <Empty />
                </FullCenterBox>
            :
                <div className={styles.list}>
                    {branches.map(item => {
                        let ahead = 0
                        let aheadM = item.label.match(/ahead (\d+)/)
                        if (aheadM) {
                            ahead = parseInt(aheadM[1])
                        }
                        let behind = 0
                        let behindM = item.label.match(/behind (\d+)/)
                        if (behindM) {
                            behind = parseInt(behindM[1])
                        }
                        return (
                            <div 
                                className={styles.item}
                                key={item.name}
                            >
                                <div className={styles.left}>
                                    <div className={styles.status}>
                                        {item.name == current &&
                                            <div className={styles.current}></div>
                                        }
                                    </div>
                                    <div className={styles.name}>{item.name}</div>
                                    {item.name != current &&
                                        <div className={styles.switch}>
                                            <IconButton
                                                tooltip={t('git.branch.switch')}
                                                onClick={async () => {
                                                    switchItem(item)
                                                }}
                                            >
                                                <ArrowRightOutlined />
                                            </IconButton>
                                        </div>
                                    }
                                </div>
                                {(ahead > 0 || behind > 0) &&
                                    <div className={styles.tag}>
                                        {ahead > 0 &&
                                            <div className={styles.tagItem}>
                                                <div className={styles.num}>{ahead}</div>
                                                <ArrowUpOutlined />
                                            </div>
                                        }
                                        {behind > 0 &&
                                            <div className={styles.tagItem}>
                                                <div className={styles.num}>{behind}</div>
                                                <ArrowDownOutlined />
                                            </div>
                                        }
                                    </div>
                                }
                                <Space>
                                    <Dropdown
                                        trigger={['click']}
                                        overlay={
                                            <Menu
                                                items={[
                                                    {
                                                        label: t('git.branch.switch'),
                                                        key: 'switch',
                                                        disabled: item.name == current,
                                                    },
                                                    {
                                                        label: t('git.branch.delete'),
                                                        key: 'delete',
                                                        danger: true,
                                                        disabled: item.name == current,
                                                    },
                                                    {
                                                        label: t('copy_name'),
                                                        key: 'copy_name',
                                                    },
                                                ]}
                                                onClick={({ key }) => {
                                                    if (key == 'delete') {
                                                        deleteItem(item)
                                                    }
                                                    else if (key == 'switch') {
                                                        switchItem(item)
                                                    }
                                                    else if (key == 'copy_name') {
                                                        copy(item.name)
                                                        message.success('copied')
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
            {branchModalVisible &&
                <BranchModal
                    config={config}
                    event$={event$}
                    // current={current}
                    remoteName={branchModalRemote}
                    projectPath={projectPath}
                    onCancel={() => {
                        setBranchModalVisible(false)
                    }}
                    onSuccess={() => {
                        setBranchModalVisible(false)
                        event$.emit({
                            type: 'event_refresh_branch',
                            data: {},
                        })
                        
                    }}
                />
            }
            {branchDeleteModalVisible &&
                <BranchDeleteModal
                    config={config}
                    event$={event$}
                    projectPath={projectPath}
                    branch={editBranch}
                    onCancel={() => {
                        setBranchDeleteModalVisible(false)
                    }}
                    onSuccess={() => {
                        setBranchDeleteModalVisible(false)
                        setManageVisible(false)
                    }}
                />
            }
            {manageVisible &&
                <Modal
                    open={true}
                    title={t('git.branch')}
                    width={1200}
                    onCancel={() => {
                        setManageVisible(false)
                    }}
                    footer={null}
                >
                    <Table
                        dataSource={allBranches}
                        size="small"
                        pagination={false}
                        columns={[
                            {
                                title: t('name'),
                                dataIndex: 'name',
                            },
                            {
                                title: t('type'),
                                dataIndex: 'type',
                                render(_value, item) {
                                    let type
                                    if (item.name.startsWith('remotes/')) {
                                        type = 'remote'
                                    }
                                    else {
                                        type = 'local'
                                    }
                                    return (
                                        <div>{type}</div>
                                    )
                                }
                            },
                            {
                                title: t('git.commit'),
                                dataIndex: 'commit',
                            },
                            {
                                title: t('label'),
                                dataIndex: 'label',
                                render(value) {
                                    return (
                                        <div className={styles.labelCell}>{value}</div>
                                    )
                                }
                            },
                            {
                                title: t('time'),
                                dataIndex: ['commitObj', 'date'],
                                render(value) {
                                    if (!value) {
                                        return '?'
                                    }
                                    return (
                                        <div>{moment(value).format('YYYY-MM-DD HH:mm')}</div>
                                        // <div className={styles.labelCell}>{value}</div>
                                    )
                                }
                            },
                            {
                                title: t('actions'),
                                dataIndex: 'op',
                                render(_value, item) {
                                    return (
                                        <Space>
                                            <Button
                                                size="small"
                                                onClick={() => {
                                                    setBranchModaRemote(item.name)
                                                    setBranchModalVisible(true)
                                                }}
                                                disabled={!item.name.startsWith('remotes/')}
                                            >{t('git.checkout')}</Button>
                                            <Button
                                                size="small"
                                                danger
                                                onClick={() => {
                                                    setBranchDeleteModalVisible(true)
                                                    setEditBranch(item)
                                                }}
                                            >{t('delete')}</Button>
                                        </Space>
                                    )
                                }
                            },
                        ]}
                    />
                </Modal>
            }
        </div>
    )
}
