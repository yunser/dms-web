import { Button, Checkbox, Descriptions, Form, Input, InputNumber, message, Modal, Popover, Space, Table, Tabs, Tree } from 'antd';
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

function obj2Tree(obj, handler) {

    function handleObj(obj, key) {
        if (obj._leaf) {
            return handler(obj)
        }
        const results = []
        for (let key in obj) {
            results.push(handleObj(obj[key], key))
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
                                            }
                                            {nodeData.type == 'type_folder' &&
                                                <div>
                                                    <FolderOutlined className={styles.icon} />
                                                    {nodeData.title}
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
            </div>
            <div className={styles.layoutRight}>
                {!!result &&
                    <div>
                        <div>Key:</div>
                        {editType == 'update' ?
                            <div>{result.key}</div>
                        :
                            <div>
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
                                            Modal.confirm({
                                                // title: 'Confirm',
                                                // icon: <ExclamationCircleOutlined />,
                                                content: `删除「${result.key}」`,
                                                okText: '确认',
                                                cancelText: '取消',
                                                async onOk() {
                                                    let res = await request.post(`${config.host}/redis/delete`, {
                                                        key: result.key,
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
    )
}
