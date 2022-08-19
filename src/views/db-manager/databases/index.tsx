import {
    Card,
    Table,
    message,
} from 'antd'
import React, { Component, Fragment, useEffect, useState } from 'react';
import axios from 'axios'

export default function DatabaseList({ config, onSelectDatabase }) {

    const [list, setList] = useState([])

    async function loadData() {
        let ret = await axios.get(`${config.host}/mysql/databases`)
        console.log('ret', ret)
        if (ret.status === 200) {
            // message.info('连接成功')
            console.log('ret', ret.data)
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
            title: '数据库名称',
            dataIndex: 'name',
            key: 'name',
            render(value: string, item) {
                return (
                    <div
                        onClick={() => {
                            onSelectDatabase && onSelectDatabase(item)
                        }}
                    >
                        {value}
                    </div>
                )
                return <a href={`/databases/${value}`}>{value}</a>
            },
        },
        {
            title: '操作',
            dataIndex: 'op',
            key: 'op',
            // render(value) {
            //     return <a href={`/databases/${value}`}>{value}</a>
            // },
        },
    ]

    return (
        <div>
            <Card bordered={false}>
                <div>
                    <Table
                        dataSource={list}
                        pagination={false}
                        columns={columns} />
                </div>
            </Card>
        </div>
    )
}

