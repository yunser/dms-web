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
import Item from 'antd/lib/list/Item'
// import type { DataNode, TreeProps } from 'antd/es/tree';
import axios from 'axios'
import { TableDetail } from '../table-detail/table-detail'
import { suggestionAdd } from '../suggestion'
import { CloseOutlined, DatabaseOutlined, ReloadOutlined, TableOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next'
import { IconButton } from '../icon-button'
import { ExecModal } from '../exec-modal/exec-modal'
import { HistoryList } from '../history'
// import _ from 'lodash'
import debounce from 'lodash/debounce'

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
    title: string,
    key: string,
    defaultSql: string,
    closable?: boolean
    data?: object
}

// const tabs: Array<TabProps> = [
//     {
//         title: 'SQL',
//         key: '0',
//         defaultSql: '',
//     },
//     // {
//     //     title: 'Tab 1',
//     //     key: '1',
//     //     defaultSql: 'SELECT * FROM target.user LIMIT 20;'
//     // },
// ]



export function DataBaseDetail({ dbName, config }) {
    const { t } = useTranslation()

    const [sql, setSql] = useState('')
    const first_key = 'key-zero'
    const tabs_default: Array<TabProps> = [
        {
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
    const timerRef = useRef(null)


    const [activeKey, setActiveKey] = useState(tabs_default[0].key)
    // const
    const [loading, setLoading] = useState(false)
    const [keyword, setKeyword] = useState('')
    const [filterKeyword, setFilterKeyword] = useState('')
    // const refreshByKeyword = 
    const refreshByKeyword = useMemo(() => {
        return debounce((_keyword) => {
            console.log('ddd.2', _keyword)
            setFilterKeyword(_keyword)
        })
    }, [])
    const [list, setList] = useState([])
    const [tabs, setTabs] = useState(tabs_default)
    const [treeData, setTreeData] = useState([
        {
            title: dbName,
            key: 'root',
            children: [
                // {
                //     title: 'parent 1-0',
                //     key: '0-0-0',
                // },
                // {
                //     title: 'parent 1-1',
                //     key: '0-0-1',
                // },
            ],
        },
    ])
    const filterTreeData = useMemo(() => {
        if (!filterKeyword) {
            return treeData
        }
        return [
            {
                ...treeData[0],
                children: treeData[0].children.filter(item => {
                    return item.title.includes(filterKeyword)
                })
            }
        ]
    }, [treeData, filterKeyword])
    // const treeData: any[] = [
        
    // ]

    async function loadData() {
        // console.log('props', this.props.match.params.name)
        // let dbName = this.props.match.params.name
        // this.dbName = dbName
        // const { dispatch } = this.props;
        // dispatch({
        //   type: 'user/fetchUserList',
        // });
        setLoading(true)
        let res = await axios.post(`${config.host}/mysql/tables`, {
            dbName,
        })
        if (res.status === 200) {
            // message.info('连接成功')
            const list = res.data
            // console.log('res', list)
            setList(res.list)

            const children = list
                .map(item => {
                    const tableName = item.TABLE_NAME
                    return {
                        title: tableName,
                        key: tableName,
                    }
                })
                .sort((a, b) => {
                    return a.title.localeCompare(b.title)
                })
            setTreeData([
                {
                    title: dbName,
                    key: 'root',
                    children,
                    itemData: Item,
                },
            ])
            // adbs: ,
            // suggestionAdd('adbs', ['dim_realtime_recharge_paycfg_range', 'dim_realtime_recharge_range'])
            suggestionAdd(dbName, list.map(item => item.TABLE_NAME))
        } else {
            message.error('连接失败')
        }
        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [])

    async function showSqlInNewtab({ title = 'New Query', sql }) {
        let tabKey = '' + new Date().getTime()
        setActiveKey(tabKey)
        setTabs([
            ...tabs,
            {
                title,
                key: tabKey,
                defaultSql: sql,
                data: {
                    dbName,
                    tableName: null,
                },
            }
        ])
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
    function queryTableStruct(tableName: string) {
        let tabKey = '' + new Date().getTime()
        setActiveKey(tabKey)
        setTabs([
            ...tabs,
            {
                title: tableName + ' - Table',
                key: tabKey,
                type: 'tableDetail',
                // defaultSql: `SELECT * FROM \`${dbName}\`.\`${tableName}\` LIMIT 20;`,
                data: {
                    dbName,
                    tableName,
                },
            }
        ])
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
                closeIcon={
                    <IconButton
                        size="small"
                    >
                        <CloseOutlined style={{ color: '#999' }} />
                    </IconButton>
                }
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

    
    console.log('tabs', tabs)

    async function showCreateTable(nodeData) {
        const tableName = nodeData.key // TODO @p2
        const sql = `show create table \`${tableName}\`;`
        // setSql(sql)
        showSqlInNewtab({
            title: 'Show create table',
            sql,
        })
    }

    async function truncate(nodeData) {
        // console.log('nodeData', nodeData)
        const tableName = nodeData.key // TODO @p2
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

    
    return (
        <div className={styles.layout}>
            <div className={styles.layoutLeft}>
                <div className={styles.header}>
                    {/* Header */}
                    <Input
                        value={keyword}
                        onChange={e => {
                            console.log('change', refreshByKeyword)
                            const kw = e.target.value
                            setKeyword(kw)
                            // setFilterKeyword(kw)
                            refreshByKeyword(kw)
                            // debounce(() => {
                            //     console.log('set')
                            // }, 150, {
                            //     'maxWait': 1000
                            // })
                        }}
                        allowClear
                        placeholder="Search..."
                    />

                    <Tooltip title={t('refresh')} mouseEnterDelay={1}>
                        <IconButton
                            className={styles.refresh}
                            onClick={() => {
                                loadData()
                            }}
                        >
                            <ReloadOutlined />
                        </IconButton>
                        {/* <Button 
                            className={styles.refresh}
                            type="link"
                            onClick={() => {
                                loadData()
                            }}
                            icon={
                                <ReloadOutlined />
                            }
                        /> */}
                    </Tooltip>
                </div>
                <div className={styles.body}>
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
                                    <Dropdown
                                        overlay={(
                                            <Menu>
                                                <Menu.Item
                                                    onClick={(e) => {
                                                        // e.stopPropagation()
                                                        // e.preventDefault()
                                                        queryTableStruct(nodeData.key)
                                                    }}
                                                >查看结构</Menu.Item>
                                                <Menu.Item
                                                    onClick={(e) => {
                                                        // e.stopPropagation()
                                                        // e.preventDefault()
                                                        showCreateTable(nodeData)
                                                    }}
                                                >导出建表语句</Menu.Item>
                                                <Menu.Item
                                                    onClick={() => {
                                                        truncate(nodeData)
                                                    }}
                                                >清空表</Menu.Item>
                                                <Menu.Item
                                                    onClick={() => {
                                                        drop(nodeData)
                                                    }}
                                                >删除表</Menu.Item>
                                            </Menu>
                                            // <Menu
                                            //     items={[
                                            //     {
                                            //         label: '1st menu item',
                                            //         key: '1',
                                            //     },
                                            //     {
                                            //         label: '2nd menu item',
                                            //         key: '2',
                                            //     },
                                            //     {
                                            //         label: '3rd menu item',
                                            //         key: '3',
                                            //     },
                                            //     ]}
                                            // />
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
                                        <div className={styles.treeTitle}
                                            onDoubleClick={() => {
                                                console.log('onDoubleClick')
                                                // queryTable(nodeData.key)
                                                if (timerRef.current) {
                                                    clearTimeout(timerRef.current)
                                                }
                                                console.log('双击')
                                                queryTableStruct(nodeData.key)
                                            }}
                                            onClick={() => {
                                                console.log('onClick')
                                                //先清除一次
                                                if (timerRef.current) {
                                                    clearTimeout(timerRef.current)
                                                }
                                                timerRef.current = window.setTimeout(() => {
                                                    console.log('单机')
                                                    queryTable(nodeData.key)
                                                }, 250)
                                            }}
                                        >
                                            <div className={styles.label}>
                                                {nodeData.key == 'root' ?
                                                    <DatabaseOutlined className={styles.icon} />
                                                :
                                                    <TableOutlined className={styles.icon} />
                                                }
                                                {nodeData.title}
                                            </div>
                                            {nodeData.key != 'root' &&
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
                                    </Dropdown>
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
                        tabBarExtraContent={{
                            right: (
                                <Space>
                                    {/* 关闭所有 */}
                                    <Button size="small"
                                        onClick={() => {
                                            // console.log('tabs', tabs)
                                            setTabs(tabs.filter(item => item.closable === false))
                                            setActiveKey(first_key)
                                        }}
                                    >{t('close_all')}</Button>
                                    <Button size="small"
                                        onClick={() => {
                                            // console.log('tabs', tabs)
                                            setTabs(tabs.filter(item => item.closable === false || item.key == activeKey))
                                            // setActiveKey(first_key)
                                        }}
                                    >
                                        {/* {t('close_all')} */}
                                        Close Other
                                    </Button>
                                    <Button size="small"
                                        onClick={() => {
                                            console.log('tabs', tabs)
                                            const history_tab = {
                                                type: 'history',
                                                title: t('history'),
                                                key: 'history',
                                                // closable: false,
                                            }
                                            setTabs([
                                                ...tabs,
                                                history_tab,
                                            ])
                                            setActiveKey('history')
                                        }}
                                    >{t('history')}</Button>
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
                                {item.type == 'history' ?
                                    <HistoryList config={config} />
                                : item.type == 'tableDetail' ?
                                    <TableDetail
                                        config={config}
                                        dbName={dbName}
                                        tableName={item.data?.tableName}
                                    />
                                :
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
