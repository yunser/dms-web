import { Button, Descriptions, Dropdown, Empty, Input, Menu, message, Modal, Popover, Space, Spin, Table, Tabs, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './file-list.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { CreditCardOutlined, DownloadOutlined, EllipsisOutlined, FileOutlined, FolderOutlined, HomeOutlined, LeftOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
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
import copy from 'copy-to-clipboard';
import { FileRenameModal } from '../file-rename';

interface File {
    name: string
    path: string
}

function getParentPath(curPath) {
    const idx = curPath.lastIndexOf('/') // TODO
    const newPath = curPath.substring(0, idx)
    console.log('newPath', newPath)
    return newPath || '/'
}

export function FileList({ config, item, showSide = false, sourceType }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [list, setList] = useState<File[]>([])
    const [error, setError] = useState('')
    
    const defaultPath = item ? 
        (item.username == 'root' ? '/root' : `/home/${item.username}`)
    :
        ''

    const [curPath, setCurPath] = useState(defaultPath)
    const [loading, setLoading] = useState(false)
    const [fileDetailModalVisible, setFileDetialModalVisible] = useState(false)
    const [fileModalPath, setFileModalPath] = useState('')
    const [fileEditModalVisible, setFileEditModalVisible] = useState(false)
    
    const [folderVisible, setFolderVisible] = useState(false)
    const [folderType, setFolderType] = useState('')
    const [activeItem, setActiveItem] = useState(null)
    const [connected, setConnected] = useState(false)
    const [renameModalVisible, setRenameModalVisible] = useState(false)
    const [renameItem, setRenameItem] = useState(null)
    const [info, setInfo] = useState(null)

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
        if (!curPath) {
            return
        }
        setLoading(true)
        setList([])
        setError('')
        setActiveItem(null)
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
            noMessage: true,
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
        else {
            setError(res.data.message)
        }
        setLoading(false)
    }

    async function loadInfo() {
        let res = await request.post(`${config.host}/file/info`, {
        })
        if (res.success) {
            // setProjects([])
            setInfo(res.data)
            setCurPath(res.data.homePath)
        }
        else {
            setError(res.data.message)
        }
        setLoading(false)
    }

    useEffect(() => {
        if (showSide && sourceType == 'local') {
            loadInfo()
        }
    }, [showSide, sourceType])

    useEffect(() => {
        if (sourceType == 'ssh' && !connected) {
            return
        }
        loadList()
    }, [curPath, connected])

    function back() {
        console.log('cur', curPath)
        
        setCurPath(getParentPath(curPath))
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

    useEffect(() => {
        function handleKeyDown(e) {
            console.log('e', e.code, e)
            console.log('e/e.keyCode', e.keyCode)
            console.log('e.srcElement', e.srcElement.nodeName)
            if (e.srcElement.nodeName == 'INPUT' || e.srcElement.nodeName == 'TEXTAREA') {
                return
            }
            // 数字 48-57
            // 字母 a-z 65-90
            function keyCode2Text(keyCode) {
                if (keyCode >= 48 && keyCode <= 57) {
                    return '0123456789'.charAt(keyCode - 48)
                }
                if (keyCode >= 65 && keyCode <= 90) {
                    return 'abcdefghijklmnopqrstuvwxyz'.charAt(keyCode - 65)
                }
                return '?'
            }

            if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 65 && e.keyCode <= 90)) {
                const idx = list.findIndex(item => item.name.toLowerCase().startsWith(keyCode2Text(e.keyCode)))
                if (idx != -1) {
                    setActiveItem(list[idx])
                }
            }
            else if (e.code == 'ArrowDown') {
                if (e.metaKey) {
                    if (activeItem.type != 'FILE') {
                        viewItem(activeItem)
                    }
                }
                else {
                    let idx = -1
                    if (activeItem) {
                        idx = list.findIndex(item => item.name == activeItem.name)
                    }
                    if (idx < list.length - 1) {
                        const newIdx = idx + 1
                        setActiveItem(list[newIdx])
                    }
                }
            }
            else if (e.code == 'ArrowUp') {
                if (e.metaKey) {
                    back()
                }
                else {
                    let idx = list.length
                    if (activeItem) {
                        idx = list.findIndex(item => item.name == activeItem.name)
                    }
                    // console.log('idx', idx)
                    if (idx > 0) {
                        const newIdx = idx - 1
                        setActiveItem(list[newIdx])
                    }
                }
            }
            else if (e.code == 'Space') {
                if (fileDetailModalVisible) {
                    setFileDetialModalVisible(false)
                }
                else {
                    if (activeItem) {
                        viewItem(activeItem)
                    }
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [activeItem, list, fileDetailModalVisible])

    async function viewItem(item) {
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
    }

    async function editItem(item) {
        setFileEditModalVisible(true)
        setFileModalPath(item.path)
    }

    if (sourceType == 'ssh' && !item) {
        return <div>No item</div>
    }
    
    // const sideList = [
    //     {
    //         path: ''
    //     }
    // ]
    return (
        <div className={styles.fileBox}>
            {showSide &&
                <div className={styles.side}>
                    {!!info &&
                        <div className={styles.sideList}>
                            <div className={styles.item}
                                onClick={() => {
                                    setCurPath(info.homePath + '/' + 'Desktop')
                                }}
                            >
                                <CreditCardOutlined className={styles.icon} />
                                {t('file.desktop')}
                            </div>
                            <div className={styles.item}
                                onClick={() => {
                                    setCurPath(info.homePath + '/' + 'Downloads')
                                }}
                            >
                                <DownloadOutlined className={styles.icon} />
                                {t('file.download')}
                            </div>
                            <div className={styles.item}
                                onClick={() => {
                                    setCurPath(info.homePath)
                                }}
                            >
                                <HomeOutlined className={styles.icon} />
                                {t('file.home')}
                            </div>
                        </div>
                    }
                </div>
            }
            <div className={styles.main}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <IconButton
                            tooltip={t('back')}
                            disabled={curPath == '/'}
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
                        <div className={classNames(styles.cell, styles.updateTime)}>
                            {t('update_time')}
                        </div>
                        <div className={classNames(styles.cell, styles.size)}>{t('size')}</div>
                    </div>
                    <div className={styles.bodyBody}>
                        {loading ?
                            <FullCenterBox
                                height={240}
                            >
                                <Spin />
                            </FullCenterBox>
                        : !!error ?
                            <FullCenterBox
                                height={320}
                            >
                                <div className={styles.error}>{error}</div>
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
                                            key={item.name}
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
                                                        else if (key == 'copy_name') {
                                                            copy(item.name)
                                                            message.info(t('copied'))
                                                        }
                                                        else if (key == 'copy_path') {
                                                            copy(item.path)
                                                            message.info(t('copied'))
                                                        }
                                                        else if (key == 'rename') {
                                                            setRenameModalVisible(true)
                                                            setRenameItem(item)
                                                        }
                                                    }}
                                                    items={[
                                                        {
                                                            label: t('open_with_text_editor'),
                                                            key: 'edit',
                                                        },
                                                        {
                                                            label: t('rename'),
                                                            key: 'rename',
                                                        },
                                                        {
                                                            label: t('delete'),
                                                            key: 'delete_file',
                                                        },
                                                        {
                                                            type: 'divider',
                                                        },
                                                        {
                                                            label: t('file.copy_name'),
                                                            key: 'copy_name',
                                                        },
                                                        {
                                                            label: t('file.copy_path'),
                                                            key: 'copy_path',
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
                                                    viewItem(item)
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
            {renameModalVisible &&
                <FileRenameModal
                    config={config}
                    item={renameItem}
                    type={folderType}
                    sourceType={sourceType}
                    onCancel={() => {
                        setRenameModalVisible(false)
                    }}
                    onSuccess={() => {
                        setRenameModalVisible(false)
                        loadList()
                    }}
                />
            }
        </div>
    )
}
