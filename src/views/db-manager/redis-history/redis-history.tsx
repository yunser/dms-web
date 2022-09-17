import { Button, Checkbox, Col, Descriptions, Empty, Form, Input, InputNumber, message, Modal, Popover, Row, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './redis-history.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { Editor } from '../editor/Editor';
import storage from '../storage'
import { request } from '../utils/http'
import { CodeDebuger } from '../code-debug';
import { uid } from 'uid';

export function RedisHistory({ config, event$, connectionId, onConnnect, }) {
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
        let res = await request.post(`${config.host}/redis/history/list`, {
            page,
            connectionId,
            // dbName,
        })
        if (res.success) {
            setList(res.data.list)
            setTotal(res.data.total)
        }
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
                <Button
                    size="small"
                    onClick={() => {
                        loadList()
                    }}
                >
                    {t('refresh')}
                </Button>
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
                    },
                    {
                        title: t('command'),
                        dataIndex: 'command',
                        width: 480,
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
