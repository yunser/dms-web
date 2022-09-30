import { Button, Descriptions, Empty, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './remote-list.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { DownloadOutlined, PlusOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
import { request } from '@/views/db-manager/utils/http';
import { IconButton } from '@/views/db-manager/icon-button';
import { RemoteEditor } from '../remote-edit';
import { FullCenterBox } from '@/views/db-manager/redis-client';
// import { saveAs } from 'file-saver'

export function RemoteList({ config, projectPath }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()

    const [modalVisible, setModalVisible] = useState(false)
    const [remotes, setRemotes] = useState([])
    // const [current, setCurrent] = useState('')

    async function loadRemotes() {
        let res = await request.post(`${config.host}/git/remote/list`, {
            projectPath,
        })
        // console.log('res', res)
        if (res.success) {
            setRemotes(res.data)
            // setCurrent(res.data.current)
        }
    }

    useEffect(() => {
        loadRemotes()
    }, [])

    return (
        <div className={styles.remoteBox}>
            {/* <div>远程列表:</div> */}
            <div className={styles.header}>
                <div>{t('git.remote')}</div>
                <IconButton
                    tooltip="新建远程"
                    onClick={() => {
                        setModalVisible(true)
                    }}
                >
                    <PlusOutlined />
                </IconButton>
            </div>
            {remotes.length == 0 ?
                <FullCenterBox
                    height={160}
                >
                    <Empty />
                </FullCenterBox>
            :
                <div className={styles.list}>
                    {remotes.map(item => {
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
            }
            {modalVisible &&
                <RemoteEditor
                    projectPath={projectPath}
                    config={config}
                    onCancel={() => {
                        setModalVisible(false)
                    }}
                    onSuccess={() => {
                        setModalVisible(false)
                        loadRemotes()
                    }}
                />
            }
        </div>
    )
}
