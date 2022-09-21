import {
    Card,
    Dropdown,
    Form,
    Input,
    Menu,
    message,
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
import { CloseOutlined, DatabaseOutlined, DownOutlined, EllipsisOutlined, HistoryOutlined, MenuOutlined, ReloadOutlined, TableOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next'
import { IconButton } from '../icon-button'
import { ExecModal } from '../exec-modal/exec-modal'
import { HistoryList } from '../sql-history'
// import _ from 'lodash'
import debounce from 'lodash/debounce'
import { SqlTree } from '../sql-tree'
import { TableList } from '../table-list'
import { request } from '../utils/http'
import { useInterval } from 'ahooks'
import { t } from 'i18next'
import DatabaseList from '../databases'
import { UserList } from '../user-list'
import { SqlList } from '../sql-list'
import { suggestionAdd } from '../suggestion'
import { MySqlInfo } from '../mysql-info'
import { SqlQuickPanel } from '../sql-quick/sql-quick'

// console.log('ddd.0')
// _.debounce(() => {
//     console.log('ddd.1')
// }, 800, {
//     'maxWait': 1000
// })

const { TabPane } = Tabs

// interface DatabaseDetailProps extends FormComponentProps {
//     dispatch: Dispatch<any>;
//     loading: boolean;
//     user: UserStateType;
// }

// interface DadabaseDetailState {
//     table: any,
//     activeKey: string,
//     tabs: Array<TabProps>,
//     asd: string,
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

function Status({ config, event$, connectionId }) {
    const [err, setErr] = useState('')
    const [curSchema, setCurSchema] = useState('')
    async function heartBeat() {
        let res = await request.post(`${config.host}/mysql/execSqlSimple`, {
            connectionId,
            sql: `select database()`,
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
            {!!err ?
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
            }

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
                        <div>No database selected.</div>
                    }
                </div>
            }
        </div>
    )
}

export function DataBaseDetail({ connectionId, event$, config, onJson }) {
    console.warn('DataBaseDetail/render')

    const { t } = useTranslation()

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
    const [activeKey, setActiveKey] = useState('')
    const [tabs, setTabs] = useState(tabs_default)

    event$.useSubscription(msg => {
        console.log('dbManager/onmessage', msg)
        // console.log(val);
        if (msg.type == 'event_show_users_tab') {
            const { connectionId: _connectionId, schemaName } = msg.data
            if (_connectionId == connectionId) {
                addOrActiveTab({
                    title: t('user_manager'),
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
                    title: t('history'),
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
                    title: t('sql_manage'),
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
                    title: t('info'),
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
    })


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
        // console.log('res', res)
        if (res.success) {
            // message.info('连接成功')
            const list = res.data
            console.log('loadAllTables/res', list)
            // setList(res.list)
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

    useEffect(() => {
        loadAllTables()
    }, [])
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

    
    // const columns = [
    //     {
    //         title: '表名',
    //         dataIndex: 'TABLE_NAME',
    //         key: 'TABLE_NAME',
    //         render(value: string) {
    //             return <div onClick={e => queryTable(value)}>{value}</div>
    //         },
    //     },
    // ]

    // function handleTabChange(key: string) {
    //     console.log('set key', key)
    //     setActiveKey(key)
    // }


    const onEdit = (targetKey: string, action: string) => {
        console.log('targetKey, action', targetKey, action)
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
                    onTab={tab => {
                        setActiveKey(tab.key)
                        setTabs([
                            ...tabs,
                            tab,
                        ])
                    }}
                />
                <div className={styles.status}>
                    <Status
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
                            return {
                                label: item.title,
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
                                {item.type == 'type_info' &&
                                    <MySqlInfo
                                        config={config}
                                        connectionId={connectionId}
                                        onSql={onSql}
                                    />
                                }
                                {item.type == 'tableDetail' &&
                                    <TableDetail
                                        config={config}
                                        connectionId={connectionId}
                                        event$={event$}
                                        dbName={item.data?.dbName}
                                        tableName={item.data?.tableName}
                                    />
                                }
                                {item.type == 'sql-query' &&
                                    <SqlBox
                                        connectionId={connectionId}
                                        event$={event$}
                                        config={config}
                                        connectionId={connectionId}
                                        // className={item.key == activeKey ? styles.visibleTab : styles.hiddenTab}
                                        key={item.key}
                                        defaultSql={item.defaultSql}
                                        style={{
                                            // visibility: item.key == activeKey ? 'visible' : 'hidden',
                                            display: item.key == activeKey ? undefined : 'none',
                                        }}
                                        onJson={onJson}
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
