import { Button, Descriptions, Drawer, Dropdown, Empty, Input, Menu, message, Modal, Popover, Space, Spin, Table, Tabs, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './commit-list.module.less';
import _, { cloneDeep } from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { BranchesOutlined, CopyOutlined, DownloadOutlined, EllipsisOutlined, ExportOutlined, FileOutlined, MinusOutlined, PlusOutlined, TagOutlined, UserOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
import { request } from '@/views/db-manager/utils/http';
import { DiffText } from '../git-diff';
import moment from 'moment';
import { FullCenterBox } from '@/views/common/full-center-box';
// import { saveAs } from 'file-saver'
// import { Gitgraph } from '@gitgraph/react'
import { CopyButton } from '@/views/db-manager/copy-button';
import { IconButton } from '@/views/db-manager/icon-button';
import { ResetModal } from '../reset-modal';
// import { useVirtualList } from 'ahooks'
import { TagEditor } from '../tag-edit';
import { BranchModal } from '../branch-modal';
import VList from 'rc-virtual-list';
import copy from 'copy-to-clipboard';
import { CherryPickModal } from '../cherry-pick-modal';
import { Editor } from '@/views/db-manager/editor/Editor';

export function _if(condition: boolean, obj: object) {
    return condition ? [obj] : []
}

interface CommitFile {
    name: string
    status: string
}

function Hash({ hash }) {
    const top6Char = hash.substring(0, 6)
    const otherChar = hash.substring(6)
    return (
        <>
            {/* <span>{hash}</span> */}
            {/* <hr /> */}
            <span className={styles.hashPrefix}>{top6Char}</span> 
            {/* <hr /> */}
            <span>{otherChar}</span>
        </>
    )
}

export function CommitList({ config, event$, projectPath,  }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()

    const [fileName, setFileName] = useState('')
    const [fileContent, setFileContent] = useState('')
    const [keyword, setKeyword] = useState('')
    const [fileContentVisible, setFileContentVisible] = useState(false)
    const [filteredKeyword, setFilteredKeyword] = useState('')
    const [filteredFile, setFilteredFile] = useState('')
    // const [filteredAuthor, setFilteredAuthor] = useState({
    //     name: '497',
    // })
    const [filteredAuthor, setFilteredAuthor] = useState(null)
    const [cherryPickVisible, setCherryPickVisible] = useState(false)
    const [cherryPickCommit, setCherryPickCommit] = useState(false)
    const [tagModalVisible, setTagModalVisible] = useState(false)
    const [branchModalVisible, setBranchModalVisible] = useState(false)
    const [listLoading, setListLoading] = useState(false)
    const [list, setList] = useState([])
    const [itemHeight, setItemHeight] = useState(32)
    const [curCommit, setCurCommit] = useState(null)
    // const [branchs, setBranchs] = useState([])
    const [curBranch, setCurBranch] = useState('')
    const [fileLoading, setFileLoading] = useState(false)
    const [files, setFiles] = useState<CommitFile[]>([])
    const [curFile, setCurFile] = useState('')
    const [diffLoading, setDiffLoading] = useState(false)
    const [fileDiff, setFileDiff] = useState('')
    const [resetModalVisible, setResetModalVisible] = useState(false)
    const [resetCommit, setResetCommit] = useState('')

    async function loadFile(file, item) {
        setDiffLoading(true)
        setCurFile(file)
        let res = await request.post(`${config.host}/git/commitFileChanged`, {
            projectPath,
            commit: (item || curCommit).hash,
            filePath: file,
            // connectionId,
            // sql: lineCode,
            // tableName,
            // dbName,
            // logger: true,
        }, {
            // noMessage: true,
        })
        // console.log('fres', res)
        if (res.success) {
            setFileDiff(res.data.res)
            event$.emit({
                type: 'event_reload_history',
                data: {
                    commands: res.data.commands,
                }
            })
        }
        setDiffLoading(false)
        
    }

    async function show(item) {
        setFileLoading(true)
        setCurCommit(item)
        setFileDiff('')
        console.log('show', item)
        // item.hash
        let res = await request.post(`${config.host}/git/show`, {
            projectPath,
            commit: item.hash,
            // connectionId,
            // sql: lineCode,
            // tableName,
            // dbName,
            // logger: true,
        }, {
            // noMessage: true,
        })
        // console.log('fres', res)
        // console.log('???', res.data.res)
        if (res.success) {
            const files: CommitFile[] = res.data.files
            const _files: CommitFile[] = files.map(file => {
                let oldName = file.name
                // let oldName = 'app/middleware/{errorHandler.js => errordeal.js}'
                let name = file.name
                let m = oldName.match(/{[\d\D]+=> ([\d\D]+)}/)
                if (m) {
                    name = oldName.substring(0, m.index) + m[1]
                }
                // name = oldName
                return {
                    name,
                    status: file.status,
                }
            })
            setFiles(_files)
            // setFileDiff(res.data.res)
            // setCurFile('')
            if (_files.length > 0) {
                setTimeout(() => {
                    loadFile(_files[0].name, item)
                }, 0)
            }
            event$.emit({
                type: 'event_reload_history',
                data: {
                    commands: res.data.commands,
                }
            })
        }
        setFileLoading(false)
    }

    function copyHash(item) {
        copy(item.hash)
        message.info(t('copied'))
    }
    
    function cherryPickCommitItem(commit) {
        console.log('cherryPickCommit', )
        setCherryPickCommit(commit)
        setCherryPickVisible(true)
    }

    function exportCommitItem(commit) {
        event$.emit({
            type: 'event_show_json',
            data: {
                json: JSON.stringify(commit, null, 4)
                // connectionId,
            },
        })
    }

    // const [tags, setTags] = useState([])
    // const [current, setCurrent] = useState('')

    // async function loadTags() {
    //     let res = await request.post(`${config.host}/git/tag/list`, {
    //         projectPath,
    //         // connectionId,
    //         // sql: lineCode,
    //         // tableName,
    //         // dbName,
    //         // logger: true,
    //     }, {
    //         // noMessage: true,
    //     })
    //     // console.log('res', res)
    //     if (res.success) {
    //         setTags(res.data.list)
    //         // setCurrent(res.data.current)
    //     }
    // }

    async function loadList() {
        setListLoading(true)
        loadBranch()
        // loadTags()
        const reqData = {
            projectPath,
        }
        if (filteredFile) {
            reqData.file = filteredFile
        }
        if (filteredAuthor) {
            // reqData.author = filteredAuthor
        }
        let res = await request.post(`${config.host}/git/commit/list`, reqData, {
            // noMessage: true,
        })
        // console.log('res', res)
        if (res.success) {
            let list = res.data
            console.log('list', list)
            if (filteredAuthor) {
                list = list.filter(item => item.author_name == filteredAuthor.name)
            }
            if (filteredKeyword) {
                const _kw = filteredKeyword.toLowerCase()
                list = list.filter(item => item.message.toLowerCase().includes(_kw) || item.hash.includes(_kw))
            }
            setList(list)
            if (list.length > 0) {
                show(list[0])
            }
            setItemHeight(itemHeight == 32 ? 33 : 32)
        }
        setListLoading(false)
    }

    

    async function loadBranch() {
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
            setCurBranch(res.data.current)
            // setBranchs(res.data.list)
        }
    }

    useEffect(() => {
        loadList()
    }, [filteredFile, filteredAuthor, filteredKeyword])
    // useEffect(() => {
    //     loadList()
    // }, [])

    event$.useSubscription(msg => {
        // console.log('CommitList/onmessage', msg)
        // console.log(val);
        if (msg.type == 'event_refresh_commit_list') {
            // const { json } = msg.data
            // addJsonTab(json)
            loadList()
        }
        else if (msg.type == 'event_refresh_branch') {
            // const { json } = msg.data
            // addJsonTab(json)
            loadList()
        }
    })

    // event$.useSubscription(msg => {
    //     console.log('CommitList/onmessage', msg)
    //     // console.log(val);
        
    // })

    const showList = useMemo(() => {
        // console.log('列表', list, branchs)
        // list hash "489deea0f6bf7e90a7434f4ae22c5e17214bdf5d"
        // branchs commit: "489deea"
        // console.log('tags', tags)
        const newList = cloneDeep(list)
        for (let item of newList) {
            // tag: v0.0.1, tag: first
            const refs = item.refs.split(',')
            const tags = []
            for (let ref of refs) {
                // console.log('ref', ref)
                if (ref.includes('tag')) {
                    tags.push(ref.split(':')[1])
                }
            }
            item.tags = tags
        }
        for (let item of newList) {
            const refs = item.refs.split(',').filter(item => item)
            const branches = []
            for (let ref of refs) {
                // console.log('ref', ref)
                if (!ref.includes('tag')) {
                    branches.push({
                        name: ref,
                    })
                }
            }
            // console.log('branches', branches)
            item.branches = branches
        }
        // for (let branch of branchs) {
        //     const idx = newList.findIndex(item => item.hash.startsWith(branch.commit))
        //     if (idx != -1) {
        //         if (!newList[idx].branchs) {
        //             newList[idx].branchs = []
        //         }
        //         newList[idx].branchs.push(branch)
        //     }
        // }
        return newList
            // .splice(0, 100)
    }, [list])

    async function openInFinder(path: string) {
        let ret = await request.post(`${config.host}/file/openInFinder`, {
            path,
        })
    }

    async function openInVsCode(path: string) {
        let ret = await request.post(`${config.host}/file/openInVsCode`, {
            path,
        })
    }

    async function browserFile(path: string) {
        let res = await request.post(`${config.host}/git/fileContent`, {
            projectPath,
            commit: curCommit.hash,
            file: path,
        })
        if (res.success) {
            setFileName(path)
            setFileContent(res.data.content)
            setFileContentVisible(true)
        }
    }
    

    // return (
    //     <div>
    //         <Gitgraph>
    //             {(gitgraph) => {
    //                 // Simulate git commands with Gitgraph API.
    //                 const master = gitgraph.branch("master");
    //                 master.commit("Initial commit");

    //                 const develop = master.branch("develop");
    //                 develop.commit("Add TypeScript");

    //                 const aFeature = develop.branch("a-feature");
    //                 aFeature
    //                 .commit("Make it work")
    //                 .commit("Make it right")
    //                 .commit("Make it fast");

    //                 develop.merge(aFeature);
    //                 develop.commit("Prepare v1");

    //                 master.merge(develop).tag("v1.0.0");
    //             }}
    //         </Gitgraph>
    //     </div>
    // )
    // console.log('curCommit.message', curCommit?.message.replace(/\\n/, '\n'))

    return (
        <div className={styles.commitBox}>
            <div className={styles.layoutTop}>
                {/* <Button
                    onClick={() => {
                        loadList()
                    }}
                >
                    刷新
                </Button> */}
                {listLoading ?
                    <FullCenterBox>
                        <Spin />
                    </FullCenterBox>
                : showList.length == 0 ?
                    <FullCenterBox
                        // height={160}
                    >
                        <Empty />
                    </FullCenterBox>
                :
                    <div className={styles.listBox}>
                        <div className={styles.header}>
                            {/* 时间 */}
                            <div className={styles.headerCells}>
                                <div className={styles.timeCell}>{t('time')}</div>
                                <div className={styles.authorCell}>{t('git.author')}</div>
                                <div className={styles.hashCell}>{t('git.hash')}</div>
                                <div></div>
                            </div>
                            {/* |
                            导出 */}
                            {!!filteredAuthor &&
                                <Tag
                                    closable
                                    onClose={() => {
                                        setFilteredAuthor(null)
                                    }}
                                >
                                    <Space>
                                        <UserOutlined />
                                        {filteredAuthor.name}
                                    </Space>
                                </Tag>
                            }
                            {!!filteredFile &&
                                <Tag
                                    closable
                                    onClose={() => {
                                        setFilteredFile('')
                                    }}
                                >
                                    <Space>
                                        <FileOutlined />
                                        {filteredFile}
                                    </Space>
                                </Tag>
                                // <div className={styles.filteredFile}>{filteredFile}</div>
                            }
                            <Space>
                                <Input.Search
                                    size="small"
                                    placeholder={t('filter')}
                                    value={keyword}
                                    onChange={e => {
                                        setKeyword(e.target.value)
                                    }}
                                    onSearch={value => {
                                        // console.log('onSearch', value)
                                        setFilteredKeyword(value)
                                    }}
                                />
                                <IconButton
                                    tooltip={t('export_json')}
                                    // size="small"
                                    className={styles.refresh}
                                    onClick={() => {
                                        event$.emit({
                                            type: 'event_show_json',
                                            data: {
                                                json: JSON.stringify(list, null, 4)
                                                // connectionId,
                                            },
                                        })
                                        // exportAllKeys()
                                    }}
                                >
                                    <ExportOutlined />
                                </IconButton>
                            </Space>
                        </div>
                        <div className={styles.list}>
                            <VList 
                                data={showList} 
                                height={320 - 32} 
                                itemHeight={32} 
                                itemKey="hash"
                            >
                                {item => {
                                    const time = moment(item.date).format('MM/DD HH:mm')
                                    return (
                                        <div
                                            className={classNames(styles.item, {
                                                [styles.active]: curCommit && curCommit.hash == item.hash
                                            })}
                                            onClick={() => {
                                                show(item)
                                            }}
                                            key={item.hash}
                                        >
                                            <div className={styles.left}>
                                                <div className={styles.time}>{time}</div>
                                                <div 
                                                    className={styles.author}
                                                    onClick={(e) => {
                                                        if (!filteredAuthor || filteredAuthor.name != item.author_name) {
                                                            e.stopPropagation()
                                                            e.nativeEvent.stopPropagation()
                                                            // console.log('item', item)
                                                            setFilteredAuthor({
                                                                name: item.author_name,
                                                                email: item.author_email,
                                                            })
                                                        }
                                                    }}
                                                >
                                                    {item.author_name}
                                                </div>
                                                <div className={styles.hash}>{item.hash.substring(0, 7)}</div>
                                                <div className={styles.tagAll}>
                                                    {item.branches?.length > 0 &&
                                                        <>
                                                            {item.branches.map(branch => {
                                                                const simpleName = branch.name
                                                                // const simpleName = branch.name.replace(/^remotes\//, '')
                                                                return (
                                                                    <Tag
                                                                        // className={styles.tag}
                                                                        key={'branch-' + branch.name}
                                                                        color="blue"
                                                                    >
                                                                        <BranchesOutlined />
                                                                        {' '}
                                                                        <span className={styles.tagName}>{simpleName}</span>
                                                                    </Tag>
                                                                    )
                                                                })}
                                                        </>
                                                    }
                                                    {item.tags?.length > 0 &&
                                                        <>
                                                            {item.tags.map(tag => {
                                                                return (
                                                                    <Tag
                                                                        // className={styles.tag}
                                                                        color="green"
                                                                        key={'tag-' + tag}
                                                                    >
                                                                        <TagOutlined />
                                                                        {' '}
                                                                        <span className={styles.tagName}>{tag}</span>
                                                                        {/* {tag} */}
                                                                    </Tag>
                                                                )
                                                            })}
                                                        </>
                                                    }
                                                </div>
                                                <div className={styles.msg}>
                                                    {item.message}
                                                </div>
                                            </div>
                                            <Dropdown
                                                trigger={['click']}
                                                overlay={
                                                    <Menu
                                                        items={[
                                                            {
                                                                label: t('git.branch.create'),
                                                                key: 'branch_create',
                                                            },
                                                            {
                                                                label: t('git.tag.create'),
                                                                key: 'tag_create',
                                                            },
                                                            {
                                                                type: 'divider',
                                                            },
                                                            {
                                                                label: t('git.copy_hash'),
                                                                key: 'copy_hash',
                                                            },
                                                            {
                                                                label: t('git.cherry_pick'),
                                                                key: 'cherry_pick',
                                                            },
                                                            {
                                                                type: 'divider',
                                                            },
                                                            {
                                                                label: t('git.branch.reset_to_commit'),
                                                                key: 'reset_commit',
                                                            },
                                                            {
                                                                label: t('export_json'),
                                                                key: 'export_json',
                                                            },
                                                        ]}
                                                        onClick={({ key }) => {
                                                            if (key == 'reset_commit') {
                                                                setResetModalVisible(true)
                                                                setResetCommit(item)
                                                            }
                                                            else if (key == 'tag_create') {
                                                                setTagModalVisible(true)
                                                            }
                                                            else if (key == 'branch_create') {
                                                                setBranchModalVisible(true)
                                                            }
                                                            else if (key == 'copy_hash') {
                                                                copyHash(item)
                                                            }
                                                            else if (key == 'cherry_pick') {
                                                                cherryPickCommitItem(item)
                                                            }
                                                            else if (key == 'export_json') {
                                                                exportCommitItem(item)
                                                            }
                                                            
                                                        }}
                                                    />
                                                }
                                            >
                                                <IconButton
                                                    // onClick={e => e.preventDefault()}
                                                >
                                                    <EllipsisOutlined />
                                                </IconButton>
                                            </Dropdown>
                                        </div>
                                    )
                                }}
                            </VList>
                        </div>
                    </div>
                }
            </div>
            <div className={styles.layoutBottom}>
                {!!curCommit &&
                    <div className={styles.layoutBottomLeft}>
                        <div className={styles.infoBox}>
                            <div className={styles.msg}>
                                <div>
                                    {curCommit.message}
                                    {/* <pre className={styles.pre}></pre> */}
                                    {/* <pre className={styles.pre}>{'123\n123'}</pre> */}
                                    
                                </div>
                                {!!curCommit.body &&
                                    <div>{curCommit.body}</div>
                                }
                            </div>
                            <div>
                                {t('git.hash')}：<Hash hash={curCommit.hash} />
                                <Space>
                                    <CopyButton
                                        text={curCommit.hash}
                                    >
                                        <IconButton title={t('copy')}>
                                            <CopyOutlined />
                                        </IconButton>
                                    </CopyButton>
                                </Space>
                            </div>
                            <div>{t('git.author')}：{curCommit.author_name} {'<'}{curCommit.author_email}{'>'}</div>
                            <div>{t('time')}：{curCommit.date ? moment(curCommit.date).format('YYYY-MM-DD HH:mm:ss') : '--'}</div>
                            <div>{t('git.refs')}：{curCommit.refs}</div>
                        </div>
                        <div className={styles.fileBox}>
                            {fileLoading ?
                                <FullCenterBox>
                                    <Spin />
                                </FullCenterBox>
                            :
                                <div className={styles.files}>
                                    {files.map(file => {
                                        const fileName = file.name
                                        return (
                                            <div
                                                key={fileName}
                                                className={classNames(styles.item, {
                                                    [styles.active]: fileName == curFile
                                                })}
                                                onClick={() => {
                                                    loadFile(fileName)
                                                }}
                                            >
                                                {file.status == 'D' ?
                                                    <div className={classNames(styles.icon, styles.deleted)}>
                                                        <MinusOutlined />
                                                    </div>
                                                : file.status == 'M' ?
                                                    <div className={classNames(styles.icon, styles.modified)}>
                                                        <EllipsisOutlined />
                                                    </div>
                                                : file.status == 'A' ?
                                                    <div className={classNames(styles.icon, styles.added)}>
                                                        <PlusOutlined />
                                                    </div>
                                                :
                                                    <div className={styles.icon}>
                                                        {/* {file.status} */}
                                                        ?
                                                    </div>
                                                }
                                                <div className={styles.name}>{fileName}</div>
                                                <div className={styles.action}>
                                                    <Dropdown
                                                        trigger={['click']}
                                                        overlay={
                                                            <Menu
                                                                items={[
                                                                    {
                                                                        label: t('file.open_in_file_manager'),
                                                                        key: 'finder',
                                                                    },
                                                                    {
                                                                        label: t('file.open_in_vscode'),
                                                                        key: 'open_in_vscode',
                                                                    },
                                                                    {
                                                                        label: t('filter'),
                                                                        key: 'filter',
                                                                    },
                                                                    {
                                                                        label: t('browser_file'),
                                                                        key: 'browser_file',
                                                                    },
                                                                    {
                                                                        label: t('copy_path'),
                                                                        key: 'copy_path',
                                                                    },
                                                                ]}
                                                                onClick={({ key }) => {
                                                                    const fullPath = projectPath + config.pathSeparator + fileName.replace(/\//g, config.pathSeparator)
                                                                    if (key == 'finder') {
                                                                        console.log('item', fileName)
                                                                        openInFinder(fullPath)
                                                                    }
                                                                    else if (key == 'open_in_vscode') {
                                                                        openInVsCode(fullPath)
                                                                    }
                                                                    else if (key == 'filter') {
                                                                        setFilteredFile(fileName)
                                                                    }
                                                                    else if (key == 'browser_file') {
                                                                        browserFile(fileName)
                                                                    }
                                                                    else if (key == 'copy_path') {
                                                                        copy(fullPath)
                                                                        message.info(t('copied'))
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
                                                </div>
                                            </div>
                                            
                                        )
                                    })}
                                </div>
                            }
                        </div>
                    </div>
                }
                <div className={styles.layoutBottomRight}>
                    {/* <div className={styles.layoutBottomRight}> */}
                    {/* <pre>{fileDiff}</pre> */}
                    {diffLoading ?
                        <FullCenterBox>
                            <Spin />
                        </FullCenterBox>
                    :
                        <DiffText
                            text={fileDiff}
                        />
                    }
                </div>
            </div>
            {resetModalVisible &&
                <ResetModal
                    config={config}
                    projectPath={projectPath}
                    curBranch={curBranch}
                    resetCommit={resetCommit}
                    onCancel={() => {
                        setResetModalVisible(false)
                    }}
                    onSuccess={() => {
                        setResetModalVisible(false)
                        loadList()
                        event$.emit({
                            type: 'event_refresh_status',
                            data: {},
                        })
                    }}
                />
            }
            {tagModalVisible &&
                <TagEditor
                    projectPath={projectPath}
                    commit={curCommit}
                    config={config}
                    event$={event$}
                    onCancel={() => {
                        setTagModalVisible(false)
                    }}
                    onSuccess={() => {
                        setTagModalVisible(false)
                        loadList()
                        // loadTags()
                        event$.emit({
                            type: 'event_refresh_tag',
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
                    commit={curCommit}
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
            {cherryPickVisible &&
                <CherryPickModal
                    config={config}
                    event$={event$}
                    commit={cherryPickCommit}
                    projectPath={projectPath}
                    onCancel={() => {
                        setCherryPickVisible(false)
                    }}
                    onSuccess={() => {
                        setCherryPickVisible(false)
                        // event$.emit({
                        //     type: 'event_refresh_commit_list',
                        //     data: {},
                        // })
                        // event$.emit({
                        //     type: 'event_refresh_branch',
                        //     data: {},
                        // })
                    }}
                />
            }
            {fileContentVisible &&
                <Drawer
                    open={true}
                    width={1200}
                    title={fileName}
                    onClose={() => {
                        setFileContentVisible(false)
                    }}
                >
                    {/* {fileContent} */}
                    <Editor
                        // event$={event$}
                        // connectionId={connectionId}
                        value={fileContent}
                        // onChange={value => setCodeASD(value)}
                        // onEditor={editor => {
                        //     // console.warn('ExecDetail/setEditor')
                        //     setEditor(editor)
                        // }}
                    />
                </Drawer>
            }
        </div>
    )
}
