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
            {/* <Button
                onClick={() => {
                    loadList()
                }}
            >
                刷新
            </Button> */}
            {/* <div>提交列表:</div> */}
            <div className={styles.list}>
                {list.map(item => {
                    return (
                        <div className={styles.item}>{item.message}</div>
                    )
                })}
            </div>
        </div>
    )
}
