import { Button, Descriptions, Dropdown, Empty, Input, Menu, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './branch-list.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { ArrowRightOutlined, DeleteOutlined, DownloadOutlined, EllipsisOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
import { request } from '@/views/db-manager/utils/http';
import { IconButton } from '@/views/db-manager/icon-button';
import { FullCenterBox } from '@/views/db-manager/redis-client';
// import { saveAs } from 'file-saver'

export function BranchList({ config, event$, projectPath, onBranch }) {
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

    event$.useSubscription(msg => {
        console.log('CommitList/onmessage', msg)
        // console.log(val);
        if (msg.type == 'event_refresh_branch') {
            // const { json } = msg.data
            // addJsonTab(json)
            loadBranches()
        }
    })

    async function deleteItem(item) {
        Modal.confirm({
            title: '删除分支',
            // icon: <ExclamationCircleOutlined />,
            content: `确定删除分支「${item.name}」？`,
            async onOk() {
                
                let ret = await request.post(`${config.host}/git/branch/delete`, {
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
                    event$.emit({
                        type: 'event_refresh_branch',
                        data: {},
                    })
                }
            }
        })
    }

    return (
        <div>
            {branches.length == 0 ?
                <FullCenterBox
                    height={160}
                >
                    <Empty />
                </FullCenterBox>
            :
                <div className={styles.list}>
                    {branches.map(item => {
                        return (
                            <div className={styles.item}>
                                <div className={styles.left}>
                                    <div className={styles.status}>
                                        {item.name == current &&
                                            <div className={styles.current}></div>
                                        }
                                    </div>
                                    <div className={styles.name}>{item.name}</div>
                                </div>
                                <Space>
                                    <IconButton
                                        tooltip="切换分支"
                                        onClick={() => {
                                            Modal.confirm({
                                                title: '切换分支',
                                                // icon: <ExclamationCircleOutlined />,
                                                content: `确定将你的工作副本切换为「${item.name}」？`,
                                                async onOk() {
                                                    
                                                    let ret = await request.post(`${config.host}/git/checkout`, {
                                                        projectPath,
                                                        branchName: item.name,
                                                    })
                                                    // console.log('ret', ret)
                                                    if (ret.success) {
                                                        // message.success('连接成功')
                                                        // onConnnect && onConnnect()
                                                        message.success(t('success'))
                                                        // onClose && onClose()
                                                        // onSuccess && onSuccess()
                                                        loadBranches()
                                                    }
                                                }
                                            })
                                        }}
                                    >
                                        <ArrowRightOutlined />
                                    </IconButton>
                                    <Dropdown
                                        trigger={['click']}
                                        overlay={
                                            <Menu
                                                items={[
                                                    {
                                                        label: '删除分支',
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
                                    {/* <IconButton
                                        tooltip="删除分支"
                                        disabled={item.name == current}
                                        onClick={() => {
                                            
                                        }}
                                    >
                                        <DeleteOutlined />
                                    </IconButton> */}
                                </Space>
                            </div>
                        )
                    })}
                </div>
            }
        </div>
    )
}
