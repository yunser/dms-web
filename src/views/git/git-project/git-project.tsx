import { Button, Descriptions, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import styles from './git-project.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons';
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
// import { saveAs } from 'file-saver'

export function GitProject({ config, event$, project, onList }) {
    const projectPath = project.path
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [curTab, setCurTab] = useState('status')
    // const [curTab, setCurTab] = useState('commit-list')
    const [branchs, setBranchs] = useState([])
    const [branchModalVisible, setBranchModalVisible] = useState(false)
    const [pullModalVisible, setPullhModalVisible] = useState(false)
    const [pushModalVisible, setPushModalVisible] = useState(false)
    const tabs = [
        {
            label: '文件状态',
            key: 'status',
        },
        {
            label: '提交记录',
            key: 'commit-list',
        },
    ]
    return (
        <div className={styles.gitApp}>
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
                    <div className={styles.header}>分支</div>
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
                    <div className={styles.header}>标签</div>
                    <TagList
                        config={config}
                        projectPath={projectPath}
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
                        activeKey={curTab}
                        onChange={key => {
                            setCurTab(key)
                        }}
                        items={tabs}
                    />
                    <Space>
                        {/* <Button
                            onClick={() => {
                                event$.emit({
                                    type: 'event_refresh_commit_list',
                                    data: {},
                                })
                            }}
                        >刷新提交</Button> */}
                        <Button
                            onClick={() => {
                                setBranchModalVisible(true)
                            }}
                        >分支</Button>
                        <Button
                            onClick={() => {
                                setPullhModalVisible(true)
                            }}
                        >抓取</Button>
                        <Button
                            onClick={() => {
                                setPushModalVisible(true)
                            }}
                        >推送</Button>
                    </Space>
                </div>
                <div className={styles.body}>
                    {curTab == 'status' &&
                        <GitStatus
                            config={config}
                            projectPath={projectPath}
                            onTab={() => {
                                setCurTab('commit-list')
                            }}
                        />
                    }
                    {curTab == 'commit-list' &&
                        <CommitList
                            config={config}
                            event$={event$}
                            projectPath={projectPath}
                            branchs={branchs}
                        />
                    }
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
        </div>
    )
}
