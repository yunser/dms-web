import { Button, Descriptions, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './commit-list.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { DownloadOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
import { request } from '@/views/db-manager/utils/http';
// import { saveAs } from 'file-saver'

export function CommitList({ config, projectPath }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()

    const [list, setList] = useState([])
    const [curCommit, setCurCommit] = useState(null)

    async function loadList() {
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
            setList(res.data)
        }
    }

    useEffect(() => {
        loadList()
        
    }, [])

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
                    {list.map(item => {
                        return (
                            <div
                                className={classNames(styles.item, {
                                    [styles.active]: curCommit && curCommit.hash == item.hash
                                })}
                                onClick={() => {
                                    setCurCommit(item)
                                }}
                            >{item.message}</div>
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
