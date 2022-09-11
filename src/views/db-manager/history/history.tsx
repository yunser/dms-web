import { Button, Descriptions, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useMemo } from 'react';
import { VFC, useRef, useState, useEffect } from 'react';
import { request } from '../utils/http';
import styles from './history.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import copy from 'copy-to-clipboard';
import { CheckCircleOutlined, ClearOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import moment from 'moment'
import { IconButton } from '../icon-button';
import { ReloadOutlined } from '@ant-design/icons';
import { CodeDebuger } from '../code-debug';

const { TabPane } = Tabs
const { TextArea } = Input

export function HistoryList({ config, onSql }) {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [list, setList] = useState([])

    const columns = [
        {
            title: t('time'),
            dataIndex: 'time',
            width: 180,
            render(value) {
                return (
                    <div>{moment(value).format('YYYY-MM-DD HH:mm:ss')}</div>
                )
            }
        },
        {
            title: t('schema'),
            dataIndex: 'schema',
            width: 160,
            ellipsis: true,
        },
        {
            title: t('sql'),
            dataIndex: 'sql',
            width: 480 + 16,
            ellipsis: true,
            render(value) {
                return (
                    <div className={styles.sqlCell}>
                        <Popover
                            title="SQL"
                            content={
                                <div className={styles.content}>
                                    <code><pre>{value}</pre></code>
                                </div>
                            }
                        >
                            {value}
                        </Popover>
                    </div>
                )
            }
        },
        {
            title: t('status'),
            dataIndex: 'status',
            width: 80,
            render(value) {
                return (
                    <div
                        style={{
                            color: value == 'success' ? 'green' : 'red',
                        }}
                    >{value == 'success' ? t('success') : t('fail')}</div>
                )
            }
        },
        {
            title: t('rows'),
            dataIndex: 'rows',
            width: 80,
        },
        {
            title: t('exec_time'),
            dataIndex: 'execTime',
            width: 100,
        },
        {
            title: t('message'),
            dataIndex: 'message',
            width: 480 + 16,
            ellipsis: true,
            render(value) {
                return (
                    <div>
                        <Popover
                            title={t('message')}
                            content={
                                <div className={styles.content}>
                                    <code><pre>{value}</pre></code>
                                </div>
                            }
                        >
                            <div className={styles.messageCell}>{value}</div>
                        </Popover>
                        {/* {value} */}
                    </div>
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
            width: 80,
            fixed: 'right',
            render(value, item) {
                return (
                    <Space>
                        <Button
                            type="link"
                            size="small"
                            onClick={() => {
                                onSql && onSql(item.sql)
                            }}
                        >{t('use')}</Button>
                    </Space>
                )
            }
        },
    ]

    async function loadData() {
        setLoading(true)
        let res = await request.post(`${config.host}/mysql/history/list`, {
            // dbName,
            page,
            pageSize: 10,
        })
        if (res.success) {
            // message.info('连接成功')
            const data = res.data
            // console.log('res', list)
            setList(data.list)
            setTotal(data.total)
        }
        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [page])

    return (
        <div className={styles.historyBox}>
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
                    <IconButton
                        tooltip={t('delete_all')}
                        onClick={() => {
                            Modal.confirm({
                                content: `${t('delete_all_confirm')}`,
                                async onOk() {
                                    let res = await request.post(`${config.host}/mysql/history/clear`, {
                                        // dbName,
                                        page,
                                        pageSize: 10,
                                    })
                                    if (res.success) {
                                        loadData()
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
            </div>
            {/* <div className={styles.debug}>

            <code><pre>UPDA8TE `linxot`.`a_test567` SET `content` = '9999989' WHERE `id` = '9'</pre></code>
            </div> */}
            <Table
                loading={loading}
                // showTotal={}
                bordered
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
                // pagination={{
                //     showTotal: total => `共 ${total} 条`
                // }}
                // {...restProps}
                // columns={columns}
                columns={columns}
                scroll={{
                    x: 1800,
                }}
            />
            <CodeDebuger path="src/views/db-manager/history/history.tsx" />
        </div>
    )
}
