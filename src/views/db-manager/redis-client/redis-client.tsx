import { Button, Checkbox, Descriptions, Form, Input, InputNumber, message, Modal, Popover, Space, Table, Tabs } from 'antd';
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
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';

export function RedisClient({ config, }) {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [editType, setEditType] = useState('update')
    const [keyword, setKeyword] = useState('')
    const [list, setList] = useState([])
    const [result, setResult] = useState(null)
    const [inputKey, setInputKey] = useState('')
    const [inputValue, setInputValue] = useState('')

    async function loadKeys() {
        setLoading(true)
        let res = await request.post(`${config.host}/redis/keys`, {
            // dbName,
        })
        if (res.status === 200) {
            // message.info('连接成功')
            const list = res.data
            // console.log('res', list)
            setList(res.data.list)

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
            // suggestionAdd('adbs', ['dim_realtime_recharge_paycfg_range', 'dim_realtime_recharge_range'])
            // suggestionAdd(dbName, list.map(item => item.TABLE_NAME))
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
                            <div className={styles.list}>
                                {list.map(item => {
                                    return (
                                        <div className={styles.item}
                                            onClick={async () => {
                                                let res = await request.post(`${config.host}/redis/get`, {
                                                    key: item,
                                                    // dbName,
                                                })
                                                console.log('get/res', res.data)
                                                if (res.status === 200) {
                                                    setResult({
                                                        key: item,
                                                        ...res.data,
                                                    })
                                                    setInputValue(res.data.value)
                                                    setEditType('update')
                                                }
                                            }}
                                        >{item}</div>
                                    )
                                })}
                            </div>
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
                                            if (res.status === 200) {
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
                                                    if (res.status === 200) {
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
                                        if (res.status === 200) {
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
