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

const timeScale = new humanFormat.Scale({
  ms: 1,
  s: 1000,
  min: 60000,
  h: 3600000,
  d: 86400000
})


export function ZSetContent({ curDb, onSuccess, connectionId, data, config }) {
    const { t } = useTranslation()
    // const [curDb] = useState(0)
    const [itemDetail, setItemDetail] = useState(null)

    console.log('/data', data)
    async function loadItem(index) {
        // setLoading(true)
        let res = await request.post(`${config.host}/redis/lindex`, {
            connectionId,
            // dbName,
            key: data.key,
            index,
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

    // async function loadInfo() {
    //     // setLoading(true)
    //     let res = await request.post(`${config.host}/redis/info`, {
    //         // dbName,
    //     })
    //     if (res.success) {
    //         console.log('DbSelector/info', res.data)
    //     } else {
    //         message.error('连接失败')
    //     }
    //     // setLoading(false)
    // }

    useEffect(() => {
        // loadKeys()
        // loadInfo()
    }, [curDb])

    const columns = [
        {
            title: t('score'),
            dataIndex: 'score',
            width: 240,
            ellipsis: true,
        },
        {
            title: t('value'),
            dataIndex: 'member',
            width: 480,
            ellipsis: true,
        },
        {
            title: '',
            dataIndex: '_empty',
            render(_value, item, index) {
                return (
                    <Space>
                        <ListPushHandler
                            config={config}
                            redisKey={data.key}
                            connectionId={connectionId}
                            type="zset"
                            item={{
                                index,
                                score: item.score,
                                value: item.member,
                            }}
                            onSuccess={onSuccess}
                        >
                            <Button
                                size="small"
                            >
                                {t('edit')}
                            </Button>
                        </ListPushHandler>
                        <Button
                            danger
                            size="small"
                            onClick={async () => {
                                Modal.confirm({
                                    content: `${t('delete')}「${item.member}」?`,
                                    async onOk() {
                                        
                                        let ret = await request.post(`${config.host}/redis/zrem`, {
                                            connectionId,
                                            key: data.key,
                                            // connectionId,
                                            value: item.member,
                                        })
                                        // console.log('ret', ret)
                                        if (ret.success) {
                                            // message.success('连接成功')
                                            // onConnnect && onConnnect()
                                            message.success(t('success'))
                                            // onClose && onClose()
                                            onSuccess && onSuccess()
                                        }
                                    }
                                })
                            }}
                        >
                            {t('delete')}
                        </Button>
                    </Space>
                )
            }
        },
    ]

    return (
        <div className={styles.contentBox}>
            <Table
                dataSource={data.items}
                columns={columns}
                size="small"
                pagination={false}
            />
            {/* <div className={styles.items}>
                {data.items.map((item, index) => {
                    return (
                        <div
                            className={styles.item}
                            // onClick={() => {
                            //     loadItem(index)
                            // }}
                        >
                            <div className={styles.content}>
                                {item.score}:{item.member}
                            </div>
                            <Space>

                                
                            </Space>
                        </div>
                    )
                })}
            </div> */}
            <div style={{ marginTop: 16 }}>
                <ListPushHandler
                    config={config}
                    redisKey={data.key}
                    connectionId={connectionId}
                    onSuccess={onSuccess}
                    type="zset"
                >
                    <Button
                        size="small"
                    >
                        {t('add')}
                    </Button>
                </ListPushHandler>
            </div>
            {!!itemDetail &&
                <div>?</div>
            }
        </div>
    )
}
