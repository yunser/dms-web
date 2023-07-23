import { Button, Descriptions, Dropdown, Input, InputProps, Menu, message, Modal, Popover, Space, Table, Tabs, Tooltip, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './function-list.module.less';
import _, { debounce } from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { Editor } from '@/views/db-manager/editor/Editor';
import { IconButton } from '@/views/db-manager/icon-button';
import { DatabaseOutlined, DownOutlined, ExportOutlined, FormatPainterOutlined, PlusOutlined, ReloadOutlined, TableOutlined, UnorderedListOutlined } from '@ant-design/icons';
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


export function FunctionList({ config, onJson, connectionId, onTab, dbName, data = {} }: any) {
    const { t } = useTranslation()
    
    const [createModalVisible, setCreateModalVisible] = useState(false)
    const [sortedInfo, setSortedInfo] = useState({})
    const [loading, setLoading] = useState(false)
    const [keyword, setKeyword] = useState('')
    const [selectedRowKeys, setSelectedRowKeys] = useState([])
    
    const [list, setList] = useState([])
    const [code, setCode] = useState(`CREATE DEFINER=\`linxot\`@\`%\` FUNCTION \`get_number3\`(param varchar(50)) RETURNS varchar(30) CHARSET utf8
BEGIN
DECLARE length INT DEFAULT 0;

DECLARE temp_str varchar(50) default '';

set length=CHAR_LENGTH(param);

WHILE length > 0 DO

IF (ASCII(mid(param,length,1))>47 and ASCII(mid(param,length,1))<58 )THEN

set temp_str = concat(temp_str,mid(param,length,1));

END IF;

SET length = length - 1;

END WHILE;

RETURN REVERSE(temp_str);

END`)
    const filterList = useMemo(() => {
        if (!keyword) {
            return list
        }
        return list.filter(item => {
            return item.name.toLowerCase().includes(keyword.toLowerCase())
        })
    }, [list, keyword])

    async function loadData() {
        setLoading(true)
        setSortedInfo({})
        setSelectedRowKeys([])
        let res = await request.post(`${config.host}/mysql/execSqlSimple`, {
            connectionId,
            sql: `select * from mysql.proc where db = '${dbName}' and \`type\` = 'FUNCTION';`,
        })
        if (res.success) {
            const list = res.data
            console.log('res', list)
            setList(list)
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

    async function dropFunction(items) {
        
        const sql = items.map(item => {
            return `DROP FUNCTION \`${item.db}\`.\`${item.name}\`;`
        }).join('\n')
        showSqlInNewtab({
            title: 'DROP FUNCTION',
            sql,
        })
    }

    async function queryDetail(item) {
        let res = await request.post(`${config.host}/mysql/execSqlSimple`, {
            connectionId,
            sql: `show create function ${item.name}`,
        })
        if (res.success) {
            const sql = res.data[0]['Create Function']
            showSqlInNewtab({
            title: item.name,
            sql,
        })
        }
    }

    const columns = [
        {
            title: t('name'),
            dataIndex: 'name',
            key: 'name',
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
                                queryDetail(item)
                            }}
                        >
                            {t('view')}
                        </Button>
                        <Dropdown
                            overlay={
                                <Menu
                                    items={[
                                        {
                                            key: 'drop',
                                            danger: true,
                                            label: t('delete'),
                                        },
                                    ]}
                                    onClick={({ _item, key, keyPath, domEvent }) => {
                                        if (key == 'drop') {
                                            dropFunction([item])
                                        }
                                        else if (key == 'truncate') {
                                            // truncateTable([item])
                                        }
                                        else if (key == 'partInfo') {
                                            // partInfo(item)
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

    async function createFunction() {
        let res = await request.post(`${config.host}/mysql/execSqlSimple`, {
            connectionId,
            sql: code,
        })
        if (res.success) {
            setCode('')
            setCreateModalVisible(false)
            loadData()
        }
    }

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
                        tooltip={t('add')}
                        onClick={() => {
                            setCreateModalVisible(true)
                        }}
                    >
                        <PlusOutlined />
                    </IconButton>
                    <IconButton
                        tooltip={t('export_json')}
                        onClick={() => {
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
                                dropFunction(items)
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
            <Table
                loading={loading}
                dataSource={filterList}
                pagination={false}
                size="small"
                rowKey="TABLE_NAME"
                columns={columns}
                bordered
                onChange={(pagination, filters, sorter) => {
                    console.log('Various parameters', pagination, filters, sorter);
                    console.log('sorter', sorter)
                    setSortedInfo(sorter)
                }}
                scroll={{
                    x: 1500,
                    y: document.body.clientHeight - 40 - 40 -16 - 32 - 40 - 16 - 12,
                }}
            />
            {createModalVisible &&
                <Modal
                    open={true}
                    title={t('sql.function.create')}
                    width={800}
                    onCancel={() => {
                        setCreateModalVisible(false)
                    }}
                    onOk={createFunction}
                >
                    <Input.TextArea
                        value={code}
                        rows={12}
                        placeholder={t('sql.function.create_sql')}
                        onChange={e => {
                            setCode(e.target.value)
                        }}
                    >
                    </Input.TextArea>
                </Modal>
            }
        </div>
    )
}
