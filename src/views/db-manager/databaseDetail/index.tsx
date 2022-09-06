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
import { HistoryList } from '../history'
// import _ from 'lodash'
import debounce from 'lodash/debounce'
import { SqlTree } from '../sql-tree'
import { TableList } from '../table-list'
import { request } from '../utils/http'
import { useInterval } from 'ahooks'
import { t } from 'i18next'

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

function Status({ config, connectionId }) {
    const [err, setErr] = useState('')
    async function heartBeat() {
        let res = await request.post(`${config.host}/mysql/execSqlSimple`, {
            sql: `SELECT 1`,
        }, {
            noMessage: true,
            timeout: 2000,
        })
        if (res.success) {

        }
        else {
            setErr('Connect rrror')
        }
    }

    async function reconnect() {
        let res = await request.post(`${config.host}/mysql/reconnect`, {
            connectionId,
        }, {
            noMessage: true,
            timeout: 2000,
        })
        if (res.success) {
            setErr('')
        }
        else {
            setErr('Connect rrror')
        }
    }

    useInterval(() => {
        heartBeat()
    }, 60 * 1000)
    
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
        </div>
    )
}

export function DataBaseDetail({ dbName, connectionId, config, onJson }) {
    console.warn('DataBaseDetail/render')

    const { t } = useTranslation()

    const [sql, setSql] = useState('')
    const first_key = 'key-zero'
    const tabs_default: Array<TabProps> = [
        {
            type: 'sql-query',
            title: t('new_query'),
            key: first_key,
            defaultSql: '',
            closable: false,
            data: {
                dbName: '',
                tableName: '',
            }
        },
        // {
        //     title: 'Tab 1',
        //     key: '1',
        //     defaultSql: 'SELECT * FROM target.user LIMIT 20;'
        // },
    ]
    const [activeKey, setActiveKey] = useState(tabs_default[0].key)
    const [tabs, setTabs] = useState(tabs_default)
    

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
            title: 'Untitled Query',
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

    function TabItem(item: TabProps) {
        return (
            <TabPane
                tab={item.title}
                key={item.key}
                closable={item.closable !== false}
                // closeIcon={
                //     <IconButton
                //         size="small"
                //     >
                //         <CloseOutlined style={{ color: '#999' }} />
                //     </IconButton>
                // }
            >
            </TabPane>
            // <SqlBox defaultSql={item.defaultSql} />
        )
    }

    const onEdit = (targetKey: string, action: string) => {
        console.log('targetKey, action', targetKey, action)
        // this[action](targetKey);
        if (action === 'add') {
            let tabKey = '' + new Date().getTime()
            setActiveKey(tabKey)
            setTabs([
                ...tabs,
                {
                    type: 'sql-query',
                    title: 'Untitled Query',
                    key: tabKey,
                    defaultSql: '',
                }
            ])
            // _this.setState({
            //     activeKey: tabKey,
            //     tabs: tabs.concat([{
                    
            //     }]),
            // })
        }
        if (action === 'remove') {
            for (let i = 0; i < tabs.length; i++) {
                if (tabs[i].key === targetKey) {
                    tabs.splice(i, 1)
                    break
                }
            }
            setTabs([
                ...tabs,
            ])
            setActiveKey(tabs[tabs.length - 1].key)
            // _this.setState({
            //     tabs
            // })
        }
    }

    
    // console.log('tabs', tabs)

    

    
    return (
        <div className={styles.layout}>
            <div className={styles.layoutLeft}>
                <SqlTree
                    config={config}
                    dbName={dbName}
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
                                    <IconButton
                                        tooltip={t('history')}
                                        onClick={() => {
                                            const history_tab = {
                                                type: 'history',
                                                title: t('history'),
                                                key: 'history-0-0',
                                            }
                                            addOrActiveTab(history_tab)
                                        }}
                                    >
                                        <HistoryOutlined />
                                    </IconButton>
                                    <Dropdown
                                        overlay={
                                            <Menu
                                                onClick={({ key }) => {
                                                    if (key == 'close_other') {
                                                        setTabs(tabs.filter(item => item.closable === false || item.key == activeKey))
                                                    }
                                                    else if (key == 'close_all') {
                                                        setTabs(tabs.filter(item => item.closable === false))
                                                        setActiveKey(first_key)
                                                    }
                                                    else if (key == 'close_current') {
                                                        const curTab = tabs.find(item => item.key == activeKey)
                                                        if (curTab) {
                                                            if (curTab.closable !== false) {
                                                                setTabs(tabs.filter(item => item.key != activeKey))
                                                                setActiveKey(first_key)
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
                    >
                        {tabs.map(TabItem)}
                    </Tabs>
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
                                {item.type == 'table_list' &&
                                    <TableList
                                        config={config}
                                        dbName={dbName}
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
                                {item.type == 'tableDetail' &&
                                    <TableDetail
                                        config={config}
                                        dbName={dbName}
                                        tableName={item.data?.tableName}
                                    />
                                }
                                {item.type == 'sql-query' &&
                                    <SqlBox
                                        config={config}
                                        dbName={dbName}
                                        tableName={item.data?.tableName}
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
                    sql={sql}
                    tableName={null}
                    dbName={dbName}
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
