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

export default function DatabaseList({ connectionId, config, onJson, onSelectDatabase, onUseManager }) {

    const { t } = useTranslation()
    const [list, setList] = useState([])

    async function loadData() {
        let ret = await request.post(`${config.host}/mysql/databases`)
        // console.log('ret', ret)
        if (ret.success) {
            // message.info('连接成功')
            // console.log('ret', ret.data)
            // storage.set('connectId', 'ret.data')
            setList(ret.data)
        } else {
            message.error('连接失败')
        }
    }

    useEffect(() => {
        loadData()
    }, [])
    
    const columns = [
        {
            title: t('db_name'),
            dataIndex: 'SCHEMA_NAME',
            key: 'SCHEMA_NAME',
            render(value: string, item) {
                return (
                    <div
                        onClick={() => {
                            onSelectDatabase && onSelectDatabase({
                                name: item.SCHEMA_NAME,
                                connectionId,
                            })
                        }}
                        style={{
                            cursor: 'pointer',
                        }}
                    >
                        <a>{value}</a>
                    </div>
                )
                // return <a href={`/databases/${value}`}>{value}</a>
            },
        },
        {
            title: 'DEFAULT_CHARACTER_SET_NAME',
            dataIndex: 'DEFAULT_CHARACTER_SET_NAME',
        },
        {
            title: 'DEFAULT_COLLATION_NAME',
            dataIndex: 'DEFAULT_COLLATION_NAME',
        },
        {
            title: '操作',
            dataIndex: 'op',
            key: 'op',
            render(value, item) {
                return (
                    <Space>
                        <DatabaseEditHandler
                            config={config}
                            item={item}
                            onSuccess={() => {
                                loadData()
                            }}
                        >
                            <a>{t('edit')}</a>
                        </DatabaseEditHandler>
                        <DatabaseRemoveHandler
                            item={item}
                            config={config}
                            onSuccess={() => {
                                loadData()
                            }}
                        >
                            <a>{t('delete')}</a>
                        </DatabaseRemoveHandler>
                    </Space>
                )
            },
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
                            loadData()
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
                        config={config}
                        onSuccess={() => {
                            loadData()
                        }}
                    >
                        <Button size="small">
                            {t('db_create')}
                        </Button>
                    </DatabaseEditHandler>
                    <Button
                        size="small"
                        onClick={() => {
                            onUseManager && onUseManager()
                        }}
                    >
                        {t('user_manager')}
                    </Button>
                </Space>
            </div>
            <Table
                bordered
                className={styles.table}
                dataSource={list}
                pagination={false}
                columns={columns}
                rowKey="name"
                size="small"
                // scroll={{
                //     y: 400,
                // }}
            />
            {/* <div>
            </div> */}
        </div>
    )
}

