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

import humanFormat from 'human-format'
import { ListPushHandler } from './list-push';
import { ListContent } from './list-content';
import { SetContent } from './set-content';
import { ZSetContent } from './zset-content';


const timeScale = new humanFormat.Scale({
  ms: 1,
  s: 1000,
  min: 60000,
  h: 3600000,
  d: 86400000
})


export function RedisKeyDetail({ config, redisKey, onRemove }) {
    const [detaiLoading, setDetailLoading] = useState(false)
    const [editType, setEditType] = useState('update')
    const [result, setResult] = useState(null)
    const [inputKey, setInputKey] = useState('')
    const [inputValue, setInputValue] = useState('')

    async function loadKey() {
        setDetailLoading(true)
        let res = await request.post(`${config.host}/redis/get`, {
            key: redisKey,
            // dbName,
        })
        console.log('get/res', res.data)
        if (res.success) {
            setResult({
                key: redisKey,
                ...res.data,
            })
            setInputValue(res.data.value)
            setEditType('update')
        }
        setDetailLoading(false)
    }

    useEffect(() => {
        loadKey()
    }, [redisKey])

    if (detaiLoading) {
        return (
            <div>Loading</div>
        )
    }

    return (
        <div className={styles.layoutRightDetail}>
            <div className={styles.layoutRightContent}>
                {!!result && editType == 'update' &&
                    <div className={styles.header}>
                        <div>{result.key}</div>
                        <Space>
                            <Button
                                size="small"
                                onClick={async () => {
                                    loadKey()
                                }}
                            >
                                刷新
                            </Button>
                            <Button
                                danger
                                size="small"
                                onClick={async () => {
                                    onRemove && onRemove()
                                    // removeKey(result.key)
                                }}
                            >
                                删除
                            </Button>
                        </Space>
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
                                <div
                                    style={{
                                        marginBottom: 16,
                                    }}
                                >
                                    <div>Key:</div>
                                    <Input
                                        value={inputKey}
                                        onChange={e => {
                                            setInputKey(e.target.value)
                                        }}
                                    />
                                </div>
                            }

                            {(result.type == 'string' || editType == 'create') &&
                                <div>
                                    {/* <div>Value:</div> */}
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
                                    <div style={{
                                        marginTop: 8,
                                    }}>
                                        {editType == 'update' ?
                                            <Space>
                                                <Button
                                                    size="small"
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
                                                        loadKeys()
                                                        loadKey(inputKey)
                                                        // setResult(null)
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
                                </div>
                            }
                            {result.type == 'list' &&
                                <div>
                                    <ListContent
                                        config={config}
                                        data={result}
                                        onSuccess={() => {
                                            loadKey(result.key)
                                        }}
                                    />
                                </div>
                            }
                            {result.type == 'set' &&
                                <div>
                                    <SetContent
                                        config={config}
                                        data={result}
                                        onSuccess={() => {
                                            loadKey(result.key)
                                        }}
                                    />
                                </div>
                            }
                            {result.type == 'hash' &&
                                <div>
                                    {/* List */}
                                    <div className={styles.items}>
                                        {result.items.map(item => {
                                            return (
                                                <div className={styles.item}>{item.key}: {item.value}</div>
                                            )
                                        })}
                                    </div>
                                </div>
                            }
                            {result.type == 'zset' &&
                                <div>
                                    <ZSetContent
                                        config={config}
                                        data={result}
                                        onSuccess={() => {
                                            loadKey(result.key)
                                        }}
                                    />
                                </div>
                            }
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
    )
}
