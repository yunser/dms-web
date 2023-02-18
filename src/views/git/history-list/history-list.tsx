import { Button, Descriptions, Dropdown, Empty, Input, Menu, message, Modal, Popover, Space, Table, Tabs, Tooltip } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './history-list.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { CloudOutlined, DownloadOutlined, EllipsisOutlined, EyeOutlined, EyeTwoTone, HistoryOutlined, PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
import { request } from '@/views/db-manager/utils/http';
import { IconButton } from '@/views/db-manager/icon-button';
import { RemoteEditor } from '../remote-edit';
import { FullCenterBox } from '@/views/common/full-center-box';
import copy from 'copy-to-clipboard';
// import { saveAs } from 'file-saver'

export function HistoryList({ config, event$, projectPath }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()

    const [moreVisible, setMoreVisible] = useState(false)
    const [histories, setHistories] = useState([])
    // const [current, setCurrent] = useState('')

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

    return (
        <div className={styles.remoteBox}>
            {/* <div>远程列表:</div> */}
            <div className={styles.header}>
                <div>
                    <HistoryOutlined />
                    {'    '}
                    {t('history')}
                </div>
                <IconButton
                    tooltip={t('manage')}
                    onClick={() => {
                        setMoreVisible(true)
                    }}
                >
                    <UnorderedListOutlined />
                </IconButton>
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
                                <Tooltip
                                    title={item.command}
                                >
                                    <div className={styles.command}>{item.command}</div>
                                </Tooltip>
                                <Dropdown
                                    trigger={['click']}
                                    overlay={
                                        <Menu
                                            items={[
                                                {
                                                    label: t('copy'),
                                                    key: 'copy',
                                                },
                                            ]}
                                            onClick={({ key }) => {
                                                if (key == 'copy') {
                                                    copy(item.command)
                                                    message.success(t('copied'))
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
                    }}
                />
            } */}
            {moreVisible &&
                <Modal
                    title={t('history')}
                    open={true}
                    width={800}
                    onCancel={() => {
                        setMoreVisible(false)
                    }}
                    footer={null}
                >
                    <Table
                        dataSource={histories}
                        columns={[
                            {
                                title: t('command'),
                                dataIndex: 'command',
                            },
                        ]}
                    />
                </Modal>
            }
        </div>
    )
}
