import { Button, Descriptions, Dropdown, Input, InputProps, Menu, message, Modal, Popover, Space, Spin, Table, Tabs, Tooltip, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './sql-tree.module.less';
import _, { debounce } from 'lodash';
import classNames from 'classnames'
import { useTranslation } from 'react-i18next';
import { Editor } from '../editor/Editor';
import { IconButton } from '../icon-button';
import { AimOutlined, CodeOutlined, ConsoleSqlOutlined, DatabaseOutlined, DeploymentUnitOutlined, FormatPainterOutlined, HistoryOutlined, InfoCircleOutlined, PlusOutlined, QuestionCircleOutlined, ReloadOutlined, SyncOutlined, TableOutlined, UnorderedListOutlined, UserOutlined } from '@ant-design/icons';
import { getTableFieldMap, setAllFields, setTabbleAllFields, suggestionAdd, suggestionAddSchemas } from '../suggestion';
import { request } from '../utils/http';
import { i18n } from '@/i18n';
import { FullCenterBox } from '../redis-client';
import copy from 'copy-to-clipboard';
import moment from 'moment';

function getTableKey(tableName: string) {
    return `table-${tableName}`
}

function getSchemaKey(schemaName: string) {
    return `schema-${schemaName}`
}

function getMsSchemaKey(schemaName: string) {
    return `ms_schema-${schemaName}`
}

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

    // TODO clear
    const timerRef = useRef<number | null>(null)
    const [isHover, setIsHover] = useState(false)

    let _content = (
        <div className={styles.treeTitle}
            onDoubleClick={() => {
                // console.log('onDoubleClick')
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
                : nodeData.type == 'schema2' ?
                    <DeploymentUnitOutlined className={styles.icon} />
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
                        }}
                    >
                        快速查询
                    </a> */}
                    {/* <a
                        className={styles.btns}
                        onClick={(e) => {
                            e.stopPropagation()
                            e.preventDefault()
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
                                    label: t('use'),
                                    // label: 'Use',
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
                                {
                                    label: t('copy_name'),
                                    key: 'copy_name',
                                },
                            ]
                        :
                            [
                                {
                                    label: t('view_struct'),
                                    key: 'view_struct',
                                },
                                {
                                    label: t('view_table'),
                                    key: 'view_table',
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
                                    danger: true,
                                },
                                {
                                    type: 'divider',
                                },
                                {
                                    label: t('count_all'),
                                    key: 'count_all',
                                },
                                {
                                    label: t('backup'),
                                    key: 'backup',
                                },
                                {
                                    label: t('copy_name'),
                                    key: 'copy_name',
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


export function SqlTree({ databaseType, curConnect, config, event$, connectionId, onTab, data = {} }: any) {
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

    async function loadSchemas(dbName) {
        let res = await request.post(`${config.host}/mysql/schemas`, {
            connectionId,
            dbName: dbName,
        })
        if (res.success) {
            const list = res.data
            const dbIdx = treeData.findIndex(node => node.itemData.$_name == dbName)
            const children = list
                .map(item => {
                    const schemaName = item.$_schema_name
                    return {
                        title: schemaName,
                        key: getMsSchemaKey(schemaName),
                        itemData: item,
                        type: 'schema2',
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
            suggestionAdd(dbName, list.map(item => item.$_table_name))
        } else {
            message.error('连接失败')
        }
    }

    async function loadTables2(dbName, schemaName) {

        let res = await request.post(`${config.host}/mysql/tables`, {
            connectionId,
            dbName,
            schemaName,
        })
        console.log('res', res)
        if (res.success) {
            // message.info('连接成功')
            const list = res.data
            return list
        } else {
            message.error('连接失败')
            return []
        }
        // setLoading(false)
    }

    async function loadTables(schemaName, treeData) {
        // console.log('props', this.props.match.params.name)
        // const { dispatch } = this.props;
        // dispatch({
        //   type: 'user/fetchUserList',
        // });
        // setLoading(true)
        if (databaseType == 'sqlite') {

        }
        else if (databaseType == 'postgresql') {

        }
        else if (databaseType == 'alasql') {

        }
        else {
            request.post(`${config.host}/mysql/execSql`, {
                connectionId,
                sql: `USE ${schemaName}`,
            })
        }
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
        if (res.success) {
            const list = res.data
            // const parentKeyFun
            const dbIdx = treeData.findIndex(node => node.itemData.$_name == schemaName)
            const children = list
                .map(item => {
                    const tableName = item.$_table_name
                    return {
                        title: tableName,
                        key: getTableKey(tableName),
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
            suggestionAdd(schemaName, list.map(item => item.$_table_name))


            // AlaSQL 自动查询
            //         console.log('alasql/nodeData', JSON.parse(JSON.stringify(nodeData)))
            //         console.log('alasql/nodeData2', nodeData.children)
            //         if (nodeData && nodeData?.children?.length) {
            //             if (databaseType == 'alasql') {
            //                 // const tableName = nodeData.children[0].itemData.$_table_name
            //                 const tableName = nodeData.children
            //                 console.log('alasql/tableName', tableName)

            //                 showSqlInNewtab({
            //                     title: '?', // TODO 写死
            //                     sql: `SELECT *
            // FROM ?
            // LIMIT 20;`,
            //                 })
            //             }
            //         }
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
            const treeData = dbs.map(item => {
                return {
                    title: item.$_name,
                    key: getSchemaKey(item.$_name),
                    type: 'schema',
                    children: [],
                    // data: 
                    itemData: item,
                    loading: false,
                }
            })
            setTreeData(treeData)
            // if (treeData.length == 2) {
            // }
            console.log('twotwo', )
            const schemaNames = treeData.map(item => item.itemData.$_name)
                .filter(n => n != 'information_schema')
            console.log('schemaNames', schemaNames)
            
            if (curConnect?.defaultDatabase && schemaNames.includes(curConnect.defaultDatabase)) {
                const nodeData = treeData.find(item => item.itemData.$_name == curConnect?.defaultDatabase)
                refreshNodeData(nodeData, treeData)
            }
            // 数据库只有一个（忽略 information_schema）时，自动加载表格
            else if (schemaNames.length == 1) {
                const nodeData = treeData.find(item => item.itemData.$_name == schemaNames[0])
                refreshNodeData(nodeData, treeData)
                // setTimeout(() => {
                // }, 0)
            }
            
            suggestionAddSchemas(connectionId, dbs.map(item => item.$_name))
        }
        // else {
        //     message.error('连接失败')
        // }
        setLoading(false)
    }

    useEffect(() => {
        loadDbList()
    }, [])


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
        const tableName = nodeData.itemData.$_table_name
        const schemaName = nodeData.itemData.$table_schema
        const sql = `SHOW CREATE TABLE \`${schemaName}\`.\`${tableName}\`;`
        showSqlInNewtab({
            title: 'Show Create Table',
            sql,
        })
    }

    async function truncate(nodeData) {
        const tableName = nodeData.itemData.$_table_name
        const schemaName = nodeData.itemData.$table_schema

        const sql = `TRUNCATE TABLE \`${schemaName}\`.\`${tableName}\`;`
        showSqlInNewtab({
            title: 'Truncate Table',
            sql,
        })
    }

    async function drop(nodeData) {
        const tableName = nodeData.itemData.$_table_name
        const schemaName = nodeData.itemData.$table_schema
        
        const sql = `DROP TABLE \`${schemaName}\`.\`${tableName}\`;`
        showSqlInNewtab({
            title: 'Drop Table',
            sql,
        })
    }

    async function backup(nodeData) {
        const tableName = nodeData.itemData.$_table_name
        const schemaName = nodeData.itemData.$table_schema
        
        const createTableSql = `SHOW CREATE TABLE \`${schemaName}\`.\`${tableName}\`;`
        const { success, data } = await request.post(`${config.host}/mysql/execSqlSimple`, {
            connectionId,
            sql: createTableSql,
            // tableName,
            // dbName,
        })
        if (!success) {
            return
        }
        if (!data.length) {
            return
        }
        const backupTableName = `${tableName}_bk_${moment().format('yyMMDD_HHmm')}`
        const checkSql = `SELECT COUNT(*) FROM \`${tableName}\`;`
        const createSql = (data[0]['Create Table'] + ';').replace(/`[\d\D]+?`/, `\`${backupTableName}\``)
        console.log('createSql', JSON.stringify(createSql))
        const insertSql = `INSERT INTO \`${backupTableName}\` (SELECT * FROM \`${tableName}\`);`
        const checkSql2 = `SELECT COUNT(*) FROM \`${backupTableName}\`;`
        const showSql = [checkSql, createSql, insertSql, checkSql2].join('\n')
        showSqlInNewtab({
            title: 'Backup Table',
            sql: showSql,
        })
    }

    async function countAll(nodeData) {
        const tableName = nodeData.itemData.$_table_name
        const schemaName = nodeData.itemData.$table_schema
        
        let sql
        sql = `SELECT COUNT(*) FROM \`${schemaName}\`.\`${tableName}\`;`
        showSqlInNewtab({
            title: 'Count Table',
            sql,
        })
    }

    function schemaUse(nodeData) {
        console.log('nodeData', nodeData)
        // return
        const sql = `USE \`${nodeData.itemData.SCHEMA_NAME}\`;`
        showSqlInNewtab({
            title: 'Use Database',
            sql,
        })
    }

    function queryTableStruct(nodeData) {
        const tableName = nodeData.itemData.$_table_name
        const schemaName = nodeData.itemData.$table_schema
        const dbName = schemaName
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

    function viewTable(nodeData) {
        const tableName = nodeData.itemData.$_table_name
        const schemaName = nodeData.itemData.$table_schema
        const dbName = schemaName
        let tabKey = '' + new Date().getTime()
        onTab && onTab({
            title: `${tableName}@${dbName} - Table`,
            key: tabKey,
            type: 'tableView',
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
                const idx = treeData.findIndex(node => node.key == getSchemaKey(schemaName))
                refreshSchemaTables(schemaName, idx, treeData)
            }
        }
    })

    function refreshSchemaTables(schemaName, idx, treeData) {
        // const idx = treeData.findIndex(node => node.key == getSchemaKey(schemaName))
        console.log('idx', idx)
        if (idx != -1) {
            treeData[idx].loading = true
        }
        setTreeData([...treeData])
        setSelectedKeys([getSchemaKey(schemaName)])
        loadTables(schemaName, treeData)

        

        // 读取字段为了代码填充
        if (databaseType == 'postgresql') {
            // TODO
        }
        else if (databaseType == 'sqlite') {

        }
        else if (databaseType == 'alasql') {
            
        }
        else {
            loadAllFields(schemaName)
        }
    }

    function refreshNodeData(nodeData, treeData) {
        if (databaseType == 'mssql') {
            refreshSchemas(nodeData)
        }
        else {
            refreshTables(nodeData, treeData)
        }
    }

    // for mssql
    function refreshSchemas(nodeData) {
        const dbName = nodeData.itemData.$_name
        const idx = treeData.findIndex(node => node.key == getSchemaKey(dbName))
        console.log('treeData', treeData)
        console.log('idx', idx)
        treeData[idx].loading = true
        setTreeData([...treeData])
        setSelectedKeys([getSchemaKey(dbName)])
        loadSchemas(dbName)
    }

    async function refreshMssqlTables(nodeData) {
        console.log('refreshMssqlTables', nodeData)
        const { $_schema_db, $_schema_name } = nodeData.itemData
        const idx = treeData.findIndex(node => node.key == getSchemaKey($_schema_db))
        console.log('idx', idx)
        if (idx != -1) {
            const idx2 = treeData[idx].children.findIndex(node => node.key == getMsSchemaKey($_schema_name))
            console.log('idx2', idx2)
            if (idx2 != -1) {
                treeData[idx].children[idx2].loading = true
                setTreeData([...treeData])
                setSelectedKeys([getMsSchemaKey($_schema_name)])
                const childrenData = await loadTables2($_schema_db, $_schema_name)
                const children = childrenData.map(item => {
                    const tableName = item.$_table_name
                    return {
                        title: tableName,
                        key: getTableKey(tableName),
                        itemData: item,
                        type: 'table',
                    }
                })
                treeData[idx].children[idx2].children = children
                treeData[idx].children[idx2].loading = false
                setSelectedKeys([getMsSchemaKey($_schema_name)])
                setExpandedKeys([...expandedKeys, getMsSchemaKey($_schema_name)])
                setTreeData([...treeData])
                // if (databaseType == 'postgresql') {
                //     // TODO
                // }
                // else if (databaseType == 'sqlite') {
        
                // }
                // else {
                //     loadAllFields(schemaName)
                // }
            }
        }

    }

    function refreshTables(nodeData, treeData) {
        const idx = treeData.findIndex(node => node.key == getSchemaKey(nodeData.itemData.$_name))
        refreshSchemaTables(nodeData.itemData.$_name, idx, treeData)
    }

    function queryTable(nodeData) {
        console.log('nodeData', nodeData)
        const tableName = nodeData.itemData.$_table_name
        const schemaName = nodeData.itemData.$table_schema

        let sql
        if (databaseType == 'mssql') {
            console.log('nodeData.itemData', nodeData.itemData)
            const { $__schemaName, $_table_name } = nodeData.itemData
            sql = `SELECT TOP 20 * FROM [${$__schemaName}].[${$_table_name}]`
        }
        else if (databaseType == 'alasql') {
            sql = `SELECT *\nFROM \`${tableName}\`\nLIMIT 20;`
        }
        else if (databaseType == 'postgresql') {
            sql = `SELECT *\nFROM "${schemaName}"."${tableName}"\nLIMIT 20;`
        }
        else {
            sql = `SELECT *\nFROM \`${schemaName}\`.\`${tableName}\`\nLIMIT 20;`
        }
        showSqlInNewtab({
            title: tableName,
            sql,
        })
        if (databaseType != 'sqlite' && databaseType != 'mssql' && databaseType != 'alasql') {
            loadTableFields({schemaName, tableName})
        }
    }
    
    return (
        <div className={styles.layoutLeft}>
            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <IconButton
                        tooltip={t('refresh')}
                        onClick={() => {
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
                                title: '$i18n.schemas',
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
                    {databaseType != 'sqlite' &&
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
                    }
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
                    <IconButton
                        tooltip={t('info')}
                        onClick={() => {
                            event$.emit({
                                type: 'event_show_info',
                                data: {
                                    connectionId,
                                },
                            })
                        }}
                    >
                        <InfoCircleOutlined />
                    </IconButton>
                    <IconButton
                        tooltip={t('quick_sql')}
                        onClick={() => {
                            // let tabKey = '' + new Date().getTime()
                            onTab && onTab({
                                title: '$i18n.quick_sql',
                                key: 'quick-sql-0',
                                type: 'quick_sql',
                                data: {
                                    connectionId,
                                },
                            })
                        }}
                    >
                        <AimOutlined />
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
                    <FullCenterBox
                        height={320}
                    >
                        <Spin />
                    </FullCenterBox>
                    // <div className={styles.loading}>{t('loading')}</div>
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
                                    }}
                                    onDoubleClick={() => {
                                        console.log('onDoubleClick', nodeData)
                                        if (nodeData.type == 'schema') {
                                            refreshNodeData(nodeData, treeData)
                                        }
                                        else if (nodeData.type == 'schema2') {
                                            console.log('schema2', nodeData)
                                            refreshMssqlTables(nodeData)
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
                                        else if (key == 'view_table') {
                                            viewTable(nodeData)
                                        }
                                        else if (key == 'refresh_table') {
                                            // queryTable(nodeData)
                                            refreshTables(nodeData, treeData)
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
                                        else if (key == 'count_all') {
                                            countAll(nodeData)
                                        }
                                        else if (key == 'backup') {
                                            backup(nodeData)
                                        }
                                        else if (key == 'copy_name') {
                                            console.log('nodeData', nodeData)
                                            if (nodeData.type == 'schema') {
                                                copy(nodeData.itemData.$_name)
                                            }
                                            else {
                                                copy(nodeData.itemData.$_table_name)
                                            }
                                            message.info(t('copied'))
                                        }
                                        else if (key == 'table_list') {
                                            event$.emit({
                                                type: 'event_view_tables',
                                                data: {
                                                    connectionId,
                                                    schemaName: nodeData.itemData.SCHEMA_NAME,
                                                }
                                            })
                                            // console.log('nodeData', nodeData)
                                            // // return
                                            // let tabKey = '' + new Date().getTime()
                                            // onTab && onTab({
                                            //     title: `${t('tables')} - ${nodeData.itemData.SCHEMA_NAME}`,
                                            //     key: tabKey,
                                            //     type: 'table_list',
                                            //     // defaultSql: `SELECT * FROM \`${dbName}\`.\`${tableName}\` LIMIT 20;`,
                                            //     data: {
                                            //         dbName: nodeData.itemData.SCHEMA_NAME,
                                            //         // tableName,
                                            //     },
                                            // })
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
