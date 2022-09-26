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
// import { saveAs } from 'file-saver'

export function CommitList({ config, projectPath,  }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()

    const [list, setList] = useState([])
    const [curCommit, setCurCommit] = useState(null)
    const [branchs, setBranchs] = useState([])

    async function loadList() {
        loadBranch()
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
        
    }, [])

    const showList = useMemo(() => {
        console.log('列表', list, branchs)
        // list hash "489deea0f6bf7e90a7434f4ae22c5e17214bdf5d"
        // branchs commit: "489deea"
        const newList = cloneDeep(list)
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
    }, [list, branchs])

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
                                    setCurCommit(item)
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
                                {item.message}
                            </div>
                        )
                    })}
                </div>
            </div>
            <div className={styles.layoutBottom}>
                {!!curCommit &&
                    <div>
                        <div>message：{curCommit.message}</div>
                        <div>body：{curCommit.body}</div>
                        <div>提交：{curCommit.hash}</div>
                        <div>作者：{curCommit.author_name} {'<'}{curCommit.author_email}{'>'}</div>
                        <div>日期：{curCommit.date}</div>
                        <div>refs：{curCommit.refs}</div>
                    </div>
                }
            </div>
        </div>
    )
}
