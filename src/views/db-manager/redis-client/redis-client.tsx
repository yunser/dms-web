import { Button, Checkbox, Descriptions, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Popover, Select, Space, Table, Tabs, Tree } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './redis-client.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { Editor } from '../editor/Editor';
import storage from '../storage'
import { request } from '../utils/http'
import { IconButton } from '../icon-button';
import { CodeOutlined, FolderOutlined, HeartOutlined, HistoryOutlined, InfoCircleOutlined, MenuOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';

import { ListContent } from './list-content';
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

function FullCenterBox(props) {
    const { children, height } = props
    return (
        <div
            className={styles.fullCenterBox}
            style={{
                // width: '100%',
                // height: '100%',
                height,
            }}
        >
            {children}
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
        let res = await request.post(`${config.host}/redis/config`, {
            connectionId,
            // dbName,
        })
        if (res.success) {
            console.log('DbSelector/config', res.data.config)

            const infos = res.data.info.split('\r\n')
            // "db0:keys=76,expires=35,avg_ttl=67512945473"
            // 107: "db1:keys=70711,expires=26,avg_ttl=28153799"
            // 108: "db4:keys=1,expires=0,avg_ttl=0"
            // 109: "db14:keys=38,expires=1,avg_ttl=70590450"

            console.log('DbSelector/infos', infos)
            const totalDb = parseInt(res.data.config[1])
            setTotalDb(totalDb)
            const databases = []
            for (let i = 0; i < totalDb; i++) {
                let keyNum = 0
                for (let info of infos) {
                    if (info.startsWith(`db${i}`)) {
                        const match = info.match(/keys=(\d+)/)
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

    // 仅用于心跳
    async function ping() {
        // setLoading(true)
        let res = await request.post(`${config.host}/redis/ping`, {
            connectionId,
            // dbName,
        })
        if (res.success) {
            console.log('DbSelector/ping', res.data)
        } else {
            message.error('连接失败')
        }
        // setLoading(false)
    }

    useEffect(() => {
        loadKeys()
        // loadInfo()
    }, [curDb])

    useInterval(() => {
        ping()
    }, 30 * 1000)

    return (
        <div>
            {/* {curDb}
            /{totalDb} */}
            <Space>
                <div>{t('db')}</div>
                <Select
                    size="small"
                    className={styles.select}
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
        console.log('ab', a, b)
        return a.key.localeCompare(b.key)
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
            key: key,
            itemData: {
                prefix: prefix,
            },
            level: level - 1,
            type: 'type_folder',
            children: results.sort(sorter),
            keyNum,
        }
    }

    return handleObj(obj, '_____root', '', 0).sort(sorter)
}

export function RedisClient({ config, event$, connectionId, defaultDatabase = 0 }) {
    const [curDb, setCurDb] = useState(defaultDatabase)
    const { t } = useTranslation()
    
    const [loading, setLoading] = useState(false)
    
    const [keyword, setKeyword] = useState('')
    const [searchType, setSearchType] = useState('blur')
    const [searchKeyword, setSearchKeyword] = useState('')
    const [list, setList] = useState([])
    
    
    const [treeData, setTreeData] = useState([])
    const [expandedKeys, setExpandedKeys ] = useState([])
    
    const [addType, setAddType] = useState('')
    const [addModalVisible, setAddModalVisible] = useState(false)
    const [renameModalVisible, setRenameModalVisible] = useState(false)
    const [renameKey, setRenameKey] = useState('')
    const [tabInfo, setTabInfo] = useState({
        activeKey: '0',
        items: [
            // {
            //     key: '0',
            //     label: '111',
            // }
        ],
    })

    function closeAllTab() {
        setTabInfo({
            activeKey: '',
            items: [],
        })
    }

    function closeOtherTab() {
        const items = tabInfo.items.filter(_it => _it.key != tabInfo.activeKey)
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


    async function loadKeys() {
        setLoading(true)
        let res = await request.post(`${config.host}/redis/keys`, {
            // dbName,
            connectionId,
            db: curDb,
            keyword: searchKeyword,
        })
        if (res.success) {
            // message.info('连接成功')
            // const list = res.data
            // console.log('res', list)
            const { list } = res.data
            setList(res.data.list)
            const treeData = []
            const treeObj = {}
            for (let item of list) {
                treeData.push({
                    title: item.key,
                    key: item.key,
                    itemData: item,
                    type: 'type_key',
                })
                _.set(treeObj, item.key.replaceAll(':', '.'), {
                    ...item,
                    _leaf: true,
                })
            }

            

            const treeData2 = obj2Tree(treeObj, (item, { level }) => {
                return {
                    title: item.key,
                    key: item.key,
                    itemData: item,
                    type: 'type_key',
                    level,
                }
            })
            console.log('treeData2', treeData2)
            setTreeData(treeData2)
            console.log('treeObj', treeObj)


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



    

    useEffect(() => {
        loadKeys()
    }, [curDb, searchKeyword])

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

    function addKey2Tab(key) {
        const tabKey = uid(32)
        setTabInfo({
            // ...tabInfo,
            activeKey: tabKey,
            items: [
                ...tabInfo.items,
                {
                    type: 'type_key',
                    label: key,
                    key: tabKey,
                    itemData: {
                        redisKey: key,
                    },
                }
            ]
        })
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
                                {/* <a onClick={e => e.preventDefault()}>
                                <Space>
                                    Click me
                                    <DownOutlined />
                                </Space>
                                </a> */}
                                <IconButton
                                    tooltip={t('add')}
                                    // size="small"
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
                                tooltip={t('like')}
                                // size="small"
                                className={styles.refresh}
                                onClick={() => {
                                    addLikeTab()
                                }}
                            >
                                <HeartOutlined />
                            </IconButton>
                            <IconButton
                                tooltip={t('info')}
                                // size="small"
                                className={styles.refresh}
                                onClick={() => {
                                    addInfoTab()
                                }}
                            >
                                <InfoCircleOutlined />
                            </IconButton>
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
                                
                                // placeholder="Search... *{keyword}*"
                                placeholder={searchType == 'blur' ? 'Search...' : 'ex: *{keyword}*'}
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
                        <div>Loading</div>
                    : list.length == 0 ?
                        <FullCenterBox
                            height={320}
                        >
                            <Empty />
                        </FullCenterBox>
                    :
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
                                console.log('type', type)
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
                                                                label: t('rename'),
                                                                key: 'rename',
                                                            },
                                                            {
                                                                label: t('copy_key_name'),
                                                                key: 'copy_key_name',
                                                            },
                                                            {
                                                                label: t('delete'),
                                                                key: 'key_delete',
                                                            },
                                                        ]}
                                                        onClick={async ({ _item, key, keyPath, domEvent }) => {
                                                            // onAction && onAction(key)
                                                            if (key == 'key_delete') {
                                                                console.log('nodeData', nodeData)
                                                                removeKey(item.key)
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
                    }
                </div>
                <div className={styles.footer}>
                    <div>{list.length} {t('num_keys')}</div>
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
                        items={tabInfo.items}
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
                                        defaultCommand={item.itemData.defaultCommand}
                                    />
                                }
                            </div>
                        )
                    })}
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
        </div>
    )
}
