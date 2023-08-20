import { Button, Col, Row, Space, Table } from 'antd';
import React, { useEffect, useState } from 'react';
import styles from './low-code.module.less';
import _ from 'lodash';
import { request } from '@/views/db-manager/utils/http';
import { getGlobalConfig } from '@/config';

function ConnectionList() {
    const config = getGlobalConfig()
    const [loading, setLoading ] = useState(false)
    const [list, setList ] = useState([])
    async function loadData() {
        setLoading(true)
        let res = await request.post(`${config.host}/lowCode/list`, {
        })
        setLoading(false)
        if (res.success) {
            const { list } = res.data
            setList(list)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    return (
        <div>
            <div>
                <Button
                    onClick={() => {
                        loadData()
                    }}
                >
                    刷新
                </Button>
            </div>
            <Table
                loading={loading}
                dataSource={list}
                columns={[
                    {
                        title: '名称',
                        dataIndex: 'name',
                    },
                    {
                        title: '操作',
                        dataIndex: '_op',
                        render(_, item) {
                            return (
                                <Space>
                                    <Button
                                        size="small"
                                        onClick={() => {
                                            window.open(`/pages/low-code-detail?id=${item.id}`)
                                        }}
                                    >
                                        打开
                                    </Button>
                                </Space>
                            )
                        }
                    },
                ]}
            />
        </div>
    )
}

export function LowCodeApp({ tabKey, config, onClickItem }) {

    return (
        <div className={styles.app}
            onKeyDown={(e) => {
                console.log('IP keydown 22222', e.target)
            }}
        >
            <Row gutter={16}>
                <Col span={12}>
                    <ConnectionList />
                </Col>
                <Col span={12}>
                </Col>
            </Row>
        </div>
    )
}

