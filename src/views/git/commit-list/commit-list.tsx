import { Button, Descriptions, Dropdown, Empty, Input, Menu, message, Modal, Popover, Space, Spin, Table, Tabs, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './commit-list.module.less';
import _, { cloneDeep } from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { BranchesOutlined, CopyOutlined, DownloadOutlined, EllipsisOutlined, PlusOutlined, TagOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
import { request } from '@/views/db-manager/utils/http';
import { DiffText } from '../git-diff';
import moment from 'moment';
import { FullCenterBox } from '@/views/db-manager/redis-client';
// import { saveAs } from 'file-saver'
import { Gitgraph } from '@gitgraph/react'
import { CopyButton } from '@/views/db-manager/copy-button';
import { IconButton } from '@/views/db-manager/icon-button';
import { ResetModal } from '../reset-modal';
import { useVirtualList } from 'ahooks'
import { TagEditor } from '../tag-edit';
import { BranchModal } from '../branch-modal';
import List from 'rc-virtual-list';

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

    const [tagModalVisible, setTagModalVisible] = useState(false)
    const [branchModalVisible, setBranchModalVisible] = useState(false)
    const [listLoading, setListLoading] = useState(false)
    const [list, setList] = useState([])
    const [itemHeight, setItemHeight] = useState(32)
    const [curCommit, setCurCommit] = useState(null)
    // const [branchs, setBranchs] = useState([])
    const [curBranch, setCurBranch] = useState('')
    const [fileLoading, setFileLoading] = useState(false)
    const [files, setFiles] = useState([])
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
        console.log('fres', res)
        if (res.success) {
            const { files } = res.data
            setFiles(files)
            // setFileDiff(res.data.res)
            // setCurFile('')
            if (files.length > 0) {
                setTimeout(() => {
                    loadFile(files[0], item)
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

    

    async function gitFetch() {
        loadBranch()
        let res = await request.post(`${config.host}/git/fetch`, {
            projectPath,
            remoteName: 'origin',
            // connectionId,
            // sql: lineCode,
            // tableName,
            // dbName,
            // logger: true,
        }, {
            noMessage: true,
        })
        console.log('fres', res)
        if (res.success) {
        }

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
        let res = await request.post(`${config.host}/git/commit/list`, {
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
            const list = res.data
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
        gitFetch()
        
    }, [])

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
                    <div className={styles.list}>
                        <List 
                            data={showList} 
                            height={320} 
                            itemHeight={32} 
                            itemKey="hash"
                        >
                            {item => {
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
                                            {item.branches?.length > 0 &&
                                                <div className={styles.tags}>
                                                    {item.branches.map(branch => {
                                                        const simpleName = branch.name
                                                        // const simpleName = branch.name.replace(/^remotes\//, '')
                                                        return (
                                                            <Tag
                                                                key={branch.name}
                                                                color="blue"
                                                            >
                                                                <BranchesOutlined />
                                                                {' '}
                                                                {simpleName}
                                                            </Tag>
                                                            )
                                                        })}
                                                </div>
                                            }
                                            {item.tags?.length > 0 &&
                                                <div className={styles.tags}>
                                                    {item.tags.map(tag => {
                                                        return (
                                                            <Tag
                                                                color="green"
                                                                key={tag}
                                                            >
                                                                <TagOutlined />
                                                                {' '}
                                                                {tag}
                                                            </Tag>
                                                        )
                                                    })}
                                                </div>
                                            }
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
                                                            label: t('git.branch.reset_to_commit'),
                                                            key: 'reset_commit',
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
                        </List>
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
                                        return (
                                            <div
                                                key={file}
                                                className={classNames(styles.item, {
                                                    [styles.active]: file == curFile
                                                })}
                                                onClick={() => {
                                                    loadFile(file)
                                                }}
                                            >{file}</div>
                                            
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
        </div>
    )
}
