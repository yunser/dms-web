import { Button, Descriptions, Divider, Dropdown, Empty, Input, Menu, message, Modal, Popover, Space, Spin, Table, Tabs, Tag, Tooltip } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './file-list.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { AppstoreOutlined, CodeOutlined, CreditCardOutlined, DatabaseOutlined, DownloadOutlined, EllipsisOutlined, FileOutlined, FileSearchOutlined, FileWordOutlined, FolderOutlined, HomeOutlined, LeftOutlined, LinkOutlined, PlusOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
import { request } from '@/views/db-manager/utils/http';
import { IconButton } from '@/views/db-manager/icon-button';
import { FullCenterBox } from '@/views/common/full-center-box';
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
import { getIconForFile, getIconForFolder, getIconForOpenFolder } from 'vscode-icons-js';
import { FilePasteModal } from '../file-paste';
import { OssInfoModal } from '@/views/oss/oss-info/oss-info';

function visibleFilter(list) {
    return list.filter(item => item.visible != false)
}

function myGetIconForFile(path) {
    const _path = path.toLowerCase()
    if (_path.endsWith('.webp')) {
        return 'file_type_image.svg'
    }
    if (_path.endsWith('.pic')) {
        return 'file_type_image.svg'
    }
    if (_path.endsWith('.raw')) {
        return 'file_type_image.svg'
    }
    if (_path.endsWith('.mid')) {
        return 'file_type_audio.svg'
    }
    if (_path.endsWith('.apk')) {
        return 'folder_type_android.svg'
    }

    return getIconForFile(_path)
}

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

function CollectionList({ config, event$, onItemClick }) {

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

    event$ && event$.useSubscription(msg => {
        console.log('Status/onmessage', msg)
        // console.log(val);
        if (msg.type == 'refresh_side') {
            loadList()
        }
        // else if (msg.type == 'event_reload_use') {
        //     const { connectionId: _connectionId, schemaName } = msg.data
        //     if (_connectionId == connectionId) {
        //         heartBeat()
        //     }
        // }
    })

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

// _sourceType: 
// local
// ssh
// oss:linxot-public
// oss:undefined（坚果云）
// 
export function FileList({ config, sourceType: _sourceType = 'local', event$, tabKey,
    item, webdavItem, ossItem, defaultPath: _defaultPath, onSshPath }) {
    // const showSide = _sourceType == 'local'
    const showSide = true
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [list, setList] = useState<File[]>([])
    const [error, setError] = useState('')

    const [sourceType, setSourceType] = useState(_sourceType ? '' : (item ? '' : 'local'))

    let defaultPath = ''
    if (_defaultPath) {
        // 有指定的，用指定的
        defaultPath = _defaultPath
    }
    else if (_sourceType == 'ssh' && item) {
        defaultPath = item.username == 'root' ? '/root' : `/home/${item.username}`
    }
    else if (_sourceType) {
        defaultPath = '/'
    }
    else {
        defaultPath = ''
    }

    const [curPath, setCurPath] = useState(defaultPath)
    const [loading, setLoading] = useState(false)
    const [fileDetailModalVisible, setFileDetialModalVisible] = useState(false)
    const [fileModalPath, setFileModalPath] = useState('')
    const [fileEditModalVisible, setFileEditModalVisible] = useState(false)
    const [pathModalVisible, setPathModalVisible] = useState(false)

    const [ossInfoItem, setOssInfoItem] = useState(true)
    const [ossInfoVisible, setOssInfoVisible] = useState(false)

    const [infoVisible, setInfoVisible] = useState(false)
    const [fileInfoPath, setFileInfoPath] = useState('')

    const [keyword, setKeyword] = useState('')

    const [folderVisible, setFolderVisible] = useState(false)
    const [folderType, setFolderType] = useState('')

    const [activeItem, setActiveItem] = useState(null)
    const [copiedItem, setCopiedItem] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [processing, setProcessing] = useState(false)

    const [connecting, setConnecting] = useState(false)
    const [connected, setConnected] = useState(false)

    const [renameModalVisible, setRenameModalVisible] = useState(false)
    const [renameItem, setRenameItem] = useState(null)

    const [pasteVisible, setPasteVisible] = useState(false)
    const [pasteFile, setPasteFile] = useState(null)

    const [info, setInfo] = useState(null)
    const rootRef = useRef(null)

    const [wsStatus, setWsStatus] = useState('disconnected')
    const colors = {
        connected: 'green',
        disconnected: 'red',
    }
    const tooltips = {
        connected: t('connected'),
        disconnected: t('disconnected'),
        // unknown: 'Un Connect',
    }
    const comData = useRef({
        // cursor: 0,
        connectTime: 0,
        connectionId: '',
    })

    const filteredList = useMemo(() => {
        if (!keyword) {
            return list
        }
        return list.filter(item => {
            return item.name.toLowerCase().includes(keyword.toLowerCase())
        })
    }, [list, keyword])

    async function sftpConnect() {
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
            // onConnect && onConnect()
            // message.success(t('success'))
            // onClose && onClose()
            // onSuccess && onSuccess()
            setConnected(true)
            setSourceType(res.data.connectionId)
            setCurPath(defaultPath)

            comData.current.connectionId = res.data.connectionId
            initWebSocket()
        }
        setConnecting(false)
    }

    async function ossConnect(ossItem) {
        // console.log('flow/1', )
        setConnecting(true)
        console.log('ossConnect', _sourceType)
        const bucket = _sourceType.split(':')[1]
        // return
        let res = await request.post(`${config.host}/oss/connect`, {
            bucket,
            region: ossItem.region,
            accessKeyId: ossItem.accessKeyId,
            accessKeySecret: ossItem.accessKeySecret,
            // path: item.path,
            // type: item.type,
        })
        console.log('connect/res', res)
        if (res.success) {
            // message.success('连接成功')
            // onConnect && onConnect()
            // message.success(t('success'))
            // onClose && onClose()
            // onSuccess && onSuccess()
            setConnected(true)
            setSourceType(res.data.connectionId)
            const defaultPath =
                _sourceType
                    ? '/'
                    : item ?
                        (item.username == 'root' ? '/root' : `/home/${item.username}`)
                        :
                        ''
            setCurPath(defaultPath)
        }
        setConnecting(false)
    }

    async function webdavConnect(webdavItem) {
        // console.log('flow/1', )
        setConnecting(true)
        console.log('ossConnect', _sourceType)
        const bucket = _sourceType.split(':')[1]
        // return
        let res = await request.post(`${config.host}/webdav/connect`, {
            // bucket,
            ...webdavItem,
            // path: item.path,
            // type: item.type,
        })
        console.log('connect/res', res)
        if (res.success) {
            // message.success('连接成功')
            // onConnect && onConnect()
            // message.success(t('success'))
            // onClose && onClose()
            // onSuccess && onSuccess()
            // loadList()
            setConnected(true)
            setSourceType(res.data.connectionId)
            const defaultPath =
                _sourceType
                    ? '/'
                    : item ?
                        (item.username == 'root' ? '/root' : `/home/${item.username}`)
                        :
                        ''
            setCurPath(defaultPath)
        }
        setConnecting(false)
    }

    function initWebSocket() {
        let first = true
        const ws = new WebSocket('ws://localhost:10087/')
        console.log('initWebSocket')
        console.log('readyState', ws.readyState)
        
        ws.onclose = async () => {
            console.log('socket/on-close')
            setWsStatus('disconnected')
            console.log('readyState', ws.readyState)

            // if (comData.current.connectTime < 3) {
            //     comData.current.connectTime++
            //     const ms = comData.current.connectTime * 2000
            //     const action = `正在第 ${comData.current.connectTime} 次重试连接，等待 ${ms} ms`
            //     console.log('time', moment().format('mm:ss'))   
            //     console.log(action)
            //     // setWsAction(action)
            //     await sleep(ms)
            //     initWebSocket()
            // }
            // else {
            //     // setWsAction('自动重试连接超过 3 次，连接失败')
            // }
        }
        ws.onopen = () => {
            comData.current.connectTime = 0
            console.log('onopen', )
            setWsStatus('connected')
            // setWsAction('')
            console.log('readyState', ws.readyState)

            ws.send(JSON.stringify({
                type: 'sftpBind',
                data: {
                    connectionId: comData.current.connectionId,
                },
            }))
            // console.log('sended')
        }
        ws.onerror = (err) => {
            // setWsStatus('error')
            setWsStatus('disconnected')
            console.log('socket error', err)
            console.log('readyState', ws.readyState)
            // if (ws.)

            // if 

        }
        ws.onmessage = (event) => {
            const text = event.data.toString()
            console.log('onmessage', text)
            // {"channel":"msg:timer","message":"2023-01-18 22:21:10"}
            // 接收推送的消息
            let msg
            try {
                msg = JSON.parse(text)
            }
            catch (err) {
                console.log('JSON.parse err', err)
                return
            }
        }
        return ws
    }

    function connect() {
        if (webdavItem) {
            webdavConnect(webdavItem)
        }
        else if (_sourceType == 'ssh' && !!item) {
            sftpConnect()
        }
        else if (_sourceType == 'local') {
            setSourceType('local')
        }
        else if (_sourceType.startsWith('oss')) {
            ossConnect(ossItem)
        }
        else {
            message.error('unknown source type')
        }
    }
    
    useEffect(() => {
        connect()
    }, [item])

    async function loadList() {
        if (!curPath) {
            console.warn('no curPath')
            return
        }
        if (!sourceType) {
            console.warn('no sourceType', sourceType)
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
                .map(item => {
                    return {
                        ...item,
                        icon: item.type == 'FILE' ? myGetIconForFile(item.name) : 'default_folder.svg',
                    }
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
        if (showSide && sourceType == 'local' && !_defaultPath) {
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

    function openWithLog(item) {
        const downloadUrl = `${config.host}/file/download?sourceType=${sourceType}&fileName=${encodeURIComponent(item.name)}&path=${encodeURIComponent(item.path)}`
        window.open(`http://localhost:3002?data=${encodeURIComponent(downloadUrl)}`, '_blank')
    }

    async function openInOs(path: string) {
        let ret = await request.post(`${config.host}/file/openInOs`, {
            sourceType,
            path,
        })
        if (ret.success) {
            // message.success('连接成功')
        }
    }

    async function openInFinder(path: string) {
        let ret = await request.post(`${config.host}/file/openInFinder`, {
            sourceType,
            path,
        })
        if (ret.success) {
            // message.success('连接成功')
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
                    // onConnect && onConnect()
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
        setProcessing(true)
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
            // onConnect && onConnect()
            message.success(t('success'))
            // onClose && onClose()
            // onSuccess && onSuccess()
            loadList()
        }
        setProcessing(false)
    }

    useEffect(() => {
        // let that = this
        function handlePaste(event) {
            const items = event.clipboardData && event.clipboardData.items
            // const file = null
            if (items && items.length) {
                // 检索剪切板items
                console.log('items', items)
                for (let i = 0; i < items.length; i++) {
                    const item = items[i]
                    console.log('type', item.type)
                    // application/zip
                    if (items[i].type.indexOf('image') !== -1) {
                        const file = items[i].getAsFile()
                        console.log('file', file)
                        setPasteFile(file)
                        setPasteVisible(true)
                        break
                    }
                }
            }
        }
        document.addEventListener('paste', handlePaste)
        return () => {
            document.removeEventListener('paste', handlePaste)
        }
    }, [])

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            console.log('e', e.code, e)
            console.log('e/e.keyCode', e.keyCode)
            console.log('e.metaKey', e.metaKey)
            console.log('tabKey', tabKey, window.__activeKey)
            if (tabKey && window.__activeKey && tabKey != window.__activeKey) {
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
            else if (e.code == 'KeyE') {
                if (e.metaKey) {
                    if (activeItem) {
                        editItem(activeItem)
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
            // else if (e.code == 'keyN') {
            //     if (e.metaKey) {
            //         console.log('nn', )
            //     }
            //     e.stopPropagation()
            //     e.preventDefault()
            // }
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

    async function clearItem(item) {
        Modal.confirm({
            content: `${t('clear')}「${item.name}」?`,
            async onOk() {
                let res = await request.post(`${config.host}/file/write`, {
                    path: item.path,
                    sourceType,
                    content: '',
                })
                // console.log('res', res)
                if (res.success) {
                    loadList()
                }
            }
        })
    }

    function cutItem(item: File) {
        if (item.type != 'FILE') {
            message.error('暂不支持复制文件夹')
            return
        }
        console.log('已复制')
        window._copiedItem = item
        window._copyType = 'cut'
        setCopiedItem(item)
    }

    function doPaste() {
        console.log('粘贴', window._copiedItem)
        if (!window._copiedItem) {
            return
        }
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
                if (item.size > 10 * 1024 * 1024) {
                    message.info('文件太大，暂不支持查看')
                    return
                }
            }
            setFileModalPath(item.path)
            setFileDetialModalVisible(true)
        }
        else {
            setKeyword('')
            setCurPath(item.path)
        }
    }

    async function viewItemOssInfo(item) {
        setOssInfoItem(item)
        setOssInfoVisible(true)
    }

    async function editItem(item) {
        setFileModalPath(item.path)
        setFileEditModalVisible(true)
    }

    async function favorite(path) {
        let res = await request.post(`${config.host}/file/collection/create`, {
            path,
        })
        // console.log('res', res)
        if (res.success) {
            // setList(res.data.list)
            event$.emit({
                type: 'refresh_side'
            })
        }
    }

    function uploadFile({ file, name, onSuccess = () => { } }) {
        let formData = new FormData()
        console.log('file', file)
        formData.append('file', file)
        formData.append('path', curPath + '/' + (name || file.name))
        formData.append('sourceType', sourceType)

        setUploading(true)
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
        })
            .then(() => {
                console.log('已上传')
                loadList()
                // Toast.info('已上传')
                // setFileKey('' + new Date().getTime())
                onSuccess && onSuccess()
                setUploading(false)
            })
    }

    if ((sourceType != 'local' && !_sourceType) && !item) {
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
                    <div className={styles.sideTop}>
                        {_sourceType == 'ssh' &&
                            <div>
                                <div className={styles.sideList}>
                                    <div className={styles.item}
                                        onClick={() => {
                                            const path = (item.username == 'root') ? '/root' : `/home/${item.username}`
                                            setCurPath(path)
                                        }}
                                    >
                                        <CreditCardOutlined className={styles.icon} />
                                        {t('file.home')}
                                    </div>
                                </div>
                                <Divider />
                            </div>
                        }
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
                                        setCurPath('/Applications')
                                    }}
                                >
                                    <AppstoreOutlined className={styles.icon} />
                                    {t('file.app')}
                                </div>
                                <div className={styles.item}
                                    onClick={() => {
                                        setCurPath(info.homePath)
                                    }}
                                >
                                    <HomeOutlined className={styles.icon} />
                                    {t('file.home')}
                                </div>
                                <Divider />
                                <div className={styles.item}
                                    onClick={() => {
                                        setCurPath(info.homePath + '/.yunser/dms-cli')
                                    }}
                                >
                                    <DatabaseOutlined className={styles.icon} />
                                    DMS - DB
                                </div>
                                <Divider />
                            </div>
                        }
                        <CollectionList
                            config={config}
                            event$={event$}
                            onItemClick={item => {
                                setCurPath(item.path)
                            }}
                        />
                    </div>
                    {_sourceType == 'ssh' &&
                        <div className={styles.sideBottom}>
                            <Space>
                                <Tooltip
                                    placement="topLeft"
                                    title={tooltips[wsStatus]}
                                    >
                                    <LinkOutlined
                                        style={{
                                            // fontWeight: 'bold',
                                            color: colors[wsStatus],
                                        }}
                                        />
                                </Tooltip>
                                {/* {sourceType} */}
                                {wsStatus != 'connected' &&
                                    <Button
                                        size="small"
                                        onClick={() => {
                                            connect()
                                        }}
                                        >
                                        {t('connect')}
                                    </Button>
                                }
                            </Space>
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
                                        if (file) {
                                            uploadFile({
                                                file,
                                                onSuccess: () => {
                                                    input.remove()
                                                }
                                            })
                                        }

                                    })
                                    input.click()
                                }}
                            >
                                <UploadOutlined />
                            </IconButton>
                        }
                        {sourceType != 'local' &&
                            <Button
                                size="small"
                                // tooltip={t('upload')}
                                onClick={() => {
                                    onSshPath && onSshPath(curPath)
                                }}
                            >
                                SSH
                            </Button>
                        }
                        <Dropdown
                            overlay={
                                <Menu
                                    onClick={({ key }) => {
                                        if (key == 'copy_path') {
                                            copy(curPath)
                                            message.info(t('copied'))
                                        }
                                        else if (key == 'add_to_favorite') {
                                            favorite(curPath)
                                        }
                                        else if (key == 'export_json') {
                                            event$.emit({
                                                type: 'event_show_json',
                                                data: {
                                                    json: JSON.stringify(list, null, 4)
                                                    // connectionId,
                                                },
                                            })
                                        }
                                    }}
                                    items={[
                                        {
                                            label: t('file.copy_path'),
                                            key: 'copy_path',
                                        },
                                        {
                                            label: t('add_to_favorite'),
                                            key: 'add_to_favorite',
                                        },
                                        {
                                            label: t('export_json'),
                                            key: 'export_json',
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
                            <Space>
                                <div>{connected ? t('connected') : t('disconnected')}</div>
                                {!connected &&
                                    <Button
                                        size="small"
                                        onClick={() => {
                                            sftpConnect()
                                        }}
                                    >
                                        {t('connect')}
                                    </Button>
                                }
                            </Space>
                        }
                    </Space>
                </div>
                <div className={styles.body}
                    // onDragOver
                    onDragOver={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                    }}
                    onDrop={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const file = e.dataTransfer.files[0]
                        console.log('file', file)
                        uploadFile({ file })
                        // const reader = new FileReader()
                        // reader.onload = async () => {
                        //     console.log(reader.result)
                        //     const root = JSON.parse((reader.result) as any)
                        //     const nodes_will = await parseRoot(page)
                        //     console.log('nodes_will', nodes_will)

                        //     editor.current.setNodes(nodes_will.children)
                        // }
                        // reader.readAsText(file, 'utf-8')
                        // var reader = new FileReader();
                        //读取成功
                    }}
                >
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
                                                                else if (key == 'open_in_os') {
                                                                    openInOs(item.path)
                                                                }
                                                                else if (key == 'clear') {
                                                                    clearItem(item)
                                                                }
                                                                else if (key == 'open_with_nginx') {
                                                                    openWithLog(item)
                                                                }
                                                                else if (key == 'oss_info') {
                                                                    viewItemOssInfo(item)
                                                                }
                                                            }}
                                                            items={visibleFilter([
                                                                {
                                                                    label: t('open'),
                                                                    key: 'open',
                                                                },
                                                                {
                                                                    label: t('open_with_text_editor'),
                                                                    key: 'edit',
                                                                },
                                                                {
                                                                    visible: sourceType.includes('oss'),
                                                                    label: t('oss_info'),
                                                                    key: 'oss_info',
                                                                },
                                                                // {
                                                                //     label: t('open_with_nginx'),
                                                                //     key: 'open_with_nginx',
                                                                // },
                                                                {
                                                                    label: t('info'),
                                                                    key: 'info',
                                                                },
                                                                ...(sourceType == 'local' ? [
                                                                    {
                                                                        label: t('file.open_in_finder'),
                                                                        key: 'finder',
                                                                    },
                                                                    {
                                                                        label: t('file.open_in_os'),
                                                                        key: 'open_in_os',
                                                                    },
                                                                ] : []),
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
                                                                    type: 'divider',
                                                                },
                                                                {
                                                                    label: t('delete'),
                                                                    key: 'delete_file',
                                                                    danger: true,
                                                                },
                                                                {
                                                                    label: t('clear'),
                                                                    key: 'clear',
                                                                },
                                                                {
                                                                    type: 'divider',
                                                                },
                                                                {
                                                                    label: t('copy_name'),
                                                                    key: 'copy_name',
                                                                },
                                                                {
                                                                    label: t('file.copy_path'),
                                                                    key: 'copy_path',
                                                                },
                                                            ])}
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
                                                            <div className={styles.iconBox}>
                                                                <img className={styles.vscIcon} src={`/vscode-icons/icons/${item.icon}`} />
                                                                {/* {item.type != 'FILE' ?
                                                        :
                                                            <img className={styles.vscIcon} src={`/vscode-icons/icons/${item.icon}`} />
                                                        } */}
                                                            </div>
                                                            {/* <div className={styles.icon}>
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
                                                    </div> */}
                                                            <div className={styles.label}>
                                                                {item.name}
                                                                {/* (?{item.icon}) */}
                                                                {!!item.isSymbolicLink &&
                                                                    <Tag color="blue" style={{ marginLeft: 8 }}>link</Tag>
                                                                }
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
                    // closable={false}
                    onCancel={() => {
                        setConnecting(false)
                    }}
                >
                    {t('connecting')}
                </Modal>
            }
            {uploading &&
                <Modal
                    open={true}
                    title={t('upload')}
                    footer={false}
                    closable={false}
                >
                    {t('uploading')}
                </Modal>
            }
            {processing &&
                <Modal
                    open={true}
                    title={t('processing')}
                    footer={false}
                    closable={false}
                >
                    {t('processing')}
                </Modal>
            }
            {pasteVisible &&
                <FilePasteModal
                    file={pasteFile}
                    onCancel={() => {
                        setPasteVisible(false)
                    }}
                    onOk={({ name }) => {
                        setPasteVisible(false)
                        uploadFile({
                            file: pasteFile,
                            name,
                        })
                    }}
                />
            }
            {ossInfoVisible &&
                <OssInfoModal
                    config={config}
                    sourceType={sourceType}
                    item={ossInfoItem}
                    onCancel={() => {
                        setOssInfoVisible(false)
                    }}
                // onOk={({ name }) => {
                //     setOssInfoVisible(false)
                //     uploadFile({
                //         file: pasteFile,
                //         name,
                //     })
                // }}
                />
            }
        </div>
    )
}
