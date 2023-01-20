import { Button, Descriptions, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useMemo } from 'react';
import { VFC, useRef, useState, useEffect } from 'react';
import { request } from '@/views/db-manager/utils/http';;
import styles from './sql-quick.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import copy from 'copy-to-clipboard';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { TabPane } = Tabs
const { TextArea } = Input


export function SqlQuickPanel({ config, connectionId, event$, item, onCancel, onSuccess, tableName, dbName }) {
    const { t } = useTranslation()

    const sqls = [
        {
            id: '1',
            title: '查询进程信息',
            sql: `show processlist;`
        },
        {
            id: '2',
            title: '查询最大连接',
            sql: `show variables like '%max_connections%';`
        },
        {
            id: '3',
            title: '查询当前连接数，活跃连接数',
            sql: `show status like 'Threads%';`
        },
    ]

    return (
        <div>
            <div className={styles.list}>
                {sqls.map(item => {
                    return (
                        <div
                            className={styles.item}
                            key={item.id}
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
                            {item.title}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
