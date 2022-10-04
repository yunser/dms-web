import { Button, Descriptions, Dropdown, Empty, Input, Menu, message, Modal, Popover, Space, Spin, Table, Tabs, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './file-list.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { DownloadOutlined, EllipsisOutlined, FileOutlined, FolderOutlined, LeftOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
import { request } from '@/views/db-manager/utils/http';
import { IconButton } from '@/views/db-manager/icon-button';
import { FullCenterBox } from '@/views/db-manager/redis-client';
import moment from 'moment';
// import { saveAs } from 'file-saver'
import filesize from 'file-size'
import { FileDetail } from '../file-detail';
import { FileNameModal } from '../file-name-edit';
import { FileEdit } from '../file-edit';

interface File {
    name: string
    path: string
}

export function FileList({ config, item, sourceType }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [list, setList] = useState<File[]>([])
    const [curPath, setCurPath] = useState('')
    const [loading, setLoading] = useState(false)
    const [fileDetailModalVisible, setFileDetialModalVisible] = useState(false)
    const [fileModalPath, setFileModalPath] = useState('')
    const [fileEditModalVisible, setFileEditModalVisible] = useState(false)
    
    const [folderVisible, setFolderVisible] = useState(false)
    const [folderType, setFolderType] = useState('')
    const [activeItem, setActiveItem] = useState(null)
    const [connected, setConnected] = useState(false)

    async function connect() {
        console.log('flow/1', )
        let ret = await request.post(`${config.host}/sftp/connect`, {
            ...item,
            // path: item.path,
            // type: item.type,
        })
        console.log('connect/res', ret)
        if (ret.success) {
            // message.success('连接成功')
            // onConnnect && onConnnect()
            // message.success(t('success'))
            // onClose && onClose()
            // onSuccess && onSuccess()
            // loadList()
            setConnected(true)
        }
    }
    
    useEffect(() => {
        if (sourceType == 'ssh') {
            connect()
        }
    }, [item])

    async function loadList() {
        setLoading(true)
        let res = await request.post(`${config.host}/file/list`, {
            path: curPath,
            sourceType,
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
        setLoading(false)
    }

    useEffect(() => {
        if (sourceType == 'ssh' && !connected) {
            return
        }
        loadList()
    }, [curPath, connected])

    function back() {
        console.log('cur', curPath)
        const idx = curPath.lastIndexOf('/') // TODO
        const newPath = curPath.substring(0, idx)
        console.log('newPath', newPath)
        setCurPath(newPath)
    }

    async function deleteItem(item) {
        Modal.confirm({
            // title: 'Confirm',
            // icon: <ExclamationCircleOutlined />,
            content: `${t('delete')}「${item.name}」?`,
            async onOk() {
                
                let ret = await request.post(`${config.host}/file/delete`, {
                    sourceType,
                    path: item.path,
                    type: item.type,
                })
                // console.log('ret', ret)
                if (ret.success) {
                    // message.success('连接成功')
                    // onConnnect && onConnnect()
                    // message.success(t('success'))
                    // onClose && onClose()
                    // onSuccess && onSuccess()
                    loadList()
                }
            }
        })
    }

    async function editItem(item) {
        setFileEditModalVisible(true)
        setFileModalPath(item.path)
    }

    if (sourceType == 'ssh' && !item) {
        return <div>No item</div>
    }
    
    return (
        <div className={styles.fileBox}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <IconButton
                        tooltip={t('back')}
                        onClick={() => {
                            back()
                        }}
                    >
                        <LeftOutlined />
                    </IconButton>
                    <IconButton
                        tooltip={t('refresh')}
                        onClick={() => {
                            loadList()
                        }}
                    >
                        <ReloadOutlined />
                    </IconButton>
                    <Dropdown
                        trigger={['click']}
                        overlay={
                            <Menu
                                onClick={({ key }) => {
                                    if (key == 'create_folder') {
                                        setFolderVisible(true)
                                        setFolderType('FOLDER')
                                    }
                                    else if (key == 'create_file') {
                                        setFolderVisible(true)
                                        setFolderType('FILE')
                                    }
                                }}
                                items={[
                                    {
                                        label: t('file'),
                                        key: 'create_file',
                                    },
                                    {
                                        label: t('folder'),
                                        key: 'create_folder',
                                    },
                                ]}
                            />
                        }
                    >
                        <IconButton
                            tooltip={t('add')}
                        >
                            <PlusOutlined />
                        </IconButton>
                    </Dropdown>
                    <div className={styles.path}>{curPath}</div>
                </div>
                {sourceType == 'ssh' &&
                    <div>{connected ? t('connected') : t('connect_unknown')}</div>
                }
            </div>
            <div className={styles.body}>
                <div className={styles.bodyHeader}>
                    <div className={classNames(styles.cell, styles.name)}>{t('name')}</div>
                    <div className={classNames(styles.cell, styles.updateTime)}>{t('update_time')}</div>
                    <div className={classNames(styles.cell, styles.size)}>{t('size')}</div>
                </div>
                <div className={styles.bodyBody}>
                    {loading ?
                        <FullCenterBox
                            height={240}
                        >
                            <Spin />
                        </FullCenterBox>
                    : list.length == 0 ?
                        <FullCenterBox>
                            <Empty />
                        </FullCenterBox>
                    :
                        <div className={styles.list}>
                            {list.map(item => {
                                return (
                                    <Dropdown
                                        trigger={['contextMenu']}
                                        overlay={
                                            <Menu
                                                onClick={({ key }) => {
                                                    if (key == 'delete_file') {
                                                        deleteItem(item)
                                                    }
                                                    else if (key == 'edit') {
                                                        editItem(item)
                                                    }
                                                }}
                                                items={[
                                                    {
                                                        label: t('open_with_text_editor'),
                                                        key: 'edit',
                                                    },
                                                    {
                                                        label: t('delete'),
                                                        key: 'delete_file',
                                                    },
                                                ]}
                                            />
                                        }
                                    >
                                        <div className={classNames(styles.item, {
                                            [styles.active]: activeItem && activeItem.name == item.name
                                        })}
                                            onClick={() => {
                                                setActiveItem(item)
                                            }}
                                            onContextMenu={() => {
                                                setActiveItem(item)
                                            }}
                                            onDoubleClick={() => {
                                                if (item.type == 'FILE') {
                                                    if (sourceType == 'local') {

                                                    }
                                                    else {
                                                        if (item.size > 1 * 1024 * 1024) {
                                                            message.info('文件太大，暂不支持查看')
                                                            return
                                                        }
                                                    }
                                                    setFileDetialModalVisible(true)
                                                    setFileModalPath(item.path)
                                                }
                                                else {
                                                    setCurPath(item.path)
                                                }
                                            }}
                                        >
                                            <div className={classNames(styles.cell, styles.name)}>
                                                <div className={styles.icon}>
                                                    {item.type == 'FILE' ?
                                                        <FileOutlined />
                                                    :
                                                        <FolderOutlined />
                                                    }
                                                </div>
                                                <div className={styles.label}>
                                                    {item.name}
                                                </div>
                                            </div>
                                            <div className={classNames(styles.cell, styles.updateTime)}>
                                                {moment(item.updateTime).format('YYYY-MM-DD HH:mm')}
                                            </div>
                                            <div className={classNames(styles.cell, styles.size)}>
                                                {/* {item.size} */}
                                                {item.type == 'FILE' ?
                                                    filesize(item.size, { fixed: 1, }).human()
                                                :
                                                    '--'
                                                }
                                                {/* {} */}
                                            </div>
                                        </div>
                                    </Dropdown>
                                )
                            })}
                        </div>
                    }
                </div>
            </div>
            {fileDetailModalVisible &&
                <FileDetail
                    config={config}
                    path={fileModalPath}
                    sourceType={sourceType}
                    onCancel={() => {
                        setFileDetialModalVisible(false)
                    }}
                />
            }
            {fileEditModalVisible &&
                <FileEdit
                    config={config}
                    path={fileModalPath}
                    sourceType={sourceType}
                    onCancel={() => {
                        setFileEditModalVisible(false)
                    }}
                    onSuccess={() => {
                        setFileEditModalVisible(false)
                        loadList()
                    }}
                />
            }
            {folderVisible &&
                <FileNameModal
                    config={config}
                    path={curPath}
                    type={folderType}
                    sourceType={sourceType}
                    onCancel={() => {
                        setFolderVisible(false)
                    }}
                    onSuccess={() => {
                        setFolderVisible(false)
                        loadList()
                    }}
                />
            }
        </div>
    )
}
