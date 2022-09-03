import {
    Card,
    Table,
    message,
} from 'antd'
import React, { Component, Fragment, useEffect, useState } from 'react';
import axios from 'axios'
import { useTranslation } from 'react-i18next';
import styles from './databases.module.less'
export default function DatabaseList({ config, onSelectDatabase }) {

    const { t } = useTranslation()
    const [list, setList] = useState([])

    async function loadData() {
        let ret = await axios.post(`${config.host}/mysql/databases`)
        // console.log('ret', ret)
        if (ret.status === 200) {
            // message.info('连接成功')
            // console.log('ret', ret.data)
            // storage.set('connectId', 'ret.data')
            setList(ret.data)
        } else {
            message.error('连接失败')
        }
    }

    useEffect(() => {
        loadData()
    }, [])
    
    const columns = [
        {
            title: t('db_name'),
            dataIndex: 'SCHEMA_NAME',
            key: 'SCHEMA_NAME',
            render(value: string, item) {
                return (
                    <div
                        onClick={() => {
                            onSelectDatabase && onSelectDatabase({
                                name: item.SCHEMA_NAME,
                            })
                        }}
                        style={{
                            cursor: 'pointer',
                        }}
                    >
                        <a>{value}</a>
                    </div>
                )
                // return <a href={`/databases/${value}`}>{value}</a>
            },
        },
        {
            title: 'DEFAULT_CHARACTER_SET_NAME',
            dataIndex: 'DEFAULT_CHARACTER_SET_NAME',
        },
        {
            title: 'DEFAULT_COLLATION_NAME',
            dataIndex: 'DEFAULT_COLLATION_NAME',
        },
        // {
        //     title: '操作',
        //     dataIndex: 'op',
        //     key: 'op',
        //     // render(value) {
        //     //     return <a href={`/databases/${value}`}>{value}</a>
        //     // },
        // },
    ]

    return (
        <div className={styles.databasesBox}>
            <Table
                bordered
                className={styles.table}
                dataSource={list}
                pagination={false}
                columns={columns}
                rowKey="name"
                size="small"
                // scroll={{
                //     y: 400,
                // }}
            />
            {/* <div>
            </div> */}
        </div>
    )
}

