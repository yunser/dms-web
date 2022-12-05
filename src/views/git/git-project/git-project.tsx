import { Button, Descriptions, Dropdown, Input, Menu, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import styles from './git-project.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { ArrowDownOutlined, ArrowLeftOutlined, ArrowUpOutlined, BranchesOutlined, DownloadOutlined, EllipsisOutlined, PullRequestOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons';
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
import { HistoryList } from '../history-list';
import { UserSetting } from '../user-setting';
import { request } from '@/views/db-manager/utils/http';
import { GitStat } from '../git-stat';
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
    const [userSettingModalVisible, setUserSettingModalVisible] = useState(false)
    const [allKey, setAllKey] = useState('0')

    const tabs = [
        {
            label: t('git.changes'),
            key: 'status',
        },
        {
            label: t('git.commits'),
            key: 'commit-list',
        },
        {
            label: t('git.stat'),
            key: 'git-stat',
        },
        {
            label: t('more'),
            key: 'git-more',
        },
    ]

    event$.useSubscription(msg => {
        // console.log('CommitList/onmessage', msg)
        // console.log(val);
        if (msg.type == 'event_refresh_all') {
            // const { json } = msg.data
            // addJsonTab(json)
            setAllKey('' + new Date().getTime())
        }
    })
    
    async function openInTerminal(path: string) {
        let ret = await request.post(`${config.host}/openInTerminal`, {
            path,
        })
        // if (ret.success) {
        // }
    }

    async function openInFinder(path: string) {
        let ret = await request.post(`${config.host}/file/openInFinder`, {
            sourceType: 'local',
            path,
        })
        if (ret.success) {
        }
    }
    
    return (
        <div className={styles.gitApp}
            key={allKey}
        >
            <div className={styles.layoutLeft}>
                <div className={styles.header}>
                    <Space>
                        <IconButton
                            // tooltip="返回列表"
                            tooltip={t('back')}
                            onClick={() => {
                                onList && onList()
                            }}
                        >
                            <ArrowLeftOutlined />
                        </IconButton>
                        <div className={styles.projectName}>{project.name}</div>
                    </Space>
                    <Dropdown
                        overlay={
                            <Menu
                                onClick={({ key }) => {
                                    if (key == 'open_in_finder') {
                                        openInFinder(projectPath)
                                    }
                                    else if (key == 'open_in_terminal') {
                                        openInTerminal(projectPath)
                                    }
                                }}
                                items={[
                                    {
                                        label: t('file.open_in_finder'),
                                        key: 'open_in_finder',
                                    },
                                    {
                                        label: t('open_in_terminal'),
                                        key: 'open_in_terminal',
                                    },
                                ]}
                            />
                        }
                    >
                        <IconButton
                            onClick={e => e.preventDefault()}
                        >
                            <EllipsisOutlined />
                        </IconButton>
                        {/* <a
                        >
                        </a> */}
                    </Dropdown>
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
                        event$={event$}
                        projectPath={projectPath}
                    />
                </div>
                <div className={styles.section}>
                    <HistoryList
                        config={config}
                        event$={event$}
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
                        {/* <Button
                            size="small"
                            onClick={() => {
                                setBranchModalVisible(true)
                            }}
                            icon={<BranchesOutlined />}
                        >
                            {t('git.branches')}
                        </Button> */}
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
                        <IconButton
                            tooltip={t('setting')}
                            onClick={() => {
                                setUserSettingModalVisible(true)
                            }}
                        >
                            <SettingOutlined />
                        </IconButton>
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
                                {item.key == 'git-stat' &&
                                    <GitStat
                                        config={config}
                                        event$={event$}
                                        projectPath={projectPath}
                                        branchs={branchs}
                                    />
                                }
                                {item.key == 'git-more' &&
                                    <div className={styles.moreBox}>
                                        <a href="https://git-scm.com/doc" target="_blank">
                                            {t('doc')}
                                        </a>
                                    </div>
                                }
                            </div>
                        )
                    })}
                </div>
            </div>
            {pushModalVisible &&
                <PushModal
                    config={config}
                    event$={event$}
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
                    event$={event$}
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
                    event$={event$}
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
                    event$={event$}
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
            {userSettingModalVisible &&
                <UserSetting
                    config={config}
                    event$={event$}
                    projectPath={projectPath}
                    onCancel={() => {
                        setUserSettingModalVisible(false)
                    }}
                    onSuccess={() => {
                        setUserSettingModalVisible(false)
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
