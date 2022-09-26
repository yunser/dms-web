import { Button, Descriptions, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './git-home.module.less';
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
import { GitProject } from '../git-project';
import { request } from '@/views/db-manager/utils/http';
import { ProjectEditor } from '../project-edit';
// import { saveAs } from 'file-saver'

export function GitHome() {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [curProject, setCurProject] = useState(null)
    const [view, setView] = useState('list')
    // const [curTab, setCurTab] = useState('commit-list')
    const config = {
        host: 'http://localhost:10086',
    }
    const [projects, setProject] = useState([])
    // const projects = [
    //     {
    //         name: 'dms-new',
    //         path: '/Users/yunser/app/dms-new',
    //     },
    //     {
    //         name: 'git-auto',
    //         path: '/Users/yunser/app/git-auto',
    //     },
    // ]

    const [projectModalVisible, setProjectModalVisible] = useState(false)

    async function loadList() {
        let res = await request.post(`${config.host}/git/project/list`, {
            // projectPath,
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
            setProject(res.data.list)
            // setCurrent(res.data.current)
        }
    }

    useEffect(() => {
        loadList()
    }, [])

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
            {view == 'list' &&
                <div>
                    <Button
                        onClick={() => {
                            loadList()
                        }}
                    >刷新</Button>
                    <Button
                        onClick={() => {
                            setProjectModalVisible(true)
                        }}
                    >新建</Button>
                    <div className={styles.list}>
                        {projects.map(item => {
                            return (
                                <div
                                    className={styles.item}
                                    onClick={() => {
                                        setView('detail')
                                        setCurProject(item)
                                    }}
                                >{item.name}</div>
                            )
                        })}
                    </div>
                </div>
            }
            {view == 'detail' &&
                <GitProject
                    config={config}
                    project={curProject}
                    // projectPath={curProject.path}
                    onList={() => {
                        setView('list')
                    }}
                />
            }
            {projectModalVisible &&
                <ProjectEditor
                    config={config}
                    onCancel={() => {
                        setProjectModalVisible(false)
                    }}
                    onSuccess={() => {
                        setProjectModalVisible(false)
                        loadList()
                    }}
                />
            }
        </div>
    )
}
