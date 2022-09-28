import { Button, Descriptions, Input, message, Modal, Popover, Space, Table, Tabs, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './commit-list.module.less';
import _, { cloneDeep } from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { DownloadOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
import { request } from '@/views/db-manager/utils/http';
import { DiffText } from '../git-diff';
import moment from 'moment';
// import { saveAs } from 'file-saver'

export function CommitList({ config, event$, projectPath,  }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()

    
    const [list, setList] = useState([])
    const [curCommit, setCurCommit] = useState(null)
    const [branchs, setBranchs] = useState([])
    const [files, setFiles] = useState([])
    const [curFile, setCurFile] = useState('')
    const [fileDiff, setFileDiff] = useState('')

    async function loadFile(file, item) {
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
        console.log('fres', res)
        if (res.success) {
            setFileDiff(res.data.res)
            // const list = res.data
            // setList(list)
        }
        
    }

    async function show(item) {
        setCurCommit(item)
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
            // const list = res.data
            // setList(list)
        }
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
            // noMessage: true,
        })
        console.log('fres', res)
        if (res.success) {
            // const list = res.data
            // setList(list)
        }

    }

    const [tags, setTags] = useState([])
    // const [current, setCurrent] = useState('')

    async function loadTags() {
        let res = await request.post(`${config.host}/git/tag/list`, {
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
            setTags(res.data.list)
            // setCurrent(res.data.current)
        }
    }

    async function loadList() {
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
        }

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
            setBranchs(res.data.list)
        }
    }

    useEffect(() => {
        loadList()
        gitFetch()
        
    }, [])

    event$.useSubscription(msg => {
        console.log('CommitList/onmessage', msg)
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
        console.log('列表', list, branchs)
        // list hash "489deea0f6bf7e90a7434f4ae22c5e17214bdf5d"
        // branchs commit: "489deea"
        console.log('tags', tags)
        const newList = cloneDeep(list)
        for (let item of newList) {
            // tag: v0.0.1, tag: first
            const refs = item.refs.split(',')
            const tags = []
            for (let ref of refs) {
                console.log('ref', ref)
                if (ref.includes('tag')) {
                    tags.push(ref.split(':')[1])
                }
            }
            item.tags = tags
        }
        for (let branch of branchs) {
            const idx = newList.findIndex(item => item.hash.startsWith(branch.commit))
            if (idx != -1) {
                if (!newList[idx].branchs) {
                    newList[idx].branchs = []
                }
                newList[idx].branchs.push(branch)
            }
        }
        return newList
    }, [list, branchs, tags])

    console.log('showList', showList)

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
                <div className={styles.list}>
                    {showList.map(item => {
                        return (
                            <div
                                className={classNames(styles.item, {
                                    [styles.active]: curCommit && curCommit.hash == item.hash
                                })}
                                onClick={() => {
                                    show(item)
                                }}
                            >
                                {item.branchs?.length > 0 &&
                                    <Space>
                                        {item.branchs.map(branch => {
                                            const simpleName = branch.name.replace(/^remotes\//, '')
                                            return (
                                                <Tag key={branch.name}>{simpleName}</Tag>
                                                )
                                            })}
                                    </Space>
                                }
                                {item.tags?.length > 0 &&
                                    <Space>
                                        {item.tags.map(tag => {
                                            return (
                                                <Tag key={tag}>{tag}</Tag>
                                            )
                                        })}
                                    </Space>
                                }
                                {item.message}
                            </div>
                        )
                    })}
                </div>
            </div>
            <div className={styles.layoutBottom}>
                {!!curCommit &&
                    <div className={styles.layoutBottomLeft}>
                        <div className={styles.infoBox}>
                            <div>message：{curCommit.message}</div>
                            <div>body：{curCommit.body}</div>
                            <div>提交：{curCommit.hash}</div>
                            <div>作者：{curCommit.author_name} {'<'}{curCommit.author_email}{'>'}</div>
                            <div>日期：{curCommit.date ? moment(curCommit.date).format('YYYY-MM-DD HH:mm:ss') : '--'}</div>
                            <div>refs：{curCommit.refs}</div>
                        </div>
                        <div className={styles.fileBox}>
                            <div className={styles.files}>
                                {files.map(file => {
                                    return (
                                        <div className={classNames(styles.item, {
                                            [styles.active]: file == curFile
                                        })}
                                            onClick={() => {
                                                loadFile(file)
                                            }}
                                        >{file}</div>
                                        
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                }
                <div className={styles.layoutBottomRight}>
                    {/* <pre>{fileDiff}</pre> */}
                    <DiffText
                        text={fileDiff}
                    />
                </div>
            </div>
        </div>
    )
}
