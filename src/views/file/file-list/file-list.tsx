import { Button, Descriptions, Divider, Dropdown, Empty, Input, Menu, message, Modal, Popover, Space, Spin, Table, Tabs, Tag, Tooltip } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './file-list.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { AppstoreOutlined, CodeOutlined, CreditCardOutlined, DatabaseOutlined, DownloadOutlined, DownOutlined, EditOutlined, EllipsisOutlined, FileOutlined, FileSearchOutlined, FileWordOutlined, FolderAddOutlined, FolderOutlined, HomeOutlined, LeftOutlined, LinkOutlined, PlusOutlined, ReloadOutlined, SaveOutlined, UploadOutlined, UpOutlined } from '@ant-design/icons';
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
import { S3InfoModal } from '@/views/s3/s3-info/s3-info';
import VList from 'rc-virtual-list'
import { SizeDiv } from '@/views/common/size-dev';
import { FileDownloadModal } from '../file-download';
import { FileOpenModal } from '../file-open';

window._copiedItems = []

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
    // const suffix = `-${copyText}`
    const suffix = moment().format('_YYYYMMDD_HHmmss')
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

function FixedFileList({ list = [], onItemClick }) {
    return (
        <div className={styles.fixedFileBox}>
            <div className={styles.list}>
                {list.map(item => {
                    return (
                        <div className={styles.item}
                            onClick={() => {
                                onItemClick && onItemClick(item)
                            }}
                        >
                            <div className={styles.name}>
                                {item.name}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function PathRender({ info, path, onPath }) {

    const pathSeparator = info?.pathSeparator || '/'
    const isWindows = info?.os == 'win32'
    const arr: string[] = path.split(pathSeparator).filter(item => item)
    return (
        // <div>{path}</div>
        <div className={styles.pathList}>
            {!isWindows &&
                <>
                    <IconButton
                        onClick={() => {
                            onPath && onPath('/')
                        }}
                    >
                        <HomeOutlined />
                    </IconButton>
                    {arr.length == 0 &&
                        <div>{pathSeparator}</div>
                    }
                </>
            }
            {arr.map((item, index) => {
                return (
                    <div 
                        className={styles.item}
                        onClick={() => {
                            console.log('index', index)
                            let path = (isWindows ? '' : '/') + arr.slice(0, index + 1).join(pathSeparator)
                            console.log('path', path)
                            // for windows, like C:
                            if (path.match(/^[a-zA-Z]:$/)) {
                                path = path + '\\'
                            }
                            onPath && onPath(path)
                        }}
                    >
                        {item}
                    </div>
                )
            })}
        </div>
    )
}

export function FileCollectionList({ config, event$, onItemClick }) {

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
    item, webdavItem, ossItem, s3Item, defaultPath: _defaultPath, onSshPath, onClone }) {
    // const showSide = _sourceType == 'local'
    const showSide = true
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const listElem = useRef(null)
    const [list, setList] = useState<File[]>([])
    const totalSize = useMemo(() => {
        let total = 0
        for (let item of list) {
            total += item.size || 0
        }
        return total
    }, [list])
    
    const listRef = useRef(null)
    const [showDotFile, setShowDotFile] = useState(false)
    const [error, setError] = useState('')
    const [sortBy, setSortBy] = useState('name')
    const [sortType, setSortType] = useState('asc')
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
    const [fileModalItem, setFileModalItem] = useState(null)
    const [fileEditModalVisible, setFileEditModalVisible] = useState(false)
    const [pathModalVisible, setPathModalVisible] = useState(false)

    const [fixedFiles, setFixedFiles] = useState([
        // {
        //     opType: 'view',
        //     name: 'test.png',
        //     path: '/test.png',   
        // }
    ])
    const [s3InfoItem, setS3InfoItem] = useState(true)
    const [s3InfoVisible, setS3InfoVisible] = useState(false)

    const [ossInfoItem, setOssInfoItem] = useState(true)
    const [ossInfoVisible, setOssInfoVisible] = useState(false)

    const [infoVisible, setInfoVisible] = useState(false)
    const [fileInfoPath, setFileInfoPath] = useState('')

    const [keyword, setKeyword] = useState('')

    const [folderVisible, setFolderVisible] = useState(false)
    const [folderType, setFolderType] = useState('')

    const [selectedPaths, setSelectedPaths] = useState([])
    const [selectedItems, setSelectedItems] = useState([])
    const selectedSize = useMemo(() => {
        let total = 0
        for (let item of selectedItems) {
            total += item.size || 0
        }
        return total
    }, [selectedItems])
    const selectedPathsMap = useMemo(() => {
        const obj = {}
        for (let path of selectedPaths) {
            obj[path] = 1
        }
        return obj
    }, [selectedPaths])
    const [activeItem, _setActiveItem] = useState(null)
    function setActiveItem(item) {
        _setActiveItem(item)
        if (item) {
            setSelectedPaths([item.path])
            setSelectedItems([item])
        }
        else {
            setSelectedPaths([])
            setSelectedItems([])
        }
    }
    const [copiedItems, setCopiedItems] = useState([])
    const [uploading, setUploading] = useState(false)
    const [processing, setProcessing] = useState(false)

    const [connecting, setConnecting] = useState(false)
    const [connected, setConnected] = useState(false)

    const [openModalVisible, setOpenModalVisible] = useState(false)

    const [renameModalVisible, setRenameModalVisible] = useState(false)
    const [renameItem, setRenameItem] = useState(null)

    const [downloadModalVisible, setDownloadModalVisible] = useState(false)

    const [readmePath, setReadmePath] = useState('')
    const [readmeContent, setReadmeContent] = useState('')

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
        originList: [],
        historyInput: '',
        lastInputTime: new Date(),
    })

    function getInputWithHistoryInput(newChar: string) {
        const now = new Date()
        if (now.getTime() - comData.current.lastInputTime.getTime() > 600) {
            comData.current.historyInput = newChar
        }
        else {
            comData.current.historyInput += newChar
        }
        // console.log('g_history_input', comData.current.historyInput)
        comData.current.lastInputTime = now
        return comData.current.historyInput
    }

    const filteredAndSOrtedList = useMemo(() => {
        function getSize(item) {
            if (item.type == 'DIRECTORY') {
                return -1
            }
            return item.size || 0
        }
        const sortTypeValue = sortType == 'asc' ? 1 : -1
        
        const sorter = (a, b) => {
            if (sortBy == 'size') {
                return (getSize(a) - getSize(b)) * sortTypeValue
            }
            return (a[sortBy] || '').localeCompare(b[sortBy] || '') * sortTypeValue
        }
        const filter = item => {
            if (showDotFile) {
                return true
            }
            return !item.name.startsWith('.')
        }
        if (!keyword) {
            return list.filter(filter).sort(sorter)
        }
        const filteredList = list.filter(filter).filter(item => {
            return item.name.toLowerCase().includes(keyword.toLowerCase())
        })
        return filteredList.sort(sorter)
    }, [list, keyword, sortBy, sortType, showDotFile])

    function sortList(col) {
        const field: string = col.dataIndex
        
        let _sortType
        if (sortBy == field) {
            _sortType = sortType == 'asc' ? 'desc' : 'asc'
        }
        else {
            _sortType = col.sortDirections[0] || 'asc'
        }
        setSortBy(field)
        setSortType(_sortType)
    }

    async function loadReadme() {
        // setLoading(true)
        let res = await request.post(`${config.host}/file/read`, {
            sourceType,
            path: readmePath,
        })
        if (res.success) {
            const content = res.data.content
            setReadmeContent(content)
        }
        // setLoading(false)
    }

    useEffect(() => {
        if (readmePath) {
            loadReadme()
        }
        else {
            setReadmeContent('')
        }
    }, [readmePath])

    async function sftpConnect(refreshPath: boolean) {
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
            if (refreshPath) {
                setCurPath(defaultPath)
            }

            comData.current.connectionId = res.data.connectionId
            initWebSocket()
        }
        setConnecting(false)
    }

    async function s3Connect(s3Item) {
        // console.log('flow/1', )
        setConnecting(true)
        console.log('s3Connect', _sourceType)
        // const bucket = _sourceType.split(':')[1]
        // return
        console.log('s3Item', s3Item)
        let res = await request.post(`${config.host}/s3/connect`, {
            id: s3Item.id,
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

    function connect(refreshPath = true) {
        if (webdavItem) {
            webdavConnect(webdavItem)
        }
        else if (_sourceType == 'ssh' && !!item) {
            sftpConnect(refreshPath)
        }
        else if (_sourceType == 'local') {
            setSourceType('local')
        }
        else if (_sourceType.startsWith('oss')) {
            ossConnect(ossItem)
        }
        else if (_sourceType.startsWith('s3')) {
            s3Connect(s3Item)
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
                .sort((a, b) => {
                    return a.name.localeCompare(b.name)
                })
                .map(item => {
                    const [_name, contentType] = lastSplit(item.name, '.')

                    return {
                        ...item,
                        icon: item.type == 'FILE' ? myGetIconForFile(item.name) : 'default_folder.svg',
                        contentType,
                    }
                })
            comData.current.originList = _.clone(list)
            setList(list)
            // activeItem 刷新后没了
            if (activeItem) {
                const activeItemExist = !!list.find(item => item.path == activeItem.path)
                if (!activeItemExist) {
                    setActiveItem(null)
                }
            }
            
            // setCurrent(res.data.current)
            // handle readme
            const fReadMeFile = list.find(item => item.name.toLowerCase() == 'readme.md')
            if (fReadMeFile) {
                setReadmePath(fReadMeFile.path)
            }
            else {
                setReadmePath('')
            }
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
            setInfo({
                pathSeparator: '/',
                ...res.data,
            })
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
        link.style.display = "none"
        link.href = downloadUrl
        link.setAttribute('download', item.name)
        link.setAttribute('target', '_blank')
        document.body.appendChild(link)
        link.click()
        console.log('link', link)
    }

    function downloadItems() {
        for (let item of selectedItems) {
            downloadItem(item)
        }
    }

    function openWithLog(item) {
        const downloadUrl = `${config.host}/file/download?sourceType=${sourceType}&fileName=${encodeURIComponent(item.name)}&path=${encodeURIComponent(item.path)}`
        window.open(`http://localhost:3002?data=${encodeURIComponent(downloadUrl)}`, '_blank')
    }

    async function openInOs(path: string) {
        await request.post(`${config.host}/file/openInOs`, {
            sourceType,
            path,
        })
    }
    async function openInVsCode(path: string) {
        await request.post(`${config.host}/file/openInVsCode`, {
            path,
        })
    }

    async function openInFinder(path: string) {
        await request.post(`${config.host}/file/openInFinder`, {
            sourceType,
            path,
        })
    }

    async function deleteItems() {
        Modal.confirm({
            width: 640,
            title: `${t('delete')} ${selectedItems.length} ${t('files')}\n?`,
            content: (
                <Table
                    columns={[
                        {
                            title: t('name'),
                            dataIndex: 'name',
                            render(name, item) {
                                return (
                                    <Space>
                                        <div className={styles.fileIconBox}>
                                            <img className={styles.vscIcon} src={`/vscode-icons/icons/${item.icon}`} />
                                        </div>
                                        {name}
                                    </Space>
                                )
                            }
                        },
                        {
                            title: t('size'),
                            dataIndex: 'size',
                            render(value, item) {
                                return (
                                    <div>
                                        {item.type == 'FILE' ?
                                            filesize(item.size, { fixed: 1, }).human()
                                        :
                                            '--'
                                        }
                                    </div>
                                )
                            }
                        },
                    ]}
                    dataSource={selectedItems}
                    size="small"
                    scroll={{
                        y: 480,
                    }}
                    pagination={false}
                />
            ),
            okButtonProps: {
                danger: true,
            },
            async onOk() {

                let ret = await request.post(`${config.host}/file/delete`, {
                    sourceType,
                    paths: selectedItems.map(item => {
                        return {
                            type: item.type,
                            path: item.path,
                        }
                    }),
                })
                if (ret.success) {
                    loadList()
                }
            }
        })
    }

    async function deleteItem(item: File) {
        Modal.confirm({
            content: `${t('delete')}「${item.name}」?`,
            okButtonProps: {
                danger: true,
            },
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

    async function copyPaste(items: File[], toFolder, copyType, sameNameFile) {
        if (items.length == 1) {
            const item = items[0]
            if (item.type != 'FILE') {
                message.error('暂不支持复制文件夹')
                return
            }
            setProcessing(true)
            const fromPath = item.path
            const toPath = toFolder + '/' + (sameNameFile ? getCopyName(item.name, t('copy')) : item.name)
            // + (sameNameFile ? `-${t('copy')}` : '')
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
        else if (items.length > 1) {
            const hasFolder = items.some(item => item.type != 'FILE')
            if (hasFolder) {
                message.error('暂不支持复制文件夹')
                return
            }
            setProcessing(true)
            
            // + (sameNameFile ? `-${t('copy')}` : '')
            // console.log('cp', fromPath, toPath)
            let ret = await request.post(`${config.host}/file/copy`, {
                sourceType,
                items: items.map(item => {
                    const fromPath = item.path
                    const toPath = toFolder + '/' + (sameNameFile ? getCopyName(item.name, t('copy')) : item.name)
                    return {
                        fromPath,
                        toPath,
                    }
                }),
                // fromPath,
                // toPath,
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
    }

    useEffect(() => {
        // let that = this
        function handlePaste(event) {
            const items = event.clipboardData && event.clipboardData.items
            // const file = null
            if (items && items.length) {
                // 检索剪切板items
                for (let i = 0; i < items.length; i++) {
                    const item = items[i]
                    console.log('type', item.type)
                    // application/zip
                    if (items[i].type.indexOf('image') !== -1) {
                        const file = items[i].getAsFile()
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
            // console.log('e', e.code, e)
            // console.log('e/e.keyCode', e.keyCode)
            // console.log('tabKey', tabKey, window.__activeKey)
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
                return 'a'
            }


            if (e.code == 'KeyC') {
                if (e.metaKey || e.ctrlKey) {
                    if (activeItem) {
                        copyItem(activeItem)
                    }
                    return
                }
            }
            else if (e.code == 'KeyE') {
                if (e.metaKey || e.ctrlKey) {
                    if (activeItem) {
                        editItem(activeItem)
                    }
                    return
                }
            }
            else if (e.code == 'KeyR') {
                if (e.metaKey || e.ctrlKey) {
                    if (activeItem) {
                        e.preventDefault() // 不加上会触发页面刷新
                        setRenameItem(activeItem)
                        setRenameModalVisible(true)
                    }
                    return
                }
            }
            else if (e.code == 'KeyX') {
                if (e.metaKey || e.ctrlKey) {
                    if (activeItem) {
                        cutItem(activeItem)
                    }
                    return
                }
            }
            else if (e.code == 'KeyV') {
                if (e.metaKey || e.ctrlKey) {
                    doPaste()
                    return
                }
            }
            else if (e.code == 'KeyI') {
                if ((e.metaKey || e.ctrlKey) && !e.altKey) {
                    if (activeItem) {
                        showItemDetail(activeItem)
                    }
                    return
                }
            }
            else if (e.code == 'Backspace') {
                if (e.metaKey || e.ctrlKey) {
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
                if (e.metaKey || e.ctrlKey) {
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
                if (e.metaKey || e.ctrlKey) {
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

            const historyInput = getInputWithHistoryInput(keyCode2Text(e.keyCode))
            if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 65 && e.keyCode <= 90)) {
                const idx = list.findIndex(item => item.name.toLowerCase().startsWith(historyInput))
                if (idx != -1) {
                    setActiveItem(list[idx])
                    // const elem = listElem.current
                    // const item_height = 40
                    // elem.scrollTop = idx * item_height
                    // elem.scrollTop = (idx / list.length) * elem.scrollHeight
                    // console.log('elem.scrollTop', elem.scrollTop)
                    // console.log('elem.scrollTop?', idx, list.length)

                    // listRef.current.scrollTo(idx * item_height)
                    listRef.current.scrollTo({
                        index: idx,
                        align: 'top',
                    })
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [activeItem, list, fileDetailModalVisible])

    function copyItems() {
        console.log('selectedItems', selectedItems)
        // .length
        const hasFolder = selectedItems.some(item => item.type != 'FILE')
        if (hasFolder) {
            message.error('暂不支持复制文件夹')
            return
        }
        console.log('已复制')
        window._copiedItems = [...selectedItems]
        window._copyType = 'copy'
        setCopiedItems([...selectedItems])
    }

    function copyItem(item: File) {
        if (item.type != 'FILE') {
            message.error('暂不支持复制文件夹')
            return
        }
        console.log('已复制')
        window._copiedItems = [item]
        window._copyType = 'copy'
        setCopiedItems([item])
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
        window._copiedItems = [item]
        window._copyType = 'cut'
        setCopiedItems([item])
    }
    
    function cutItems() {
        console.log('selectedItems', selectedItems)
        // .length
        const hasFolder = selectedItems.some(item => item.type != 'FILE')
        if (hasFolder) {
            message.error('暂不支持复制文件夹')
            return
        }
        console.log('已复制')
        window._copiedItems = [...selectedItems]
        window._copyType = 'cut'
        setCopiedItems([...selectedItems])
    }

    function doPaste() {
        console.log('粘贴', window._copiedItems.length)
        if (window._copiedItems.length == 0) {
            return
        }
        // if (activeItem) {
        //     window._copiedPath = activeItem.path
        // }
        const sameNameFile = list.find(item => item.name == window._copiedItems[0].name)
        if (sameNameFile) {
            if (window._copyType == 'cut') {
                message.error('exist')
                return
            }
            console.log('same')
            // return
        }
        copyPaste(window._copiedItems, curPath, window._copyType, sameNameFile)
        setCopiedItems([])
        window._copiedItems = []
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
            setFileModalItem(item)
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

    async function viewItemS3Info(item) {
        setS3InfoItem(item)
        setS3InfoVisible(true)
    }

    async function editItem(item) {
        setFileModalItem(item)
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

    function uploadFiles(files = []) {
        // const file = e.dataTransfer.files[0]
        // uploadFile({ file })
        if (files.length > 1) {
            for (let file of files) {
                uploadFile({
                    file,
                    onSuccess: () => {
                        // input.remove()
                        // message.success(`${}`)
                    }
                })
            }
        }
        else {
            const file = files[0]
            if (file) {
                uploadFile({
                    file,
                    onSuccess: () => {
                        // input.remove()
                    }
                })
            }
        }
    }

    async function uploadFile({ file, name, onSuccess = () => { } }) {
        let formData = new FormData()
        formData.append('file', file)
        formData.append('path', curPath + '/' + (name || file.name))
        formData.append('sourceType', sourceType)

        setUploading(true)
        // fetch('http://192.168.31.212:8000/api/file', {
        await fetch(`${config.host}/file/upload`, {
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
        console.log('已上传')
        loadList()
        // Toast.info('已上传')
        // setFileKey('' + new Date().getTime())
        onSuccess && onSuccess()
        setUploading(false)
    }

    if ((sourceType != 'local' && !_sourceType) && !item) {
        return <div>No item</div>
    }

    // const sideList = [
    //     {
    //         path: ''
    //     }
    // ]

    const columns = [
        {
            label: t('name'),
            dataIndex: 'name',
            sortDirections: ['asc', 'desc'],
        },
        {
            label: t('file.modify_time'),
            dataIndex: 'modifyTime',
            sortDirections: ['desc', 'asc'],
        },
        {
            label: t('create_time'),
            dataIndex: 'createTime',
            sortDirections: ['desc', 'asc'],
        },
        {
            label: t('access_time'),
            dataIndex: 'accessTime',
            sortDirections: ['desc', 'asc'],
        },
        {
            label: t('type'),
            dataIndex: 'contentType',
            sortDirections: ['asc', 'desc'],
        },
        {
            label: t('size'),
            dataIndex: 'size',
            sortDirections: ['desc', 'asc'],
        },
    ]

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
                                 {info.os == 'win32' &&
                                    <>
                                        <div className={styles.item}
                                            onClick={() => {
                                                setCurPath(info.homePath + '\\' + 'Desktop')
                                            }}
                                        >
                                            <CreditCardOutlined className={styles.icon} />
                                            {t('file.desktop')}
                                        </div>
                                        <div className={styles.item}
                                            onClick={() => {
                                                setCurPath(info.homePath + '\\' + 'Downloads')
                                            }}
                                        >
                                            <DownloadOutlined className={styles.icon} />
                                            {t('file.download')}
                                        </div>
                                        <div className={styles.item}
                                            onClick={() => {
                                                setCurPath(info.homePath + '\\' + 'Documents')
                                            }}
                                        >
                                            <FileWordOutlined className={styles.icon} />
                                            {t('file.document')}
                                        </div>
                                        <div className={styles.item}
                                            onClick={() => {
                                                setCurPath(info.homePath + '\\' + 'Pictures')
                                            }}
                                        >
                                            <FileWordOutlined className={styles.icon} />
                                            {t('file.picture')}
                                        </div>
                                        <div className={styles.item}
                                            onClick={() => {
                                                setCurPath(info.homePath + '\\' + 'Videos')
                                            }}
                                        >
                                            <FileWordOutlined className={styles.icon} />
                                            {t('file.video')}
                                        </div>
                                        <div className={styles.item}
                                            onClick={() => {
                                                setCurPath(info.homePath + '\\' + 'Music')
                                            }}
                                        >
                                            <FileWordOutlined className={styles.icon} />
                                            {t('file.music')}
                                        </div>
                                        <div className={styles.item}
                                            onClick={() => {
                                                setCurPath(info.homePath + '\\' + '3D Objects')
                                            }}
                                        >
                                            <FileWordOutlined className={styles.icon} />
                                            {t('file.3d_object')}
                                        </div>
                                        <div className={styles.item}
                                            onClick={() => {
                                                setCurPath(info.homePath)
                                            }}
                                        >
                                            <HomeOutlined className={styles.icon} />
                                            {t('file.home')}
                                        </div>
                                    </>
                                }
                                {info.os == 'darwin' &&
                                    <>
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
                                    </>
                                }
                                {!!info.disks.length &&
                                    <>
                                        <Divider />
                                        {info.disks.map(disk => {
                                            return (
                                                <div 
                                                    className={styles.item}
                                                    key={disk.name}
                                                    onClick={() => {
                                                        setCurPath(disk.path)
                                                    }}
                                                >
                                                    <SaveOutlined className={styles.icon} />
                                                    {disk.name}
                                                </div>
                                            )
                                        })}
                                    </>
                                }
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
                        <FileCollectionList
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
                                {/* <Tooltip
                                    placement="topLeft"
                                    title={tooltips[wsStatus]}
                                    >
                                    <LinkOutlined
                                        style={{
                                            // fontWeight: 'bold',
                                            color: colors[wsStatus],
                                        }}
                                    />
                                </Tooltip> */}
                                <Popover
                                    title={tooltips[wsStatus]}
                                    content={(
                                        <Button
                                            size="small"
                                            onClick={() => {
                                                connect(false)
                                            }}
                                            >
                                            {t('reconnect')}
                                        </Button>
                                    )}
                                >
                                    <LinkOutlined
                                        style={{
                                            // fontWeight: 'bold',
                                            color: colors[wsStatus],
                                        }}
                                    />
                                </Popover>
                                {/* {sourceType} */}
                                {wsStatus != 'connected' &&
                                    <Button
                                        size="small"
                                        onClick={() => {
                                            connect(false)
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
                                        else if (key == 'download_from_url') {
                                            setDownloadModalVisible(true)
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
                                        {
                                            type: 'divider',
                                        },
                                        {
                                            label: t('file.download_from_url'),
                                            key: 'download_from_url',
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
                        {/* <IconButton
                            tooltip={t('folder')}
                            onClick={() => {
                                setFolderVisible(true)
                                setFolderType('FOLDER')
                            }}
                        >
                            <FolderAddOutlined />
                        </IconButton> */}
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
                                tooltip={t('file.open_in_file_manager')}
                                onClick={() => {
                                    openInFinder(curPath)
                                }}
                            >
                                <FileSearchOutlined />
                            </IconButton>
                        }
                        {copiedItems.length > 0 &&
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
                                    input.setAttribute('multiple', 'multiple')
                                    input.addEventListener('change', (e) => {
                                        uploadFiles(e.target.files)
                                    })
                                    input.click()
                                }}
                            >
                                <UploadOutlined />
                            </IconButton>
                        }
                        <Space>
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
                            <Tooltip title={t('file.dot_file_toggle')}>
                                <Button
                                    size="small"
                                    type={showDotFile ? 'primary' : 'default'}
                                    onClick={() => {
                                        setShowDotFile(!showDotFile)
                                    }}
                                >
                                    .
                                </Button>
                            </Tooltip>
                        </Space>
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
                                        else if (key == 'export_file_name') {
                                            event$.emit({
                                                type: 'event_show_json',
                                                data: {
                                                    json: list
                                                        // .map(item => `* ${item.name}`)
                                                        .map(item => `${item.name}`)
                                                        .join('\n')
                                                    // connectionId,
                                                },
                                            })
                                        }
                                        else if (key == 'open_text_file') {
                                            setOpenModalVisible(true)
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
                                            type: 'divider',
                                        },
                                        {
                                            label: t('file.open_text_file'),
                                            key: 'open_text_file',
                                        },
                                        {
                                            type: 'divider',
                                        },
                                        {
                                            label: t('export_json'),
                                            key: 'export_json',
                                        },
                                        {
                                            label: t('export_file_name'),
                                            key: 'export_file_name',
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
                        <div className={styles.pathBox}
                            onClick={() => {
                            }}
                            >
                            {/* {curPath} */}
                            <PathRender
                                info={info}
                                path={curPath}
                                onPath={path => {
                                    setCurPath(path)
                                }}
                            />
                            <IconButton
                                className={styles.editBtn}
                                onClick={() => {
                                    setPathModalVisible(true)
                                }}
                            >
                                <EditOutlined />
                            </IconButton>
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
                        e.stopPropagation()
                        e.preventDefault()
                        uploadFiles(e.dataTransfer.files)
                    }}
                >
                    <div className={styles.bodyContainer}>
                        <div className={styles.bodyHeader}>
                            {columns.map(col => {
                                return (
                                    <div 
                                        className={classNames(styles.cell, styles[col.dataIndex])}
                                        key={col.dataIndex}
                                        onClick={() => {
                                            sortList(col)
                                        }}
                                    >
                                        {col.label}
                                        {col.dataIndex == sortBy &&
                                            <div className={styles.sortIcon}>
                                                {sortType == 'asc' ?
                                                    <UpOutlined />
                                                :
                                                    <DownOutlined />
                                                }
                                            </div>
                                        }
                                    </div>
                                )
                            })}
                        </div>
                        <div className={styles.bodyBody}
                            ref={listElem}
                        >
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
                                    : filteredAndSOrtedList.length == 0 ?
                                        <FullCenterBox>
                                            <Empty />
                                        </FullCenterBox>
                                    :
                                    <SizeDiv
                                        className={styles.listBox}
                                        render={size => (
                                            <VList
                                                className={styles.mainFileList}
                                                ref={listRef}
                                                data={filteredAndSOrtedList} 
                                                height={size.height} 
                                                itemHeight={40} 
                                                itemKey="hash"
                                                // onScroll={e => {
                                                //     console.log('scroll', e.target.scrollTop)
                                                // }}
                                            >
                                                {(item, index) => {
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
                                                                            setRenameItem(item)
                                                                            setRenameModalVisible(true)
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
                                                                        else if (key == 'open_in_vscode') {
                                                                            openInVsCode(item.path)
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
                                                                        else if (key == 's3_info') {
                                                                            viewItemS3Info(item)
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
                                                                            label: t('oss_info'),
                                                                            key: 'oss_info',
                                                                            visible: sourceType.includes('oss'),
                                                                        },
                                                                        {
                                                                            label: t('s3_info'),
                                                                            key: 's3_info',
                                                                            visible: sourceType.startsWith('s3:'),
                                                                        },
                                                                        // {
                                                                        //     label: t('open_with_nginx'),
                                                                        //     key: 'open_with_nginx',
                                                                        // },
                                                                        {
                                                                            label: t('info'),
                                                                            key: 'info',
                                                                        },
                                                                        {
                                                                            label: t('file.open_in_file_manager'),
                                                                            key: 'finder',
                                                                            visible: sourceType == 'local',
                                                                        },
                                                                        {
                                                                            label: t('file.open_in_os'),
                                                                            key: 'open_in_os',
                                                                            visible: sourceType == 'local',
                                                                        },
                                                                        {
                                                                            label: t('file.open_in_vscode'),
                                                                            key: 'open_in_vscode',
                                                                            visible: sourceType == 'local',
                                                                        },
                                                                        {
                                                                            label: t('download'),
                                                                            key: 'download',
                                                                            visible: sourceType != 'local',
                                                                        },
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
                                                                            label: t('copy_name'),
                                                                            key: 'copy_name',
                                                                        },
                                                                        {
                                                                            label: t('file.copy_path'),
                                                                            key: 'copy_path',
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
                                                                            danger: true,
                                                                            visible: item.type == 'FILE',
                                                                        },
                                                                    ])}
                                                                />
                                                            }
                                                        >
                                                            <div className={classNames(styles.item, {
                                                                [styles.active]: selectedPathsMap[item.path]
                                                            })}
                                                                onClick={(e) => {
                                                                    // 多选
                                                                    if (e.metaKey) {
                                                                        if (selectedPaths.includes(item.path)) {
                                                                            // 取消选择
                                                                            setSelectedPaths(selectedPaths.filter(_item => _item != item.path))
                                                                            setSelectedItems(selectedItems.filter(_item => _item.path != item.path))
                                                                        }
                                                                        else {
                                                                            // 选择
                                                                            setSelectedPaths([
                                                                                ...selectedPaths,
                                                                                item.path,
                                                                            ])
                                                                            setSelectedItems([
                                                                                ...selectedItems,
                                                                                item,
                                                                            ])
                                                                        }
                                                                    }
                                                                    else if (e.shiftKey) {
                                                                        // 范围选择
                                                                        if (activeItem) {
                                                                            const startIdx = filteredAndSOrtedList.findIndex(item => item.path == activeItem.path)
                                                                            const endIdx = index
                                                                            const minIdx = Math.min(startIdx, endIdx)
                                                                            const maxIdx = Math.max(startIdx, endIdx)
                                                                            for (let idx = minIdx; idx <= maxIdx; idx++) {
                                                                                const item = filteredAndSOrtedList[idx]
                                                                                if (!selectedPaths.includes(item.path)) {
                                                                                    selectedPaths.push(item.path)
                                                                                    selectedItems.push(item)
                                                                                    setSelectedPaths([
                                                                                        ...selectedPaths,
                                                                                    ])
                                                                                    setSelectedItems([...selectedItems])
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                    else {
                                                                        setActiveItem(item)
                                                                    }
                                                                }}
                                                                onContextMenu={() => {
                                                                    setActiveItem(item)
                                                                }}
                                                                onDoubleClick={() => {
                                                                    viewItem(item)
                                                                }}
                                                            >
                                                                <div className={classNames(styles.cell, styles.name)}>
                                                                    <div className={styles.fileIconBox}>
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
                                                                <div className={classNames(styles.cell, styles.modifyTime, styles.content)}>
                                                                    {item.modifyTime ? moment(item.modifyTime).format('YYYY-MM-DD HH:mm') : '--'}
                                                                </div>
                                                                <div className={classNames(styles.cell, styles.createTime, styles.content)}>
                                                                    {item.createTime ? moment(item.createTime).format('YYYY-MM-DD HH:mm') : '--'}
                                                                </div>
                                                                <div className={classNames(styles.cell, styles.accessTime, styles.content)}>
                                                                    {item.accessTime ? moment(item.accessTime).format('YYYY-MM-DD HH:mm') : '--'}
                                                                </div>
                                                                <div className={classNames(styles.cell, styles.contentType)}>
                                                                    {item.contentType || '--'}
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
                                                }}
                                            </VList>
                                        )}
                                    />
                                        // <div 
                                            
                                        // >
                                        //     {filteredList.map(item => {
                                        //     })}
                                        // </div>
                            }
                        </div>
                    </div>
                </div>
                <div className={styles.footer}>
                    {selectedPaths.length > 1 &&
                        <Space>
                            <div>{selectedPaths.length} {t('selected')}</div>
                            <div>{filesize(selectedSize, { fixed: 1, }).human()}</div>
                            <Button
                                danger
                                size="small"
                                onClick={() => {
                                    deleteItems()
                                }}
                            >
                                {t('delete')}
                            </Button>
                            <Button
                                size="small"
                                onClick={() => {
                                    copyItems()
                                }}
                            >
                                {t('copy')}
                            </Button>
                            <Button
                                size="small"
                                onClick={() => {
                                    cutItems()
                                }}
                            >
                                {t('cut')}
                            </Button>
                            {sourceType != 'local' &&
                                <Button
                                    size="small"
                                    onClick={() => {
                                        downloadItems()
                                    }}
                                >
                                    {t('download')}
                                </Button>
                            }
                        </Space>
                    }
                    <Space>

                    </Space>
                    <Space>
                        <div>{list.length} {t('files')}</div>
                        <div>{filesize(totalSize, { fixed: 1, }).human()}</div>
                        <Button
                            size="small"
                            onClick={() => {
                                onClone && onClone({
                                    defaultPath: curPath,
                                })
                            }}
                        >
                            {t('new_tab')}
                        </Button>
                    </Space>
                    {!!readmeContent &&
                        <div className={styles.readme}>{readmeContent}</div>
                    }
                </div>
            </div>
            {fileDetailModalVisible &&
                <FileDetail
                    config={config}
                    path={fileModalItem.path}
                    sourceType={sourceType}
                    onCancel={() => {
                        setFileDetialModalVisible(false)
                    }}
                    onMin={() => {
                        setFileDetialModalVisible(false)
                        let oldList = fixedFiles.filter(item => item.path!= fileModalItem.path)
                        setFixedFiles([
                            {
                                ...fileModalItem,
                                opType: 'view',
                            },
                            ...oldList,
                        ])
                    }}
                    onEdit={() => {
                        setFileDetialModalVisible(false)
                        editItem(fileModalItem)
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
                    path={fileModalItem.path}
                    initContent={fileModalItem.content}
                    sourceType={sourceType}
                    onCancel={() => {
                        setFileEditModalVisible(false)
                    }}
                    onSuccess={() => {
                        setFileEditModalVisible(false)
                        loadList()
                    }}
                    onMin={(content) => {
                        setFileEditModalVisible(false)
                        let oldList = fixedFiles.filter(item => item.path!= fileModalItem.path)
                        setFixedFiles([
                            {
                                ...fileModalItem,
                                opType: 'edit',
                                content,
                            },
                            ...oldList,
                        ])
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
            {openModalVisible &&
                <FileOpenModal
                    config={config}
                    item={renameItem}
                    type={folderType}
                    sourceType={sourceType}
                    onCancel={() => {
                        setOpenModalVisible(false)
                    }}
                    onSuccess={(path) => {
                        setOpenModalVisible(false)
                        editItem({
                            path,
                        })
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
                    onCancel={() => {
                        setUploading(false)
                    }}
                >
                    {t('uploading')}
                </Modal>
            }
            {processing &&
                <Modal
                    open={true}
                    title={t('processing')}
                    footer={false}
                    onCancel={() => {
                        setProcessing(false)
                    }}
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
                    ossItem={ossItem}
                    onCancel={() => {
                        setOssInfoVisible(false)
                    }}
                />
            }
            {s3InfoVisible &&
                <S3InfoModal
                    config={config}
                    sourceType={sourceType}
                    item={s3InfoItem}
                    onCancel={() => {
                        setS3InfoVisible(false)
                    }}
                />
            }
            {downloadModalVisible &&
                <FileDownloadModal
                    config={config}
                    info={info}
                    item={renameItem}
                    type={folderType}
                    curPath={curPath}
                    sourceType={sourceType}
                    onCancel={() => {
                        setDownloadModalVisible(false)
                    }}
                    onSuccess={() => {
                        setDownloadModalVisible(false)
                        loadList()
                    }}
                />
            }
            {fixedFiles.length > 0 &&
                <FixedFileList
                    list={fixedFiles}
                    onItemClick={item => {
                        if (item.opType == 'view') {
                            viewItem(item)
                        }
                        else {
                            editItem(item)
                        }
                        setFixedFiles([...fixedFiles.filter(_item => _item.path != item.path)])
                    }}
                />
            }
        </div>
    )
}
