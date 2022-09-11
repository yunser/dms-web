import { Button, Descriptions, Dropdown, Input, InputProps, Menu, message, Modal, Popover, Space, Table, Tabs, Tooltip, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './sql-list.module.less';
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

export function SqlList({ config, connectionId, event$ }: any) {
    const { t } = useTranslation()
    console.warn('SqlList/render')
    const [loading, setLoading] = useState(false)
    const [keyword, setKeyword] = useState('')
    // const [filterKeyword] = useState('')
    // const refreshByKeyword = 
    
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [list, setList] = useState([])
    
    event$.useSubscription(msg => {
        console.log('Status/onmessage', msg)
        // console.log(val);
        if (msg.type == 'event_sql_list_refresh') {
            loadData()
            // const { connectionId: _connectionId, schemaName } = msg.data
            // if (_connectionId == connectionId) {
            // }
        }
    })

    async function loadData() {
        // console.log('props', this.props.match.params.name)
        // let dbName = this.props.match.params.name
        // this.dbName = dbName
        // const { dispatch } = this.props;
        // dispatch({
        //   type: 'user/fetchUserList',
        // });
        setLoading(true)
        // setSortedInfo({})
        let res = await request.post(`${config.host}/mysql/sql/list`, {
            page,
            pageSize: 20,
            keyword,
        })
        if (res.success) {
            // message.info('连接成功')
            const { list, total } = res.data
            console.log('res', list)
            setList(list)
            setTotal(total)

            // const children = list
            //     .map(item => {
            //         const tableName = item.TABLE_NAME
            //         return {
            //             title: tableName,
            //             key: tableName,
            //         }
            //     })
            //     .sort((a, b) => {
            //         return a.title.localeCompare(b.title)
            //     })
            // setTreeData([
            //     {
            //         title: dbName,
            //         key: 'root',
            //         children,
            //         // itemData: item,
            //     },
            // ])
            // adbs: ,
            // suggestionAdd('adbs', ['dim_realtime_recharge_paycfg_range', 'dim_realtime_recharge_range'])
            // suggestionAdd(dbName, list.map(item => item.TABLE_NAME))
        }
        //  else {
        //     message.error('连接失败')
        // }
        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [page, keyword])

    
    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            width: 160,
            ellipsis: true,
        },
        {
            title: 'SQL',
            dataIndex: 'sql',
            width: 480 + 16,
            ellipsis: true,
            render(value) {
                return (
                    <Popover
                        title="SQL"
                        content={
                            <div className={styles.content}>
                                <code><pre>{value}</pre></code>
                            </div>
                        }
                    >
                        <div className={styles.sqlCell}>
                            {value}
                        </div>
                    </Popover>
                )
            }
        },
        {
            title: '',
            dataIndex: '_empty',
        },
        {
            title: t('actions'),
            dataIndex: 'actions',
            fixed: 'right',
            width: 160,
            // ellipsis: true,
            render(value, item) {
                return (
                    <Space>
                        <Button
                            type="link"
                            size="small"
                            onClick={() => {
                                event$.emit({
                                    type: 'event_open_sql',
                                    data: {
                                        connectionId,
                                        sql: item.sql,
                                    }
                                })
                                // onSql && onSql(item.sql)
                            }}
                        >{t('use')}</Button>
                        <Button
                            type="link"
                            size="small"
                            onClick={() => {
                                Modal.confirm({
                                    content: `${t('delete_confirm')} ${item.name}?`,
                                    // okText: '确认',
                                    // cancelText: '取消',
                                    async onOk() {
                                        // console.log('删除', )
                                        let res = await request.post(`${config.host}/mysql/sql/remove`, {
                                            id: item.id,
                                        })
                                        if (res.success) {
                                            // message.info('连接成功')
                                            // const list = res.data
                                            // console.log('res', list)
                                            // setList(list)
                                            loadData()
                                        }
                                    }
                                })
                            }}
                        >{t('delete')}</Button>
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
                    <Input.Search
                        placeholder={t('search')}
                        allowClear
                        onSearch={value => {
                            setKeyword(value)
                        }}
                        style={{ width: 200 }}
                    />
                </Space>
            </div>
            {/* <div className={styles.header}>
                <DebounceInput
                    value={keyword}
                    onChange={value => {
                        setKeyword(value)
                    }}
                    allowClear
                    placeholder={t('search') + '...'}
                />

                <IconButton
                    className={styles.refresh}
                    tooltip={t('refresh')}
                    onClick={() => {
                        loadData()
                    }}
                >
                    <ReloadOutlined />
                </IconButton>
                <IconButton
                    className={styles.refresh}
                    tooltip={t('list_view')}
                    onClick={() => {
                        let tabKey = '' + new Date().getTime()
                        onTab && onTab({
                            title: 'Tables',
                            key: tabKey,
                            type: 'table_list',
                            // defaultSql: `SELECT * FROM \`${dbName}\`.\`${tableName}\` LIMIT 20;`,
                            data: {
                                dbName,
                                // tableName,
                            },
                        })
                    }}
                >
                    <UnorderedListOutlined />
                </IconButton>
            </div> */}
            {/* <div className={styles.body}>
                {loading ?
                    <div className={styles.loading}>Loading...</div>
                :
                    <Tree
                        // checkable
                        defaultExpandedKeys={['root']}
                        selectedKeys={[]}
                        // defaultSelectedKeys={['0-0-0', '0-0-1']}
                        // defaultCheckedKeys={['0-0-0', '0-0-1']}
                        titleRender={nodeData => {
                            // console.log('nodeData', nodeData)
                            return (
                                <TreeTitle
                                    nodeData={nodeData}
                                    keyword={keyword}
                                    onClick={() => {
                                        queryTable(nodeData.key)
                                    }}
                                    onDoubleClick={() => {
                                        queryTableStruct(nodeData.key)
                                    }}
                                    onAction={(key) => {
                                        if (key == 'view_struct') {
                                            queryTableStruct(nodeData.key)
                                        }
                                        else if (key == 'export_struct') {
                                            showCreateTable(nodeData)
                                        }
                                        else if (key == 'truncate') {
                                            truncate(nodeData)
                                        }
                                        else if (key == 'drop') {
                                            drop(nodeData)
                                        }
                                    }}
                                />
                            )
                        }}
                        onSelect={(selectedKeys, info) => {
                            // console.log('selected', selectedKeys, info);
                            // const tableName = selectedKeys[0]
                            // queryTable(tableName)

                        }}
                        // onCheck={onCheck}
                        treeData={filterTreeData}
                    />
                }
            </div> */}
            <Table
                loading={loading}
                className={styles.table}
                dataSource={list}
                pagination={{
                    current: page,
                    pageSize: 20,
                    total: total,
                    onChange: (page) => {
                        setPage(page)
                    }
                }}
                size="small"
                rowKey="id"
                columns={columns}
                bordered
                onChange={(pagination, filters, sorter) => {
                    console.log('Various parameters', pagination, filters, sorter);
                    // setFilteredInfo(filters);
                    console.log('sorter', sorter)
                    setSortedInfo(sorter)
                }}
                scroll={{
                    x: 2400,
                }}
            />
            {/* <Card bordered={false}>
                <div className={styles.tableList}>
                </div>
            </Card> */}
        </div>
    )
}
