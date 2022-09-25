import { Button, Descriptions, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import styles from './git-project.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { DownloadOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
import { CommitList } from '../commit-list';
import { BranchList } from '../branch-list';
import { GitStatus } from '../git-status';
import { RemoteList } from '../remote-list';
// import { saveAs } from 'file-saver'

export function GitProject({ projectPath, onList }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [curTab, setCurTab] = useState('status')
    // const [curTab, setCurTab] = useState('commit-list')
    const config = {
        host: 'http://localhost:10086',
    }

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
                {/* <Button
                    onClick={() => {
                        onList && onList()
                    }}
                >
                    返回列表</Button> */}
                <div className={styles.section}>
                    <div className={styles.header}>分支</div>
                    <BranchList
                        config={config}
                        projectPath={projectPath}
                    />
                </div>
                <div className={styles.section}>
                    <div className={styles.header}>远程</div>
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
                            projectPath={projectPath}
                        />
                    }
                </div>
            </div>
        </div>
    )
}
