import { Button, Descriptions, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import styles from './git-project.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { ArrowDownOutlined, ArrowLeftOutlined, ArrowUpOutlined, BranchesOutlined, DownloadOutlined, PullRequestOutlined, ReloadOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
import { CommitList } from '../commit-list';
import { BranchList } from '../branch-list';
import { GitStatus } from '../git-status';
import { RemoteList } from '../remote-list';
import { TagList } from '../tag-list';
import { ProjectEditor } from '../project-edit';
import { IconButton } from '@/views/db-manager/icon-button';
import { PushModal } from '../push-modal';
import { PullModal } from '../pull-modal';
import { BranchModal } from '../branch-modal';
import { MergeModal } from '../merge-modal';
// import { saveAs } from 'file-saver'

export function GitProject({ config, event$, project, onList }) {
    const projectPath = project.path
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [curTab, setCurTab] = useState('status')
    // const [curTab, setCurTab] = useState('commit-list')
    const [branchs, setBranchs] = useState([])
    const [mergeModalVisible, setMergeModalVisible] = useState(false)
    const [branchModalVisible, setBranchModalVisible] = useState(false)
    const [pullModalVisible, setPullhModalVisible] = useState(false)
    const [pushModalVisible, setPushModalVisible] = useState(false)
    const [allKey, setAllKey] = useState('0')

    const tabs = [
        {
            label: t('git.changes'),
            key: 'status',
        },
        {
            label: t('git.commit'),
            key: 'commit-list',
        },
    ]

    event$.useSubscription(msg => {
        console.log('CommitList/onmessage', msg)
        // console.log(val);
        if (msg.type == 'event_refresh_all') {
            // const { json } = msg.data
            // addJsonTab(json)
            setAllKey('' + new Date().getTime())
        }
    })
    
    return (
        <div className={styles.gitApp}
            key={allKey}
        >
            <div className={styles.layoutLeft}>
                <div className={styles.header}>
                    <IconButton
                        tooltip="返回列表"
                        onClick={() => {
                            onList && onList()
                        }}
                    >
                        <ArrowLeftOutlined />
                    </IconButton>
                    <div className={styles.projectName}>{project.name}</div>
                </div>
                {/* <Button
                    onClick={() => {
                        onList && onList()
                    }}
                >
                    </Button> */}
                <div className={styles.section}>
                    <BranchList
                        config={config}
                        event$={event$}
                        projectPath={projectPath}
                        onBranch={branchs => {
                            setBranchs(branchs)
                        }}
                    />
                </div>
                <div className={styles.section}>
                    <TagList
                        config={config}
                        projectPath={projectPath}
                        event$={event$}
                    />
                </div>
                <div className={styles.section}>
                    <RemoteList
                        config={config}
                        projectPath={projectPath}
                    />
                </div>
            </div>
            <div className={styles.layoutRight}>
                <div className={styles.header}>
                    <Tabs
                        className={styles.tab}
                        activeKey={curTab}
                        onChange={key => {
                            setCurTab(key)
                        }}
                        tabBarGutter={-1}
                        items={tabs}
                        type="card"
                        size="large"
                    />
                    <Space>
                        <Button
                            size="small"
                            onClick={() => {
                                event$.emit({
                                    type: 'event_refresh_all',
                                    data: {},
                                })
                            }}
                            icon={<ReloadOutlined />}
                        >
                            {t('refresh')}
                        </Button>
                        <Button
                            size="small"
                            onClick={() => {
                                setBranchModalVisible(true)
                            }}
                            icon={<BranchesOutlined />}
                        >
                            {t('git.branches')}
                        </Button>
                        <Button
                            size="small"
                            onClick={() => {
                                setMergeModalVisible(true)
                            }}
                            icon={<PullRequestOutlined />}
                        >
                            {t('git.merge')}
                        </Button>
                        <Button
                            size="small"
                            icon={<ArrowDownOutlined />}
                            onClick={() => {
                                setPullhModalVisible(true)
                            }}
                        >
                            {t('git.pull')}
                        </Button>
                        <Button
                            size="small"
                            icon={<ArrowUpOutlined />}
                            onClick={() => {
                                setPushModalVisible(true)
                            }}
                        >
                            {t('git.push')}
                        </Button>
                    </Space>
                </div>
                <div className={styles.body}>
                    {tabs.map(item => {
                        return (
                            <div
                                className={styles.tabContent}
                                key={item.key}
                                style={{
                                    // visibility: item.key == activeKey ? 'visible' : 'hidden',
                                    display: item.key == curTab ? undefined : 'none',
                                }}
                            >
                                {item.key == 'status' &&
                                    <GitStatus
                                        config={config}
                                        projectPath={projectPath}
                                        event$={event$}
                                        onTab={() => {
                                            setCurTab('commit-list')
                                        }}
                                    />
                                }
                                {item.key == 'commit-list' &&
                                    <CommitList
                                        config={config}
                                        event$={event$}
                                        projectPath={projectPath}
                                        branchs={branchs}
                                    />
                                }
                            </div>
                        )
                    })}
                </div>
            </div>
            {pushModalVisible &&
                <PushModal
                    config={config}
                    projectPath={projectPath}
                    onCancel={() => {
                        setPushModalVisible(false)
                    }}
                    onSuccess={() => {
                        setPushModalVisible(false)
                        event$.emit({
                            type: 'event_refresh_commit_list',
                            data: {},
                        })
                    }}
                />
            }
            {pullModalVisible &&
                <PullModal
                    config={config}
                    projectPath={projectPath}
                    onCancel={() => {
                        setPullhModalVisible(false)
                    }}
                    onSuccess={() => {
                        setPullhModalVisible(false)
                        event$.emit({
                            type: 'event_refresh_commit_list',
                            data: {},
                        })
                    }}
                />
            }
            {branchModalVisible &&
                <BranchModal
                    config={config}
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
            {mergeModalVisible &&
                <MergeModal
                    config={config}
                    projectPath={projectPath}
                    onCancel={() => {
                        setMergeModalVisible(false)
                    }}
                    onSuccess={() => {
                        setMergeModalVisible(false)
                        event$.emit({
                            type: 'event_refresh_commit_list',
                            data: {},
                        })
                        event$.emit({
                            type: 'event_refresh_branch',
                            data: {},
                        })
                    }}
                />
            }
        </div>
    )
}
