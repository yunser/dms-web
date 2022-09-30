import { Button, Descriptions, Empty, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './tag-list.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { DeleteOutlined, DownloadOutlined, PlusOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
import { request } from '@/views/db-manager/utils/http';
import { IconButton } from '@/views/db-manager/icon-button';
import { TagEditor } from '../tag-edit';
import { FullCenterBox } from '@/views/db-manager/redis-client';
// import { saveAs } from 'file-saver'

export function TagList({ config, event$, projectPath }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()

    const [modalVisible, setModalVisible] = useState(false)
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

    useEffect(() => {
        loadTags()
    }, [])

    return (
        <div>
            <div className={styles.header}>
                标签
                <IconButton
                    tooltip="新建标签"
                    onClick={() => {
                        setModalVisible(true)
                    }}
                >
                    <PlusOutlined />
                </IconButton>
            </div>
            {tags.length == 0 ?
                <FullCenterBox
                    height={160}
                >
                    <Empty />
                </FullCenterBox>
            :
                <div className={styles.list}>
                    {tags.map(item => {
                        return (
                            <div className={styles.item}>
                                <div className={styles.status}>
                                    {/* {item.name == current &&
                                        <div className={styles.current}></div>
                                    } */}
                                </div>
                                <div className={styles.name}>{item.name}</div>
                                <Space>
                                    <IconButton
                                        tooltip="删除标签"
                                        // disabled={item.name == current}
                                        onClick={() => {
                                            Modal.confirm({
                                                title: '删除标签',
                                                // icon: <ExclamationCircleOutlined />,
                                                content: `确定删除标签「${item.name}」？`,
                                                async onOk() {
                                                    
                                                    let ret = await request.post(`${config.host}/git/tag/delete`, {
                                                        projectPath,
                                                        name: item.name,
                                                    })
                                                    // console.log('ret', ret)
                                                    if (ret.success) {
                                                        // message.success('连接成功')
                                                        // onConnnect && onConnnect()
                                                        message.success(t('success'))
                                                        // onClose && onClose()
                                                        // onSuccess && onSuccess()
                                                        // loadBranches()
                                                        loadTags()
                                                        event$.emit({
                                                            type: 'event_refresh_branch',
                                                            data: {},
                                                        })
                                                    }
                                                }
                                            })
                                        }}
                                    >
                                        <DeleteOutlined />
                                    </IconButton>
                                </Space>
                            </div>
                        )
                    })}
                </div>
            }
            {modalVisible &&
                <TagEditor
                    projectPath={projectPath}
                    config={config}
                    onCancel={() => {
                        setModalVisible(false)
                    }}
                    onSuccess={() => {
                        setModalVisible(false)
                        loadTags()
                        event$.emit({
                            type: 'event_refresh_commit_list',
                            data: {},
                        })
                    }}
                />
            }
        </div>
    )
}
