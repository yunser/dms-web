import { Button, Descriptions, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useMemo } from 'react';
import { VFC, useRef, useState, useEffect } from 'react';
import { request } from '../utils/http';
import styles from './exec-detail.module.less';
import _ from 'lodash';
import classNames from 'classnames'
console.log('lodash', _)
import copy from 'copy-to-clipboard';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import axios from 'axios'

const { TabPane } = Tabs
const { TextArea } = Input

export function HistoryList({ config, }) {
    const { t } = useTranslation()
    const [list, setList] = useState([])

    const columns = [
        {
            title: 'Time',
            dataIndex: 'time',
        },
        {
            title: 'Schema',
            dataIndex: 'schema',
        },
        {
            title: 'SQL',
            dataIndex: 'sql',
        },
        {
            title: 'Status',
            dataIndex: 'status',
        },
        {
            title: 'Rows',
            dataIndex: 'rows',
        },
        {
            title: 'Time(ms)',
            dataIndex: 'execTime',
        },
        {
            title: 'Message',
            dataIndex: 'message',
        },
    ]

    async function loadData() {
        // setLoading(true)
        let res = await axios.post(`${config.host}/mysql/history/list`, {
            // dbName,
        })
        if (res.status === 200) {
            // message.info('连接成功')
            const list = res.data
            console.log('res', list)
            setList(list)
        }
    }

    useState(() => {
        loadData()
    }, [])

    return (
        <div>
            {/* History */}
            <Table
                // showTotal={}
                bordered
                dataSource={list}
                // pagination={{
                //     showTotal: total => `共 ${total} 条`
                // }}
                // {...restProps}
                // columns={columns}
                columns={columns}
            />
        </div>
    )
}
