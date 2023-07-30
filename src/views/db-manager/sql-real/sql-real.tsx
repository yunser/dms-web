import { Button, Space, Table, Tag } from 'antd';
import React from 'react';
import { useState, useEffect } from 'react';
import { request } from '@/views/db-manager/utils/http';;
import styles from './sql-real.module.less';
import _ from 'lodash';
import { ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { IconButton } from '../icon-button';

export function SqlRealPanel({ config, connectionId, event$ }) {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [list, setList] = useState([])

    async function loadData() {
        const sql = `SELECT *
        FROM information_schema.PROCESSLIST
        LIMIT 100`
        setLoading(true)
        let res = await request.post(`${config.host}/mysql/execSqlSimple`, {
            connectionId,
            sql,
        })
        if (res.success) {
            function scoreCommand(item) {
                if (item.COMMAND == 'Sleep') {
                    return 0
                }
                return 1
            }
            function scoreTime(item) {
                return item.TIME
            }
            function sorter(a, b) {
                if (a.COMMAND != b.COMMAND) {
                    return scoreCommand(b) - scoreCommand(a)
                }
                return scoreTime(b) - scoreTime(a)
            }
            setList(res.data.sort(sorter))
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    return (
        <div className={styles.realBox}>
            <div className={styles.toolBox}>
                <Space>
                    <IconButton
                        tooltip={t('refresh')}
                        onClick={() => {
                            loadData()
                        }}
                    >
                        <ReloadOutlined />
                    </IconButton>
                </Space>
            </div>
            <Table
                loading={loading}
                dataSource={list}
                columns={[
                    {
                        title: t('id'),
                        dataIndex: 'ID',
                    },
                    {
                        title: t('user'),
                        dataIndex: 'USER',
                    },
                    {
                        title: t('schema'),
                        dataIndex: 'DB',
                    },
                    {
                        title: t('host'),
                        dataIndex: 'HOST',
                    },
                    {
                        title: t('command'),
                        dataIndex: 'COMMAND',
                        render(value) {
                            if (value == 'Query') {
                                return <Tag color="blue">{value}</Tag>
                            }
                            if (value == 'Sleep') {
                                return <div className={styles.sleep}>{value}</div>
                            }
                            return (
                                <div>{value}</div>
                            )
                        }
                    },
                    {
                        title: t('time') + '(s)',
                        dataIndex: 'TIME',
                    },
                    {
                        title: t('status'),
                        dataIndex: 'STATE',
                    },
                    {
                        title: t('sql'),
                        dataIndex: 'INFO',
                    },
                    {
                        title: t('actions'),
                        dataIndex: '_op',
                        render(_value, item) {
                            return (
                                <Space>
                                    <Button
                                        size="small"
                                        disabled={!item.INFO}
                                        onClick={() => {
                                            event$.emit({
                                                type: 'event_open_sql',
                                                data: {
                                                    connectionId,
                                                    sql: item.INFO,
                                                }
                                            })
                                        }}
                                    >
                                        {t('run')}
                                    </Button>
                                    <Button
                                        size="small"
                                        danger
                                        onClick={() => {
                                            const sql = `KILL ${item.ID};`
                                            event$.emit({
                                                type: 'event_open_sql',
                                                data: {
                                                    connectionId,
                                                    sql,
                                                }
                                            })
                                        }}
                                    >
                                        {t('sql.kill')}
                                    </Button>
                                </Space>
                            )
                        }
                    },
                ]}
                size="small"
                pagination={false}
            />
        </div>
    )
}
