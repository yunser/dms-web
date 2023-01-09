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


export function HashContent({ connectionId, curDb, onSuccess, data, config }) {
    const { t } = useTranslation()
    // const [curDb] = useState(0)
    const [itemDetail, setItemDetail] = useState(null)

    console.log('/data', data)

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
            title: t('field'),
            dataIndex: 'key',
            width: 240,
            ellipsis: true,
        },
        {
            title: t('value'),
            dataIndex: 'value',
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
                            connectionId={connectionId}
                            redisKey={data.key}
                            type="hash"
                            item={{
                                index,
                                field: item.key,
                                value: item.value,
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
                                    // title: 'Confirm',
                                    // icon: <ExclamationCircleOutlined />,
                                    content: `${t('delete')}「${item.key}」?`,
                                    async onOk() {
                                        
                                        let ret = await request.post(`${config.host}/redis/hdel`, {
                                            connectionId,
                                            key: data.key,
                                            // connectionId,
                                            field: item.key,
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
                                        {item.key}: {item.value}
                                    </div>
                                    
                                </div>
                            )
                        })}
                    </div> */}
                    {!!itemDetail &&
                        <div>?</div>
                    }
                </div>
            </div>
            <div className={styles.footer}>
                <ListPushHandler
                    config={config}
                    connectionId={connectionId}
                    redisKey={data.key}
                    onSuccess={onSuccess}
                    type="hash"
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
