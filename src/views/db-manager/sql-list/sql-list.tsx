import { Button, Input, Modal, Popover, Space, Table } from 'antd';
import React, { useEffect, useState } from 'react';
import styles from './sql-list.module.less';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@/views/db-manager/icon-button';
import { ReloadOutlined } from '@ant-design/icons';
import { request } from '@/views/db-manager/utils/http';
import { SqlLikeModal } from '../sql-edit';

export function SqlList({ config, connectionId, event$ }: any) {
    const { t } = useTranslation()
    console.warn('SqlList/render')
    const [loading, setLoading] = useState(false)
    const [keyword, setKeyword] = useState('')
    const [editModalVisible, setEditModalVisible] = useState(false)
    const [editModalItem, setEditModalItem] = useState(null)
    
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [list, setList] = useState([])
    
    event$.useSubscription(msg => {
        console.log('Status/onmessage', msg)
        if (msg.type == 'event_sql_list_refresh') {
            loadData()
        }
    })

    async function loadData() {
        setLoading(true)
        let res = await request.post(`${config.host}/mysql/sql/list`, {
            page,
            pageSize: 20,
            keyword,
        })
        if (res.success) {
            const { list, total } = res.data
            setList(list)
            setTotal(total)
        }
        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [page, keyword])

    
    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            width: 160,
            ellipsis: true,
        },
        {
            title: 'SQL',
            dataIndex: 'sql',
            width: 480 + 16,
            ellipsis: true,
            render(value) {
                return (
                    <Popover
                        title="SQL"
                        content={
                            <div className={styles.content}>
                                <code><pre>{value}</pre></code>
                            </div>
                        }
                    >
                        <div className={styles.sqlCell}>
                            {value}
                        </div>
                    </Popover>
                )
            }
        },
        {
            title: '',
            dataIndex: '_empty',
        },
        {
            title: t('actions'),
            dataIndex: 'actions',
            fixed: 'right',
            width: 160,
            render(value, item) {
                return (
                    <Space>
                        <Button
                            type="link"
                            size="small"
                            onClick={() => {
                                event$.emit({
                                    type: 'event_open_sql',
                                    data: {
                                        connectionId,
                                        sql: item.sql,
                                    }
                                })
                            }}
                        >
                            {t('use')}
                        </Button>
                        <Button
                            type="link"
                            size="small"
                            onClick={() => {
                                setEditModalItem(item)
                                setEditModalVisible(true)
                            }}
                        >
                            {t('edit')}
                        </Button>
                        <Button
                            type="link"
                            size="small"
                            danger
                            onClick={() => {
                                Modal.confirm({
                                    content: `${t('delete_confirm')} ${item.name}?`,
                                    okButtonProps: {
                                        danger: true,
                                    },
                                    async onOk() {
                                        let res = await request.post(`${config.host}/mysql/sql/remove`, {
                                            id: item.id,
                                        })
                                        if (res.success) {
                                            loadData()
                                        }
                                    }
                                })
                            }}
                        >{t('delete')}</Button>
                    </Space>
                )
            }
        },
    ]

    return (
        <div className={styles.tablesBox}>
            <div style={{
                marginBottom: 8
            }}>
                <Space>
                    <IconButton
                        tooltip={t('refresh')}
                        onClick={() => {
                            loadData()
                        }}
                    >
                        <ReloadOutlined />
                    </IconButton>
                    <Input.Search
                        placeholder={t('search')}
                        allowClear
                        onSearch={value => {
                            setKeyword(value)
                        }}
                        style={{ width: 200 }}
                    />
                </Space>
            </div>
            <Table
                loading={loading}
                className={styles.table}
                dataSource={list}
                pagination={{
                    current: page,
                    pageSize: 20,
                    total: total,
                    onChange: (page) => {
                        setPage(page)
                    }
                }}
                size="small"
                rowKey="id"
                columns={columns}
                bordered
                onChange={(pagination, filters, sorter) => {
                    console.log('Various parameters', pagination, filters, sorter);
                    console.log('sorter', sorter)
                    setSortedInfo(sorter)
                }}
                scroll={{
                    x: 2400,
                }}
            />
            {editModalVisible &&
                <SqlLikeModal
                    config={config}
                    event$={event$}
                    connectionId={connectionId}
                    item={editModalItem}
                    onSuccess={() => {
                        setEditModalVisible(false)
                        loadData()
                    }}
                    onClose={() => {
                        setEditModalVisible(false)
                    }}
                />
            }
        </div>
    )
}
