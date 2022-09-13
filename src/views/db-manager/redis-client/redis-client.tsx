import { Button, Checkbox, Descriptions, Dropdown, Form, Input, InputNumber, Menu, message, Modal, Popover, Select, Space, Table, Tabs, Tree } from 'antd';
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
import { FolderOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';

import { ListContent } from './list-content';
import { useInterval } from 'ahooks';
import { RedisKeyDetail } from './key-detail';
import { KeyAddModal } from './key-add';



function DbSelector({ curDb, onDatabaseChange, config }) {
    // const [curDb] = useState(0)
    const [databases, setDatabases] = useState([])
    const [totalDb, setTotalDb] = useState(0)

    async function loadKeys() {
        // setLoading(true)
        let res = await request.post(`${config.host}/redis/config`, {
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
    async function loadInfo() {
        // setLoading(true)
        let res = await request.post(`${config.host}/redis/info`, {
            // dbName,
        })
        if (res.success) {
            console.log('DbSelector/info', res.data)
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
        loadInfo()
    }, 30 * 1000)

    return (
        <div>
            {/* {curDb}
            /{totalDb} */}
            DB: 
            <Select
                className={styles.select}
                value={curDb}
                // Redis 默认数据库数量 16，16 * 32 = 512
                listHeight={512}
                options={databases}
                onChange={value => {
                    onDatabaseChange && onDatabaseChange(value)
                }}
            />
        </div>
    )
}

function obj2Tree(obj, handler) {

    function handleObj(obj, key, prefix) {
        if (obj._leaf) {
            return handler(obj)
        }
        const results = []
        let keyNum = 0
        for (let key in obj) {
            let ret = handleObj(obj[key], key, prefix + key + ':')
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
            type: 'type_folder',
            children: results,
            keyNum,
        }
    }

    return handleObj(obj, '_____root', '')
}

export function RedisClient({ config, }) {
    const [curDb, setCurDb] = useState(0)
    const { t } = useTranslation()
    
    const [loading, setLoading] = useState(false)
    
    const [keyword, setKeyword] = useState('')
    const [list, setList] = useState([])
    
    
    const [treeData, setTreeData] = useState([])
    const [expandedKeys, setExpandedKeys ] = useState([])
    
    const [addType, setAddType] = useState('')
    const [addModalVisible, setAddModalVisible] = useState(false)
    const [detailRedisKey, setDetailRedisKey] = useState('')

    async function loadKeys() {
        setLoading(true)
        let res = await request.post(`${config.host}/redis/keys`, {
            // dbName,
            db: curDb,
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

            

            const treeData2 = obj2Tree(treeObj, item => {
                return {
                    title: item.key,
                    key: item.key,
                    itemData: item,
                    type: 'type_key',
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
            // setTreeData([
            //     {
            //         title: dbName,
            //         key: 'root',
            //         children,
            //         itemData: Item,
            //     },
            // ])
            // adbs: ,
        } else {
            message.error('连接失败')
        }
        setLoading(false)
    }

    

    useEffect(() => {
        loadKeys()
    }, [curDb])

    function removeKey(key) {
        Modal.confirm({
            // title: 'Confirm',
            // icon: <ExclamationCircleOutlined />,
            content: `删除「${key}」`,
            okText: '确认',
            cancelText: '取消',
            async onOk() {
                let res = await request.post(`${config.host}/redis/delete`, {
                    key: key,
                })
                console.log('get/res', res.data)
                if (res.success) {
                    message.success('删除成功')
                    loadKeys()
                    setDetailRedisKey('')
                    // setInputValue(res.data.value)
                }
            }
        })
    }

    function removeKeys(nodeData) {
        Modal.confirm({
            // title: 'Confirm',
            // icon: <ExclamationCircleOutlined />,
            content: `Remove ${nodeData.keyNum} Keys?`,
            okText: '确认',
            cancelText: '取消',
            async onOk() {
                console.log('list', list)
                const keys = list
                    .filter(item => item.key.startsWith(nodeData.itemData.prefix))
                    .map(item => item.key)
                console.log('keys', keys)
                let res = await request.post(`${config.host}/redis/delete`, {
                    keys,
                })
                console.log('get/res', res.data)
                if (res.success) {
                    message.success('删除成功')
                    loadKeys()
                    setDetailRedisKey('')
                }
            }
        })
    }

    return (
        <div className={styles.redisLayout}>
            <div className={styles.layoutLeft}>
                <div className={styles.header}>
                    <Input
                        className={styles.searchInput}
                        value={keyword}
                        onChange={e => {
                            setKeyword(e.target.value)
                        }}
                        allowClear
                        placeholder="Search..."
                    />
                    <IconButton
                        className={styles.refresh}
                        onClick={() => {
                            loadKeys()
                        }}
                    >
                        <ReloadOutlined />
                    </IconButton>
                    <Dropdown
                        overlay={
                            <Menu
                                items={[
                                    {
                                        label: '字符串',
                                        key: 'string',
                                    },
                                    {
                                        label: '列表',
                                        key: 'list',
                                    },
                                    {
                                        label: '集合',
                                        key: 'set',
                                    },
                                    {
                                        label: '有序集合',
                                        key: 'zset',
                                    },
                                    {
                                        label: '哈希',
                                        key: 'hash',
                                    },
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
                            className={styles.refresh}
                            onClick={() => {
                                // setDetailRedisKey('')
                                // setInputKey('')
                                // setInputValue('')
                            }}
                        >
                            <PlusOutlined />
                        </IconButton>
                    </Dropdown>
                    {/* <Space>
                    </Space> */}
                </div>
                <div className={styles.body}>
                    <div>
                        {/* <Input
                            value={keyword}
                        /> */}
                        {loading ?
                            <div>Loading</div>
                        :
                            <Tree
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
                                    const item = nodeData.itemData
                                    const colorMap = {
                                        string: '#66a642',
                                        list: '#dc9742',
                                        set: '#4088cc',
                                        hash: '#ad6ccb',
                                        zset: '#c84f46',
                                    }
                                    return (
                                        <div className={styles.treeTitle}>
                                            {nodeData.type == 'type_key' &&
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
                                                                    console.log('nodeData', nodeData)
                                                                    removeKey(item.key)
                                                                }
                                                            }}
                                                        >
                                                        </Menu>
                                                    )}
                                                    trigger={['contextMenu']}
                                                >
                                                    <div className={styles.item}
                                                        onClick={async () => {
                                                            setDetailRedisKey(item.key)
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
                                                        <div className={styles.keyNum}>{nodeData.keyNum} Keys</div>
                                                    </div>
                                                </Dropdown>
                                            }
                                        </div>
                                    )
                                }}
                            />
                            // <div className={styles.list}>
                            //     {list.map(item => {
                            //         const colorMap = {
                            //             string: '#66a642',
                            //             list: '#dc9742',
                            //         }
                            //         return (
                            //             <div className={styles.item}
                            //                 onClick={async () => {
                            //                     let res = await request.post(`${config.host}/redis/get`, {
                            //                         key: item.key,
                            //                         // dbName,
                            //                     })
                            //                     console.log('get/res', res.data)
                            //                     if (res.success) {
                            //                         setResult({
                            //                             key: item.key,
                            //                             ...res.data,
                            //                         })
                            //                         setInputValue(res.data.value)
                            //                         setEditType('update')
                            //                     }
                            //                 }}
                            //             >
                            //                 <div className={styles.type}
                            //                     style={{
                            //                         backgroundColor: colorMap[item.type] || '#000'
                            //                     }}
                            //                 >{item.type}</div>
                            //                 <div className={styles.name}>{item.key}</div>
                            //             </div>
                            //         )
                            //     })}
                            // </div>
                        }
                    </div>
                </div>
                <div className={styles.footer}>
                    <div>{list.length} Keys</div>
                    <DbSelector
                        config={config}
                        curDb={curDb}
                        onDatabaseChange={db => {
                            setCurDb(db)
                        }}
                    />
                </div>
            </div>
            <div className={styles.layoutRight}>
                {!!detailRedisKey &&
                    <RedisKeyDetail
                        config={config}
                        redisKey={detailRedisKey}
                        onRemove={() => {
                            removeKey(detailRedisKey)
                        }}
                    />
                }
            </div>
            {addModalVisible &&
                <KeyAddModal
                    config={config}
                    type={addType}
                    onCancel={() => {
                        setAddModalVisible(false)
                    }}
                    onSuccess={({ key }) => {
                        setDetailRedisKey(key)
                        setAddModalVisible(false)
                        loadKeys()
                    }}
                />
            }
        </div>
    )
}
