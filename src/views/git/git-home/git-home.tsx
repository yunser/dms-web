import { Button, Descriptions, Dropdown, Input, Menu, message, Modal, Popover, Space, Table, Tabs, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './git-home.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { DownloadOutlined, EllipsisOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
import { CommitList } from '../commit-list';
import { BranchList } from '../branch-list';
import { GitStatus } from '../git-status';
import { RemoteList } from '../remote-list';
import { GitProject } from '../git-project';
import { request } from '@/views/db-manager/utils/http';
import { ProjectEditor } from '../project-edit';
import { IconButton } from '@/views/db-manager/icon-button';
// import { saveAs } from 'file-saver'

export function GitHome() {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [curProject, setCurProject] = useState(null)
    const [view, setView] = useState('list')
    const [keyword, setKeyword] = useState('')
    // const [curTab, setCurTab] = useState('commit-list')
    const config = {
        host: 'http://localhost:10086',
    }
    const [projects, setProjects] = useState([])
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
    const filterdProjects = useMemo(() => {
        if (!keyword) {
            return projects    
        }
        return projects.filter(p => p.name.toLowerCase().includes(keyword.toLowerCase()))
        // return projects
    }, [projects, keyword])

    const event$ = useEventEmitter()

    const [cloneModalVisible, setCloneModalVisible] = useState(false)
    const [projectItem, setProjectItem] = useState(null)
    const [projectModalVisible, setProjectModalVisible] = useState(false)
    const [createType, setCreateType] = useState(false)

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
            setProjects(res.data.list.sort((a, b) => {
                return a.name.localeCompare(b.name)
            }))
            // setCurrent(res.data.current)
        }
    }

    useEffect(() => {
        loadList()
    }, [])

    function editProject(item) {
        setProjectModalVisible(true)
        setProjectItem(item)
    }

    async function deleteProject(item) {
        Modal.confirm({
            title: '',
            // icon: <ExclamationCircleOutlined />,
            content: `${t('delete')}「${item.name}」?（不会删除项目文件）`,
            async onOk() {
                let res = await request.post(`${config.host}/git/project/delete`, {
                    id: item.id,
                })
                console.log('get/res', res.data)
                if (res.success) {
                    message.success(t('success'))
                    // onSuccess && onSuccess()
                    loadList()
                    // loadKeys()
                    // setResult(null)
                    // setResult({
                    //     key: item,
                    //     ...res.data,
                    // })
                    // setInputValue(res.data.value)
                }
            }
        })
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
            {view == 'list' &&
                <div className={styles.listBox}>
                    <div className={styles.listContent}>
                        <div className={styles.tool}>
                            <Space>
                                <IconButton
                                    tooltip={t('refresh')}
                                    onClick={() => {
                                        loadList()
                                    }}
                                >
                                    <ReloadOutlined />
                                </IconButton>
                                <Dropdown
                                    overlay={
                                        <Menu
                                            items={[
                                                {
                                                    label: '从 URL 克隆',
                                                    key: 'clone_from_url',
                                                },
                                                {
                                                    label: '添加已经存在的本地仓库',
                                                    key: 'add_exists',
                                                },
                                                {
                                                    label: '创建本地仓库',
                                                    key: 'create_git',
                                                },
                                            ]}
                                            onClick={({ key }) => {
                                                if (key == 'add_exists') {
                                                    setProjectModalVisible(true)
                                                    setProjectItem(null)
                                                    setCreateType('exists')
                                                }
                                                else if (key == 'clone_from_url') {
                                                    setCloneModalVisible(true)
                                                    setProjectItem(null)
                                                    setCreateType('clone')
                                                }
                                                else if (key == 'create_git') {
                                                    setProjectModalVisible(true)
                                                    setProjectItem(null)
                                                    setCreateType('init')
                                                }
                                            }}
                                        />
                                    }
                                >
                                    <IconButton
                                        tooltip={t('add')}
                                        className={styles.refresh}
                                        // onClick={() => {
                                        //     setProjectModalVisible(true)
                                        // }}
                                    >
                                        <PlusOutlined />
                                    </IconButton>
                                </Dropdown>
                            </Space>
                        </div>
                        <div>
                            <Input
                                placeholder={t('filter')}
                                value={keyword}
                                allowClear
                                onChange={e => {
                                    setKeyword(e.target.value)
                                }}
                            />
                        </div>
                        {/* <div>{keyword}</div> */}
                        <div className={styles.list}>
                            {filterdProjects.map(item => {
                                return (
                                    <div
                                        key={item.id}
                                        className={styles.item}
                                        onClick={() => {
                                            setView('detail')
                                            setCurProject(item)
                                        }}
                                    >
                                        <div className={styles.name}>{item.name}</div>
                                        <Space>
                                            {!!item.branch &&
                                                <div className={styles.branch}>
                                                    <Tag>{item.branch}</Tag>
                                                </div>
                                            }
                                            <Dropdown
                                                overlay={
                                                    <Menu
                                                        items={[
                                                            {
                                                                label: '编辑',
                                                                key: 'edit',
                                                            },
                                                            {
                                                                label: '删除',
                                                                key: 'delete',
                                                            },
                                                        ]}
                                                        onClick={({ key, domEvent }) => {
                                                            // domEvent.preventDefault()
                                                            domEvent.stopPropagation()
                                                            if (key == 'delete') {
                                                                deleteProject(item)
                                                            }
                                                            else if (key == 'edit') {
                                                                editProject(item)
                                                            }
                                                        }}
                                                    />
                                                }
                                            >
                                                <IconButton
                                                    // tooltip={t('add')}
                                                    className={styles.refresh}
                                                    // onClick={() => {
                                                    //     setProjectModalVisible(true)
                                                    // }}
                                                >
                                                    <EllipsisOutlined />
                                                </IconButton>
                                            </Dropdown>
                                        </Space>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            }
            {view == 'detail' &&
                <GitProject
                    config={config}
                    event$={event$}
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
                    item={projectItem}
                    createType={createType}
                    onCancel={() => {
                        setProjectModalVisible(false)
                    }}
                    onSuccess={() => {
                        setProjectModalVisible(false)
                        loadList()
                    }}
                />
            }
            {cloneModalVisible &&
                <ProjectEditor
                    config={config}
                    sourceType="clone"
                    onCancel={() => {
                        setCloneModalVisible(false)
                    }}
                    onSuccess={() => {
                        setCloneModalVisible(false)
                        loadList()
                    }}
                />
            }
        </div>
    )
}
