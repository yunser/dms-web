import { Button, Checkbox, Descriptions, Dropdown, Form, Input, InputNumber, Menu, message, Modal, Popover, Select, Space, Table, Tabs, Tree } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './redis-client.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { request } from '@/views/db-manager/utils/http';

import humanFormat from 'human-format'
import { ListPushHandler } from './list-push';

function fields2Str(fields: string[]) {
    let arr = []
    for (let idx = 0; idx < fields.length; idx += 2) {
        arr.push(`${fields[idx]}: ${fields[idx + 1]}`)
    }
    return arr.join(', ')
}

const timeScale = new humanFormat.Scale({
  ms: 1,
  s: 1000,
  min: 60000,
  h: 3600000,
  d: 86400000
})


export function StreamContent({ curDb, connectionId, onSuccess, data, config }) {
    const { t } = useTranslation()
    // const [curDb] = useState(0)
    const [itemDetail, setItemDetail] = useState(null)

    console.log('/data', data)

    const list = useMemo(() => {
        return data.items
        // return data.items.map((item, index) => {
        //     return {
        //         index,
        //         value: item,
        //     }
        // })
    }, [data])

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
            title: t('id'),
            dataIndex: 'id',
            width: 240,
            ellipsis: true,
        },
        {
            title: t('redis.fields'),
            dataIndex: 'fields',
            width: 480,
            ellipsis: true,
            render(value) {
                console.log('value', value)
                // return value.join(', ')
                return (
                    <div>{fields2Str(value)}</div>
                )
            }
        },
        {
            title: '',
            dataIndex: '_empty',
            render(_value, item, index) {
                return (
                    <Space>
                        {/* <ListPushHandler
                            connectionId={connectionId}
                            config={config}
                            redisKey={data.key}
                            item={{
                                index,
                                value: item.value,
                            }}
                            onSuccess={onSuccess}
                        >
                            <Button
                                size="small"
                            >
                                {t('edit')}
                            </Button>
                        </ListPushHandler> */}
                        <Button
                            danger
                            size="small"
                            onClick={async () => {
                                Modal.confirm({
                                    content: `${t('delete')}「${fields2Str(item.fields)}」?`,
                                    async onOk() {
                                        
                                        let ret = await request.post(`${config.host}/redis/xdel`, {
                                            connectionId: connectionId,
                                            key: data.key,
                                            // connectionId,
                                            id: item.id,
                                        })
                                        // console.log('ret', ret)
                                        if (ret.success) {
                                            // message.success('连接成功')
                                            // onConnect && onConnect()
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
        <>
            <div className={styles.body}>
                <Table
                    dataSource={list}
                    columns={columns}
                    size="small"
                    pagination={false}
                />
                {/* <div className={styles.items}>
                    {list.map((item, index) => {
                        return (
                            <div
                                className={styles.item}
                                // onClick={() => {
                                //     loadItem(index)
                                // }}
                            >
                                <div className={styles.content}>
                                    {item.value}
                                </div>
                                
                            </div>
                        )
                    })}
                </div> */}
                {!!itemDetail &&
                    <div>?</div>
                }
            </div>
            <div className={styles.footer}>
                <ListPushHandler
                    type="stream"
                    config={config}
                    connectionId={connectionId}
                    redisKey={data.key}
                    onSuccess={onSuccess}
                >
                    <Button
                        size="small"
                    >
                        {t('add')}
                    </Button>
                </ListPushHandler>
            </div>
        </>
    )
}
