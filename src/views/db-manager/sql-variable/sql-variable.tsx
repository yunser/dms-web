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
                        width: 320,
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
