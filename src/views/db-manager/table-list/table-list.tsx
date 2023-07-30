import { Button, Descriptions, Dropdown, Input, InputProps, Menu, message, Modal, Popover, Space, Table, Tabs, Tooltip, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './table-list.module.less';
import _, { debounce } from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { Editor } from '@/views/db-manager/editor/Editor';
import { IconButton } from '@/views/db-manager/icon-button';
import { DatabaseOutlined, DownOutlined, ExportOutlined, FormatPainterOutlined, ReloadOutlined, TableOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { suggestionAdd } from '../suggestion';
import { SorterResult } from 'antd/lib/table/interface';
import { useEventEmitter } from 'ahooks';
import { request } from '@/views/db-manager/utils/http';;
import filesize from 'file-size'

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


export function TableList({ config, onJson, connectionId, onTab, dbName, data = {} }: any) {
    // console.warn('SqlTree/render')
    
    const { defaultJson = '' } = data
    const { t } = useTranslation()
    const event$ = useEventEmitter()
    
    const [sortedInfo, setSortedInfo] = useState({});
    const [loading, setLoading] = useState(false)
    const [keyword, setKeyword] = useState('')
    // const [filterKeyword] = useState('')
    // const refreshByKeyword = 
    const [selectedRowKeys, setSelectedRowKeys] = useState([])
    
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
    const filterList = useMemo(() => {
        if (!keyword) {
            return list
        }
        return list.filter(item => {
            return item.TABLE_NAME.toLowerCase().includes(keyword.toLowerCase())
        })
    }, [list, keyword])
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
        setSortedInfo({})
        setSelectedRowKeys([])
        let res = await request.post(`${config.host}/mysql/tables`, {
            dbName,
            connectionId,
        })
        if (res.success) {
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

    async function truncateTable(items) {
        const sql = items.map(item => {
            return `TRUNCATE TABLE \`${item.TABLE_SCHEMA}\`.\`${item.TABLE_NAME}\`;`
        }).join('\n')
        console.log('truncate', sql)
        showSqlInNewtab({
            title: 'TRUNCATE TABLE',
            sql,
        })
    }

    async function dropTable(items) {
        
        const sql = items.map(item => {
            return `DROP TABLE \`${item.TABLE_SCHEMA}\`.\`${item.TABLE_NAME}\`;`
        }).join('\n')
        showSqlInNewtab({
            title: 'DROP TABLE',
            sql,
        })
    }

    async function partInfo(item) {
        showSqlInNewtab({
            title: item.TABLE_NAME,
            sql: `SELECT PARTITION_NAME,TABLE_ROWS,PARTITION_EXPRESSION,PARTITION_DESCRIPTION 
FROM INFORMATION_SCHEMA.PARTITIONS 
WHERE TABLE_SCHEMA='${item.TABLE_SCHEMA}' AND TABLE_NAME = '${item.TABLE_NAME}'
ORDER BY TABLE_ROWS DESC`
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
            title: t('name'),
            dataIndex: 'TABLE_NAME',
            key: 'TABLE_NAME',
            sorter: (a, b) => a.TABLE_NAME.localeCompare(b.TABLE_ROWS),
            sortOrder: sortedInfo.columnKey === 'TABLE_NAME' ? sortedInfo.order : null,
            // sortDirections: ['descend', 'ascend'],
            width: 240,
            ellipsis: true,
            fixed: 'left',
            render(value) {
                return (
                    <div className={styles.cell}>{value}</div>
                )
            }
        },
        {
            title: t('nginx'),
            dataIndex: 'ENGINE',
            width: 80,
            ellipsis: true,
        },
        {
            title: t('rows'),
            dataIndex: 'TABLE_ROWS',
            key: 'TABLE_ROWS',
            width: 110,
            ellipsis: true,
            sorter: (a, b) => a.TABLE_ROWS - b.TABLE_ROWS,
            sortOrder: sortedInfo.columnKey === 'TABLE_ROWS' ? sortedInfo.order : null,
            sortDirections: ['descend', 'ascend'],
        },
        {
            title: t('data_length'),
            dataIndex: 'DATA_LENGTH',
            key: 'DATA_LENGTH',
            width: 120,
            ellipsis: true,
            sorter: (a, b) => a.DATA_LENGTH - b.DATA_LENGTH,
            sortOrder: sortedInfo.columnKey === 'DATA_LENGTH' ? sortedInfo.order : null,
            sortDirections: ['descend', 'ascend'],
            render(value) {
                return filesize(parseFloat(value), { fixed: 1, }).human()
                // return (
                //     <div>{filesize(value, { fixed: 1, }).human()}</div>
                // )
            },
        },
        {
            title: t('index_length'),
            dataIndex: 'INDEX_LENGTH',
            key: 'INDEX_LENGTH',
            width: 120,
            ellipsis: true,
            sorter: (a, b) => a.INDEX_LENGTH - b.INDEX_LENGTH,
            sortOrder: sortedInfo.columnKey === 'INDEX_LENGTH' ? sortedInfo.order : null,
            sortDirections: ['descend', 'ascend'],
            render(value) {
                return (
                    <div>{filesize(parseFloat(value), { fixed: 1, }).human()}</div>
                )
            },
        },
        {
            title: t('data_free'),
            dataIndex: 'DATA_FREE',
            key: 'DATA_FREE',
            width: 120,
            ellipsis: true,
            sorter: (a, b) => a.DATA_FREE - b.DATA_FREE,
            sortOrder: sortedInfo.columnKey === 'DATA_FREE' ? sortedInfo.order : null,
            sortDirections: ['descend', 'ascend'],
            render(value) {
                return (
                    <div>{filesize(parseFloat(value), { fixed: 1, }).human()}</div>
                )
            },
        },
        {
            title: t('collation'),
            dataIndex: 'TABLE_COLLATION',
            width: 170,
            ellipsis: true,
        },
        {
            title: t('comment'),
            dataIndex: 'TABLE_COMMENT',
            width: 320,
            ellipsis: true,
        },
        {
            title: '',
            dataIndex: '_empty',
        },
        {
            title: t('actions'),
            dataIndex: 'op',
            fixed: 'right',
            width: 200,
            render(_value, item) {
                return (
                    <Space>
                        <Button
                            type="link"
                            size="small"
                            onClick={() => {
                                queryTableStruct(item.TABLE_NAME)
                            }}
                        >
                            {t('edit')}
                        </Button>
                        <Button
                            type="link"
                            size="small"
                            onClick={() => {
                                showSqlInNewtab({
                                    title: item.TABLE_NAME,
                                    sql: `SELECT * FROM \`${item.TABLE_SCHEMA}\`.\`${item.TABLE_NAME}\`
LIMIT 20`,
                                })
                            }}
                        >
                            {t('query')}
                        </Button>
                        <Dropdown
                            overlay={
                                <Menu
                                    items={[
                                        {
                                            key: 'partInfo',
                                            label: t('partition_info'),
                                        },
                                        {
                                            key: 'truncate',
                                            label: t('table_truncate'),
                                        },
                                        {
                                            key: 'drop',
                                            danger: true,
                                            label: t('delete'),
                                        },
                                    ]}
                                    onClick={({ _item, key, keyPath, domEvent }) => {
                                        if (key == 'drop') {
                                            dropTable([item])
                                        }
                                        else if (key == 'truncate') {
                                            truncateTable([item])
                                        }
                                        else if (key == 'partInfo') {
                                            partInfo(item)
                                        }
                                    }}
                                />
                            }
                        >
                            <Button
                                type="link"
                                size="small"
                            >
                                {t('more')}
                                <DownOutlined />
                            </Button>
                        </Dropdown>
                    </Space>
                )
            }
        },
    ]

    event$.useSubscription(val => {
        console.log('onmessage2', val)
        // console.log(val);
    })

    return (
        <div className={styles.tablesBox}>
            <div className={styles.header}>
                <Space>
                    <IconButton
                        tooltip={t('refresh')}
                        onClick={() => {
                            loadData()
                        }}
                    >
                        <ReloadOutlined />
                    </IconButton>
                    <IconButton
                        tooltip={t('export_json')}
                        onClick={() => {
                            // event$.emit('hello')
                            // event$.emit({
                            //     type: 'open_json',
                            //     data: '123',
                            // })
                            onJson && onJson(JSON.stringify(list, null, 4))
                        }}
                    >
                        <ExportOutlined />
                    </IconButton>
                    <DebounceInput
                        value={keyword}
                        onChange={value => {
                            setKeyword(value)
                        }}
                        allowClear
                        placeholder={t('search') + '...'}
                    />
                    {/* <Button
                        // type="link"
                        size="small"
                        onClick={() => {
                            onJson && onJson(JSON.stringify(list, null, 4))
                        }}
                    >
                        导出 JSON
                    </Button> */}
                </Space>
                {selectedRowKeys.length > 0 &&
                    <Space>
                        <Button
                            size="small"
                            danger
                            onClick={() => {
                                const tableNames = selectedRowKeys
                                const items = tableNames.map(tableName => {
                                    return list.find(item => item.TABLE_NAME == tableName)
                                })
                                dropTable(items)
                            }}
                        >{t('delete')}</Button>
                        <Button
                            size="small"
                            danger
                            onClick={() => {
                                const tableNames = selectedRowKeys
                                const items = tableNames.map(tableName => {
                                    return list.find(item => item.TABLE_NAME == tableName)
                                })
                                truncateTable(items)
                            }}
                        >{t('truncate')}</Button>

                    </Space>
                }
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
                dataSource={filterList}
                pagination={false}
                size="small"
                rowKey="TABLE_NAME"
                columns={columns}
                bordered
                rowSelection={{
                    selectedRowKeys,
                    onChange(selectedRowKeys, selectedRows, info) {
                        setSelectedRowKeys(selectedRowKeys)
                    },
                }}
                onChange={(pagination, filters, sorter) => {
                    console.log('Various parameters', pagination, filters, sorter);
                    // setFilteredInfo(filters);
                    console.log('sorter', sorter)
                    setSortedInfo(sorter)
                }}
                scroll={{
                    // x: true,
                    x: 1500,
                    y: document.body.clientHeight - 40 - 40 -16 - 32 - 40 - 16 - 12,
                }}
            />
            {/* <Card bordered={false}>
                <div className={styles.tableList}>
                </div>
            </Card> */}
        </div>
    )
}
