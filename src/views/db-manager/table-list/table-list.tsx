import { Button, Descriptions, Dropdown, Input, InputProps, Menu, message, Modal, Popover, Space, Table, Tabs, Tooltip, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './table-list.module.less';
import _, { debounce } from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { Editor } from '../editor/Editor';
import { IconButton } from '../icon-button';
import { DatabaseOutlined, FormatPainterOutlined, ReloadOutlined, TableOutlined, UnorderedListOutlined } from '@ant-design/icons';
import axios from 'axios';
import { suggestionAdd } from '../suggestion';

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

function TreeTitle({ keyword, nodeData, onAction, onClick, onDoubleClick }: any) {
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
                // queryTableStruct(nodeData.key)
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
                {nodeData.key == 'root' ?
                    <DatabaseOutlined className={styles.icon} />
                :
                    <TableOutlined className={styles.icon} />
                }
                {!!keyword ?
                    getHightlight(nodeData.title, keyword)
                :
                    nodeData.title
                }
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
    )

    let content = _content
    if (isHover) {
        content = (
            <Dropdown
                overlay={(
                    <Menu
                        items={[
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
                        ]}
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


export function TableList({ config, onTab, dbName, data = {} }: any) {
    console.warn('SqlTree/render')
    
    const { defaultJson = '' } = data
    const { t } = useTranslation()

    const [loading, setLoading] = useState(false)
    const [keyword, setKeyword] = useState('')
    // const [filterKeyword] = useState('')
    // const refreshByKeyword = 
    
    const [list, setList] = useState([])
    
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
        if (!keyword) {
            return treeData
        }
        return [
            {
                ...treeData[0],
                children: treeData[0].children.filter(item => {
                    return item.title.toLowerCase().includes(keyword.toLowerCase())
                })
            }
        ]
    }, [treeData, keyword])
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
        } else {
            message.error('连接失败')
        }
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
            title: 'TABLE_NAME',
            dataIndex: 'TABLE_NAME',
        },
        {
            title: 'TABLE_COMMENT',
            dataIndex: 'TABLE_COMMENT',
        },
        {
            title: 'ENGINE',
            dataIndex: 'ENGINE',
        },
        {
            title: 'TABLE_ROWS',
            dataIndex: 'TABLE_ROWS',
        },
        {
            title: 'DATA_LENGTH',
            dataIndex: 'DATA_LENGTH',
        },
        {
            title: 'INDEX_LENGTH',
            dataIndex: 'INDEX_LENGTH',
        },
        {
            title: 'DATA_FREE',
            dataIndex: 'DATA_FREE',
        },
        {
            title: 'TABLE_COLLATION',
            dataIndex: 'TABLE_COLLATION',
        },
    ]

    return (
        <div className={styles.tablesBox}>
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
                dataSource={list}
                pagination={false}
                size="small"
                rowKey="TABLE_NAME"
                columns={columns}
                bordered
            />
            {/* <Card bordered={false}>
                <div className={styles.tableList}>
                </div>
            </Card> */}
        </div>
    )
}
