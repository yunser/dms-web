import { Button, Descriptions, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useMemo } from 'react';
import { VFC, useRef, useState, useEffect } from 'react';
import { request } from '../utils/http';
import styles from './mysql-info.module.less';
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

export function MySqlInfo({ config, connectionId, onSql }) {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [page, setPage] = useState(1)
    const [version, setVersion] = useState('--')
    const [list, setList] = useState([])

    async function loadData() {
        setLoading(true)
        let res = await request.post(`${config.host}/mysql/execSqlSimple`, {
            // dbName,
            connectionId,
            sql: 'SELECT VERSION()',
            // pageSize: 10,
        })
        if (res.success) {
            // message.info('连接成功')
            const data = res.data
            setVersion(`v${data[0]['VERSION()']}`)
            // console.log('res', list)
            // setList(data.list)
            // setTotal(data.total)
        }
        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [page])

    return (
        <div className={styles.historyBox}>
            {loading ?
                <div>{t('loading')}</div>
            :
                <div>
                    {t('server_version')}: {version}
                </div>
            }
            {/* <div className={styles.debug}>

            <code><pre>UPDA8TE `linxot`.`a_test567` SET `content` = '9999989' WHERE `id` = '9'</pre></code>
            </div> */}
            <CodeDebuger path="src/views/db-manager/mysql-info/mysql-info.tsx" />
        </div>
    )
}
