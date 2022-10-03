import { Button, Descriptions, Dropdown, Empty, Input, Menu, message, Modal, Popover, Space, Table, Tabs, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './file-home.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { DownloadOutlined, EllipsisOutlined, FileOutlined, FolderOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
import { request } from '@/views/db-manager/utils/http';
import { IconButton } from '@/views/db-manager/icon-button';
import { FullCenterBox } from '@/views/db-manager/redis-client';
// import { saveAs } from 'file-saver'

interface File {
    name: string
}

export function FileHome() {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [list, setList] = useState<File[]>([])

    const config = {
        host: 'http://localhost:10086'
    }

    async function loadList() {
        let res = await request.post(`${config.host}/file/list`, {
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
            const list = (res.data.list as File[])
                .filter(file => {
                    return !file.name.startsWith('.')
                })
                .sort((a, b) => {
                    return a.name.localeCompare(b.name)
                })
            setList(list)
            // setCurrent(res.data.current)
        }
    }

    useEffect(() => {
        loadList()
    }, [])

    return (
        <div className={styles.fileBox}>
            <div className={styles.header}>
                <Button
                    onClick={() => {
                        loadList()
                    }}
                >
                    刷新
                </Button>
                {/* <div className={styles.}>
                </div> */}
            </div>
            <div className={styles.body}>
                <div className={styles.list}>
                    {list.map(item => {
                        return (
                            <div className={styles.item}>
                                <div className={styles.icon}>
                                    {item.type == 'FILE' ?
                                        <FileOutlined />
                                    :
                                        <FolderOutlined />
                                    }
                                </div>
                                <div className={styles.name}>
                                    {item.name}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
