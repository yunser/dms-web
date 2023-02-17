import { Alert, Button, Descriptions, Dropdown, Empty, Input, InputRef, Menu, message, Modal, Popover, Space, Table, Tabs, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './git-home.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { DownloadOutlined, EllipsisOutlined, ExportOutlined, PlusOutlined, QuestionOutlined, ReloadOutlined, StarFilled } from '@ant-design/icons';
import { GitProject } from '../git-project';
import { request } from '@/views/db-manager/utils/http';
import { ProjectEditor } from '../project-edit';
import { IconButton } from '@/views/db-manager/icon-button';
import { FullCenterBox } from '@/views/common/full-center-box';
import moment from 'moment';
import { getGlobalConfig } from '@/config';
import { SearchUtil } from '@/utils/search';
import storage from '@/utils/storage';
// import { saveAs } from 'file-saver'

function isInclude(text: string, subText: string) {
    // console.log('isInclude', text, subText)
    // let subIdx = 0
    // for (let idx = 0; idx < text.length; idx++) {
    //     const char = text.charAt(idx)
    //     if (text.charAt(idx) == subText.charAt(subIdx)) {
    //         subIdx++
    //     }
    // }
    // console.log('isInclude/subIdx', subIdx)
    // return subIdx == subText.length
    const keywords = subText.trim().split(/\s+/)
    for (let keyword of keywords) {
        if (!text.includes(keyword)) {
            return false
        }
    }
    return true
}

function visibleFilter(list) {
    return list.filter(item => item.visible != false)
}

function search(projects, keyword) {
    const keywordL = keyword.toLowerCase()
    return projects
        .filter(p => isInclude(p.name.toLowerCase(), keywordL))
}

export function GitHome({ event$, onProject }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [curProject, setCurProject] = useState(null)
    const [view, setView] = useState('list')
    const [keyword, setKeyword] = useState('')
    const searchInputRef = useRef<InputRef>(null)
    // const [curTab, setCurTab] = useState('commit-list')
    const config = getGlobalConfig()
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
        // return SearchUtil.search(projects, keyword, {
        //     attributes: ['name', 'host'],
        // })
        if (!keyword) {
            return projects    
        }
        return search(projects, keyword)
        // return projects
    }, [projects, keyword])

    // const event$ = useEventEmitter()

    const [version, setVersion] = useState('21212')
    const [cloneModalVisible, setCloneModalVisible] = useState(false)
    const [projectItem, setProjectItem] = useState(null)
    const [projectModalVisible, setProjectModalVisible] = useState(false)
    const [createType, setCreateType] = useState(false)
    const [activeIndex, setActiveIndex] = useState(0)
    const [alertVisible] = useState(() => {
        return storage.get('alertVisible', true)
    })
    const inputingRef = useRef(false)
    
    useEffect(() => {
        const handleKeyDown = e => {
            // if (document.activeElement?.nodeName == 'INPUT' || document.activeElement?.nodeName == 'TEXTAREA') {
            //     return
            // }
            
            // console.log('e', e.code, e)
            if (e.code == 'Escape') {
                // onCancel && onCancel()
                
            }
            else if (e.code == 'ArrowDown') {
                let newIdx = activeIndex + 1
                if (newIdx > filterdProjects.length - 1) {
                    newIdx = 0
                }
                setActiveIndex(newIdx)

                e.stopPropagation()
                e.preventDefault()
            }
            else if (e.code == 'ArrowUp') {
                let newIdx = activeIndex - 1
                if (newIdx < 0) {
                    newIdx = filterdProjects.length - 1
                }
                setActiveIndex(newIdx)

                e.stopPropagation()
                e.preventDefault()
            }
            else if (e.code == 'Enter') {
                if (inputingRef.current) {
                    return
                }
                if (filterdProjects[activeIndex]) {
                    onProject && onProject(filterdProjects[activeIndex], !!e.metaKey)
                }
                // console.log('inputRef', inputRef.current)
                // if (inputRef.current.inputing) {
                //     return
                // }
                // if (results[curIndex]?.onItemClick) {
                //     results[curIndex]?.onItemClick()
                //     afterItemClick()
                // }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [activeIndex, filterdProjects, inputingRef.current])

    useEffect(() => {
        const handleCompositionStart = e => {
            console.log('compositionstart')
            inputingRef.current = true
        }
        const handleCompositionEnd = e => {
            console.log('compositionend')
            inputingRef.current = false
        }
        window.addEventListener('compositionstart', handleCompositionStart)
        window.addEventListener('compositionend', handleCompositionEnd)
        return () => {
            window.removeEventListener('compositionstart', handleCompositionStart)
            window.removeEventListener('compositionend', handleCompositionEnd)
        }
    }, [activeIndex, filterdProjects])

    
    // onCompositionStart={() => {
    //     console.log('onCompositionStart')
    //     inputRef.current.inputing = true
    // }}
    // onCompositionEnd={() => {
    //     console.log('onCompositionEnd')
    //     inputRef.current.inputing = false
    // }}

    async function loadVersion() {
        let res = await request.post(`${config.host}/git/version`, {
        })
        if (res.success) {
            // setProjects([])
            // 2
            const { agent, installed, major, minor, patch } = res.data.version
            setVersion(`${major}.${minor}.${patch}`)
        }
    }

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
                if ((a.isFavorite || b.isFavorite)) {
                    return score(b) - score(a)
                }
                return a.name.localeCompare(b.name)
            }))
            // setCurrent(res.data.current)
        }
    }

    useEffect(() => {
        loadList()
        loadVersion()
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
        // if (ret.success) {
        // }
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
                                        setActiveIndex(0)
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
                                <IconButton
                                    tooltip={t('help')}
                                    onClick={() => {
                                        event$.emit({
                                            type: 'event_show_help',
                                            data: {
                                                fileName: 'git',
                                            },
                                        })
                                    }}
                                >
                                    <QuestionOutlined />
                                </IconButton>
                            </Space>
                        </div>
                        <div>
                            <Input
                                ref={searchInputRef}
                                placeholder={t('filter')}
                                value={keyword}
                                allowClear
                                onChange={e => {
                                    setKeyword(e.target.value)
                                    if (activeIndex != 0) {
                                        setActiveIndex(0)
                                    }
                                }}
                            />
                        </div>
                        {alertVisible &&
                            <div className={styles.alertBox}>
                                <Alert 
                                    message={t('git_install')}
                                    type="info"
                                    closable
                                    onClose={() => {
                                        storage.set('alertVisible', false)
                                    }}
                                />
                            </div>
                        }
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
                                    {filterdProjects.map((item, index) => {
                                        return (
                                            <div
                                                key={item.id}
                                                className={classNames(styles.item, {
                                                    [styles.active]: index == activeIndex
                                                })}
                                                onClick={(e) => {
                                                    // setView('detail')
                                                    // setCurProject(item)
                                                    if (e.metaKey) {
                                                        onProject && onProject(item, !!e.metaKey)
                                                    }
                                                    else {
                                                        setActiveIndex(index)
                                                    }
                                                }}
                                                onDoubleClick={() => {
                                                    onProject && onProject(item)
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
                                                        // e.preventDefault()
                                                        // e.stopPropagation()
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
                                                                        label: t('open'),
                                                                        key: 'open',
                                                                    },
                                                                    {
                                                                        label: t('open_in_new_tab'),
                                                                        key: 'open_in_new_tab',
                                                                    },
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
                                                                    {
                                                                        label: t('open_in_terminal'),
                                                                        key: 'open_in_terminal',
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
                                                                    else if (key == 'open_in_terminal') {
                                                                        openInTerminal(item.path)
                                                                    }
                                                                    else if (key == 'open_in_new_tab') {
                                                                        onProject && onProject(item, true)
                                                                    }
                                                                    else if (key == 'open') {
                                                                        onProject && onProject(item, false)
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
            <div className={styles.version}>Git v{version}</div>
        </div>
    )
}

