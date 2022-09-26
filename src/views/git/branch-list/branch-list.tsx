import { Button, Descriptions, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './branch-list.module.less';
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

export function BranchList({ config, projectPath, onBranch }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()

    const [current, setCurrent] = useState('')
    const [branches, setBranches] = useState([])

    async function loadBranches() {
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
            onBranch && onBranch(res.data.list)
            setBranches(res.data.list.filter(item => {
                // 不显示远程的分支
                if (item.name.startsWith(('remotes/'))) {
                    return false
                }
                return true
            }))
            setCurrent(res.data.current)
        }
    }

    useEffect(() => {
        loadBranches()
    }, [])

    return (
        <div>
            <div className={styles.list}>
                {branches.map(item => {
                    return (
                        <div className={styles.item}>
                            <div className={styles.status}>
                                {item.name == current &&
                                    <div className={styles.current}></div>
                                }
                            </div>
                            <div className={styles.name}>{item.name}</div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
