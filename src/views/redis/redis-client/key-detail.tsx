import { Button, Checkbox, Descriptions, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Popover, Select, Space, Spin, Table, Tabs, Tree } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './redis-client.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { request } from '@/views/db-manager/utils/http';
import { IconButton } from '@/views/db-manager/icon-button';
import { DeleteOutlined, EllipsisOutlined, FolderOutlined, HeartOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';

import humanFormat from 'human-format'
import { ListPushHandler } from './list-push';
import { StreamContent } from './key-detail-stream';
import { ListContent } from './key-detail-list';
import { SetContent } from './key-detail-set';
import { ZSetContent } from './key-detail-zset';
import { HashContent } from './key-detail-hash';
import copy from 'copy-to-clipboard';
import { t } from 'i18next';
import { RedisTtlModal } from '../redis-ttl';
import { StringContent } from './key-detail-string';
import { FullCenterBox } from '@/views/common/full-center-box';


export function RedisKeyDetail({ config, event$, connectionId, redisKey, onRemove }) {

    console.warn('RedisKeyDetail/render')

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

    function exportJson() {
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
    }
    function exportAsCommand() {
        console.log('result', result)
        let command = ''
        // let exportObj = {}
        function toString(str: string) {
            if (str.match(/\s/)) {
                return `"${str.replace(/\"/g, '\\"')}"`
            }
            return str
        }
        if (result.type == 'string') {
            console.log('ppp', result.value.replace(/"/g, '\"'))
            command = `SET ${toString(result.key)} ${toString(result.value)}`
        }
        else if (result.type == 'list') {
            command = 
                [
                    `DEL ${toString(result.key)}`,
                    ...result.items.map(item => `RPUSH ${toString(result.key)} ${toString(item)}`),
                ].join('\n')
        }
        else if (result.type == 'set') {
            command = 
                [
                    `DEL ${toString(result.key)}`,
                    ...result.items.map(item => `SADD ${toString(result.key)} ${toString(item)}`),
                ].join('\n')
        }
        else if (result.type == 'zset') {
            command = 
                [
                    `DEL ${toString(result.key)}`,
                    ...result.items.map(item => `ZADD ${toString(result.key)} ${item.score} ${toString(item.member)}`),
                ].join('\n')
        }
        else if (result.type == 'hash') {
            command = 
                [
                    `DEL ${toString(result.key)}`,
                    ...result.items.map(item => `HSET ${toString(result.key)} ${toString(item.key)} ${toString(item.value)}`),
                ].join('\n')
        }
        else {
            message.error('unknown type')
            // exportObj = {
            //     type: result.type,
            //     key: result.key,
            //     items: result.items,
            // }
        }

        event$.emit({
            type: 'event_show_json',
            data: {
                json: command,
                // connectionId,
            },
        })
    }
    
    
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
            <FullCenterBox
                // height={320}
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
            // <div>Loading</div>
        )
    }

    if (result && !result.exists) {
        return (
            <FullCenterBox>
                <Empty
                    description={t('key_is_not_exists')}
                />
            </FullCenterBox>
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
                                tooltip={t('favorite_key')}
                                // size="small"
                                className={styles.refresh}
                                onClick={() => {
                                    like()
                                }}
                            >
                                <HeartOutlined />
                            </IconButton>
                            <IconButton
                                tooltip={t('delete')}
                                // size="small"
                                className={styles.refresh}
                                onClick={() => {
                                    onRemove && onRemove({
                                        key: result.key,
                                    })
                                }}
                            >
                                <DeleteOutlined />
                            </IconButton>
                            {/* <Button
                                danger
                                size="small"
                                onClick={async () => {
                                    // removeKey(result.key)
                                }}
                            >
                                {t('delete')}
                            </Button> */}
                            <Dropdown
                                overlay={
                                    <Menu
                                        items={[
                                            {
                                                key: 'copy_key_name',
                                                label: t('copy_key_name'),
                                            },
                                            {
                                                key: 'export_json',
                                                label: t('export_json'),
                                            },
                                            {
                                                key: 'export_command',
                                                label: t('redis.export_command'),
                                            },
                                        ]}
                                        onClick={({ key }) => {
                                            if (key == 'copy_key_name') {
                                                copy(result.key)
                                                message.info('Copied')
                                            }
                                            else if (key == 'export_json') {
                                                exportJson()
                                            }
                                            else if (key == 'export_command') {
                                                exportAsCommand()
                                            }
                                        }}
                                    />        
                                }
                            >
                                <IconButton
                                    // tooltip={t('refresh')}
                                    // size="small"
                                    className={styles.refresh}
                                    // onClick={() => {
                                    //     loadKey()
                                    // }}
                                >
                                    <EllipsisOutlined />
                                </IconButton>
                            </Dropdown>
                        </Space>
                    </div>
                }
                {/* <div className={styles.body}> */}
                    {/* {!!result && result.value == null &&
                        <div>键不存在</div>
                    } */}
                {/* </div> */}
                {!!result &&
                    <>
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
                            <StringContent
                                connectionId={connectionId}
                                event$={event$}
                                config={config}
                                data={result}
                                onSuccess={() => {
                                    loadKey(result.key)
                                }}
                            />
                        }
                        {result.type == 'list' &&
                            <ListContent
                                connectionId={connectionId}
                                config={config}
                                data={result}
                                onSuccess={() => {
                                    loadKey(result.key)
                                }}
                            />
                        }
                        {result.type == 'stream' &&
                            <StreamContent
                                connectionId={connectionId}
                                config={config}
                                data={result}
                                onSuccess={() => {
                                    loadKey(result.key)
                                }}
                            />
                        }
                        {result.type == 'set' &&
                            <SetContent
                                connectionId={connectionId}
                                config={config}
                                data={result}
                                onSuccess={() => {
                                    loadKey(result.key)
                                }}
                            />
                        }
                        {result.type == 'hash' &&
                            <HashContent
                                connectionId={connectionId}
                                config={config}
                                data={result}
                                onSuccess={() => {
                                    loadKey(result.key)
                                }}
                            />
                        }
                        {result.type == 'zset' &&
                            <ZSetContent
                                connectionId={connectionId}
                                config={config}
                                data={result}
                                onSuccess={() => {
                                    loadKey(result.key)
                                }}
                            />
                        }
                        {/* <div>{result.value}</div> */}
                    </>
                }
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
