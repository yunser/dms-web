import { Button, Descriptions, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './remote-list.module.less';
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

export function RemoteList({ config, projectPath }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()

    const [list, setList] = useState([])
    // const [current, setCurrent] = useState('')

    async function loadList() {
        let res = await request.post(`${config.host}/git/remote/list`, {
            projectPath,
        })
        // console.log('res', res)
        if (res.success) {
            setList(res.data)
            // setCurrent(res.data.current)
        }
    }

    useEffect(() => {
        loadList()
    }, [])

    return (
        <div>
            {/* <div>远程列表:</div> */}
            <div className={styles.list}>
                {list.map(item => {
                    return (
                        <div className={styles.item}>
                            <div className={styles.name}>{item.name}</div>
                            {/* {item.name == current &&
                                <div className={styles.current}></div>
                            } */}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
