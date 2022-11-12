import { Button, Descriptions, Dropdown, Empty, Input, InputRef, Menu, message, Modal, Popover, Space, Table, Tabs, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './git-home.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { DownloadOutlined, EllipsisOutlined, ExportOutlined, PlusOutlined, ReloadOutlined, StarFilled } from '@ant-design/icons';
import { GitProject } from '../git-project';
import { request } from '@/views/db-manager/utils/http';
import { ProjectEditor } from '../project-edit';
import { IconButton } from '@/views/db-manager/icon-button';
import { FullCenterBox } from '@/views/db-manager/redis-client';
import moment from 'moment';
// import { saveAs } from 'file-saver'

function visibleFilter(list) {
    return list.filter(item => item.visible != false)
}

export function GitHome({ event$, }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [curProject, setCurProject] = useState(null)
    const [view, setView] = useState('list')
    const [keyword, setKeyword] = useState('')
    const searchInputRef = useRef<InputRef>(null)
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

    // const event$ = useEventEmitter()

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
            // setProjects([])
            function score(item) {
                if (item.isFavorite) {
                    if (item.favoriteTime) {
                        return moment(item.favoriteTime).toDate().getTime()
                    }
                    return 100
                }
                return 0
            }
            setProjects(res.data.list.sort((a, b) => {
                // if (a)
                if ((a.isFavorite != b.isFavorite) || (a.favoriteTime != b.favoriteTime)) {
                    return score(b) - score(a)
                }
                return a.name.localeCompare(b.name)
            }))
            // setCurrent(res.data.current)
        }
    }

    useEffect(() => {
        loadList()
    }, [])

    useEffect(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus()
        }
    }, [searchInputRef.current])

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

    async function openInFinder(path: string) {
        let ret = await request.post(`${config.host}/file/openInFinder`, {
            sourceType: 'local',
            path,
        })
        if (ret.success) {
        }
    }

    async function addToFavorite(item, isFavorite) {
        let res = await request.post(`${config.host}/git/project/update`, {
            id: item.id,
            data: {
                isFavorite,
                favoriteTime: isFavorite ? new Date().toISOString() : null,
            },
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
        // Modal.confirm({
        //     title: '',
        //     // icon: <ExclamationCircleOutlined />,
        //     content: `${t('delete')}「${item.name}」?（不会删除项目文件）`,
        //     async onOk() {
        //     }
        // })
    }

    return (
        <div className={styles.gitApp}>
            {view == 'list' &&
                <div className={styles.listBox}>
                    <div className={styles.listContent}>
                        <div className={styles.tool}
                            
                        >
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
                                    trigger={['click']}
                                    overlay={
                                        <Menu
                                            items={[
                                                {
                                                    label: t('git.clone_from_url'),
                                                    key: 'clone_from_url',
                                                },
                                                {
                                                    label: t('git.add_exists_local_repository'),
                                                    key: 'add_exists',
                                                },
                                                {
                                                    label: t('git.create_local_repository'),
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
                                        // tooltip={t('add')}
                                        className={styles.refresh}
                                        // onClick={() => {
                                        //     setProjectModalVisible(true)
                                        // }}
                                    >
                                        <PlusOutlined />
                                    </IconButton>
                                </Dropdown>
                                <IconButton
                                    tooltip={t('export_json')}
                                    onClick={() => {
                                        event$.emit({
                                            type: 'event_show_json',
                                            data: {
                                                json: JSON.stringify(projects, null, 4)
                                            },
                                        })
                                    }}
                                >
                                    <ExportOutlined />
                                </IconButton>
                            </Space>
                        </div>
                        <div>
                            <Input
                                ref={searchInputRef}
                                placeholder={t('filter')}
                                value={keyword}
                                allowClear
                                autoFocus={true}
                                onChange={e => {
                                    setKeyword(e.target.value)
                                }}
                            />
                        </div>
                        {/* <div>{keyword}</div> */}
                        {filterdProjects.length == 0 ?
                            <FullCenterBox
                                height={320}
                            >
                                <Empty />
                            </FullCenterBox>
                        :
                            <div className={styles.listWrap}>
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
                                                <Space>
                                                    <div className={styles.name}>{item.name}</div>
                                                    {!!item.isFavorite &&
                                                        // <IconButton
                                                        //     // tooltip={t('add')}
                                                        //     className={styles.favoriteIcon}
                                                        //     // onClick={() => {
                                                        //     //     setProjectModalVisible(true)
                                                        //     // }}
                                                        // >
                                                        // </IconButton>
                                                        <StarFilled className={styles.favoriteIcon} />
                                                    }
                                                </Space>
                                                <Space
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                    }}
                                                >
                                                    {!!item.changes && item.changes > 0 &&
                                                        <div className={styles.branch}>
                                                            <div className={styles.changes}>{item.changes}</div>
                                                        </div>
                                                    }
                                                    {!!item.branch &&
                                                        <div className={styles.branch}>
                                                            <Tag>{item.branch}</Tag>
                                                        </div>
                                                    }
                                                    <Dropdown
                                                        trigger={['click']}
                                                        overlay={
                                                            <Menu
                                                                items={visibleFilter([
                                                                    {
                                                                        label: t('edit'),
                                                                        key: 'edit',
                                                                    },
                                                                    {
                                                                        label: t('delete'),
                                                                        key: 'delete',
                                                                        danger: true,
                                                                    },
                                                                    {
                                                                        type: 'divider',
                                                                    },
                                                                    {
                                                                        visible: !item.isFavorite,
                                                                        label: t('add_to_favorite'),
                                                                        key: 'add_to_favorite',
                                                                    },
                                                                    {
                                                                        visible: !!item.isFavorite,
                                                                        label: t('remove_from_favorite'),
                                                                        key: 'remove_from_favorite',
                                                                    },
                                                                    {
                                                                        label: t('export_json'),
                                                                        key: 'export_json',
                                                                    },
                                                                    {
                                                                        label: t('file.open_in_finder'),
                                                                        key: 'open_in_finder',
                                                                    },
                                                                    
                                                                ])}
                                                                onClick={({ key, domEvent }) => {
                                                                    // domEvent.preventDefault()
                                                                    domEvent.stopPropagation()
                                                                    if (key == 'delete') {
                                                                        deleteProject(item)
                                                                    }
                                                                    else if (key == 'edit') {
                                                                        editProject(item)
                                                                    }
                                                                    else if (key == 'add_to_favorite') {
                                                                        addToFavorite(item, true)
                                                                    }
                                                                    else if (key == 'remove_from_favorite') {
                                                                        addToFavorite(item, false)
                                                                    }
                                                                    else if (key == 'export_json') {
                                                                        event$.emit({
                                                                            type: 'event_show_json',
                                                                            data: {
                                                                                json: JSON.stringify(item, null, 4)
                                                                            },
                                                                        })
                                                                    }
                                                                    else if (key == 'open_in_finder') {
                                                                        openInFinder(item.path)
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
                        }
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

