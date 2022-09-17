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
import { FolderOutlined, HeartOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';

import humanFormat from 'human-format'
import { ListPushHandler } from './list-push';
import { ListContent } from './list-content';
import { SetContent } from './set-content';
import { ZSetContent } from './zset-content';
import { HashContent } from './hash-content';
import copy from 'copy-to-clipboard';
import { t } from 'i18next';
import { RedisTtlModal } from '../redis-ttl';

export function RedisKeyDetail({ config, event$, connectionId, redisKey, onRemove }) {
    const [detaiLoading, setDetailLoading] = useState(false)
    const [editType, setEditType] = useState('update')
    const [result, setResult] = useState(null)
    const [ttlModalVisible, setTtlModalVisible] = useState(false)
    const [inputKey, setInputKey] = useState('')
    const [inputValue, setInputValue] = useState('')

    const timeScale = new humanFormat.Scale({
        [t('msecond')]: 1,
        [t('second')]: 1000,
        [t('minute')]: 60 * 1000,
        [t('hour')]: 60 * 60 * 1000,
        [t('day')]: 24 * 60 * 60 * 1000,
        [t('month')]: 30 * 24 * 60 * 60 * 1000,
        [t('year')]: 365 * 24 * 60 * 60 * 1000,
      })
    
    async function like() {
        let res = await request.post(`${config.host}/redis/key/create`, {
            connectionId: connectionId,
            key: redisKey,
            // dbName,
        })
        console.log('get/res', res.data)
        if (res.success) {
            message.success(t('success'))
            // setResult({
            //     key: redisKey,
            //     ...res.data,
            // })
            // setInputValue(res.data.value)
            // setEditType('update')
        }
    }
    async function loadKey() {
        setDetailLoading(true)
        let res = await request.post(`${config.host}/redis/get`, {
            connectionId: connectionId,
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
                            {/* <Button
                                size="small"
                                onClick={async () => {
                                    loadKey()
                                }}
                            >
                                {t('refresh')}
                            </Button> */}
                            <IconButton
                                tooltip={t('refresh')}
                                // size="small"
                                className={styles.refresh}
                                onClick={() => {
                                    loadKey()
                                }}
                            >
                                <ReloadOutlined />
                            </IconButton>
                            <IconButton
                                tooltip={t('like')}
                                // size="small"
                                className={styles.refresh}
                                onClick={() => {
                                    like()
                                }}
                            >
                                <HeartOutlined />
                            </IconButton>
                            <Button
                                size="small"
                                onClick={async () => {
                                    console.log('result', result)
                                    let exportObj = {}
                                    if (result.type == 'string') {
                                        exportObj = {
                                            type: result.type,
                                            key: result.key,
                                            value: result.value,
                                        }
                                    }
                                    else {
                                        exportObj = {
                                            type: result.type,
                                            key: result.key,
                                            items: result.items,
                                        }
                                    }

                                    event$.emit({
                                        type: 'event_show_json',
                                        data: {
                                            json: JSON.stringify(exportObj, null, 4)
                                            // connectionId,
                                        },
                                    })
                                }}
                            >
                                {t('export_json')}
                            </Button>
                            <Button
                                size="small"
                                onClick={async () => {
                                    copy(result.key)
                                    message.info('Copied')
                                }}
                            >
                                {t('copy_key_name')}
                            </Button>
                            <Button
                                danger
                                size="small"
                                onClick={async () => {
                                    onRemove && onRemove({
                                        key: result.key,
                                    })
                                    // removeKey(result.key)
                                }}
                            >
                                {t('delete')}
                            </Button>
                        </Space>
                    </div>
                }
                <div className={styles.body}>
                    {/* {!!result && result.value == null &&
                        <div>键不存在</div>
                    } */}
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
                                                            connectionId: connectionId,
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
                                                    {t('update')}
                                                </Button>
                                                
                                            </Space>
                                        :
                                            <Button
                                                onClick={async () => {
                                                    let res = await request.post(`${config.host}/redis/set`, {
                                                        connectionId: connectionId,
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
                                        connectionId={connectionId}
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
                                        connectionId={connectionId}
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
                                    <HashContent
                                        connectionId={connectionId}
                                        config={config}
                                        data={result}
                                        onSuccess={() => {
                                            loadKey(result.key)
                                        }}
                                    />
                                    {/* <div className={styles.items}>
                                        {result.items.map(item => {
                                            return (
                                                <div className={styles.item}>{item.key}: {item.value}</div>
                                            )
                                        })}
                                    </div> */}
                                </div>
                            }
                            {result.type == 'zset' &&
                                <div>
                                    <ZSetContent
                                        connectionId={connectionId}
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
                        <div>
                            TTL：{result.ttl >= 0 ? `${humanFormat(result.ttl, {scale: timeScale})}` : '--'}
                            <Button
                                className={styles.setting}
                                size="small"
                                onClick={() => {
                                    setTtlModalVisible(true)
                                }}
                            >
                                {t('setting')}
                            </Button>
                        </div>
                        <div>{t('encoding')}：{result.encoding}</div>
                        <div>{t('mem_size')}：{result.size} Bytes</div>
                    </div>
                }
            </div>
            {ttlModalVisible &&
                <RedisTtlModal
                    config={config}
                    redisKey={result.key}
                    connectionId={connectionId}
                    onCancel={() => {
                        setTtlModalVisible(false)
                    }}
                    onSuccess={() => {
                        setTtlModalVisible(false)
                        loadKey(result.key)
                    }}
                />
            }
        </div>
    )
}
