import { Button, Checkbox, Descriptions, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Popover, Select, Space, Spin, Table, Tabs, Tooltip, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './redis-client.module.less';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { request } from '@/views/db-manager/utils/http';
import { IconButton } from '@/views/db-manager/icon-button';
import { ClearOutlined, CodeOutlined, DeleteOutlined, EllipsisOutlined, ExportOutlined, FolderOutlined, HeartOutlined, HistoryOutlined, InfoCircleOutlined, LinkOutlined, MenuOutlined, PlusOutlined, ProfileOutlined, ReloadOutlined } from '@ant-design/icons';
import { useInterval } from 'ahooks';
import { RedisKeyDetail } from './key-detail';
import { KeyAddModal } from './key-add';
import { uid } from 'uid';
import { RedisHistory } from '../redis-history';
import { RedisEditor } from '../redis-editor';
import copy from 'copy-to-clipboard';
import { RedisLike } from '../redis-like';
import { RedisInfo } from '../redis-info';
import { RedisRenameModal } from '../redis-rename';
import { RedisDuplicateModal } from '../redis-duplicate';
import { PubSubModal } from '../redis-pubsub';
import { FullCenterBox } from '@/views/common/full-center-box';
import moment from 'moment';
import { RedisOpenModal } from '../redis-open';


function Status({ config, connectionId }) {
    const { t } = useTranslation()
    const [status, setStatus] = useState('unknown')
    // 仅用于心跳
    async function ping() {
        if (!connectionId) {
            return
        }
        // setLoading(true)
        let res = await request.post(`${config.host}/redis/ping`, {
            connectionId,
            // dbName,
        }, {
            timeout: 1000,
        })
        console.log('Status/res', res)
        if (res.success) {
            console.log('DbSelector/ping', res.data)
            setStatus('success')
            // setStatus('fail')
        } else {
            setStatus('fail')
            message.error('连接失败')
        }
        // setLoading(false)
    }

    // TODO 依赖 connectionId
    useInterval(() => {
        ping()
    }, 30 * 1000, {
        immediate: true,
        
    })

    const colors = {
        success: 'green',
        fail: 'red',
    }
    const tooltips = {
        success: t('connected'),
        fail: t('connect_error'),
        unknown: 'Un Connect',
    }

    return (
        <div>
            <Tooltip
                placement="topLeft"
                title={tooltips[status]}
            >
                <LinkOutlined
                    style={{
                        // fontWeight: 'bold',
                        color: colors[status],
                    }}
                />
            </Tooltip>
            {/* {status} */}
        </div>
    )
}

function DbSelector({ curDb, connectionId, onDatabaseChange, config }) {
    const { t } = useTranslation()
    // const [curDb] = useState(0)
    const [databases, setDatabases] = useState([])
    const [totalDb, setTotalDb] = useState(0)

    async function loadKeys() {
        // setLoading(true)
        if (!connectionId) {
            return
        }
        let res = await request.post(`${config.host}/redis/config`, {
            connectionId,
            // dbName,
        })
        if (res.success) {
            const infos = res.data.info.split('\r\n')
            // "db0:keys=76,expires=35,avg_ttl=67512945473"
            // 107: "db1:keys=70711,expires=26,avg_ttl=28153799"
            // 108: "db4:keys=1,expires=0,avg_ttl=0"
            // 109: "db14:keys=38,expires=1,avg_ttl=70590450"

            // console.log('DbSelector/infos', infos)
            const totalDb = parseInt(res.data.config[1])
            setTotalDb(totalDb)
            const databases = []
            for (let i = 0; i < totalDb; i++) {
                let keyNum = 0
                for (let info of infos) {
                    if (info.startsWith(`db${i}:`)) {
                        const match = info.match(/keys=(\d+),/)
                        if (match) {
                            keyNum = match[1]
                        }
                        break
                    }
                }
                databases.push(({
                    label: `${i} (${keyNum})`,
                    value: i,
                }))
            }
            setDatabases(databases)
        } else {
            message.error('连接失败')
        }
        // setLoading(false)
    }

    

    useEffect(() => {
        loadKeys()
        // loadInfo()
    }, [connectionId, curDb])

    return (
        <div>
            {/* {curDb}
            /{totalDb} */}
            <Space>
                <div>{t('db')}</div>
                <Select
                    size="small"
                    className={styles.dbSelect}
                    value={curDb}
                    // Redis 默认数据库数量 16，16 * 32 = 512
                    listHeight={512}
                    options={databases}
                    onChange={value => {
                        onDatabaseChange && onDatabaseChange(value)
                    }}
                />
            </Space>
        </div>
    )
}

function obj2Tree(obj, handler) {

    const sorter = (a, b) => {
        // console.log('ab', a, b)
        const typeScore = {
            'type_key': 1,
            'type_folder': 2,
        }
        if (a.itemData.key == b.itemData.key) {
            return typeScore[a.type] - typeScore[b.type]
        }
        return a.itemData.key.localeCompare(b.itemData.key)
    }
    function handleObj(obj, key, prefix, level) {
        if (obj._leaf) {
            return handler(obj, { level: level - 1 })
        }
        const results = []
        let keyNum = 0
        for (let key in obj) {
            let ret = handleObj(obj[key], key, prefix + key + ':', level + 1)
            results.push(ret)
            keyNum += ret.keyNum || 1
        }
        if (key == '_____root') {
            return results
        }
        return {
            title: key,
            key: 'folder-' + key,
            itemData: {
                prefix: prefix,
                key,
            },
            level: level - 1,
            type: 'type_folder',
            children: results.sort(sorter),
            keyNum,
        }
    }

    return handleObj(obj, '_____root', '', 0).sort(sorter)
}

export function RedisClient({ config, event$, connectionId: _connectionId, 
    item: _item, defaultDatabase = 0 }) {
    const [curDb, setCurDb] = useState(defaultDatabase)
    const { t } = useTranslation()
    
    const [ connectionId, setConnectionId ] = useState(_connectionId)
    const [loading, setLoading] = useState(false)
    
    const [keyword, setKeyword] = useState('')
    const [searchType, setSearchType] = useState('blur')
    const [searchKeyword, setSearchKeyword] = useState('')
    const [total, setTotal] = useState(0)
    const [list, setList] = useState([])
    const comData = useRef({
        cursor: 0,
        connectTime: 0,
        connectionId: _connectionId,
    })
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

    // tree
    const [treeData, setTreeData] = useState([])
    const [expandedKeys, setExpandedKeys ] = useState([])
    // add
    const [addType, setAddType] = useState('')
    const [addModalVisible, setAddModalVisible] = useState(false)
    // rename
    const [renameModalVisible, setRenameModalVisible] = useState(false)
    const [renameKey, setRenameKey] = useState('')
    // open
    const [openModalVisible, setOpenModalVisible] = useState(false)
    // duplicate
    const [duplicateVisible, setDuplicateVisible] = useState(false)
    const [duplicateKey, setDuplicateKey] = useState('')
    // pub/sub
    const [pubSubVisible, setPubSubVisible] = useState(false)

    // tabs
    const [tabInfo, setTabInfo] = useState({
        activeKey: '0',
        items: [
            // {
            //     key: '0',
            //     label: '111',
            // }
        ],
    })

    useEffect(() => {
        if (connectionId) {
            loadKeys()
        }
    }, [connectionId, curDb, searchKeyword])

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
                type: 'redisBind',
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

    async function connect() {
        console.log('重连', _item)
        const item = _item
        const reqData = {
            host: item.host,
            port: item.port,
            user: item.user,
            password: item.password,
            userName: item.userName,
            db: item.defaultDatabase || 0,
            // remember: values.remember,
        }
        // if (values.remember) {
        //     storage.set('redisInfo', reqData)
        // }
        let ret = await request.post(`${config.host}/redis/connect`, reqData)
        // console.log('ret', ret)
        if (ret.success) {
            message.success('连接成功')
            setConnectionId(ret.data.connectionId)
            comData.current.connectionId = ret.data.connectionId
            initWebSocket()
            // onConnect && onConnect({
            //     connectionId: ret.data.connectionId,
            //     name: item.name,
            //     defaultDatabase: item.defaultDatabase || 0,
            //     item,
            // })
        }
    }

    useEffect(() => {
        connect()
    }, [_item])

    async function reconnect() {
        console.log('重连', _item)
        connect()
    }

    event$.useSubscription(msg => {
        console.log('RedisClient/onmessage', msg)
        // console.log(val);
        if (msg.type == 'event_show_key') {
            const { connectionId: _connectionId, key } = msg.data
            if (_connectionId == connectionId) {
                addKey2Tab(key)
            }
        }
        else if (msg.type == 'event_open_command') {
            const { connectionId: _connectionId, command } = msg.data
            if (_connectionId == connectionId) {
                addEditorTab(command)
            }
        }
    })

    async function loadMore() {
        await _loadKeys()
    }

    function closeAllTab() {
        setTabInfo({
            activeKey: '',
            items: [],
        })
    }

    function closeOtherTab() {
        const items = tabInfo.items.filter(_it => _it.key == tabInfo.activeKey)
        const activeKey = items.length ? items[0].key : ''
        setTabInfo({
            activeKey,
            items,
        })
    }

    function closeTabByKeys(keys: string[]) {
        const items = tabInfo.items.filter(_it => {
            if (_it.itemData?.redisKey) {
                return !keys.includes(_it.itemData.redisKey)
            }
            return true
        })
        const activeKey = items.length ? items[0].key : ''
        setTabInfo({
            activeKey,
            items,
        })
    }

    function closeTabByKey(targetKey) {
        const items = tabInfo.items.filter(_it => _it.key != targetKey)
        const activeKey = items.length ? items[0].key : ''
        setTabInfo({
            activeKey,
            items,
        })
    }

    function closeCurTab() {
        console.log('closeCurTab', closeCurTab)
        closeTabByKey(tabInfo.activeKey)
    }

    const onEdit = (targetKey: string, action: string) => {
        console.log('targetKey, action', targetKey, action)
        // this[action](targetKey);
        if (action === 'add') {
            // let tabKey = '' + new Date().getTime()
            // setActiveKey(tabKey)
            // setTabs([
            //     ...tabs,
            //     {
            //         title: 'SQL',
            //         key: tabKey,
            //         defaultSql: '',
            //     }
            // ])
            // _this.setState({
            //     activeKey: tabKey,
            //     tabs: tabs.concat([{

            //     }]),
            // })
        }
        else if (action === 'remove') {
            closeTabByKey(targetKey)
            
            // for (let i = 0; i < tabs.length; i++) {
            //     if (tabs[i].key === targetKey) {
            //         tabs.splice(i, 1)
            //         break
            //     }
            // }
            // if (tabs.length == 0) {
            //     tabs.push(tab_workbench)
            // }
            // setTabs([
            //     ...tabs,
            // ])
            // setActiveKey(tabInfo.items[tabs.length - 1].key)
            // _this.setState({
            //     tabs
            // })
        }
    }

    async function flush() {
        Modal.confirm({
            // title: 'Confirm',
            // icon: <ExclamationCircleOutlined />,
            content: `确认清空当前数据库的数据?`,
            async onOk() {
                let ret = await request.post(`${config.host}/redis/flush`, {
                    connectionId,
                })
                // console.log('ret', ret)
                if (ret.success) {
                    // message.success('连接成功')
                    message.success(t('success'))
                    loadKeys()
                    // onClose && onClose()
                    // onSuccess && onSuccess()
                }
            }
        })
    }

    async function flushAll() {
        Modal.confirm({
            // title: 'Confirm',
            // icon: <ExclamationCircleOutlined />,
            content: `确认清空全部数据库的数据?`,
            async onOk() {
                let ret = await request.post(`${config.host}/redis/flushAll`, {
                    connectionId,
                })
                // console.log('ret', ret)
                if (ret.success) {
                    // message.success('连接成功')
                    message.success(t('success'))
                    loadKeys()
                    // onClose && onClose()
                    // onSuccess && onSuccess()
                }
            }
        })
    }

    async function loadKeys() {
        comData.current.cursor = 0
        await _loadKeys()
    }

    async function _loadKeys() {
        setLoading(true)
        let res = await request.post(`${config.host}/redis/keys`, {
            // dbName,
            connectionId,
            db: curDb,
            cursor: comData.current.cursor,
            keyword: searchKeyword,
            pageSize: 1000,
        })
        const originList = list
        if (res.success) {
            // message.info('连接成功')
            // const list = res.data
            // console.log('res', list)
            
            const { list: _list, total, cursor } = res.data
            let list = []
            if (comData.current.cursor == 0) {
                list = _list
            }
            else {
                list = [...originList, ..._list]
            }
            setTotal(total)
            comData.current.cursor = cursor
            setList(list)
            // const treeData = []
            const treeObj = {}
            for (let item of list) {
                // treeData.push({
                //     title: item.key,
                //     key: item.key,
                //     itemData: item,
                //     type: 'type_key',
                // })
                const node = {
                    ...item,
                    _leaf: true,
                }
                if (item.key.includes(':')) {
                    _.set(treeObj, item.key.replaceAll(':', '.'), node)
                }
                else {
                    _.set(treeObj, '____root____' + item.key, node)
                }
            }
            

            

            const treeData2 = obj2Tree(treeObj, (item, { level }) => {
                return {
                    title: item.key,
                    key: 'key-' + item.key,
                    itemData: item,
                    type: 'type_key',
                    level,
                    childrem: undefined,
                }
            })
            // console.log('treeData2', treeData2)
            setTreeData(treeData2)
            // console.log('treeObj', treeObj)


            // const children = list
            //     .map(item => {
            //         const tableName = item.TABLE_NAME
            //         return {
            //             title: tableName,
            //             key: tableName,
            //         }
            //     })
            //     .sort((a, b) => {
            //         return a.title.localeCompare(b.title)
            //     })
            // adbs: ,
        } else {
            message.error('连接失败')
        }
        setLoading(false)
    }

    function addLikeTab() {
        const tabKey = uid(32)
        setTabInfo({
            // ...tabInfo,
            activeKey: tabKey,
            items: [
                ...tabInfo.items,
                {
                    type: 'type_like',
                    label: t('favorite_keys'),
                    key: tabKey,
                    itemData: {
                        // redisKey: key,
                    },
                }
            ]
        })
    }

    function addInfoTab() {
        const tabKey = uid(32)
        setTabInfo({
            // ...tabInfo,
            activeKey: tabKey,
            items: [
                ...tabInfo.items,
                {
                    type: 'type_info',
                    label: t('info'),
                    key: tabKey,
                    itemData: {
                        // redisKey: key,
                    },
                }
            ]
        })
    }

    function addHistoryTab() {
        const tabKey = uid(32)
        setTabInfo({
            // ...tabInfo,
            activeKey: tabKey,
            items: [
                ...tabInfo.items,
                {
                    type: 'type_history',
                    label: t('history'),
                    key: tabKey,
                    itemData: {
                        // redisKey: key,
                    },
                }
            ]
        })
    }

    function addEditorTab(command) {
        const tabKey = uid(32)
        setTabInfo({
            // ...tabInfo,
            activeKey: tabKey,
            items: [
                ...tabInfo.items,
                {
                    type: 'type_editor',
                    label: t('untitled'),
                    key: tabKey,
                    itemData: {
                        defaultCommand: command,
                        // redisKey: key,
                    },
                }
            ]
        })
    }

    function addKey2Tab(key, { openInNewTab = false } = {}) {
        // const tabKey = uid(32)
        let tabKey = 'key-detail-single'
        if (openInNewTab) {
            tabKey = uid(32)
        }
        const fIdx = tabInfo.items.findIndex(item => item.key == tabKey)
        const newTab = {
            type: 'type_key',
            label: key,
            key: tabKey,
            itemData: {
                redisKey: key,
            },
        }
        console.log('fIdx', fIdx)
        if (fIdx == -1) {
            setTabInfo({
                // ...tabInfo,
                activeKey: tabKey,
                items: [
                    ...tabInfo.items,
                    newTab,
                ]
            })
        }
        else {
            tabInfo.items[fIdx] = newTab
            setTabInfo({
                // ...tabInfo,
                activeKey: tabKey,
                items: [
                    ...tabInfo.items,
                ]
            })
        }
    }

    function removeKey(key, cb) {
        Modal.confirm({
            content: `${t('delete')}「${key}」?`,
            async onOk() {
                let res = await request.post(`${config.host}/redis/delete`, {
                    connectionId,
                    key: key,
                })
                console.log('get/res', res.data)
                if (res.success) {
                    message.success(t('success'))
                    loadKeys()
                    closeTabByKeys([key])
                    cb && cb()
                }
            }
        })
    }

    async function gen2000() {
        let res = await request.post(`${config.host}/redis/gen2000`, {
            connectionId,
            number: 2000,
        })
        console.log('get/res', res.data)
        if (res.success) {
            message.success(t('success'))
            loadKeys()
        }
    }

    function exportAllKeys() {
        console.log('list', list)
        event$.emit({
            type: 'event_show_json',
            data: {
                json: JSON.stringify(list, null, 4)
                // connectionId,
            },
        })
    }

    function exportKeys(nodeData) {
        const keys = list
            .filter(item => item.key.startsWith(nodeData.itemData.prefix))
            .map(item => item.key)
        // console.log('keys', keys)
        event$.emit({
            type: 'event_show_json',
            data: {
                json: JSON.stringify(keys, null, 4)
                // connectionId,
            },
        })
    }

    function exportKeyValue(nodeData) {
        const keys = list
            .filter(item => item.key.startsWith(nodeData.itemData.prefix))
        //     .map(item => item.key)
        // console.log('keys', keys)
        event$.emit({
            type: 'event_show_json',
            data: {
                json: JSON.stringify(keys, null, 4)
                // connectionId,
            },
        })
    }

    async function setAsDefaultDatabase() {
        let res = await request.post(`${config.host}/redis/connection/update`, {
            id: _item.id,
            data: {
                ..._item,
                defaultDatabase: curDb,
            },
        })
        console.log('get/res', res.data)
        if (res.success) {
            message.success(t('success'))
            // loadKeys()
            // closeTabByKeys(keys)
        }
    }

    function removeKeys(nodeData) {
        Modal.confirm({
            // title: 'Confirm',
            // icon: <ExclamationCircleOutlined />,
            content: `${t('delete')} ${nodeData.keyNum} ${t('num_keys').toLowerCase()}?`,
            async onOk() {
                console.log('list', list)
                const keys = list
                    .filter(item => item.key.startsWith(nodeData.itemData.prefix))
                    .map(item => item.key)
                console.log('keys', keys)
                let res = await request.post(`${config.host}/redis/delete`, {
                    connectionId,
                    keys,
                })
                console.log('get/res', res.data)
                if (res.success) {
                    message.success('删除成功')
                    loadKeys()
                    closeTabByKeys(keys)
                }
            }
        })
    }

    return (
        <div className={styles.redisLayout}>
            <div className={styles.layoutLeft}>
                <div className={styles.header}>
                    <div className={styles.layoutLeftTool}>
                        <Space>
                            <IconButton
                                tooltip={t('refresh')}
                                // size="small"
                                className={styles.refresh}
                                onClick={() => {
                                    loadKeys()
                                }}
                            >
                                <ReloadOutlined />
                            </IconButton>
                            <IconButton
                                tooltip={t('history')}
                                // size="small"
                                className={styles.refresh}
                                onClick={() => {
                                    addHistoryTab()
                                    // event$.emit({
                                    //     type: 'event_redis_history',
                                    //     data: {
                                    //         connectionId,
                                    //     },
                                    // })
                                }}
                            >
                                <HistoryOutlined />
                            </IconButton>
                            <Dropdown
                                overlay={
                                    <Menu
                                        items={[
                                            {
                                                label: t('string'),
                                                key: 'string',
                                            },
                                            {
                                                label: t('list'),
                                                key: 'list',
                                            },
                                            {
                                                label: t('set'),
                                                key: 'set',
                                            },
                                            {
                                                label: t('zset'),
                                                key: 'zset',
                                            },
                                            {
                                                label: t('hash'),
                                                key: 'hash',
                                            },
                                            // {
                                            //     type: 'divider',
                                            // },
                                            // {
                                            //     label: t('command'),
                                            //     key: 'command',
                                            // },
                                            // {
                                            //     label: <a href="https://www.aliyun.com">2nd menu item</a>,
                                            //     key: '1',
                                            // },
                                            // {
                                            //     type: 'divider',
                                            // },
                                            // {
                                            //     label: '3rd menu item',
                                            //     key: '3',
                                            // },
                                        ]}
                                        onClick={({ key }) => {
                                            if (key == 'string') {
                                                setAddModalVisible(true)
                                                setAddType('string')
                                            }
                                            else if (key == 'list') {
                                                setAddModalVisible(true)
                                                setAddType('list')
                                            }
                                            else if (key == 'set') {
                                                setAddModalVisible(true)
                                                setAddType('set')
                                            }
                                            else if (key == 'zset') {
                                                setAddModalVisible(true)
                                                setAddType('zset')
                                            }
                                            else if (key == 'hash') {
                                                setAddModalVisible(true)
                                                setAddType('hash')
                                            }
                                            // else if (key == 'command') {
                                            //     addEditorTab()
                                            // }
                                        }}
                                    />
                                }
                                trigger={['click']}
                            >
                                <IconButton
                                    tooltip={t('add')}
                                    className={styles.refresh}
                                >
                                    <PlusOutlined />
                                </IconButton>
                            </Dropdown>
                            <IconButton
                                tooltip={t('command')}
                                // size="small"
                                className={styles.refresh}
                                onClick={() => {
                                    addEditorTab()
                                }}
                            >
                                <CodeOutlined />
                            </IconButton>
                            <IconButton
                                tooltip={t('favorite_keys')}
                                className={styles.refresh}
                                onClick={() => {
                                    addLikeTab()
                                }}
                            >
                                <HeartOutlined />
                            </IconButton>
                            <IconButton
                                tooltip={t('redis.pubsub')}
                                className={styles.refresh}
                                onClick={() => {
                                    setPubSubVisible(true)
                                }}
                            >
                                <ProfileOutlined />
                            </IconButton>
                            <Dropdown
                                trigger={['click']}
                                overlay={
                                    <Menu
                                        items={[
                                            {
                                                label: t('info'),
                                                key: 'info',
                                                // icon: <InfoCircleOutlined />
                                            },
                                            {
                                                label: t('export_json'),
                                                key: 'export_json',
                                                // icon: <ExportOutlined />
                                            },
                                            {
                                                label: t('set_as_default_database'),
                                                key: 'set_as_default_database',
                                                // icon: <ClearOutlined />
                                            },
                                            {
                                                type: 'divider',
                                            },
                                            {
                                                label: t('clear_current_database'),
                                                key: 'flush',
                                                danger: true,
                                                icon: <ClearOutlined />
                                            },
                                            {
                                                label: t('clear_all'),
                                                key: 'flush_all',
                                                danger: true,
                                                icon: <ClearOutlined />
                                            },
                                            // {
                                            //     label: t('生成 2000 条数据'),
                                            //     key: 'gen_2000',
                                            // },
                                        ]}
                                        onClick={({ key }) => {
                                            if (key == 'info') {
                                                addInfoTab()
                                            }
                                            else if (key == 'flush') {
                                                flush()
                                            }
                                            else if (key == 'flush_all') {
                                                flushAll()
                                            }
                                            else if (key == 'export_json') {
                                                exportAllKeys()
                                            }
                                            else if (key == 'gen_2000') {
                                                gen2000()
                                            }
                                            else if (key == 'set_as_default_database') {
                                                setAsDefaultDatabase()
                                            }
                                        }}
                                    />
                                }
                            >
                                <IconButton
                                    tooltip={t('more')}
                                    // size="small"
                                    className={styles.refresh}
                                    onClick={() => {
                                        // flush()
                                    }}
                                >
                                    <EllipsisOutlined />
                                </IconButton>
                            </Dropdown>
                        </Space>
                    </div>
                    <div className={styles.layoutLeftSearch}>

                        <Input.Group
                            compact
                            className={styles.inputGroup}
                        >
                            <Select
                                // size="small"
                                className={styles.inputSelect}
                                value={searchType}
                                onChange={value => {
                                    setSearchType(value)
                                }}
                                options={[
                                    {
                                        label: t('fuzzy'),
                                        value: 'blur',
                                    },
                                    {
                                        label: t('match'),
                                        value: 'match',
                                    },
                                ]}
                            />
                            <Input.Search
                                // size="small"
                                className={styles.searchSearch}
                                value={keyword}
                                onChange={e => {
                                    setKeyword(e.target.value)
                                }}
                                allowClear
                                
                                placeholder={searchType == 'blur' ? t('search') : '*{keyword}*'}
                                onSearch={(value) => {
                                    console.log('onSearch', value)
                                    if (value) {
                                        let _value
                                        if (searchType == 'blur') {
                                            _value = `*${value}*`
                                        }
                                        else {
                                            _value = value
                                        }
                                        //  = value + (value.endsWith('*') ? '' : '*')
                                        setSearchKeyword(_value)
                                        // setKeyword(_value)
                                    }
                                    else {
                                        setSearchKeyword('')
                                    }
                                    // handleSearch()
                                }}
                            />
                        </Input.Group>
                    </div>
                    
                    {/* <Space>
                    </Space> */}
                </div>
                <div className={styles.body}>
                    {loading ?
                        <FullCenterBox
                            height={320}
                        >
                            {/* <div>Loading</div> */}
                            {/* <ReactLoading
                                type="bars"
                                color={'#09c'}
                                height={66.7}
                                width={37.5}
                            /> */}
                            <Spin />
                        </FullCenterBox>
                    : list.length == 0 ?
                        <FullCenterBox
                            height={320}
                        >
                            <Empty />
                        </FullCenterBox>
                    :
                        <div>
                            <Tree
                                className={styles.tree}
                                height={document.body.clientHeight - 42 - 48 - 16 - 80}
                                treeData={treeData}
                                expandedKeys={expandedKeys}
                                onExpand={(expandedKeys) => {
                                    setExpandedKeys(expandedKeys)
                                }}
                                onSelect={(selectedKeys, info) => {
                                    const { key, type } = info.node
                                    if (type == 'type_folder') {
                                        if (expandedKeys.includes(key)) {
                                            setExpandedKeys(expandedKeys.filter(_key => _key != key))
                                        }
                                        else {
                                            setExpandedKeys([
                                                ...expandedKeys,
                                                key,
                                            ])
                                        }
                                    }
                                }}
                                titleRender={nodeData => {
                                    // console.log('nodeData?', nodeData)
                                    const { level = 0 } = nodeData
                                    const item = nodeData.itemData
                                    const colorMap = {
                                        string: '#66a642',
                                        list: '#dc9742',
                                        set: '#4088cc',
                                        hash: '#ad6ccb',
                                        zset: '#c84f46',
                                    }
                                    return (
                                        <div className={styles.treeTitle}
                                            style={{
                                                width: 400 - level * 24 - 56,
                                            }}
                                        >
                                            {nodeData.type == 'type_key' &&
                                                <Dropdown
                                                    overlay={(
                                                        <Menu
                                                            items={[
                                                                {
                                                                    label: t('open_in_new_tab'),
                                                                    key: 'open_in_new_tab',
                                                                },
                                                                {
                                                                    label: t('copy_key_name'),
                                                                    key: 'copy_key_name',
                                                                },
                                                                {
                                                                    label: t('duplicate'),
                                                                    key: 'duplicate',
                                                                },
                                                                {
                                                                    label: t('rename'),
                                                                    key: 'rename',
                                                                },
                                                                {
                                                                    label: t('delete'),
                                                                    key: 'key_delete',
                                                                    danger: true,
                                                                },
                                                            ]}
                                                            onClick={async ({ _item, key, keyPath, domEvent }) => {
                                                                // onAction && onAction(key)
                                                                if (key == 'open_in_new_tab') {
                                                                    addKey2Tab(nodeData.itemData.key, { openInNewTab: true })
                                                                }
                                                                else if (key == 'key_delete') {
                                                                    console.log('nodeData', nodeData)
                                                                    removeKey(nodeData.itemData.key)
                                                                }
                                                                else if (key == 'copy_key_name') {
                                                                    console.log('nodeData', nodeData)
                                                                    // removeKey(item.key)
                                                                    copy(nodeData.itemData.key)
                                                                    message.info(t('copied'))
                                                                }
                                                                else if (key == 'rename') {
                                                                    console.log('nodeData', nodeData)
                                                                    setRenameModalVisible(true)
                                                                    setRenameKey(nodeData.itemData.key)
                                                                }
                                                                else if (key == 'duplicate') {
                                                                    setDuplicateVisible(true)
                                                                    setDuplicateKey(nodeData.itemData.key)
                                                                }
                                                            }}
                                                        >
                                                        </Menu>
                                                    )}
                                                    trigger={['contextMenu']}
                                                >
                                                    <div className={styles.item}
                                                        onClick={async () => {
                                                            addKey2Tab(item.key)
                                                        }}
                                                    >
                                                        <div className={styles.type}
                                                            style={{
                                                                backgroundColor: colorMap[item.type] || '#000'
                                                            }}
                                                        >{item.type}</div>
                                                        <div className={styles.name}>{item.key}</div>
                                                    </div>
                                                </Dropdown>
                                            }
                                            {nodeData.type == 'type_folder' &&
                                                <Dropdown
                                                    overlay={(
                                                        <Menu
                                                            items={[
                                                                // {
                                                                //     label: t('export_json'),
                                                                //     key: 'key_export_keys',
                                                                // },
                                                                {
                                                                    label: t('export'),
                                                                    key: 'key_export_keys',
                                                                    children: [
                                                                        {
                                                                            label: t('export_keys'),
                                                                            key: 'key_export_keys',
                                                                        },
                                                                        {
                                                                            label: t('export_key_and_value'),
                                                                            key: 'key_export_key_value',
                                                                        },
                                                                    ]
                                                                },
                                                                {
                                                                    label: t('delete'),
                                                                    key: 'key_delete',
                                                                },
                                                            ]}
                                                            onClick={async ({ _item, key, keyPath, domEvent }) => {
                                                                // onAction && onAction(key)
                                                                if (key == 'key_delete') {
                                                                    console.log('removeKeys', nodeData)
                                                                    removeKeys(nodeData)
                                                                }
                                                                else if (key == 'key_export_keys') {
                                                                    exportKeys(nodeData)
                                                                }
                                                                else if (key == 'key_export_key_value') {
                                                                    exportKeyValue(nodeData)
                                                                }
                                                            }}
                                                        >
                                                        </Menu>
                                                    )}
                                                    trigger={['contextMenu']}
                                                >
                                                    <div className={styles.folderNode}>
                                                        <FolderOutlined className={styles.icon} />
                                                        {nodeData.title}
                                                        <div className={styles.keyNum}>{nodeData.keyNum} {t('num_keys')}</div>
                                                    </div>
                                                </Dropdown>
                                            }
                                        </div>
                                    )
                                }}
                            />
                            {list.length != total && !keyword &&
                                <div className={styles.moreBox}>
                                    <Button
                                        size="small"
                                        onClick={() => {
                                            loadMore()
                                        }}
                                    >
                                        {t('redis.load_more_keys')}
                                    </Button>
                                </div>
                            }
                        </div>
                    }
                </div>
                <div className={styles.footer}>
                    <Space>
                        {/* <Status
                            config={config}
                            connectionId={connectionId}
                        /> */}
                        {/* {wsStatus} */}
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
                        {wsStatus != 'connected' &&
                            <Button
                                size="small"
                                onClick={() => {
                                    reconnect()
                                }}
                            >
                                {/* 重连 */}
                                {t('connect')}
                            </Button>
                        }
                        <div>{total} {t('num_keys')}</div>
                    </Space>
                    <DbSelector
                        connectionId={connectionId}
                        config={config}
                        curDb={curDb}
                        onDatabaseChange={db => {
                            setCurDb(db)
                            closeAllTab()
                        }}
                    />
                </div>
            </div>
            <div className={styles.layoutRight}>
                <div className={styles.layoutRightHeader}>
                    <Tabs
                        // size="large"
                        hideAdd={true}
                        activeKey={tabInfo.activeKey}
                        type="editable-card"
                        onChange={key => {
                            setTabInfo({
                                ...tabInfo,
                                activeKey: key,
                            })
                        }}
                        onEdit={onEdit}
                        tabBarExtraContent={{
                            right: (
                                <div className={styles.layoutRightHeaderTabExtra}>
                                    <Space>
                                        {tabInfo.items.length > 0 &&
                                            <Dropdown
                                                overlay={
                                                    <Menu
                                                        onClick={({ key }) => {
                                                            if (key == 'close_other') {
                                                                closeOtherTab()
                                                            }
                                                            else if (key == 'close_all') {
                                                                closeAllTab()
                                                            }
                                                            else if (key == 'close_current') {
                                                                // const curTab = tabs.find(item => item.key == activeKey)
                                                                // if (curTab) {
                                                                //     if (curTab.closable !== false) {
                                                                //         const newTabs = tabs.filter(item => item.key != activeKey)
                                                                //         setTabs(newTabs)
                                                                //         if (newTabs.length) {
                                                                //             setActiveKey(newTabs[newTabs.length - 1].key)
                                                                //         }
                                                                //         else {
                                                                //             setActiveKey('')
                                                                //         }
                                                                //     }

                                                                // }
                                                            }
                                                        }}
                                                        items={[
                                                            // {
                                                            //     label: t('close'),
                                                            //     key: 'close_current',
                                                            // },
                                                            {
                                                                label: t('close_other'),
                                                                key: 'close_other',
                                                            },
                                                            {
                                                                label: t('close_all'),
                                                                key: 'close_all',
                                                            },
                                                        ]}
                                                    />
                                                }
                                            >
                                                <IconButton
                                                    onClick={e => e.preventDefault()}
                                                >
                                                    <MenuOutlined />
                                                </IconButton>
                                                {/* <a
                                                >
                                                </a> */}
                                            </Dropdown>
                                        }
                                    </Space>
                                </div>
                            )
                        }}
                        items={tabInfo.items.map(item => {
                            return {
                                ...item,
                                label: (
                                    <div className={styles.tabLabel}>
                                        <Tooltip title={item.label}>
                                            {item.label}
                                        </Tooltip>
                                    </div>
                                )
                            }
                        })}
                    />
                </div>
                <div className={styles.layoutRightBody}>
                    {tabInfo.items.map(item => {
                        return (
                            <div
                                className={styles.tabContent}
                                key={item.key}
                                style={{
                                    display: item.key == tabInfo.activeKey ? undefined : 'none',
                                }}
                            >
                                {item.type == 'type_key' &&
                                    <RedisKeyDetail
                                        connectionId={connectionId}
                                        event$={event$}
                                        config={config}
                                        redisKey={item.itemData.redisKey}
                                        onRemove={({ key }) => {
                                            removeKey(key, () => {
                                                // closeCurTab()
                                            })
                                        }}
                                    />
                                }
                                {item.type == 'type_history' &&
                                    <RedisHistory
                                        config={config}
                                        event$={event$}
                                        connectionId={connectionId}
                                    />
                                }
                                {item.type == 'type_like' &&
                                    <RedisLike
                                        config={config}
                                        event$={event$}
                                        connectionId={connectionId}
                                    />
                                }
                                {item.type == 'type_info' &&
                                    <RedisInfo
                                        config={config}
                                        event$={event$}
                                        connectionId={connectionId}
                                    />
                                }
                                {item.type == 'type_editor' &&
                                    <RedisEditor
                                        config={config}
                                        connectionId={connectionId}
                                        event$={event$}
                                        defaultCommand={item.itemData.defaultCommand}
                                    />
                                }
                            </div>
                        )
                    })}
                    {tabInfo.items.length == 0 &&
                        <FullCenterBox>
                            <Button
                                onClick={() => {
                                    setOpenModalVisible(true)
                                }}
                            >
                                {t('redis.key.open')}
                            </Button>
                        </FullCenterBox>
                    }
                </div>
            </div>
            {addModalVisible &&
                <KeyAddModal
                    config={config}
                    connectionId={connectionId}
                    type={addType}
                    onCancel={() => {
                        setAddModalVisible(false)
                    }}
                    onSuccess={({ key }) => {
                        setAddModalVisible(false)
                        loadKeys()
                        addKey2Tab(key)
                    }}
                />
            }
            {openModalVisible &&
                <RedisOpenModal
                    config={config}
                    connectionId={connectionId}
                    redisKey={renameKey}
                    onCancel={() => {
                        setOpenModalVisible(false)
                    }}
                    onSuccess={({ key }) => {
                        setOpenModalVisible(false)
                        // loadKeys()
                        addKey2Tab(key)
                    }}
                />
            }
            {renameModalVisible &&
                <RedisRenameModal
                    config={config}
                    connectionId={connectionId}
                    redisKey={renameKey}
                    onCancel={() => {
                        setRenameModalVisible(false)
                    }}
                    onSuccess={() => {
                        setRenameModalVisible(false)
                        loadKeys()
                    }}
                />
            }
            {duplicateVisible &&
                <RedisDuplicateModal
                    config={config}
                    connectionId={connectionId}
                    redisKey={duplicateKey}
                    onCancel={() => {
                        setDuplicateVisible(false)
                    }}
                    onSuccess={() => {
                        setDuplicateVisible(false)
                        loadKeys()
                    }}
                />
            }
            {pubSubVisible &&
                <PubSubModal
                    config={config}
                    connectionId={connectionId}
                    onCancel={() => {
                        setPubSubVisible(false)
                    }}
                />
            }
        </div>
    )
}
