import { Space, Table } from 'antd';
import React, { useMemo } from 'react';
import { useState, useEffect } from 'react';
import { request } from '@/views/db-manager/utils/http';;
import styles from './sql-memory.module.less';
import _ from 'lodash';
import { ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { IconButton } from '../icon-button';
import fileSize from 'filesize'
import { variables_dic } from '../sql-variable/sql-variable';


export function SqlMemoryPanel({ config, connectionId, event$ }) {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [list, setList] = useState([])
    const [list2, setList2] = useState([])

    const { totalSize, threadMemo } = useMemo(() => {
        let total = 0
        for (let item of list) {
            total += parseInt(item.Value)
        }
        const max_connections = list2.find(item => item.Variable_name == 'max_connections')
        const sort_buffer_size = list2.find(item => item.Variable_name == 'sort_buffer_size')
        let threadMemo = null
        if (max_connections && sort_buffer_size) {
            threadMemo = parseInt(max_connections.Value) * parseInt(sort_buffer_size.Value)
            total += threadMemo
        }
        return {
            totalSize: total,
            threadMemo,
        }
    }, [list, list2])

    async function loadData() {
        setLoading(true)
        let res = await request.post(`${config.host}/mysql/execSqlSimple`, {
            connectionId,
            sql: 'SHOW GLOBAL VARIABLES',
        })
        if (res.success) {
            const list = res.data.filter(item => {
                return [
                    'innodb_buffer_pool_size',

                    'key_buffer_size',
                    'query_cache_size',
                    'thread_cache_size',
                    'tmp_table_size',
                    'innodb_log_buffer_size',
                    'binlog_cache_size',

                    'innodb_additional_mem_pool_size',
                    'read_buffer_size',
                    'read_buffer_size',
                    'read_rnd_buffer_size',
                    'join_buffer_size',
                    'thread_stack',
                ].includes(item.Variable_name)
            })
            .sort((a, b) => {
                return parseInt(b.Value) - parseInt(a.Value)
            })
            setList(list)

            const list2 = res.data.filter(item => {
                return [
                    'max_connections',
                    'sort_buffer_size',
                ].includes(item.Variable_name)
            })
            setList2(list2)

            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const columns = [
        {
            title: 'variable name',
            dataIndex: 'Variable_name',
            width: 240,
        },
        {
            title: 'value',
            dataIndex: 'Value',
            width: 160, // 有些很长，如 optimizer_switch
            ellipsis: true,
        },
        {
            title: 'format',
            dataIndex: 'format',
            width: 320,
            render(_value, item) {
                if (!variables_dic[item.Variable_name]?.format) {
                    return <div></div>
                }
                if (variables_dic[item.Variable_name]?.format == 'size') {
                    return (
                        <div>{fileSize(parseInt(item.Value), {base: 2})}</div>
                    )
                }
                return <div></div>
            }
        },
        {
            title: 'desc',
            dataIndex: 'Value',
            width: 320,
            render(_value, item) {
                if (!variables_dic[item.Variable_name]?.desc) {
                    return <div></div>
                }
                return (
                    <div>{variables_dic[item.Variable_name]?.desc}</div>
                )
            }
        },
        {
            title: '',
            dataIndex: '_op',
        },
    ]
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
            <div>
                <Space>
                    <div>
                        总：{fileSize(totalSize, {base: 2})}，
                    </div>
                    <div>
                        其中线程：{fileSize(threadMemo, {base: 2})}
                    </div>

                </Space>
            </div>
            <br />
            <Table
                loading={loading}
                dataSource={list}
                columns={columns}
                size="small"
                pagination={false}
            />
            <br />
            <Table
                loading={loading}
                dataSource={list2}
                columns={columns}
                size="small"
                pagination={false}
            />
        </div>
    )
}
