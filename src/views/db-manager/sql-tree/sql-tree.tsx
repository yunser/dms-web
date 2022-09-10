import { Button, Descriptions, Dropdown, Input, InputProps, Menu, message, Modal, Popover, Space, Table, Tabs, Tooltip, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './sql-tree.module.less';
import _, { debounce } from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { Editor } from '../editor/Editor';
import { IconButton } from '../icon-button';
import { CodeOutlined, ConsoleSqlOutlined, DatabaseOutlined, FormatPainterOutlined, HistoryOutlined, InfoCircleOutlined, PlusOutlined, QuestionCircleOutlined, ReloadOutlined, SyncOutlined, TableOutlined, UnorderedListOutlined, UserOutlined } from '@ant-design/icons';
import { getTableFieldMap, setAllFields, setTabbleAllFields, suggestionAdd, suggestionAddSchemas } from '../suggestion';
import { request } from '../utils/http';

function getHightlight(title: string, keyword: string) {
    const index = title.toLocaleLowerCase().indexOf(keyword.toLowerCase())
    if (index == -1) {
        return <span>{title}</span>
    }
    const before = title.substring(0, index)
    const center = title.substring(index, index + keyword.length)
    const after = title.substring(index + keyword.length)
    return (
        <span>
            {before}
            <span style={{ color: 'red'}}>{center}</span>
            {after}
        </span>
    )
    // return (
    //     <span
    //         dangerouslySetInnerHTML={{
    //             __html: title.replace(keyword, `<span style="color: red">${keyword}</span>`),
    //         }}
    //     ></span>
    // )
}

function TreeTitle({ keyword, loading = false, nodeData, onAction, onClick, onDoubleClick }: any) {
    const { t } = useTranslation()

    const timerRef = useRef<number | null>(null)
    const [isHover, setIsHover] = useState(false)

    let _content = (
        <div className={styles.treeTitle}
            onDoubleClick={() => {
                // console.log('onDoubleClick')
                // queryTable(nodeData.key)
                if (timerRef.current) {
                    clearTimeout(timerRef.current)
                }
                // console.log('双击')
                onDoubleClick && onDoubleClick()
            }}
            onClick={() => {
                // console.log('onClick')
                //先清除一次
                if (timerRef.current) {
                    clearTimeout(timerRef.current)
                }
                timerRef.current = window.setTimeout(() => {
                    // console.log('单机')
                    onClick && onClick()
                }, 250)
            }}
        >
            <div className={styles.label}>
                {loading ?
                     <SyncOutlined className={styles.icon} spin />
                    // <span>Loading</span>
                // :
                //     <span>No</span>
                : nodeData.type == 'schema' ?
                    <DatabaseOutlined className={styles.icon} />
                : nodeData.type == 'table' ?
                    <TableOutlined className={styles.icon} />
                : nodeData.type == 'emppty' ?
                    <InfoCircleOutlined className={styles.icon} />
                :
                    <QuestionCircleOutlined className={styles.icon} />
                }
                {!!keyword ?
                    getHightlight(nodeData.title, keyword)
                :
                    nodeData.title
                }
            </div>
            {nodeData.type != 'schema' &&
                <Space>
                    {/* <a
                        className={styles.btns}
                        onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            queryTable(nodeData.key)
                        }}
                    >
                        快速查询
                    </a> */}
                    {/* <a
                        className={styles.btns}
                        onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
                            queryTableStruct(nodeData.key)
                        }}
                    >
                        查看结构
                    </a> */}
                </Space>
            }
        </div>
    )

    let content = _content
    if (isHover) {
        content = (
            <Dropdown
                overlay={(
                    <Menu
                        items={nodeData.type == 'schema' ? 
                            [
                                {
                                    label: t('refresh'),
                                    key: 'refresh_table',
                                },
                                {
                                    // label: t('refresh'),
                                    label: 'Use',
                                    key: 'schema_use',
                                },
                                {
                                    label: t('table_list'),
                                    key: 'table_list',
                                },
                                {
                                    label: t('table_create'),
                                    key: 'table_create',
                                },
                            ]
                        :
                            [
                                {
                                    label: t('view_struct'),
                                    key: 'view_struct',
                                },
                                {
                                    label: t('export_struct'),
                                    key: 'export_struct',
                                },
                                {
                                    label: t('table_truncate'),
                                    key: 'truncate',
                                },
                                {
                                    label: t('table_drop'),
                                    key: 'drop',
                                },
                            ]
                        }
                        onClick={({ item, key, keyPath, domEvent }) => {
                            onAction && onAction(key)
                        }}
                    >
                    </Menu>
                )}
                trigger={['contextMenu']}
            >
                {/* <div
                className="site-dropdown-context-menu"
                style={{
                    textAlign: 'center',
                    height: 200,
                    lineHeight: '200px',
                }} */}
                {/* Right Click on here */}
                {_content}
            </Dropdown>
        )
    }

    return (
        <div
            className={styles.treeTitleBox}
            onMouseEnter={() => {
                setIsHover(true)
            }}
            onMouseLeave={() => {
                setIsHover(false)
            }}
        >
            {content}
        </div>
    )
}

function DebounceInput(props: InputProps) {

    const { value, onChange } = props
    const [_value, setValue ] = useState('')

    const refreshByKeyword = useMemo(() => {
        return debounce((_keyword) => {
            // console.log('ddd.2', _keyword)
            onChange && onChange(_keyword)
        }, 500)
    }, [])
    useEffect(() => {
        setValue(value)
    }, [value])

    return (
        <Input
            {...props}
            value={_value}
            onChange={e => {
                // console.log('change', refreshByKeyword)
                const kw = e.target.value
                setValue(kw)
                // setFilterKeyword(kw)
                refreshByKeyword(kw)
                
                // debounce(() => {
                //     console.log('set')
                // }, 150, {
                //     'maxWait': 1000
                // })
            }}
            // value={keyword}
            // onChange={e => {
            //     // console.log('change', refreshByKeyword)
            //     const kw = e.target.value
            //     setKeyword(kw)
            //     // setFilterKeyword(kw)
            //     refreshByKeyword(kw)
            //     // debounce(() => {
            //     //     console.log('set')
            //     // }, 150, {
            //     //     'maxWait': 1000
            //     // })
            // }}
            // allowClear
            // placeholder={t('search') + '...'}
        />
    )
}


export function SqlTree({ config, event$, connectionId, onTab, data = {} }: any) {
    console.warn('SqlTree/render')
    
    const { defaultJson = '' } = data
    const { t } = useTranslation()

    const [loading, setLoading] = useState(false)
    const [keyword, setKeyword] = useState('')
    // const [filterKeyword] = useState('')
    // const refreshByKeyword = 
    
    const [selectedKeys, setSelectedKeys] = useState([])
    const [expandedKeys, setExpandedKeys] = useState([])
    const [treeData, setTreeData] = useState([])
    const filterTreeData = useMemo(() => {
        if (!keyword) {
            return treeData
        }
        return treeData.map(schemaNode => {
            console.log('schemaNode', schemaNode)
            return {
                ...schemaNode,
                children: (schemaNode.children || []).filter(tableNode => {
                    return tableNode.title.toLowerCase().includes(keyword.toLowerCase())
                })
            }
        })
        // return [
        //     {
        //         ...treeData[0],
        //         children: treeData[0].children.filter(item => {
        //             return item.title.toLowerCase().includes(keyword.toLowerCase())
        //         })
        //     }
        // ]
    }, [treeData, keyword])
    // const treeData: any[] = [
        
    // ]

    

    async function loadTables(schemaName) {
        // console.log('props', this.props.match.params.name)
        // const { dispatch } = this.props;
        // dispatch({
        //   type: 'user/fetchUserList',
        // });
        // setLoading(true)
        request.post(`${config.host}/mysql/execSql`, {
            connectionId,
            sql: `USE ${schemaName}`,
            // tableName,
            // dbName,
        }, {
            // noMessage: true,
        })
        event$.emit({
            type: 'event_update_use',
            data: {
                schemaName,
                connectionId,
            }
        })

        let res = await request.post(`${config.host}/mysql/tables`, {
            connectionId,
            dbName: schemaName,
        })
        console.log('res', res)
        if (res.success) {
            // message.info('连接成功')
            const list = res.data
            // console.log('res', list)
            // setList(res.list)

            // if (!list) {
                
            // }

            console.log('treeData', treeData)
            
            const dbIdx = treeData.findIndex(node => node.itemData.SCHEMA_NAME == schemaName)
            // return

            const children = list
                .map(item => {
                    const tableName = item.TABLE_NAME
                    return {
                        title: tableName,
                        key: tableName,
                        itemData: item,
                        type: 'table',
                    }
                })
                .sort((a, b) => {
                    return a.title.localeCompare(b.title)
                })
            treeData[dbIdx].loading = false
            treeData[dbIdx].children = children
            // console.log('treeData[dbIdx]', treeData[dbIdx])
            if (!list.length) {
                treeData[dbIdx].children = [
                    {
                        title: t('table_empty'),
                        type: 'emppty',
                        key: 'no-table' + new Date().getTime(),
                        itemData: {},
                    }
                ]
            }
            setExpandedKeys([treeData[dbIdx].key])
            setTreeData([...treeData])
            // adbs: ,
            // suggestionAdd('adbs', ['dim_realtime_recharge_paycfg_range', 'dim_realtime_recharge_range'])
            suggestionAdd(schemaName, list.map(item => item.TABLE_NAME))
        } else {
            message.error('连接失败')
        }
        // setLoading(false)
    }

    async function loadDbList() {
        setLoading(true)
        let ret = await request.post(`${config.host}/mysql/databases`, {
            connectionId,
        })
        // console.log('ret', ret)
        if (ret.success) {
            // message.info('连接成功')
            // console.log('ret', ret.data)
            // storage.set('connectId', 'ret.data')
            const dbs = ret.data
            setTreeData(dbs.map(item => {
                return {
                    title: item.SCHEMA_NAME,
                    key: item.SCHEMA_NAME,
                    type: 'schema',
                    children: [],
                    // data: 
                    itemData: item,
                    loading: false,
                }
            }))
            // setTreeData([
            //     ,
            // ])
            suggestionAddSchemas(connectionId, dbs.map(item => item.SCHEMA_NAME))
        }
        // else {
        //     message.error('连接失败')
        // }
        setLoading(false)
    }

    useEffect(() => {
        loadDbList()
    }, [])

    // useEffect(() => {
    //     loadTables()
    // }, [])

    async function loadTableFields({schemaName, tableName}) {
        if (getTableFieldMap()[tableName]) {
            return
        }
        const fieldNamesSql = `SELECT DISTINCT(COLUMN_NAME)
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = '${schemaName}'
AND TABLE_NAME = '${tableName}'
LIMIT 1000;`
        const res = await request.post(`${config.host}/mysql/execSqlSimple`, {
            connectionId,
            sql: fieldNamesSql,
            // tableName,
            // dbName,
        }, {
            // noMessage: true,
        })
        console.log('表字段', res.data)
        setTabbleAllFields(tableName, res.data.map(item => item.COLUMN_NAME))
    }

    async function loadAllFields(schemaName) {
        const fieldNamesSql = `SELECT DISTINCT(COLUMN_NAME)
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = '${schemaName}'
LIMIT 1000;`
        const res = await request.post(`${config.host}/mysql/execSql`, {
            connectionId,
            sql: fieldNamesSql,
            // tableName,
            // dbName,
        }, {
            // noMessage: true,
        })
        console.log('字段', res.data)
        setAllFields(name, res.data.results.map(item => item[0]))
    }

    function showSqlInNewtab({ title = 'New Query', sql }) {
        let tabKey = '' + new Date().getTime()
        onTab && onTab({
            type: 'sql-query',
            title,
            key: tabKey,
            defaultSql: sql,
            data: {
                dbName: null,
                tableName: null,
            },
        })
    }

    async function showCreateTable(nodeData) {
        const tableName = nodeData.key // TODO @p2
        const dbName = nodeData.itemData.TABLE_SCHEMA
        const sql = `show create table \`${dbName}\`.\`${tableName}\`;`
        // setSql(sql)
        showSqlInNewtab({
            title: 'Show create table',
            sql,
        })
    }

    async function truncate(nodeData) {
        // console.log('nodeData', nodeData)
        const tableName = nodeData.key // TODO @p2
        const dbName = nodeData.itemData.TABLE_SCHEMA
        const sql = `TRUNCATE TABLE \`${dbName}\`.\`${tableName}\`;`
        console.log('truncate', sql)
        // setSql(sql)
        showSqlInNewtab({
            title: 'TRUNCATE TABLE',
            sql,
        })
    }

    async function drop(nodeData) {
        console.log('drop/nodeData', nodeData)
        
        // return
        const tableName = nodeData.key // TODO @p2
        const sql = `DROP TABLE \`${nodeData.itemData.TABLE_SCHEMA}\`.\`${tableName}\`;`
        // setSql(sql)
        showSqlInNewtab({
            title: 'DROP TABLE',
            sql,
        })
    }

    function schemaUse(nodeData) {
        console.log('nodeData', nodeData)
        // return
        const sql = `USE \`${nodeData.itemData.SCHEMA_NAME}\`;`
        showSqlInNewtab({
            title: 'USE',
            sql,
        })
    }

    function queryTableStruct(nodeData) {
        console.log('nodeData', nodeData)
        // return
        const tableName = nodeData.key // TODO @p2
        const dbName = nodeData.itemData.TABLE_SCHEMA
        let tabKey = '' + new Date().getTime()
        onTab && onTab({
            title: `${tableName}@${dbName} - Table`,
            key: tabKey,
            type: 'tableDetail',
            data: {
                dbName,
                tableName,
            },
        })
    }
    
    event$.useSubscription(msg => {
        console.log('Status/onmessage', msg)
        // console.log(val);
        if (msg.type == 'ev_refresh_table') {
            const { connectionId: _connectionId, schemaName } = msg.data
            if (_connectionId == connectionId) {
                refreshSchemaTables(schemaName)
            }
        }
    })

    function refreshSchemaTables(schemaName) {
        const idx = treeData.findIndex(node => node.key == schemaName)
        console.log('idx', idx)
        treeData[idx].loading = true
        setTreeData([...treeData])
        setSelectedKeys([schemaName])
        loadTables(schemaName)
        loadAllFields(schemaName)
    }

    function refreshTables(nodeData) {
        refreshSchemaTables(nodeData.itemData.SCHEMA_NAME)
        // const idx = treeData.findIndex(node => node.key == nodeData.key)
        // console.log('idx', idx)
        // treeData[idx].loading = true
        // setTreeData([...treeData])
        // setSelectedKeys(nodeData.key)
        // loadTables(nodeData.itemData.SCHEMA_NAME)
    }

    function queryTable(nodeData) {
        const tableName = nodeData.key // TODO @p2
        const schemaName = nodeData.itemData.TABLE_SCHEMA

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
            sql: `SELECT *\nFROM \`${schemaName}\`.\`${tableName}\`\nLIMIT 20;`,
        })
        loadTableFields({schemaName, tableName})
    }
    
    return (
        <div className={styles.layoutLeft}>
            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <IconButton
                        tooltip={t('refresh')}
                        onClick={() => {
                            // loadTables()
                            loadDbList()
                        }}
                    >
                        <ReloadOutlined />
                    </IconButton>
                    {/* <IconButton
                        tooltip={t('table_create')}
                        onClick={() => {
                            let tabKey = '' + new Date().getTime()
                            onTab && onTab({
                                title: 'New Table',
                                key: tabKey,
                                type: 'tableDetail',
                                // defaultSql: `SELECT * FROM \`${dbName}\`.\`${tableName}\` LIMIT 20;`,
                                data: {
                                    dbName,
                                    tableName: null,
                                },
                            })
                        }}
                    >
                        <PlusOutlined />
                    </IconButton> */}
                    <IconButton
                        tooltip={t('list_view')}
                        onClick={() => {
                            let tabKey = '' + new Date().getTime()
                            onTab && onTab({
                                title: 'MySQL Databases',
                                key: 'mysql-database-0',
                                type: 'databases',
                                data: {
                                    connectionId,
                                },
                            })
                            // onTab && onTab({
                            //     title: 'Tables',
                            //     key: tabKey,
                            //     type: 'table_list',
                            //     // defaultSql: `SELECT * FROM \`${dbName}\`.\`${tableName}\` LIMIT 20;`,
                            //     data: {
                            //         dbName,
                            //         // tableName,
                            //     },
                            // })

                        }}
                    >
                        <UnorderedListOutlined />
                    </IconButton>
                    <IconButton
                        tooltip={t('user_manager')}
                        onClick={() => {
                            event$.emit({
                                type: 'event_show_users_tab',
                                data: {
                                    connectionId,
                                },
                            })
                        }}
                    >
                        <UserOutlined />
                    </IconButton>
                    <IconButton
                        tooltip={t('history')}
                        onClick={() => {
                            event$.emit({
                                type: 'event_show_history',
                                data: {
                                    connectionId,
                                },
                            })
                        }}
                    >
                        <HistoryOutlined />
                    </IconButton>
                    <IconButton
                        tooltip={t('sql_manage')}
                        onClick={() => {
                            event$.emit({
                                type: 'event_show_sqls',
                                data: {
                                    connectionId,
                                },
                            })
                        }}
                    >
                        {/* <CodeOutlined /> */}
                        <ConsoleSqlOutlined />
                    </IconButton>
                </div>
                {/* Header */}
                <DebounceInput
                    value={keyword}
                    onChange={value => {
                        setKeyword(value)
                    }}
                    allowClear
                    placeholder={t('search') + '...'}
                />

                
            </div>
            <div className={styles.body}>
                {loading ?
                    <div className={styles.loading}>{t('loading')}</div>
                :
                    <Tree
                        height={document.body.clientHeight - 42 - 80 - 40}
                        // checkable
                        // defaultExpandedKeys={['root']}
                        selectedKeys={selectedKeys}
                        expandedKeys={expandedKeys}
                        onExpand={(expandedKeys, info) => {
                            setExpandedKeys(expandedKeys)
                        }}
                        // defaultSelectedKeys={['0-0-0', '0-0-1']}
                        // defaultCheckedKeys={['0-0-0', '0-0-1']}
                        titleRender={nodeData => {
                            // console.log('nodeData', nodeData)
                            // console.log('nodeData.loading', nodeData.loading, nodeData)
                            if (loading) {
                                return <div>Loading</div>
                            }
                            return (
                                <TreeTitle
                                    // key={'' + loading}
                                    loading={nodeData.loading}
                                    nodeData={nodeData}
                                    keyword={keyword}
                                    onClick={() => {
                                        // queryTable(nodeData.key)
                                    }}
                                    onDoubleClick={() => {
                                        console.log('onDoubleClick', nodeData)
                                        if (nodeData.type == 'schema') {
                                            refreshTables(nodeData)
                                        }
                                        else if (nodeData.type == 'table') {
                                            queryTable(nodeData)
                                        }
                                        else {
                                            // nothing
                                        }
                                    }}
                                    onAction={(key) => {
                                        if (key == 'view_struct') {
                                            queryTableStruct(nodeData)
                                        }
                                        else if (key == 'refresh_table') {
                                            // queryTable(nodeData)
                                            refreshTables(nodeData)
                                        }
                                        else if (key == 'schema_use') {
                                            // queryTable(nodeData)
                                            schemaUse(nodeData)
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
                                        else if (key == 'table_list') {
                                            console.log('nodeData', nodeData)
                                            // return
                                            let tabKey = '' + new Date().getTime()
                                            onTab && onTab({
                                                title: 'Tables',
                                                key: tabKey,
                                                type: 'table_list',
                                                // defaultSql: `SELECT * FROM \`${dbName}\`.\`${tableName}\` LIMIT 20;`,
                                                data: {
                                                    dbName: nodeData.itemData.SCHEMA_NAME,
                                                    // tableName,
                                                },
                                            })
                                        }
                                        else if (key == 'table_create') {
                                            console.log('nodeData', nodeData)
                                            // return
                                            let tabKey = '' + new Date().getTime()
                                            onTab && onTab({
                                                title: 'New Table',
                                                key: tabKey,
                                                type: 'tableDetail',
                                                // defaultSql: `SELECT * FROM \`${dbName}\`.\`${tableName}\` LIMIT 20;`,
                                                data: {
                                                    dbName: nodeData.itemData.SCHEMA_NAME,
                                                    tableName: null,
                                                },
                                            })
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
                {/* <Card bordered={false}>
                    <div className={styles.tableList}>
                        <Table
                            dataSource={list}
                            pagination={false}
                            rowKey="TABLE_NAME"
                            columns={columns} />
                    </div>
                </Card> */}
            </div>
        </div>
    )
}
