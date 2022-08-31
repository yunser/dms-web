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

export function RedisClient({ config, }) {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [keyword, setKeyword] = useState('')
    const [list, setList] = useState([])
    const [result, setResult] = useState(null)

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
                <div>
                    {/* <Input
                        value={keyword}
                    /> */}
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
                                            setResult(res.data)
                                        }
                                    }}
                                >{item}</div>
                            )
                        })}
                    </div>
                </div>
            </div>
            <div className={styles.layoutRight}>
                {!!result &&
                    <div>{result.value}</div>
                }
            </div>
        </div>
    )
}
