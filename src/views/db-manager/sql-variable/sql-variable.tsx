import { Input, Radio, Space, Table } from 'antd';
import React, { useMemo, useRef } from 'react';
import { useState, useEffect } from 'react';
import { request } from '@/views/db-manager/utils/http';;
import styles from './sql-variable.module.less';
import _ from 'lodash';
import { ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { IconButton } from '../icon-button';
import { SearchUtil } from '@/utils/search';
import fileSize from 'filesize'

export const variables_dic = {
    'innodb_buffer_pool_size': {
        format: 'size',
    },
    'key_buffer_size': {
        format: 'size',
    },
    'innodb_log_buffer_size': {
        format: 'size',
    },
    'innodb_buffer_pool_chunk_size': {
        format: 'size',
    },
    'innodb_log_file_size': {
        format: 'size',
    },
    'thread_stack': {
        format: 'size',
    },
    'tmp_table_size': {
        format: 'size',
    },
    'join_buffer_size': {
        format: 'size',
    },
    'sort_buffer_size': {
        format: 'size',
    },
    'query_cache_size': {
        format: 'size',
    },
    'binlog_cache_size': {
        format: 'size',
    },
    'max_binlog_cache_size': {
        format: 'size',
    },
    'read_buffer_size': {
        format: 'size',
    },
    'read_rnd_buffer_size': {
        format: 'size',
    },
    'innodb_max_undo_log_size': {
        format: 'size',
    },
    'innodb_ft_total_cache_size': {
        format: 'size',
    },
    'thread_cache_size': {
        format: 'size',
    },
    'max_connections': {
        desc: '用于设置同时连接到MySQL服务器的最大客户端数量。一旦超过这个数量，新的客户端连接将无法被接受并返回错误信息',
    },
    // 
    'Binlog_cache_disk_use': {
        desc: '因事务使用的临时二进制日志缓存超出 binlog_cache_size 的设置而使用临时文件存储的数量。',
    },
}

export function SqlVariablePanel({ config, connectionId, event$ }) {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [list, setList] = useState([])
    const [keyword, setKeyword] = useState('')
    const [type, setType] = useState('variable')

    const filteredList = useMemo(() => {
        return SearchUtil.search(list, keyword, {
            attributes: ['Variable_name'],
        })
    }, [list, keyword])

    async function loadData() {
        const sqls = {
            variable: 'SHOW VARIABLES',
            global_variable: 'SHOW GLOBAL VARIABLES',
            status: 'SHOW STATUS',
            global_status: 'SHOW GLOBAL STATUS',
        }
        const sql = sqls[type]
        setLoading(true)
        let res = await request.post(`${config.host}/mysql/execSqlSimple`, {
            connectionId,
            sql,
        })
        if (res.success) {
            setList(res.data)
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [type])

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
                    <Input
                        value={keyword}
                        onChange={e => {
                            setKeyword(e.target.value)
                        }}
                    />
                    <Radio.Group
                        value={type}
                        onChange={e => {
                            setType(e.target.value)
                        }}
                        size="small"
                    >
                        <Radio.Button value="variable">{t('variable')}</Radio.Button>
                        <Radio.Button value="global_variable">{t('global_variable')}</Radio.Button>
                        <Radio.Button value="status">{t('status')}</Radio.Button>
                        <Radio.Button value="global_status">{t('global_status')}</Radio.Button>
                    </Radio.Group>
                </Space>
            </div>
            <Table
                loading={loading}
                dataSource={filteredList}
                columns={[
                    {
                        title: 'variable name',
                        dataIndex: 'Variable_name',
                        width: 240,
                    },
                    {
                        title: 'value',
                        dataIndex: 'Value',
                        width: 240, // 有些很长，如 optimizer_switch
                        ellipsis: true,
                    },
                    {
                        title: 'format',
                        dataIndex: 'format',
                        width: 320,
                        render(_value, item) {
                            if (variables_dic[item.Variable_name]?.format == 'size') {
                                return (
                                    <div>{fileSize(parseInt(item.Value), {base: 2})}</div>
                                )
                            }
                            return <div></div>
                        }
                    },
                    {
                        title: '',
                        dataIndex: '_op',
                    },
                ]}
                size="small"
                pagination={false}
            />
        </div>
    )
}
