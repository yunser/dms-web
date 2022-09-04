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
import axios from 'axios';
import { suggestionAdd } from '../suggestion';
import { SorterResult } from 'antd/lib/table/interface';
import { request } from '../utils/http';

export function UserList({ config, onTab, data = {} }: any) {
    console.warn('SqlTree/render')
    
    const { defaultJson = '' } = data
    const { t } = useTranslation()

    const [sortedInfo, setSortedInfo] = useState({});
    const [loading, setLoading] = useState(false)
    const [keyword, setKeyword] = useState('')
    // const [filterKeyword] = useState('')
    // const refreshByKeyword = 
    
    const [list, setList] = useState([])
    

    async function loadData() {
        // console.log('props', this.props.match.params.name)
        // let dbName = this.props.match.params.name
        // this.dbName = dbName
        // const { dispatch } = this.props;
        // dispatch({
        //   type: 'user/fetchUserList',
        // });
        setLoading(true)
        setSortedInfo({})
        let res = await request.post(`${config.host}/mysql/execSqlSimple`, {
            sql: `SELECT *
FROM \`mysql\`.\`user\``,
        })
        if (res.status === 200) {
            // message.info('连接成功')
            const list = res.data
            console.log('res', list)
            setList(list)

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

    async function showCreateTable(nodeData) {
        const tableName = nodeData.key // TODO @p2
        const sql = `show create table \`${tableName}\`;`
        // setSql(sql)
        showSqlInNewtab({
            title: 'Show create table',
            sql,
        })
    }

    async function truncate(tableName) {
        // console.log('nodeData', nodeData)
        // const tableName = nodeData.key // TODO @p2
        const sql = `TRUNCATE TABLE \`${tableName}\`;`
        console.log('truncate', sql)
        // setSql(sql)
        showSqlInNewtab({
            title: 'TRUNCATE TABLE',
            sql,
        })
    }

    async function drop(nodeData) {
        const tableName = nodeData.key // TODO @p2
        const sql = `DROP TABLE \`${tableName}\`;`
        // setSql(sql)
        showSqlInNewtab({
            title: 'DROP TABLE',
            sql,
        })
    }

    function queryTableStruct(tableName: string) {
        let tabKey = '' + new Date().getTime()
        onTab && onTab({
            title: tableName + ' - Table',
            key: tabKey,
            type: 'tableDetail',
            // defaultSql: `SELECT * FROM \`${dbName}\`.\`${tableName}\` LIMIT 20;`,
            data: {
                dbName,
                tableName,
            },
        })
    }
    

    function queryTable(tableName: string) {
        // let tabKey = '' + new Date().getTime()
        // setActiveKey(tabKey)
        // setTabs([
        //     ...tabs,
        //     {
        //         title: tableName,
        //         key: tabKey,
        //         defaultSql: `SELECT *\nFROM \`${dbName}\`.\`${tableName}\`\nLIMIT 20;`,
        //         data: {
        //             dbName,
        //             tableName,
        //         },
        //     }
        // ])
        showSqlInNewtab({
            title: tableName,
            sql: `SELECT *\nFROM \`${dbName}\`.\`${tableName}\`\nLIMIT 20;`,
        })
    }
    
    const columns = [
        {
            title: 'User',
            dataIndex: 'User',
        },
        {
            title: 'Host',
            dataIndex: 'Host',
        },
        // {
        //     title: 'TABLE_ROWS',
        //     dataIndex: 'TABLE_ROWS',
        //     key: 'TABLE_ROWS',
        //     sorter: (a, b) => a.TABLE_ROWS - b.TABLE_ROWS,
        //     sortOrder: sortedInfo.columnKey === 'TABLE_ROWS' ? sortedInfo.order : null,
        //     sortDirections: ['descend', 'ascend'],
        //     ellipsis: true,
        // },
        // {
        //     title: 'DATA_LENGTH',
        //     dataIndex: 'DATA_LENGTH',
        //     key: 'DATA_LENGTH',
        //     sorter: (a, b) => a.DATA_LENGTH - b.DATA_LENGTH,
        //     sortOrder: sortedInfo.columnKey === 'DATA_LENGTH' ? sortedInfo.order : null,
        //     sortDirections: ['descend', 'ascend'],
        // },
        // {
        //     title: 'INDEX_LENGTH',
        //     dataIndex: 'INDEX_LENGTH',
        //     key: 'INDEX_LENGTH',
        //     sorter: (a, b) => a.INDEX_LENGTH - b.INDEX_LENGTH,
        //     sortOrder: sortedInfo.columnKey === 'INDEX_LENGTH' ? sortedInfo.order : null,
        //     sortDirections: ['descend', 'ascend'],
        // },
        // {
        //     title: 'DATA_FREE',
        //     dataIndex: 'DATA_FREE',
        //     key: 'DATA_FREE',
        //     sorter: (a, b) => a.DATA_FREE - b.DATA_FREE,
        //     sortOrder: sortedInfo.columnKey === 'DATA_FREE' ? sortedInfo.order : null,
        //     sortDirections: ['descend', 'ascend'],
        // },
        // {
        //     title: 'TABLE_COLLATION',
        //     dataIndex: 'TABLE_COLLATION',
        // },
        // {
        //     title: 'TABLE_COMMENT',
        //     dataIndex: 'TABLE_COMMENT',
        //     width: 240,
        //     ellipsis: true,
        // },
//         {
//             title: '操作',
//             dataIndex: 'op',
//             fixed: 'right',
//             render(_value, item) {
//                 return (
//                     <Space>
//                         <Button
//                             type="link"
//                             size="small"
//                             onClick={() => {
//                                 showSqlInNewtab({
//                                     title: item.TABLE_NAME,
//                                     sql: `SELECT * FROM \`${item.TABLE_NAME}\`
// LIMIT 20`,
//                                 })
//                             }}
//                         >
//                             查询
//                         </Button>
//                         <Button
//                             type="link"
//                             size="small"
//                             onClick={() => {
//                                 showSqlInNewtab({
//                                     title: item.TABLE_NAME,
//                                     sql: `SELECT PARTITION_NAME,TABLE_ROWS,PARTITION_EXPRESSION,PARTITION_DESCRIPTION 
// FROM INFORMATION_SCHEMA.PARTITIONS 
// WHERE TABLE_SCHEMA='${dbName}' AND TABLE_NAME = '${item.TABLE_NAME}'
// ORDER BY TABLE_ROWS DESC`
//                                 })
//                             }}
//                         >
//                             查询分区信息
//                         </Button>
//                         <Button
//                             type="link"
//                             size="small"
//                             onClick={() => {
//                                 truncate(item.TABLE_NAME)
//                             }}
//                         >
//                             清空
//                         </Button>
//                     </Space>
//                 )
//             }
//         },
    ]

    return (
        <div className={styles.tablesBox}>
            <div style={{
                marginBottom: 8
            }}>
                <Space>
                    {/* <IconButton
                        tooltip={t('refresh')}
                        onClick={() => {
                            loadData()
                        }}
                    >
                        <ReloadOutlined />
                    </IconButton> */}
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
                className={styles.table}
                dataSource={list}
                pagination={false}
                size="small"
                rowKey="TABLE_NAME"
                columns={columns}
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
            {/* <Card bordered={false}>
                <div className={styles.tableList}>
                </div>
            </Card> */}
        </div>
    )
}
