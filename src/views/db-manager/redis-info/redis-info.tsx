import { Button, Checkbox, Col, Descriptions, Empty, Form, Input, InputNumber, message, Modal, Popover, Row, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './redis-info.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { Editor } from '../editor/Editor';
import storage from '../storage'
import { request } from '../utils/http'
import { CodeDebuger } from '../code-debug';
import { uid } from 'uid';
import Item from 'antd/lib/list/Item';

export function RedisInfo({ config, event$, connectionId, onConnect, }) {
    const { t } = useTranslation()
    const [modalVisible, setModalVisible] = useState(false)
    const [list, setList] = useState([])
    const pageSize = 10
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [connections, setConnections] = useState([
        // {
        //     id: '1',
        //     name: 'XXX',
        // },
        // {
        //     id: '2',
        //     name: 'XXX2',
        // },
    ])
    const [loading, setLoading] = useState(false)
    // const [form] = Form.useForm()
//     const [code, setCode] = useState(`{
//     "host": "",
//     "user": "",
//     "password": ""
// }`)

    async function loadList() {
        setLoading(true)
        let res = await request.post(`${config.host}/redis/info`, {
            connectionId,
            // dbName,
        })
        if (res.success) {
            const infos = res.data.info.split('\r\n')
            console.log('info', infos)
            // setList(res.data.list)
            // setTotal(res.data.total)
            const list = []
            for (let item of infos) {
                if (item.includes(':')) {
                    const arr = item.split(':')
                    list.push({
                        key: arr[0],
                        value: arr[1],
                    })
                }
            }
            setList(list)
        }
        setLoading(false)
    }

    useEffect(() => {
        loadList()
    }, [page])

    return (
        <div className={styles.infoBox}>
            <div
                style={{
                    marginBottom: 8,
                }}
            >
                <Button
                    size="small"
                    onClick={() => {
                        loadList()
                    }}
                >
                    {t('refresh')}
                </Button>
            </div>
            <Table
                loading={loading}
                dataSource={list}
                bordered
                size="small"
                pagination={false}
                // pagination={{
                //     total,
                //     current: page,
                //     pageSize,
                //     showSizeChanger: false,
                // }}
                columns={[
                    {
                        title: t('name'),
                        dataIndex: 'key',
                        width: 240,
                    },
                    {
                        title: t('value'),
                        dataIndex: 'value',
                        width: 240,
                    },
                    {
                        title: '',
                        dataIndex: '_empty',
                    },
                ]}
                onChange={({ current }) => {
                    setPage(current)
                }}
            />
        </div>
    )
}
