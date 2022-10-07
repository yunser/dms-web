import { Button, Descriptions, Dropdown, Empty, Input, Menu, message, Modal, Popover, Space, Spin, Table, Tabs, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './file-list.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { CodeOutlined, CreditCardOutlined, DownloadOutlined, EllipsisOutlined, FileOutlined, FileSearchOutlined, FileWordOutlined, FolderOutlined, HomeOutlined, LeftOutlined, PlusOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons';
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
import { FileUtil } from '../utils/utl';
import { FilePathModal } from '../file-path';
import { FileInfo } from '../file-info';

function lastSplit(text: string, sep: string) {
    const idx = text.lastIndexOf(sep)
    if (idx == -1) {
        return [text]
    }
    return [
        text.substring(0, idx),
        text.substring(idx + 1),
    ]
}

function getCopyName(fileName: string, copyText: string) {
    const suffix = `-${copyText}`
    if (fileName.includes('.')) {
        const [name, ext] = lastSplit(fileName, '.')
        return `${name}${suffix}.${ext}`
    }
    return fileName + suffix
}

interface File {
    name: string
    path: string
    type: string
}

function getParentPath(curPath: string) {
    const idx = curPath.lastIndexOf('/') // TODO
    const newPath = curPath.substring(0, idx)
    console.log('newPath', newPath)
    return newPath || '/'
}

function CollectionList({ config, onItemClick }) {

    const [list, setList] = useState([])

    async function loadList() {
        let res = await request.post(`${config.host}/file/collection/list`, {
        }, {
            noMessage: true,
        })
        // console.log('res', res)
        if (res.success) {
            setList(res.data.list)
        }
    }

    useEffect(() => {
        loadList()
    }, [])

    return (
        <div className={styles.collList}>
            {list.map(item => {
                return (
                    <div className={styles.item}
                        onClick={() => {
                            onItemClick && onItemClick(item)  
                        }}
                    >
                        <FolderOutlined className={styles.icon} />
                        {item.name}
                    </div>
                )
            })}
        </div>
    )
}

export function FileList({ config, event$, tabKey, item, showSide = false }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [list, setList] = useState<File[]>([])
    const [error, setError] = useState('')

    const [sourceType, setSourceType] = useState(item ? '' : 'local')
    
    const defaultPath = item ? 
        (item.username == 'root' ? '/root' : `/home/${item.username}`)
    :
        ''

    const [curPath, setCurPath] = useState(defaultPath)
    const [loading, setLoading] = useState(false)
    const [fileDetailModalVisible, setFileDetialModalVisible] = useState(false)
    const [fileModalPath, setFileModalPath] = useState('')
    const [fileEditModalVisible, setFileEditModalVisible] = useState(false)
    const [pathModalVisible, setPathModalVisible] = useState(false)
    const [infoVisible, setInfoVisible] = useState(false)
    const [fileInfoPath, setFileInfoPath] = useState('')
    const [keyword, setKeyword] = useState('')
    const [folderVisible, setFolderVisible] = useState(false)
    const [folderType, setFolderType] = useState('')
    const [activeItem, setActiveItem] = useState(null)
    const [copiedItem, setCopiedItem] = useState(null)
    const [connecting, setConnecting] = useState(false)
    const [connected, setConnected] = useState(false)
    const [renameModalVisible, setRenameModalVisible] = useState(false)
    const [renameItem, setRenameItem] = useState(null)
    const [info, setInfo] = useState(null)
    const rootRef = useRef(null)

    const filteredList = useMemo(() => {
        if (!keyword) {
            return list
        }
        return list.filter(item => {
            return item.name.toLowerCase().includes(keyword.toLowerCase())
        })
    }, [list, keyword])
    async function connect() {
        // console.log('flow/1', )
        setConnecting(true)
        let res = await request.post(`${config.host}/sftp/connect`, {
            ...item,
            // path: item.path,
            // type: item.type,
        })
        console.log('connect/res', res)
        if (res.success) {
            // message.success('连接成功')
            // onConnnect && onConnnect()
            // message.success(t('success'))
            // onClose && onClose()
            // onSuccess && onSuccess()
            // loadList()
            setConnected(true)
            setSourceType(res.data.connectionId)
        }
        setConnecting(false)
    }
    
    useEffect(() => {
        if (!!item) {
            connect()
        }
        else {
            setSourceType('local')
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
        if (item) {
            if (!sourceType) {
                return
            }
            loadList()
        }
        else {
            loadList()
        }
    }, [curPath, item, sourceType])

    function back() {
        console.log('cur', curPath)
        
        setCurPath(getParentPath(curPath))
    }

    function downloadItem(item: File) {
        const downloadUrl = `${config.host}/file/download?sourceType=${sourceType}&fileName=${encodeURIComponent(item.name)}&path=${encodeURIComponent(item.path)}`
        const link = document.createElement("a")
        // let temp = res.headers["content-disposition"].split(";")[1].split("filename=")[1];
        // const fileName = decodeURIComponent(temp);  
        // console.log('fileName_',fileName)
        link.style.display = "none"
        link.href = downloadUrl
        link.setAttribute('download', item.name)
        link.setAttribute('target', '_blank')
        document.body.appendChild(link)
        link.click()
        console.log('link', link)
    }

    async function openInFinder(path: string) {
        let ret = await request.post(`${config.host}/file/openInFinder`, {
            sourceType,
            path,
            // type: item.type,
        })
        // console.log('ret', ret)
        if (ret.success) {
            // message.success('连接成功')
            // onConnnect && onConnnect()
            // message.success(t('success'))
            // onClose && onClose()
            // onSuccess && onSuccess()
            // loadList()
        }
    }

    async function deleteItem(item: File) {
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

    async function copyPaste(item: File, toFolder, copyType, sameNameFile) {
        if (item.type != 'FILE') {
            message.error('暂不支持复制文件夹')
            return
        }
        const fromPath = item.path
        const toPath = toFolder + '/' + (sameNameFile ? getCopyName(item.name, t('copy')) : item.name)
        // + (sameNameFile ? `-${t('copy')}` : '')
        console.log('cp', fromPath, toPath)
        let ret = await request.post(`${config.host}/file/copy`, {
            sourceType,
            fromPath,
            toPath,
            copyType,
        })
        // console.log('ret', ret)
        if (ret.success) {
            // onConnnect && onConnnect()
            message.success(t('success'))
            // onClose && onClose()
            // onSuccess && onSuccess()
            loadList()
        }
    }

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            console.log('e', e.code, e)
            console.log('e/e.keyCode', e.keyCode)
            console.log('e.metaKey', e.metaKey)
            console.log('tabKey', tabKey, window.__activeKey)
            if (tabKey != window.__activeKey) {
                return
            }
            // const parent = rootRef.current.parentNode


            // console.log('parent', parent)
            // console.log('parent.style', parent.style.display)
            // console.log('rootRef', rootRef.current.parent)
            // console.log('e.srcElement', e.srcElement.nodeName)
            


            if (document.activeElement?.nodeName == 'INPUT' || document.activeElement?.nodeName == 'TEXTAREA') {
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
            

            if (e.code == 'KeyC') {
                if (e.metaKey) {
                    if (activeItem) {
                        copyItem(activeItem)
                    }
                    return
                }
            }
            else if (e.code == 'KeyX') {
                if (e.metaKey) {
                    if (activeItem) {
                        cutItem(activeItem)
                    }
                    return
                }
            }
            else if (e.code == 'KeyV') {
                if (e.metaKey) {
                    doPaste()
                    return
                }
            }
            else if (e.code == 'KeyI') {
                if (e.metaKey && !e.altKey) {
                    if (activeItem) {
                        showItemDetail(activeItem)
                    }
                    return
                }
            }
            else if (e.code == 'Backspace') {
                if (e.metaKey) {
                    deleteItem(activeItem)
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
                e.stopPropagation()
                e.preventDefault()
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
                e.stopPropagation()
                e.preventDefault()
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
                e.stopPropagation()
                e.preventDefault()
            }
            
            if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 65 && e.keyCode <= 90)) {
                const idx = list.findIndex(item => item.name.toLowerCase().startsWith(keyCode2Text(e.keyCode)))
                if (idx != -1) {
                    setActiveItem(list[idx])
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [activeItem, list, fileDetailModalVisible])

    function copyItem(item: File) {
        if (item.type != 'FILE') {
            message.error('暂不支持复制文件夹')
            return
        }
        console.log('已复制')
        window._copiedItem = item
        window._copyType = 'copy'
        setCopiedItem(item)
    }

    function showItemDetail(item: File) {
        setInfoVisible(true)
        setFileInfoPath(item.path)
    }

    function cutItem(item: File) {
        if (item.type != 'FILE') {
            message.error('暂不支持复制文件夹')
            return
        }
        console.log('已复制')
        window._copiedItem = item
        window._copyType = 'cut'
    }

    function doPaste() {
        console.log('粘贴', window._copiedItem)
        // if (activeItem) {
        //     window._copiedPath = activeItem.path
        // }
        const sameNameFile = list.find(item => item.name == window._copiedItem.name)
        if (sameNameFile) {
            if (window._copyType == 'cut') {
                message.error('exist')
                return
            }
            console.log('same')
            // return
        }
        copyPaste(window._copiedItem, curPath, window._copyType, sameNameFile)
        setCopiedItem(null)
        window._copiedItem = null
    }

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
            setKeyword('')
            setCurPath(item.path)
        }
    }

    async function editItem(item) {
        setFileEditModalVisible(true)
        setFileModalPath(item.path)
    }

    if (sourceType != 'local' && !item) {
        return <div>No item</div>
    }
    
    // const sideList = [
    //     {
    //         path: ''
    //     }
    // ]
    return (
        <div ref={rootRef} className={styles.fileBox}>
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
                                    setCurPath(info.homePath + '/' + 'Documents')
                                }}
                            >
                                <FileWordOutlined className={styles.icon} />
                                {t('file.document')}
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
                    <CollectionList
                        config={config}
                        onItemClick={item => {
                            setCurPath(item.path)
                        }}
                    />
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
                        {sourceType == 'local' &&
                            <IconButton
                                tooltip={t('terminal.open_in_terminal')}
                                onClick={() => {
                                    event$.emit({
                                        type: 'event_open_terminal',
                                        data: {
                                            path: curPath,
                                        }
                                    })
                                }}
                            >
                                <CodeOutlined />
                            </IconButton>
                        }
                        {sourceType == 'local' &&
                            <IconButton
                                tooltip={t('file.open_in_finder')}
                                onClick={() => {
                                    openInFinder(curPath)
                                }}
                            >
                                <FileSearchOutlined />
                            </IconButton>
                        }
                        {!!copiedItem &&
                            <Button
                                size="small"
                                onClick={() => {
                                    doPaste()
                                }}
                            >
                                {t('paste')}
                            </Button>
                        }
                        {sourceType != 'local' &&
                            <IconButton
                                tooltip={t('upload')}
                                onClick={() => {
                                    const input = document.createElement('input')
                                    input.type = 'file'
                                    input.addEventListener('change', (e) => { 
                                        const file = e.target.files[0]
                                        let formData = new FormData()
                                        console.log('file', file)
                                        formData.append('file', file)
                                        formData.append('path', curPath + '/' + file.name)

                                        // fetch('http://192.168.31.212:8000/api/file', {
                                        fetch(`${config.host}/file/upload`, {
                                            method: "POST",
                                            mode: 'cors',
                                            // headers: {
                                            //     'Content-Type': 'application/x-www-form-urlencoded'
                                            //     // 'Content-Type': 'multipart/form-data'
                                            // },
                                            // body: JSON.stringify({
                                            //     text,
                                            // })
                                            body: formData,
                                        }).then(() => {
                                            console.log('已上传')
                                            loadList()
                                            // Toast.info('已上传')
                                            // setFileKey('' + new Date().getTime())
                                            input.remove()
                                        })
                                    })
                                    input.click()
                                }}
                            >
                                <UploadOutlined />
                            </IconButton>
                        }
                        <Dropdown
                            overlay={
                                <Menu
                                    onClick={({ key }) => {
                                        if (key == 'copy_path') {
                                            copy(curPath)
                                            message.info(t('copied'))
                                        }
                                    }}
                                    items={[
                                        {
                                            label: t('file.copy_path'),
                                            key: 'copy_path',
                                        },
                                    ]}
                                />
                            }
                        >
                            <IconButton
                                onClick={e => e.preventDefault()}
                            >
                                <EllipsisOutlined />
                            </IconButton>
                        </Dropdown>
                        <div className={styles.path}
                            onClick={() => {
                                setPathModalVisible(true)
                            }}
                        >
                            {curPath}
                            {/* <Input
                                className={styles.input}
                                value={curPath}

                            /> */}
                        </div>
                    </div>
                    <Space>
                        <Input
                            placeholder={t('filter')}
                            value={keyword}
                            allowClear
                            size="small"
                            onChange={e => {
                                setKeyword(e.target.value)
                            }}
                        />
                        {sourceType != 'local' &&
                            <div>{connected ? t('connected') : t('connect_unknown')}</div>
                        }
                    </Space>
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
                        : filteredList.length == 0 ?
                            <FullCenterBox>
                                <Empty />
                            </FullCenterBox>
                        :
                            <div className={styles.list}>
                                {filteredList.map(item => {
                                    const isImage = FileUtil.isImage(item.path)
                                    const isMarkdown = item.path.endsWith('.md')

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
                                                        else if (key == 'download') {
                                                            downloadItem(item)
                                                        }
                                                        else if (key == 'open') {
                                                            viewItem(item)
                                                        }
                                                        else if (key == 'copy') {
                                                            copyItem(item)
                                                        }
                                                        else if (key == 'cut') {
                                                            cutItem(item)
                                                        }
                                                        else if (key == 'info') {
                                                            showItemDetail(item)
                                                        }
                                                        else if (key == 'finder') {
                                                            openInFinder(item.path)
                                                        }
                                                    }}
                                                    items={[
                                                        {
                                                            label: t('open'),
                                                            key: 'open',
                                                        },
                                                        {
                                                            label: t('open_with_text_editor'),
                                                            key: 'edit',
                                                        },
                                                        {
                                                            label: t('info'),
                                                            key: 'info',
                                                        },
                                                        {
                                                            label: t('file.open_in_finder'),
                                                            key: 'finder',
                                                        },
                                                        ...(sourceType != 'local' ? [
                                                            {
                                                                label: t('download'),
                                                                key: 'download',
                                                            },
                                                        ] : []),
                                                        {
                                                            type: 'divider',
                                                        },
                                                        {
                                                            label: t('copy'),
                                                            key: 'copy',
                                                        },
                                                        {
                                                            label: t('cut'),
                                                            key: 'cut',
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
                                                        {item.type != 'FILE' ?
                                                            <div className={classNames('iconfont', 'icon-folder', styles.iconFolder)}></div>
                                                        : isImage ?
                                                            <div className={classNames('iconfont', 'icon-image', styles.iconMarkdown)}></div>
                                                        : isMarkdown ?
                                                            <div className={classNames('iconfont', 'icon-markdown', styles.iconImage)}></div>
                                                        :
                                                            <FileOutlined />
                                                            // <FolderOutlined />
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
            {infoVisible &&
                <FileInfo
                    config={config}
                    path={fileInfoPath}
                    sourceType={sourceType}
                    onCancel={() => {
                        setInfoVisible(false)
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
            {pathModalVisible &&
                <FilePathModal
                    config={config}
                    path={curPath}
                    onCancel={() => {
                        setPathModalVisible(false)
                    }}
                    onSuccess={(path) => {
                        setPathModalVisible(false)
                        setCurPath(path)
                    }}
                />
            }
            {connecting &&
                <Modal
                    open={true}
                    title={t('connect')}
                    footer={false}
                    closable={false}
                >
                    {t('connecting')}
                </Modal>
            }
        </div>
    )
}
