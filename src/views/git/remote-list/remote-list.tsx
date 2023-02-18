import { Button, Descriptions, Dropdown, Empty, Input, Menu, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './remote-list.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { CloudOutlined, DownloadOutlined, EllipsisOutlined, GithubOutlined, GitlabOutlined, PlusOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
import { request } from '@/views/db-manager/utils/http';
import { IconButton } from '@/views/db-manager/icon-button';
import { RemoteEditor } from '../remote-edit';
import { FullCenterBox } from '@/views/common/full-center-box';
// import { saveAs } from 'file-saver'

export function RemoteList({ config, event$, projectPath }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()

    const [manageVisible, setManageVisible] = useState(false)

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

    async function deleteItem(item) {
        Modal.confirm({
            title: t('git.remote.delete'),
            // icon: <ExclamationCircleOutlined />,
            content: `${t('git.remote.delete.confirm')}「${item.name}」？`,
            async onOk() {
                
                let res = await request.post(`${config.host}/git/command`, {
                    projectPath,
                    commands: ['remote', 'remove', item.name],
                })
                // console.log('ret', ret)
                if (res.success) {
                    // message.success('连接成功')
                    // onConnect && onConnect()
                    message.success(t('success'))
                    // onClose && onClose()
                    // onSuccess && onSuccess()
                    // loadBranches()
                    loadRemotes()
                    event$.emit({
                        type: 'event_reload_history',
                        data: {
                            commands: res.data.commands,
                        }
                    })
                    // event$.emit({
                    //     type: 'event_refresh_branch',
                    //     data: {},
                    // })
                }
            }
        })
    }

    function exportList() {
        event$.emit({
            type: 'event_show_json',
            data: {
                json: JSON.stringify(remotes, null, 4)
            },
        })
    }

    return (
        <div className={styles.remoteBox}>
            {/* <div>远程列表:</div> */}
            <div className={styles.header}>
                <div>
                    <CloudOutlined />
                    {'    '}
                    {t('git.remotes')}
                </div>
                <Space>
                    <IconButton
                        tooltip={t('git.remote.create')}
                        onClick={() => {
                            setModalVisible(true)
                        }}
                    >
                        <PlusOutlined />
                    </IconButton>
                    <Dropdown
                        trigger={['click']}
                        overlay={
                            <Menu
                                items={[
                                    {
                                        label: t('manage'),
                                        key: 'manage',
                                    },
                                    {
                                        label: t('export_json'),
                                        key: 'export_json',
                                    },
                                ]}
                                onClick={({ key }) => {
                                    if (key == 'export_json') {
                                        exportList()
                                    }
                                    else if (key == 'manage') {
                                        setManageVisible(true)
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
                </Space>
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
                        // git@github.com:yunser/aliyun-cli.git
                        // https://github.com/yunser/aliyun-cli.git
                        let githubUrl = ''
                        const m = item.refs.fetch.match(/git@github.com:([\w-]+?)\/([\w-]+?).git/)
                        if (m) {
                            const [_, user, repo] = m
                            githubUrl = `https://github.com/${user}/${repo}`
                        }
                        else {
                            const m2 = item.refs.fetch.match(/https:\/\/github.com\/([\w-]+?)\/([\w-]+?).git/)
                            if (m2) {
                                const [_, user, repo] = m2
                                githubUrl = `https://github.com/${user}/${repo}`
                            }
                        }
                        // ssh://git@gitlab.weyatech.cn:10022/chuangren/cr-admin.git
                        let gitlabUrl = ''
                        if (item.refs.fetch.startsWith('ssh://git@gitlab.weyatech.cn:10022')) {
                            gitlabUrl = item.refs.fetch.replace('ssh://git@gitlab.weyatech.cn:10022', 'http://gitlab.weyatech.cn')
                                .replace(/.git$/, '')
                        }
                        return (
                            <div
                                className={styles.item}
                                key={item.name}
                            >
                                <Space>
                                    <div className={styles.name}>{item.name}</div>
                                    {!!githubUrl &&
                                        <IconButton
                                            tooltip="Github"
                                            onClick={() => {
                                                window.open(githubUrl, '_blank')
                                            }}
                                        >
                                            <GithubOutlined />
                                        </IconButton>
                                    }
                                    {!!gitlabUrl &&
                                        <IconButton
                                            tooltip="Gitlab"
                                            onClick={() => {
                                                window.open(gitlabUrl, '_blank')
                                            }}
                                        >
                                            <GitlabOutlined />
                                        </IconButton>
                                    }
                                </Space>
                                <Space>
                                    <Dropdown
                                        trigger={['click']}
                                        overlay={
                                            <Menu
                                                items={[
                                                    {
                                                        label: t('git.remote.delete'),
                                                        key: 'delete',
                                                        danger: true,
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
                                </Space>
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
                    event$={event$}
                    onCancel={() => {
                        setModalVisible(false)
                    }}
                    onSuccess={() => {
                        setModalVisible(false)
                        loadRemotes()
                    }}
                />
            }
            {manageVisible &&
                <Modal
                    open={true}
                    title={t('git.tag')}
                    width={800}
                    onCancel={() => {
                        setManageVisible(false)
                    }}
                    footer={null}
                >
                    <Table
                        dataSource={remotes}
                        pagination={false}
                        bordered
                        size="small"
                        columns={[
                            {
                                title: t('name'),
                                dataIndex: 'name',
                            },
                            {
                                title: t('url'),
                                dataIndex: ['refs', 'fetch'],
                            },
                            // {
                            //     title: t('git.push_url'),
                            //     dataIndex: ['refs', 'push'],
                            // },
                            // {
                            //     title: t('git.fetch_url'),
                            //     dataIndex: ['refs', 'fetch'],
                            // },
                            // {
                            //     title: t('git.push_url'),
                            //     dataIndex: ['refs', 'push'],
                            // },
                        ]}
                    />
                </Modal>
            }
        </div>
    )
}
