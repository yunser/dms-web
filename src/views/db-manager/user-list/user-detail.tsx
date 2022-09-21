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

export function UserDetail({ config, connectionId, userName, onTab, data = {} }: any) {
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
            connectionId,
            sql: `SELECT *
FROM \`mysql\`.\`db\`
WHERE \`User\` = '${userName}'
LIMIT 20;`,
        })
        if (res.success) {
            // message.info('连接成功')
            const list = res.data
            console.log('res', list)

            const all_permissions = [
                {
                    name: 'Select',
                    col: 'Select_priv',
                },
                {
                    name: 'Insert',
                    col: 'Insert_priv',
                },
                {
                    name: 'Update',
                    col: 'Update_priv',
                },
                {
                    name: 'Delete',
                    col: 'Delete_priv',
                },
                {
                    name: 'Create',
                    col: 'Create_priv',
                },
                {
                    name: 'Drop',
                    col: 'Drop_priv',
                },
                {
                    name: 'Grant',
                    col: 'Grant_priv',
                },
                {
                    name: 'References',
                    col: 'References_priv',
                },
                {
                    name: 'Index',
                    col: 'Index_priv',
                },
                {
                    name: 'Alter',
                    col: 'Alter_priv',
                },
                {
                    name: 'Create Tmp Table',
                    col: 'Create_tmp_table_priv',
                },
                {
                    name: 'Lock Tables',
                    col: 'Lock_tables_priv',
                },
                {
                    name: 'Create View',
                    col: 'Create_view_priv',
                },
                {
                    name: 'Show View',
                    col: 'Show_view_priv',
                },
                {
                    name: 'Create Routine',
                    col: 'Create_routine_priv',
                },
                {
                    name: 'Alter Routine',
                    col: 'Alter_routine_priv',
                },
                {
                    name: 'Execute',
                    col: 'Execute_priv',
                },
                {
                    name: 'Event',
                    col: 'Event_priv',
                },
                {
                    name: 'Trigger',
                    col: 'Trigger_priv',
                },
            ]

            setList(list.map(item => {
                const permissions = []
                for (let per of all_permissions) {
                    if (item[per.col] == 'Y') {
                        permissions.push(per.name)
                    }
                }
                return {
                    ...item,
                    permissions: permissions.join(', ')
                }
            }))

            
        }
        //  else {
        //     message.error('连接失败')
        // }
        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [userName])

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
            title: t('Db'),
            dataIndex: 'Db',
            with: 160,
        },
        {
            title: t('permissions'),
            dataIndex: 'permissions',
        },
    ]

    return (
        <div className={styles.tablesBox}>
            {/* <div style={{
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
            </div> */}
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
            {/* <Card bordered={false}>
                <div className={styles.tableList}>
                </div>
            </Card> */}
        </div>
    )
}
