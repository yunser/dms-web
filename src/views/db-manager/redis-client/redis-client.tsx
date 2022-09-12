import { Button, Checkbox, Descriptions, Dropdown, Form, Input, InputNumber, Menu, message, Modal, Popover, Space, Table, Tabs, Tree } from 'antd';
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

import humanFormat from 'human-format'

const timeScale = new humanFormat.Scale({
  ms: 1,
  s: 1000,
  min: 60000,
  h: 3600000,
  d: 86400000
})

function obj2Tree(obj, handler) {

    function handleObj(obj, key) {
        if (obj._leaf) {
            return handler(obj)
        }
        const results = []
        let keyNum = 0
        for (let key in obj) {
            let ret = handleObj(obj[key], key)
            results.push(ret)
            keyNum += ret.keyNum || 1
        }
        if (key == '_____root') {
            return results
        }
        return {
            title: key,
            key: key,
            itemData: {},
            type: 'type_folder',
            children: results,
            keyNum,
        }
    }

    return handleObj(obj, '_____root')
}

export function RedisClient({ config, }) {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [editType, setEditType] = useState('update')
    const [keyword, setKeyword] = useState('')
    const [list, setList] = useState([])
    const [result, setResult] = useState(null)
    const [inputKey, setInputKey] = useState('')
    const [inputValue, setInputValue] = useState('')
    const [treeData, setTreeData] = useState([])

    async function loadKeys() {
        setLoading(true)
        let res = await request.post(`${config.host}/redis/keys`, {
            // dbName,
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
    }, [])

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
                    setResult(null)
                    // setResult({
                    //     key: item,
                    //     ...res.data,
                    // })
                    // setInputValue(res.data.value)
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
                    <IconButton
                        className={styles.refresh}
                        onClick={() => {
                            setResult({
                                key: '',
                                value: '',
                            })
                            setInputKey('')
                            setInputValue('')
                            setEditType('create')
                        }}
                    >
                        <PlusOutlined />
                    </IconButton>
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
                                                            let res = await request.post(`${config.host}/redis/get`, {
                                                                key: item.key,
                                                                // dbName,
                                                            })
                                                            console.log('get/res', res.data)
                                                            if (res.success) {
                                                                setResult({
                                                                    key: item.key,
                                                                    ...res.data,
                                                                })
                                                                setInputValue(res.data.value)
                                                                setEditType('update')
                                                            }
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
                                                <div className={styles.folderNode}>
                                                    <FolderOutlined className={styles.icon} />
                                                    {nodeData.title}
                                                    <div className={styles.keyNum}>{nodeData.keyNum} Keys</div>
                                                    
                                                </div>
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
                    {list.length} Keys
                </div>
            </div>
            <div className={styles.layoutRight}>
                <div className={styles.layoutRightContent}>
                    {!!result && editType == 'update' &&
                        <div className={styles.header}>
                            <div>{result.key}</div>
                        </div>
                    }
                    <div className={styles.body}>
                        {!!result &&
                            <div>
                                {editType == 'update' ?
                                    <div>
                                        {/* {result.key} */}
                                    </div>
                                :
                                <div>
                                        <div>Key:</div>
                                        <Input
                                            value={inputKey}
                                            onChange={e => {
                                                setInputKey(e.target.value)
                                            }}
                                        />
                                    </div>
                                }
                                <div>Value:</div>
                                <Input.TextArea
                                    value={inputValue}
                                    onChange={e => {
                                        setInputValue(e.target.value)
                                    }}
                                    rows={8}
                                    style={{
                                        width: 400,
                                    }}
                                />
                                <div>
                                    {editType == 'update' ?
                                        <Space>
                                            <Button
                                                onClick={async () => {
                                                    let res = await request.post(`${config.host}/redis/set`, {
                                                        key: result.key,
                                                        value: inputValue,
                                                        // dbName,
                                                    })
                                                    console.log('get/res', res.data)
                                                    if (res.success) {
                                                        message.success('修改成功')
                                                        // setResult({
                                                        //     key: item,
                                                        //     ...res.data,
                                                        // })
                                                        // setInputValue(res.data.value)
                                                    }
                                                }}
                                            >
                                                修改
                                            </Button>
                                            <Button
                                                danger
                                                onClick={async () => {
                                                    removeKey(result.key)
                                                }}
                                            >
                                                删除
                                            </Button>
                                        </Space>
                                    :
                                        <Button
                                            onClick={async () => {
                                                let res = await request.post(`${config.host}/redis/set`, {
                                                    key: inputKey,
                                                    value: inputValue,
                                                    // dbName,
                                                })
                                                console.log('get/res', res.data)
                                                if (res.success) {
                                                    message.success('新增成功')
                                                    // setResult({
                                                    //     key: item,
                                                    //     ...res.data,
                                                    // })
                                                    // setInputValue(res.data.value)
                                                }
                                            }}
                                        >
                                            新增
                                        </Button>
                                    }
                                </div>
                                {/* <div>{result.value}</div> */}
                            </div>
                        }
                    </div>
                </div>
                <div className={styles.layoutRightSide}>
                    {!!result && editType == 'update' &&
                        <div>
                            <div>TTL：{result.ttl >= 0 ? `${humanFormat(result.ttl, {scale: timeScale})}` : '--'}</div>
                            <div>Encoding：{result.encoding}</div>
                            <div>Size：{result.size} Bytes</div>
                        </div>
                    }
                </div>
            </div>
        </div>
    )
}
