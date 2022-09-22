import { Button, Descriptions, Dropdown, Input, InputProps, Menu, message, Modal, Popover, Space, Table, Tabs, Tooltip, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './user-list.module.less';
import _, { debounce } from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { Editor } from '../editor/Editor';
import { IconButton } from '../icon-button';
import { DatabaseOutlined, FormatPainterOutlined, ReloadOutlined, TableOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { suggestionAdd } from '../suggestion';
import { SorterResult } from 'antd/lib/table/interface';
import { request } from '../utils/http';
import { UserDetail } from './user-detail';
import { UserEditModal } from './user-edit';

export function UserList({ config, connectionId, onTab, data = {} }: any) {
    console.warn('SqlTree/render')
    
    const { defaultJson = '' } = data
    const { t } = useTranslation()

    const [sortedInfo, setSortedInfo] = useState({});
    const [loading, setLoading] = useState(false)
    const [curUserName, setCurUserName] = useState('')
    const [editUserItem, setEditUserItem] = useState('')
    
    const [list, setList] = useState([])
    

    async function loadData() {
        setLoading(true)
        setSortedInfo({})
        let res = await request.post(`${config.host}/mysql/execSqlSimple`, {
            connectionId,
            sql: `SELECT *
FROM \`mysql\`.\`user\``,
        })
        if (res.success) {
            // message.info('连接成功')
            const list = res.data
            console.log('res', list)
            setList(list)

        }
        //  else {
        //     message.error('连接失败')
        // }
        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [])

    function showSqlInNewtab({ title = 'New Query', sql }) {
        let tabKey = '' + new Date().getTime()
        onTab && onTab({
            type: 'sql-query',
            title,
            key: tabKey,
            defaultSql: sql,
            data: {
                dbName,
                tableName: null,
            },
        })
    }


    const columns = [
        {
            title: t('user'),
            dataIndex: 'User',
            with: 160,
        },
        {
            title: t('host'),
            dataIndex: 'Host',
        },
        {
            title: '操作',
            dataIndex: 'op',
            fixed: 'right',
            render(_value, item) {
                return (
                    <Space>
                        <Button
                            type="link"
                            size="small"
                            onClick={() => {
                                setCurUserName(item.User)
                            }}
                        >
                            查看权限
                        </Button>
                        <Button
                            type="link"
                            size="small"
                            onClick={() => {
                                setEditUserItem(item)
                            }}
                        >
                            {t('edit')}
                        </Button>
                        {/* <Button
                            type="link"
                            size="small"
                            onClick={() => {
                                truncate(item.TABLE_NAME)
                            }}
                        >
                            清空
                        </Button> */}
                    </Space>
                )
            }
        },
    ]

    return (
        <div className={styles.tablesBox}>
            <div style={{
                marginBottom: 8
            }}>
                <Space>
                    <IconButton
                        tooltip={t('refresh')}
                        onClick={() => {
                            loadData()
                        }}
                    >
                        <ReloadOutlined />
                    </IconButton>
                </Space>
            </div>
            <Table
                className={styles.table}
                dataSource={list}
                pagination={false}
                size="small"
                rowKey="TABLE_NAME"
                columns={columns}
                loading={loading}
                bordered
                onChange={(pagination, filters, sorter) => {
                    console.log('Various parameters', pagination, filters, sorter);
                    // setFilteredInfo(filters);
                    console.log('sorter', sorter)
                    setSortedInfo(sorter)
                }}
                scroll={{
                    x: true,
                }}
            />
            {!!curUserName &&
                <div>
                    <div>{curUserName}权限：</div>
                    <UserDetail
                        config={config}
                        connectionId={connectionId}
                        userName={curUserName}
                    />
                </div>
            }
            {!!editUserItem &&
                <UserEditModal
                    config={config}
                    connectionId={connectionId}
                    item={editUserItem}
                    onCancel={() => {
                        setEditUserItem('')
                    }}
                    onSuccess={() => {
                        setEditUserItem('')
                        loadData()
                    }}
                />
            }
        </div>
    )
}
