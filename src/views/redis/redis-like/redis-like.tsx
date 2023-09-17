import { Button, Input, Modal, Space, Table } from 'antd';
import React, { useEffect, useState } from 'react';
import styles from './redis-like.module.less';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { request } from '@/views/db-manager/utils/http';
import { RedisLikeModal } from './redis-like-modal';
import { IconButton } from '@/views/db-manager/icon-button';
import { ReloadOutlined } from '@ant-design/icons';

export function RedisLike({ config, event$, connectionId, onConnect, }) {
    const { t } = useTranslation()
    const [editModalVisible, setEditModalVisible] = useState(false)
    const [editModalItem, setEditModalItem] = useState(null)
    const [keyword, setKeyword] = useState('')
    const [list, setList] = useState([])
    const pageSize = 10
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(false)

    async function loadList() {
        setLoading(true)
        let res = await request.post(`${config.host}/redis/key/list`, {
            page,
            connectionId,
            keyword,
        })
        if (res.success) {
            setList(res.data.list)
            setTotal(res.data.total)
        }
        setLoading(false)
    }

    useEffect(() => {
        loadList()
    }, [page, keyword])

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
                        className={styles.refresh}
                        onClick={() => {
                            loadList()
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
                        title: t('name'),
                        dataIndex: 'name',
                        width: 240,
                    },
                    {
                        title: t('key'),
                        dataIndex: 'key',
                        width: 240,
                    },
                    {
                        title: t('time'),
                        dataIndex: 'create_time',
                        width: 240,
                    },
                    {
                        title: t('actions'),
                        dataIndex: 'actions',
                        // width: 80,
                        render(_value, item) {
                            return (
                                <div>
                                    <Space>
                                        <Button
                                            type="link"
                                            size="small"
                                            onClick={async () => {
                                                event$.emit({
                                                    type: 'event_show_key',
                                                    data: {
                                                        connectionId,
                                                        key: item.key,
                                                    }
                                                })
                                            }}
                                        >
                                            {t('view')}
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
                                            danger
                                            type="link"
                                            size="small"
                                            onClick={async () => {
                                                Modal.confirm({
                                                    content: `${t('delete')}「${item.key}」?`,
                                                    okButtonProps: {
                                                        danger: true,
                                                    },
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
                                        </Button>
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
                rowKey="id"
            />
            {editModalVisible &&
                <RedisLikeModal
                    config={config}
                    event$={event$}
                    connectionId={connectionId}
                    item={editModalItem}
                    onSuccess={() => {
                        setEditModalVisible(false)
                        loadList()
                    }}
                    onClose={() => {
                        setEditModalVisible(false)
                    }}
                />
            }
        </div>
    )
}
