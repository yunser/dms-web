import { Button, Checkbox, Col, Descriptions, Empty, Form, Input, InputNumber, message, Modal, Popover, Row, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './redis-history.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { request } from '@/views/db-manager/utils/http';
import { uid } from 'uid';
import { IconButton } from '@/views/db-manager/icon-button';
import { ClearOutlined, ReloadOutlined } from '@ant-design/icons';
import copy from 'copy-to-clipboard';
import moment from 'moment';

export function RedisHistory({ config, event$, connectionId, onConnect, }) {
    const { t } = useTranslation()
    const [modalVisible, setModalVisible] = useState(false)
    const [list, setList] = useState([])
    const pageSize = 10
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [connections, setConnections] = useState([
        // {
        //     id: '1',
        //     name: 'XXX',
        // },
        // {
        //     id: '2',
        //     name: 'XXX2',
        // },
    ])
    const [loading, setLoading] = useState(false)
    // const [form] = Form.useForm()
//     const [code, setCode] = useState(`{
//     "host": "",
//     "user": "",
//     "password": ""
// }`)

    async function loadList() {
        setLoading(true)
        let res = await request.post(`${config.host}/redis/history/list`, {
            page,
            connectionId,
            // dbName,
        })
        if (res.success) {
            setList(res.data.list)
            setTotal(res.data.total)
        }
        setLoading(false)
    }

    useEffect(() => {
        loadList()
    }, [page])

    return (
        <div className={styles.connectBox}>
            <div
                style={{
                    marginBottom: 8,
                }}
            >
                <Space>
                    <IconButton
                        tooltip={t('refresh')}
                        onClick={() => {
                            loadList()
                        }}
                    >
                        <ReloadOutlined />
                    </IconButton>
                    <IconButton
                        tooltip={t('delete_all')}
                        onClick={() => {
                            Modal.confirm({
                                content: `${t('delete_all_confirm')}`,
                                async onOk() {
                                    let res = await request.post(`${config.host}/redis/history/clear`, {
                                    })
                                    if (res.success) {
                                        loadList()
                                        // message.info('连接成功')
                                        
                                        // const data = res.data
                                        // // console.log('res', list)
                                        // setList(data.list)
                                        // setTotal(data.total)
                                    }
                                }
                            })
                        }}
                    >
                        <ClearOutlined />
                    </IconButton>
                </Space>
                {/* <Button
                    size="small"
                    onClick={() => {
                        loadList()
                    }}
                >
                    {t('refresh')}
                </Button> */}
            </div>
            <Table
                loading={loading}
                dataSource={list}
                bordered
                size="small"
                pagination={{
                    total,
                    current: page,
                    pageSize,
                    showSizeChanger: false,
                }}
                columns={[
                    {
                        title: t('time'),
                        dataIndex: 'create_time',
                        width: 240,
                        render(value) {
                            return moment(value).format('YYYY-MM-DD HH:mm:ss')
                        }
                    },
                    // {
                    //     title: t('db'),
                    //     dataIndex: 'db',
                    //     width: 80,
                    // },
                    {
                        title: t('command'),
                        dataIndex: 'command',
                        width: 480,
                        render(value) {
                            const arr = value.split(/\s+/)
                            const [cmd, ...params] = arr
                            // let color = 'green'
                            let color = undefined
                            // TODO 大小写
                            const cmdLowerCase = cmd.toLowerCase()
                            const delCmds = [
                                'DEL',
                                'LREM',
                                'SREM',
                                'HDEL',
                                'ZREM',
                            ]
                            const updateCmds = [
                                'SADD',
                                'SET',
                                'LSET',
                                'RESTORE',
                                'HSETNX',
                                'RPUSH',
                                'ZADD',
                                'PERSIST',
                                'HSET',
                            ]
                            const getCmds = [
                                'GET',
                                'SMEMBERS',
                                'LRANGE',
                                'LLEN',
                                'INFO',
                                'HGETALL',
                                'DUMP',
                                // zset
                                'ZCARD',
                                'ZRANGE',
                                'TYPE',
                            ]
                            if (delCmds.includes(cmd.toUpperCase())) {
                                color = 'red'
                            }
                            else if (updateCmds.includes(cmd.toUpperCase())) {
                                color = '#177ddc'
                            }
                            else if (getCmds.includes(cmd.toUpperCase())) {
                                color = 'green'
                            }
                            return (
                                <div  className={styles.cmdCell}>
                                    <span className={styles.cmd}
                                        style={{
                                            color,
                                        }}
                                    >{cmd}</span>
                                    <span className={styles.params}>{params.join(' ')}</span>
                                </div>
                            )
                        }
                    },
                    {
                        title: t('actions'),
                        dataIndex: 'actions',
                        width: 80,
                        render(_value, item) {
                            return (
                                <div>
                                    <Space>
                                        <Button
                                            type="link"
                                            size="small"
                                            onClick={async () => {
                                                copy(item.command)
                                                message.info(t('copied'))
                                            }}
                                        >
                                            {t('copy')}
                                        </Button>
                                        <Button
                                            type="link"
                                            size="small"
                                            onClick={async () => {
                                                event$.emit({
                                                    type: 'event_open_command',
                                                    data: {
                                                        connectionId,
                                                        command: item.command,
                                                    }
                                                })
                                            }}
                                        >
                                            {t('use')}
                                        </Button>
                                        {/* <Button
                                            danger
                                            type="link"
                                            size="small"
                                            onClick={async () => {
                                                Modal.confirm({
                                                    content: `${t('delete')}「${item.key}」?`,
                                                    async onOk() {
                                                        let res = await request.post(`${config.host}/redis/key/remove`, {
                                                            id: item.id,
                                                            // dbName,
                                                        })
                                                        if (res.success) {
                                                            loadList()
                                                        }
                                                    }
                                                })
                                            }}
                                        >
                                            {t('delete')}
                                        </Button> */}
                                    </Space>
                                </div>
                            )
                        }
                    },
                    {
                        title: '',
                        dataIndex: '_empty',
                    },
                ]}
                onChange={({ current }) => {
                    setPage(current)
                }}
            />
        </div>
    )
}
