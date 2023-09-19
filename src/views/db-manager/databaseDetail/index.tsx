import {
    Card,
    Dropdown,
    Form,
    Input,
    Menu,
    message,
    Modal,
    Popover,
    Space,
    Tabs,
    Tooltip,
    Tree,
} from 'antd'
import React, { Component, Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Table, Button } from 'antd'
// import { Dispatch } from 'redux'
// import { FormComponentProps } from 'antd/es/form'
// import { UserStateType } from '@/models/user'
import styles from './index.module.less'
// import http from '../../../utils/http'
import SqlBox from './SqlBox'
// import Item from 'antd/lib/list/Item'
// import type { DataNode, TreeProps } from 'antd/es/tree';
import { TableDetail } from '../table-detail/table-detail'
// import { suggestionAdd } from '../suggestion'
import { CloseOutlined, DatabaseOutlined, DownOutlined, EllipsisOutlined, HistoryOutlined, LinkOutlined, MenuOutlined, ReloadOutlined, TableOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next'
import { IconButton } from '../icon-button'
import { ExecModal } from '../exec-modal/exec-modal'
import { HistoryList } from '../sql-history'
// import _ from 'lodash'
import debounce from 'lodash/debounce'
import { SqlTree } from '../sql-tree'
import { TableList } from '../table-list'
import { request } from '@/views/db-manager/utils/http';
import { useInterval } from 'ahooks'
import { t } from 'i18next'
import DatabaseList from '../databases'
import { UserList } from '../user-list'
import { SqlList } from '../sql-list'
import { suggestionAdd } from '../suggestion'
import { MySqlInfo } from '../mysql-info'
import { SqlQuickPanel } from '../sql-quick/sql-quick'
import { TableViewer } from '../table-view/table-view'
import storage from '@/utils/storage'
import { FunctionList } from '../function-list'
import { ExportDoc } from '../export-doc'
import { TableDataExporter } from '../table-data-exporter/table-data-exporter'
import { TableDiff } from '../table-diff'
import { SqlDataImport } from '../data-import'
import { SqlRealPanel } from '../sql-real/sql-real'
import { SqlDataBackup } from '../data-backup'

// console.log('ddd.0')
// _.debounce(() => {
//     console.log('ddd.1')
// }, 800, {
//     'maxWait': 1000
// })

// interface DatabaseDetailProps extends FormComponentProps {
//     dispatch: Dispatch<any>;
//     loading: boolean;
//     user: UserStateType;
// }



interface TabProps {
    type: string,
    title: string,
    key: string,
    defaultSql: string,
    closable?: boolean
    data?: object
}


// function CurrentSchema({ config, curSchema = '' }) {
//     // const [curSchema, setCurSchema] = useState('')

//     async function loadCurrentSchema() {
//         let res = await request.post(`${config.host}/mysql/execSqlSimple`, {
//             sql: `select database()`,
//         }, {
//             noMessage: true,
//         })
//         console.log('loadCurrentSchema/res', res.data)
//         if (res.success) {
//             // setCurSchema(res.data[0]['database()'])
//         }
//         // else {
//         //     setErr('Connect rrror')
//         // }
//     }

//     useEffect(() => {
//         loadCurrentSchema()
//     }, [])

//     return (
//         <div className={styles.curSchemaBox}>
//             {!!curSchema ?
//                 <Tooltip title="Current Selected Schema">
//                     <div>{curSchema}</div>
//                 </Tooltip>
//             :
//                 <div>No database selected.</div>
//             }
//         </div>
//     )
// }

function Status({ databaseType, config, event$, connectionId }) {
    const [err, setErr] = useState('')
    const [curSchema, setCurSchema] = useState('')
    async function heartBeat() {
        if (databaseType == 'splite') {
            return
        }
        if (databaseType == 'mssql') {
            return
        }
        if (databaseType == 'alasql') {
            return
        }
        if (databaseType == 'oracle') {
            return
        }
        let sql
        if (databaseType == 'postgresql') {
            sql = `select current_database()`
        }
        else {
            sql = `select database()`
        }
        let res = await request.post(`${config.host}/mysql/execSqlSimple`, {
            connectionId,
            sql,
        }, {
            noMessage: true,
            timeout: 2000,
        })
        if (res.success) {
            setCurSchema(res.data[0]['database()'])
        }
        else {
            setErr('Connect rrror')
        }
    }

    event$.useSubscription(msg => {
        console.log('Status/onmessage', msg)
        // console.log(val);
        if (msg.type == 'event_update_use') {
            const { connectionId: _connectionId, schemaName } = msg.data
            if (_connectionId == connectionId) {
                setCurSchema(schemaName)
            }
        }
        else if (msg.type == 'event_reload_use') {
            const { connectionId: _connectionId, schemaName } = msg.data
            if (_connectionId == connectionId) {
                heartBeat()
            }
        }
    })

    async function reconnect() {
        let res = await request.post(`${config.host}/mysql/reconnect`, {
            connectionId,
        }, {
            // noMessage: true,
            timeout: 2000,
        })
        if (res.success) {
            setErr('')
            setCurSchema('')
        }
        else {
            setErr('Connect rrror')
        }
    }

    useInterval(() => {
        heartBeat()
    }, 30 * 1000, {
        immediate: true,
    })


    
    return (
        <div className={styles.statusBox}>
            {/* {connectionId} */}
            {/* {!!err ?
                <div className={styles.error}>
                    <div>{t('connect_error')}</div>
                    <Button
                        size="small"
                        onClick={reconnect}
                    >
                        {t('reconnect')}
                    </Button>
                </div>
            :
                <div className={styles.success}>
                    {t('connected')}
                </div>
            } */}

            {/* <CurrentSchema
                config={config}
                curSchema={curSchema}
            /> */}
            {!err &&
                <div className={styles.curSchemaBox}>
                    {!!curSchema ?
                        <Tooltip title="Current Selected Schema">
                            <div>{curSchema}</div>
                        </Tooltip>
                    :
                        <div>{t('no_database_selected')}</div>
                    }
                </div>
            }
        </div>
    )
}

export function DataBaseDetail({ databaseType = 'mysql', curConnect, _connectionId, event$, config, onJson }) {
    console.warn('DataBaseDetail/render')

    const { t } = useTranslation()

    const [connectionId, setConnectionId] = useState(_connectionId)
    const [sql, setSql] = useState('')
    const first_key = 'key-zero'
    const tabs_default: Array<TabProps> = [
        // {
        //     type: 'sql-query',
        //     title: t('new_query'),
        //     key: first_key,
        //     defaultSql: '',
        //     closable: false,
        //     data: {
        //         dbName: '',
        //         tableName: '',
        //     }
        // },
        // {
        //     title: 'Tab 1',
        //     key: '1',
        //     defaultSql: 'SELECT * FROM target.user LIMIT 20;'
        // },
    ]
    // const [activeKey, setActiveKey] = useState(tabs_default[0].key)
    const [activeKey, _setActiveKey] = useState('')
    const [tabViewId, setTabViewId] = useState('')
    const [tabs, setTabs] = useState(tabs_default)
    const [wsStatus, setWsStatus] = useState('disconnected')
    const colors = {
        connected: 'green',
        disconnected: 'red',
    }
    const tooltips = {
        connected: t('connected'),
        disconnected: t('disconnected'),
        // unknown: 'Un Connect',
    }
    const [connecting, setConnecting] = useState(false)
    const comData = useRef({
        // cursor: 0,
        connectTime: 0,
        connectionId: _connectionId,
    })

    event$.useSubscription(msg => {
        // console.log(val);
        if (msg.type == 'event_show_users_tab') {
            const { connectionId: _connectionId, schemaName } = msg.data
            if (_connectionId == connectionId) {
                addOrActiveTab({
                    title: '$i18n.user_manager',
                    key: 'user-manager-0',
                    type: 'user-manager',
                    data: {
                        // name,
                    }
                }, {
                    // closeCurrentTab: true,
                })
            }
        }
        else if (msg.type == 'event_show_history') {
            const { connectionId: _connectionId, schemaName } = msg.data
            if (_connectionId == connectionId) {
                const history_tab = {
                    type: 'history',
                    title: '$i18n.history',
                    key: 'history-0-0',
                }
                addOrActiveTab(history_tab)
            }
        }
        else if (msg.type == 'event_show_sqls') {
            const { connectionId: _connectionId, schemaName } = msg.data
            if (_connectionId == connectionId) {
                const history_tab = {
                    type: 'type_sqls',
                    title: '$i18n.sql.like.list',
                    key: 'sqls-0-0',
                }
                addOrActiveTab(history_tab)
            }
        }
        else if (msg.type == 'event_show_info') {
            const { connectionId: _connectionId, schemaName } = msg.data
            if (_connectionId == connectionId) {
                const history_tab = {
                    type: 'type_info',
                    title: '$i18n.info',
                    key: 'info-0-0',
                }
                addOrActiveTab(history_tab)
            }
        }
        else if (msg.type == 'event_open_sql') {
            const { connectionId: _connectionId, schemaName } = msg.data
            if (_connectionId == connectionId) {
                const { sql } = msg.data
                onSql(sql)
            }
        }
        else if (msg.type == 'event_view_tables') {
            const { connectionId: _connectionId, schemaName } = msg.data
            if (_connectionId == connectionId) {
                let tabKey = '' + new Date().getTime()
                addOrActiveTab({
                    title: `${t('tables')} - ${schemaName}`,
                    key: tabKey,
                    type: 'table_list',
                    // defaultSql: `SELECT * FROM \`${dbName}\`.\`${tableName}\` LIMIT 20;`,
                    data: {
                        dbName: schemaName,
                        // tableName,
                    },
                })
            }
        }
        else if (msg.type == 'event_view_functions') {
            const { connectionId: _connectionId, schemaName } = msg.data
            if (_connectionId == connectionId) {
                let tabKey = '' + new Date().getTime()
                addOrActiveTab({
                    title: `${t('functions')} - ${schemaName}`,
                    key: tabKey,
                    type: 'function_list',
                    // defaultSql: `SELECT * FROM \`${dbName}\`.\`${tableName}\` LIMIT 20;`,
                    data: {
                        dbName: schemaName,
                        // tableName,
                    },
                })
            }
        }
        else if (msg.type == 'export_doc') {
            const { connectionId: _connectionId, schemaName } = msg.data
            if (_connectionId == connectionId) {
                let tabKey = '' + new Date().getTime()
                addOrActiveTab({
                    title: `${t('export_doc')} - ${schemaName}`,
                    key: tabKey,
                    type: 'export_doc',
                    // defaultSql: `SELECT * FROM \`${dbName}\`.\`${tableName}\` LIMIT 20;`,
                    data: {
                        dbName: schemaName,
                        // tableName,
                    },
                })
            }
        }
        else if (msg.type == 'table_diff') {
            const { connectionId: _connectionId, schemaName } = msg.data
            if (_connectionId == connectionId) {
                let tabKey = '' + new Date().getTime()
                addOrActiveTab({
                    title: `${t('table_diff')} - ${schemaName}`,
                    key: tabKey,
                    type: 'table_diff',
                    // defaultSql: `SELECT * FROM \`${dbName}\`.\`${tableName}\` LIMIT 20;`,
                    data: {
                        dbName: schemaName,
                        // tableName,
                    },
                })
            }
        }
        else if (msg.type == 'data_import') {
            const { connectionId: _connectionId, schemaName } = msg.data
            if (_connectionId == connectionId) {
                let tabKey = '' + new Date().getTime()
                addOrActiveTab({
                    title: `${t('data_import')} - ${schemaName}`,
                    key: tabKey,
                    type: 'data_import',
                    // defaultSql: `SELECT * FROM \`${dbName}\`.\`${tableName}\` LIMIT 20;`,
                    data: {
                        dbName: schemaName,
                        // tableName,
                    },
                })
            }
        }
        else if (msg.type == 'data_backup') {
            const { connectionId: _connectionId, schemaName } = msg.data
            if (_connectionId == connectionId) {
                let tabKey = '' + new Date().getTime()
                addOrActiveTab({
                    title: `${t('data_backup')} - ${schemaName}`,
                    key: tabKey,
                    type: 'data_backup',
                    data: {
                        dbName: schemaName,
                    },
                })
            }
        }
    })

    function setActiveKey(key) {
        setTabViewId('' + new Date().getTime())
        _setActiveKey(key)
    }

    function initWebSocket() {
        let first = true
        const ws = new WebSocket('ws://localhost:10087/')
        
        ws.onclose = async () => {
            console.log('socket/on-close')
            setWsStatus('disconnected')
            console.log('readyState', ws.readyState)

            // if (comData.current.connectTime < 3) {
            //     comData.current.connectTime++
            //     const ms = comData.current.connectTime * 2000
            //     const action = `正在第 ${comData.current.connectTime} 次重试连接，等待 ${ms} ms`
            //     console.log('time', moment().format('mm:ss'))   
            //     console.log(action)
            //     // setWsAction(action)
            //     await sleep(ms)
            //     initWebSocket()
            // }
            // else {
            //     // setWsAction('自动重试连接超过 3 次，连接失败')
            // }
        }
        ws.onopen = () => {
            comData.current.connectTime = 0
            console.log('onopen', )
            setWsStatus('connected')
            // setWsAction('')
            console.log('readyState', ws.readyState)

            ws.send(JSON.stringify({
                type: 'dbBind',
                data: {
                    connectionId: comData.current.connectionId,
                },
            }))
            // console.log('sended')
        }
        ws.onerror = (err) => {
            // setWsStatus('error')
            setWsStatus('disconnected')
            console.log('socket error', err)
            console.log('readyState', ws.readyState)
            // if (ws.)

            // if 

        }
        ws.onmessage = (event) => {
            const text = event.data.toString()
            console.log('onmessage', text)
            // {"channel":"msg:timer","message":"2023-01-18 22:21:10"}
            // 接收推送的消息
            let msg
            try {
                msg = JSON.parse(text)
            }
            catch (err) {
                console.log('JSON.parse err', err)
                return
            }
        }
        return ws
    }

    async function connect() {
        setConnecting(true)
        const reqData = {
            ...curConnect,
        }
        let ret = await request.post(`${config.host}/mysql/connect`, reqData)
        // console.log('ret', ret)
        if (ret.success) {
            // message.success('连接成功')
            // onConnect && onConnect({
            //     ...ret.data,
            //     curConnect: reqData,
            // })
            setConnectionId(ret.data.connectionId)
            
    
            const historyConnections = storage.get('historyConnections', [])
            let newHistoryConnections = historyConnections.filter(item => item.id != reqData.id)
            newHistoryConnections.unshift({
                _name: reqData.name,
                id: reqData.id,
            })
            if (newHistoryConnections.length > 8) {
                newHistoryConnections = newHistoryConnections.slice(0, 8)
            }
            storage.set('historyConnections', newHistoryConnections)

            comData.current.connectionId = ret.data.connectionId
            initWebSocket()
        }
        setConnecting(false)
    }
    
    useEffect(() => {
        connect()
    }, [curConnect])

    useEffect(() => {
        if (!connectionId) {
            return
        }
        if (databaseType == 'postgresql') {

        }
        else if (databaseType == 'sqlite') {

        }
        else if (databaseType == 'mssql') {

        }
        else if (databaseType == 'alasql') {

        }
        else if (databaseType == 'oracle') {

        }
        else {
            loadAllTables()
        }
    }, [connectionId])

    async function loadAllTables() {
        let res = await request.post(`${config.host}/mysql/execSqlSimple`, {
            connectionId,
            sql: `SELECT TABLE_SCHEMA, TABLE_NAME
    FROM \`information_schema\`.\`TABLES\`
    LIMIT 1000`,
    // tableName,
    // dbName,
}, {
    // noMessage: true,
})
        if (res.success) {
            const list = res.data
            const schemaMap = {}
            for (let item of list) {
                const { TABLE_SCHEMA, TABLE_NAME, } = item
                if (!schemaMap[TABLE_SCHEMA]) {
                    schemaMap[TABLE_SCHEMA] = []
                }
                schemaMap[TABLE_SCHEMA].push(TABLE_NAME)
            }
            for (let schemaName in schemaMap) {
                suggestionAdd(schemaName, schemaMap[schemaName])
            }
            // if (!list) {
                
            // }
        } else {
            message.error('连接失败')
        }
        // setLoading(false)
    }

    

    function addOrActiveTab(tab, { closeCurrentTab = false,} = {}) {
        const exists = tabs.find(t => t.key == tab.key)
        if (!exists) {
            let newTabs = [
                ...tabs,
                tab,
            ]
            if (closeCurrentTab) {
                newTabs = newTabs.filter(item => item.key != activeKey)
            }
            setTabs(newTabs)
        }
        setActiveKey(tab.key)
    }
    
    function onSql(sql) {
        let tabKey = '' + new Date().getTime()
        addOrActiveTab({
            title: t('untitled_query'),
            type: 'sql-query',
            key: tabKey,
            defaultSql: sql,
        })
    }

    function openTableDetail({ tableName, dbName }) {
        let tabKey = '' + new Date().getTime()
        addOrActiveTab({
            title: tableName,
            type: 'tableDetail',
            key: tabKey,
            defaultSql: sql,
            data: {
                dbName,
                tableName,
            }
        }, {
            closeCurrentTab: true,
        })
    }

    const onEdit = (targetKey: string, action: string) => {
        if (action === 'add') {
            let tabKey = '' + new Date().getTime()
            setActiveKey(tabKey)
            setTabs([
                ...tabs,
                {
                    type: 'sql-query',
                    title: t('untitled_query'),
                    key: tabKey,
                    defaultSql: '',
                }
            ])
        }
        if (action === 'remove') {
            const newTabs = tabs.filter(item => item.key != targetKey)
            setTabs([...newTabs])
            if (newTabs.length) {
                setActiveKey(newTabs[newTabs.length - 1].key)
            }
        }
    }

    return (
        <div className={styles.layout}>
            <div className={styles.layoutLeft}>
                <SqlTree
                    event$={event$}
                    config={config}
                    connectionId={connectionId}
                    databaseType={databaseType}
                    curConnect={curConnect}
                    onTab={tab => {
                        setActiveKey(tab.key)
                        setTabs([
                            ...tabs,
                            tab,
                        ])
                    }}
                />
                <div className={styles.status}>
                    <Space>
                        <Popover
                            title={tooltips[wsStatus]}
                            content={(
                                <Button
                                    size="small"
                                    onClick={() => {
                                        connect()
                                    }}
                                    >
                                    {t('reconnect')}
                                </Button>
                            )}
                        >
                            <LinkOutlined
                                style={{
                                    color: colors[wsStatus],
                                }}
                            />
                        </Popover>
                        {wsStatus != 'connected' &&
                            <Button
                            size="small"
                            onClick={() => {
                                connect()
                            }}
                            >
                                {t('reconnect')}
                            </Button>
                        }
                    </Space>
                    <Status
                        databaseType={databaseType}
                        event$={event$}
                        config={config}
                        connectionId={connectionId}
                    />
                </div>
            </div>
            <div className={styles.layoutRight}>
                {/* <Button type="primary" onClick={update}>更新</Button> */}
                <div className={styles.header}>
                    <Tabs
                        onEdit={onEdit}
                        activeKey={activeKey}
                        onChange={key => {
                            setActiveKey(key)
                        }}
                        tabBarGutter={-1}
                        type="editable-card"
                        style={{
                            height: '100%',
                        }}
                        // addIcon={
                        //     <HistoryOutlined />
                        // }
                        tabBarExtraContent={{
                            right: (
                                <Space>
                                    <Dropdown
                                        overlay={
                                            <Menu
                                                onClick={({ key }) => {
                                                    if (key == 'close_other') {
                                                        setTabs(tabs.filter(item => item.closable === false || item.key == activeKey))
                                                    }
                                                    else if (key == 'close_all') {
                                                        // setTabs(tabs.filter(item => item.closable === false))
                                                        // setActiveKey(first_key)
                                                        setTabs([])
                                                        setActiveKey('')
                                                    }
                                                    else if (key == 'close_current') {
                                                        const curTab = tabs.find(item => item.key == activeKey)
                                                        if (curTab) {
                                                            if (curTab.closable !== false) {
                                                                const newTabs = tabs.filter(item => item.key != activeKey)
                                                                setTabs(newTabs)
                                                                if (newTabs.length) {
                                                                    setActiveKey(newTabs[newTabs.length - 1].key)
                                                                }
                                                                else {
                                                                    setActiveKey('')
                                                                }
                                                            }

                                                        }
                                                    }
                                                }}
                                                items={[
                                                    {
                                                        label: t('close'),
                                                        key: 'close_current',
                                                    },
                                                    {
                                                        label: t('close_other'),
                                                        key: 'close_other',
                                                    },
                                                    {
                                                        label: t('close_all'),
                                                        key: 'close_all',
                                                    },
                                                ]}
                                            />
                                        }
                                    >
                                        <IconButton
                                            onClick={e => e.preventDefault()}
                                        >
                                            <MenuOutlined />
                                        </IconButton>
                                        {/* <a
                                        >
                                        </a> */}
                                    </Dropdown>
                                </Space>
                            )
                        }}
                        items={tabs.map(item => {
                            const labelText = item.title.startsWith('$i18n.') ? t(item.title.replace('$i18n.', '')) : item.title
                            return {
                                // label: item.title,
                                label: (
                                    <div
                                        className={styles.tabLabel}
                                        title={labelText}
                                    >
                                        {labelText}
                                    </div>
                                ),
                                key: item.key,
                                closable: item.closable !== false,
                            }
                        })}
                    />
                </div>
                <div className={styles.body}>
                    {tabs.map(item => {
                        return (
                            <div
                                className={styles.tabContent}
                                key={item.key}
                                style={{
                                    // visibility: item.key == activeKey ? 'visible' : 'hidden',
                                    display: item.key == activeKey ? undefined : 'none',
                                }}
                            >
                                {item.type == 'user-manager' &&
                                    <UserList
                                        config={config}
                                        connectionId={connectionId}
                                    />
                                }
                                {item.type == 'databases' &&
                                    <DatabaseList
                                        config={config}
                                        onJson={onJson}
                                        event$={event$}
                                        connectionId={connectionId}
                                        // onSelectDatabase={async ({name, connectionId}) => {
                                        //     const key = '' + new Date().getTime()
                                        //     addOrActiveTab({
                                        //         title: `${name} - DB`,
                                        //         key,
                                        //         type: 'database',
                                        //         data: {
                                        //             name,
                                        //             connectionId,
                                        //         }
                                        //     }, {
                                        //         closeCurrentTab: true,
                                        //     })

                                        //     request.post(`${config.host}/mysql/execSql`, {
                                        //         sql: `USE ${name}`,
                                        //         connectionId,
                                        //         // tableName,
                                        //         // dbName,
                                        //     }, {
                                        //         // noMessage: true,
                                        //     })

                                            
                                        // }}
                                    />
                                }
                                {item.type == 'type_sqls' &&
                                    <SqlList
                                        config={config}
                                        connectionId={connectionId}
                                        event$={event$}
                                    />
                                }
                                {item.type == 'table_list' &&
                                    <TableList
                                        config={config}
                                        connectionId={connectionId}
                                        dbName={item.data.dbName}
                                        onJson={onJson}
                                        onTab={tab => {
                                            setActiveKey(tab.key)
                                            setTabs([
                                                ...tabs,
                                                tab,
                                            ])
                                        }}
                                    />
                                }
                                {item.type == 'function_list' &&
                                    <FunctionList
                                        config={config}
                                        connectionId={connectionId}
                                        dbName={item.data.dbName}
                                        onJson={onJson}
                                        onTab={tab => {
                                            setActiveKey(tab.key)
                                            setTabs([
                                                ...tabs,
                                                tab,
                                            ])
                                        }}
                                    />
                                }
                                {item.type == 'export_doc' &&
                                    <ExportDoc
                                        config={config}
                                        connectionId={connectionId}
                                        dbName={item.data.dbName}
                                        onJson={onJson}
                                        onTab={tab => {
                                            setActiveKey(tab.key)
                                            setTabs([
                                                ...tabs,
                                                tab,
                                            ])
                                        }}
                                    />
                                }
                                {item.type == 'table_diff' &&
                                    <TableDiff
                                        config={config}
                                        connectionId={connectionId}
                                        dbName={item.data.dbName}
                                        onJson={onJson}
                                        onTab={tab => {
                                            setActiveKey(tab.key)
                                            setTabs([
                                                ...tabs,
                                                tab,
                                            ])
                                        }}
                                    />
                                }
                                {item.type == 'data_import' &&
                                    <SqlDataImport
                                        config={config}
                                        connectionId={connectionId}
                                        dbName={item.data.dbName}
                                        onJson={onJson}
                                        onTab={tab => {
                                            setActiveKey(tab.key)
                                            setTabs([
                                                ...tabs,
                                                tab,
                                            ])
                                        }}
                                    />
                                }
                                {item.type == 'data_backup' &&
                                    <SqlDataBackup
                                        config={config}
                                        connectionId={connectionId}
                                        dbName={item.data.dbName}
                                        onJson={onJson}
                                        onTab={tab => {
                                            setActiveKey(tab.key)
                                            setTabs([
                                                ...tabs,
                                                tab,
                                            ])
                                        }}
                                    />
                                }
                                {item.type == 'history' &&
                                    <HistoryList
                                        config={config}
                                        onSql={onSql}
                                    />
                                }
                                {item.type == 'quick_sql' &&
                                    <SqlQuickPanel
                                        config={config}
                                        connectionId={connectionId}
                                        event$={event$}
                                    />
                                }
                                {item.type == 'real_process' &&
                                    <SqlRealPanel
                                        config={config}
                                        connectionId={connectionId}
                                        event$={event$}
                                    />
                                }
                                {item.type == 'type_info' &&
                                    <MySqlInfo
                                        config={config}
                                        connectionId={connectionId}
                                        onSql={onSql}
                                    />
                                }
                                {item.type == 'tableDetail' &&
                                    <TableDetail
                                        databaseType={databaseType}
                                        config={config}
                                        connectionId={connectionId}
                                        event$={event$}
                                        dbName={item.data?.dbName}
                                        tableName={item.data?.tableName}
                                        onTab={({ tableName, dbName }) => {
                                            openTableDetail({ tableName, dbName })
                                        }}
                                    />
                                }
                                {item.type == 'tableView' &&
                                    <TableViewer
                                        databaseType={databaseType}
                                        config={config}
                                        connectionId={connectionId}
                                        event$={event$}
                                        dbName={item.data?.dbName}
                                        tableName={item.data?.tableName}
                                    />
                                }
                                {item.type == 'table-data-export' &&
                                    <TableDataExporter
                                        databaseType={databaseType}
                                        config={config}
                                        connectionId={connectionId}
                                        event$={event$}
                                        dbName={item.data?.dbName}
                                        tableName={item.data?.tableName}
                                    />
                                }
                                {item.type == 'sql-query' &&
                                    <SqlBox
                                        tabViewId={tabViewId}
                                        databaseType={databaseType}
                                        connectionId={connectionId}
                                        event$={event$}
                                        config={config}
                                        key={item.key}
                                        defaultSql={item.defaultSql}
                                        data={item.data}
                                        style={{
                                            // visibility: item.key == activeKey ? 'visible' : 'hidden',
                                            display: item.key == activeKey ? undefined : 'none',
                                        }}
                                        onJson={onJson}
                                        curConnect={curConnect}
                                    />
                                }
                            </div>
                        )
                        // return (
                        // )
                    })}
                </div>
            </div>

            {!!sql &&
                <ExecModal
                    config={config}
                    connectionId={connectionId}
                    sql={sql}
                    tableName={null}
                    dbName={null}
                />
            }
            {connecting &&
                <Modal
                    open={true}
                    // centered
                    // title="connecting"
                    title={null}
                    footer={null}
                    onCancel={() => {
                        setConnecting(false)
                    }}
                >
                    {t('connecting')}
                </Modal>
            }
        </div>
    )
}

// class DataBaseDetailPage extends Component<DatabaseDetailProps, DadabaseDetailState> {

//     dbName: string = ''

//     state: DadabaseDetailState = {
//         table: {
//             list: [],
//         },
//         activeKey: tabs[0].key,
//         tabs,
//     };


//     render() {
//         return (
//             <DataBaseDetail dbName={this.props.match.params.name} />
//         )
//     }
// }

// export default Form.create<DatabaseDetailProps>()(DataBaseDetailPage)
