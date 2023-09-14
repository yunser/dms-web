import { Button, Descriptions, Dropdown, Empty, Input, Menu, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './branch-list.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { ArrowDownOutlined, ArrowRightOutlined, ArrowUpOutlined, BranchesOutlined, DeleteOutlined, DownloadOutlined, EllipsisOutlined, PlusOutlined, RightOutlined, UpOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
import { request } from '@/views/db-manager/utils/http';
import { IconButton } from '@/views/db-manager/icon-button';
import { FullCenterBox } from '@/views/common/full-center-box';
import { BranchDeleteModal } from '../branch-delete';
import { BranchModal } from '../branch-modal';
import moment from 'moment';
import copy from 'copy-to-clipboard';
import { BranchRenameModal } from '../branch-rename';
import { SearchUtil } from '@/utils/search';
// import { saveAs } from 'file-saver'

export function BranchList({ config, event$, projectPath, onBranch }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()

    const [branchDeleteModalVisible, setBranchDeleteModalVisible] = useState(false)
    const [branchRenameModalVisible, setBranchRenameModalVisible] = useState(false)
    const [editBranch, setEditBranch] = useState(null)
    const [current, setCurrent] = useState('')
    const [allBranches, setAllBranches] = useState([])
    const [branchKeyword, setBranchKeyword] = useState('')
    const filteredBranches = useMemo(() => {
        return SearchUtil.searchLike(allBranches, branchKeyword, {
            attributes: ['name'],
        })
    }, [allBranches, branchKeyword])
    const [branches, setBranches] = useState([])
const [detailVisible, setDetailVisible] = useState(true)
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
        setEditBranch(item)
        setBranchDeleteModalVisible(true)
    }

    async function renameItem(item) {
        setEditBranch(item)
        setBranchRenameModalVisible(true)
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
                <div className={styles.title}
                    onClick={() => {
                        setDetailVisible(!detailVisible)
                    }}
                >
                    <BranchesOutlined />
                    {'    '}
                    {t('git.branches')}
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
                                opacity: branches.length > 0 ? 1 : 0.2,
                            }}
                        >
                            <RightOutlined />
                        </IconButton>
                    }
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
            {detailVisible &&
                <div>
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
                                            {/* <div className={styles.}></div> */}
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
                                        <div className={styles.tagBox}>
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
                                        </div>
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
                                                                label: t('rename'),
                                                                key: 'rename',
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
                                                            else if (key == 'rename') {
                                                                renameItem(item)
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
            {branchRenameModalVisible &&
                <BranchRenameModal
                    config={config}
                    projectPath={projectPath}
                    item={editBranch}
                    onCancel={() => {
                        setBranchRenameModalVisible(false)
                    }}
                    onSuccess={() => {
                        setBranchRenameModalVisible(false)
                        loadBranches()
                    }}
                />
            }

            {manageVisible &&
                <Modal
                    open={true}
                    title={t('git.branches')}
                    width={1200}
                    onCancel={() => {
                        setManageVisible(false)
                    }}
                    footer={null}
                >
                    <div className={styles.searchBox}>
                        <Input
                            placeholder={t('filter')}
                            value={branchKeyword}
                            allowClear={true}
                            onChange={e => {
                                setBranchKeyword(e.target.value)
                            }}
                        />
                    </div>
                    <Table
                        dataSource={filteredBranches}
                        size="small"
                        pagination={false}
                        scroll={{
                            y: 560,
                        }}
                        columns={[
                            {
                                title: t('name'),
                                dataIndex: 'name',
                            },
                            {
                                title: t('type'),
                                dataIndex: 'type',
                                width: 80,
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
                                width: 100,
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
                                                    if (item.name.startsWith('remotes/')) {
                                                        setBranchModaRemote(item.name)
                                                        setBranchModalVisible(true)
                                                    }
                                                    else {
                                                        setManageVisible(false)
                                                        switchItem(item)
                                                    }
                                                }}
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
