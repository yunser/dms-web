import {
    Card,
    Table,
    message,
    Button,
    Space,
} from 'antd'
import React, { Component, Fragment, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './databases.module.less'
import { IconButton } from '../icon-button';
import { ExportOutlined, ReloadOutlined } from '@ant-design/icons';
import { DatabaseEditHandler } from '../db-edit';
import { DatabaseRemoveHandler } from '../db-remove';
import { request } from '../utils/http';
import { CodeDebuger } from '../code-debug';

export default function DatabaseList({ connectionId, config, event$, onJson, onSelectDatabase }) {

    const { t } = useTranslation()
    const [list, setList] = useState([])
    const [loading, setLoading] = useState(false)

    async function loadDbList() {
        setLoading(true)
        let ret = await request.post(`${config.host}/mysql/databases`, {
            connectionId,
        })
        // console.log('ret', ret)
        if (ret.success) {
            // message.info('连接成功')
            // console.log('ret', ret.data)
            // storage.set('connectId', 'ret.data')
            setList(ret.data)
        } else {
            message.error('连接失败')
        }
        setLoading(false)
    }

    useEffect(() => {
        loadDbList()
    }, [])
    
    const columns = [
        {
            title: t('schema_name'),
            dataIndex: 'SCHEMA_NAME',
            key: 'SCHEMA_NAME',
            width: 320,
            ellipsis: true,
            // render(value: string, item) {
            //     return (
            //         <div
            //             onClick={() => {
            //                 onSelectDatabase && onSelectDatabase({
            //                     name: item.SCHEMA_NAME,
            //                     connectionId,
            //                 })
            //             }}
            //             style={{
            //                 cursor: 'pointer',
            //             }}
            //         >
            //             <a>{value}</a>
            //         </div>
            //     )
            //     // return <a href={`/databases/${value}`}>{value}</a>
            // },
        },
        {
            // title: 'DEFAULT_CHARACTER_SET_NAME',
            title: t('character_set'),
            dataIndex: 'DEFAULT_CHARACTER_SET_NAME',
            width: 170,
            ellipsis: true,
        },
        {
            title: t('collation'),
            dataIndex: 'DEFAULT_COLLATION_NAME',
            width: 170,
            ellipsis: true,
        },
        {
            title: t('actions'),
            dataIndex: 'op',
            key: 'op',
            width: 160,
            render(value, item) {
                return (
                    <Space>
                        <DatabaseEditHandler
                            connectionId={connectionId}
                            config={config}
                            connectionId={connectionId}
                            item={item}
                            onSuccess={() => {
                                loadDbList()
                            }}
                        >
                            <a>{t('edit')}</a>
                        </DatabaseEditHandler>
                        <a
                            onClick={() => {
                                event$.emit({
                                    type: 'event_view_tables',
                                    data: {
                                        connectionId,
                                        schemaName: item.SCHEMA_NAME,
                                    }
                                })
                            }}
                        >{t('table_list')}</a>
                        <DatabaseRemoveHandler
                            item={item}
                            connectionId={connectionId}
                            config={config}
                            onSuccess={() => {
                                loadDbList()
                            }}
                        >
                            <a>{t('delete')}</a>
                        </DatabaseRemoveHandler>
                    </Space>
                )
            },
        },
        {
            title: '',
            dataIndex: '_empty',
        },
    ]

    return (
        <div className={styles.databasesBox}>
            <div style={{
                marginBottom: 8,
            }}>
                <Space>
                    <IconButton
                        tooltip={t('refresh')}
                        onClick={() => {
                            loadDbList()
                        }}
                    >
                        <ReloadOutlined />
                    </IconButton>
                    <IconButton
                        tooltip={t('export_json')}
                        onClick={() => {
                            const content = JSON.stringify(list, null, 4)
                            onJson && onJson(content)
                        }}
                    >
                        <ExportOutlined />
                    </IconButton>
                    <DatabaseEditHandler
                        connectionId={connectionId}
                        config={config}
                        onSuccess={() => {
                            loadDbList()
                        }}
                    >
                        <Button size="small">
                            {t('db_create')}
                        </Button>
                    </DatabaseEditHandler>
                </Space>
            </div>
            <Table
                loading={loading}
                bordered
                className={styles.table}
                dataSource={list}
                pagination={false}
                columns={columns}
                rowKey="name"
                size="small"
                scroll={{
                    // y: 400,
                    y: document.body.clientHeight - 190,
                }}
            />
            <CodeDebuger path="src/views/db-manager/databases/index.tsx" />
            {/* <div>
            </div> */}
        </div>
    )
}

