import { Button, Checkbox, Col, Descriptions, Empty, Form, Input, InputNumber, message, Modal, Popover, Row, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './logger-detail.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { Editor } from '../editor/Editor';
import storage from '../storage'
import { CodeDebuger } from '../code-debug';
import { uid } from 'uid';
import Item from 'antd/lib/list/Item';
import moment from 'moment';
import { request } from '@/views/db-manager/utils/http';

export function LoggerDetail({ event, connectionId, item: detailItem, onConnnect, }) {

    const config = {
        host: 'http://localhost:7003',
    }

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
    const [keyword, setKeyword] = useState('__req')
    const [searchKeyword, setSearchKeyword] = useState('__req')
    // const [form] = Form.useForm()
//     const [code, setCode] = useState(`{
//     "host": "",
//     "user": "",
//     "password": ""
// }`)

    console.log('detailItem', detailItem)
    async function loadList() {
        setLoading(true)
        let res = await request.post(detailItem.url, {
            // connectionId,
            // dbName,
            keyword: searchKeyword,
            // "keyword": "__req",
        })
        if (res.success) {
            const { list } = res.data
            setList(list)
        }
        setLoading(false)
    }

    useEffect(() => {
        loadList()
    }, [page, searchKeyword])

    return (
        <div className={styles.infoBox}>
            <div
                style={{
                    marginBottom: 8,
                }}
            >
                <Space>
                    <Button
                        size="small"
                        onClick={() => {
                            loadList()
                        }}
                    >
                        {t('refresh')}
                    </Button>
                    <Input.Search
                        value={keyword}
                        onChange={(e) => {
                            setKeyword(e.target.value)  
                        }}
                        onSearch={kw => {
                            setSearchKeyword(kw)
                        }}
                    />
                </Space>
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
                        title: t('time'),
                        dataIndex: 'time',
                        width: 320,
                        render(value) {
                            return (
                                <div>{moment(value).format('YYYY-MM-DD HH:mm:ss')}</div>
                            )
                        }
                    },
                    {
                        title: t('content'),
                        dataIndex: 'content',
                        width: 640,
                        render(value) {
                            return (
                                <div className={styles.content}>{value}</div>
                            )
                        }
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
