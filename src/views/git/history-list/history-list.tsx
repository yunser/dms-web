import { Button, Descriptions, Dropdown, Empty, Input, Menu, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './history-list.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { CloudOutlined, DownloadOutlined, EllipsisOutlined, HistoryOutlined, PlusOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
import { request } from '@/views/db-manager/utils/http';
import { IconButton } from '@/views/db-manager/icon-button';
import { RemoteEditor } from '../remote-edit';
import { FullCenterBox } from '@/views/db-manager/redis-client';
// import { saveAs } from 'file-saver'

export function HistoryList({ config, event$, projectPath }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()

    const [modalVisible, setModalVisible] = useState(false)
    const [histories, setHistories] = useState([])
    // const [current, setCurrent] = useState('')

    async function loadRemotes() {
        let res = await request.post(`${config.host}/git/remote/list`, {
            projectPath,
        })
        // console.log('res', res)
        if (res.success) {
            // setRemotes(res.data)
            // setCurrent(res.data.current)
        }
    }

    event$.useSubscription(msg => {
        console.log('Status/onmessage', msg)
        // console.log(val);
        if (msg.type == 'event_reload_history') {
            const { commands } = msg.data
            // console.log('commands', commands)
            setHistories([
                ...commands.reverse(),
                ...histories,
            ])
        }
        // else if (msg.type == 'event_reload_use') {
        //     const { connectionId: _connectionId, schemaName } = msg.data
        //     if (_connectionId == connectionId) {
        //         heartBeat()
        //     }
        // }
    })

    useEffect(() => {
        // loadRemotes()
    }, [])

    async function deleteItem(item) {
        Modal.confirm({
            title: t('git.remote.delete'),
            // icon: <ExclamationCircleOutlined />,
            content: `${t('git.remote.delete.confirm')}「${item.name}」？`,
            async onOk() {
                
                let ret = await request.post(`${config.host}/git/command`, {
                    projectPath,
                    commands: ['remote', 'remove', item.name],
                })
                // console.log('ret', ret)
                if (ret.success) {
                    // message.success('连接成功')
                    // onConnect && onConnect()
                    message.success(t('success'))
                    // onClose && onClose()
                    // onSuccess && onSuccess()
                    // loadBranches()
                    loadRemotes()
                    // event$.emit({
                    //     type: 'event_refresh_branch',
                    //     data: {},
                    // })
                }
            }
        })
    }

    return (
        <div className={styles.remoteBox}>
            {/* <div>远程列表:</div> */}
            <div className={styles.header}>
                <div>
                    <HistoryOutlined />
                    {'    '}
                    {t('history')}
                </div>
                {/* <IconButton
                    tooltip={t('git.remote.create')}
                    onClick={() => {
                        setModalVisible(true)
                    }}
                >
                    <PlusOutlined />
                </IconButton> */}
            </div>
            {histories.length == 0 ?
                <FullCenterBox
                    height={160}
                >
                    <Empty />
                </FullCenterBox>
            :
                <div className={styles.list}>
                    {histories.map(item => {
                        return (
                            <div
                                className={styles.item}
                                key={item.id}
                            >
                                <div className={styles.command}>{item.command}</div>
                                {/* <Space>
                                    <Dropdown
                                        trigger={['click']}
                                        overlay={
                                            <Menu
                                                items={[
                                                    {
                                                        label: t('git.remote.delete'),
                                                        key: 'delete',
                                                    },
                                                ]}
                                                onClick={({ key }) => {
                                                    if (key == 'delete') {
                                                        deleteItem(item)

                                                    }
                                                }}
                                            />
                                        }
                                    >
                                        <IconButton
                                            onClick={e => e.preventDefault()}
                                        >
                                            <EllipsisOutlined />
                                        </IconButton>
                                    </Dropdown>
                                </Space> */}
                            </div>
                        )
                    })}
                </div>
            }
            {/* {modalVisible &&
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
            } */}
        </div>
    )
}
