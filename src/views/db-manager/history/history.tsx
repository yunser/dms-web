import { Button, Descriptions, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useMemo } from 'react';
import { VFC, useRef, useState, useEffect } from 'react';
import { request } from '../utils/http';
import styles from './history.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import copy from 'copy-to-clipboard';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import axios from 'axios'
import moment from 'moment'
import { IconButton } from '../icon-button';
import { ReloadOutlined } from '@ant-design/icons';

const { TabPane } = Tabs
const { TextArea } = Input

export function HistoryList({ config, onSql }) {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [list, setList] = useState([])

    const columns = [
        {
            title: t('time'),
            dataIndex: 'time',
            render(value) {
                return (
                    <div>{moment(value).format('YYYY-MM-DD HH:mm:ss')}</div>
                )
            }
        },
        {
            title: t('schema'),
            dataIndex: 'schema',
        },
        {
            title: t('sql'),
            dataIndex: 'sql',
            with: 240,
            ellipsis: true,
            render(value) {
                return (
                    <div className={styles.sqlCell}>
                        <Popover
                            title="SQL"
                            content={
                                <div className={styles.content}>
                                    {/* {sql} */}
                                    <code><pre>{value}</pre></code>
                                </div>
                            }
                        >
                            {/* <div className={styles.sql}>{sql}</div> */}
                            {value}
                        </Popover>
                    </div>
                )
            }
        },
        {
            title: t('status'),
            dataIndex: 'status',
            render(value) {
                return (
                    <div
                        style={{
                            color: value == 'success' ? 'green' : 'red',
                        }}
                    >{value}</div>
                )
            }
        },
        {
            title: t('rows'),
            dataIndex: 'rows',
        },
        {
            title: t('exec_time'),
            dataIndex: 'execTime',
        },
        {
            title: t('message'),
            dataIndex: 'message',
            render(value) {
                return (
                    <div
                        style={{
                            color: 'red',
                        }}
                    >{value}</div>
                )
            }
        },
        {
            title: t('actions'),
            dataIndex: 'actions',
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
        let res = await axios.post(`${config.host}/mysql/history/list`, {
            // dbName,
        })
        if (res.status === 200) {
            // message.info('连接成功')
            const list = res.data
            // console.log('res', list)
            setList(list)
        }
        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [])

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
                </Space>
            </div>
            <Table
                loading={loading}
                // showTotal={}
                bordered
                dataSource={list}
                size="small"
                // pagination={{
                //     showTotal: total => `共 ${total} 条`
                // }}
                // {...restProps}
                // columns={columns}
                columns={columns}
                scroll={{
                    x: true,
                }}
            />
        </div>
    )
}
