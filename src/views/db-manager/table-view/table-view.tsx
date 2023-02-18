import { Button, Checkbox, Descriptions, Form, Input, message, Modal, Select, Space, Table, Tabs } from 'antd';
import React, { useMemo } from 'react';
import { VFC, useRef, useState, useEffect } from 'react';
import { request } from '@/views/db-manager/utils/http';;
import styles from './table-view.module.less';
import _ from 'lodash';
import { ExecModal } from '../exec-modal/exec-modal';
import { uid } from 'uid';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@/views/db-manager/icon-button';
import { KeyOutlined, ReloadOutlined } from '@ant-design/icons';
import filesize from 'file-size';
import { CodeDebuger } from '../code-debug';
import moment from 'moment';
import { dbFunConfigMap } from '../utils/database';
const { TabPane } = Tabs

function hasValue(value) {
    return !!value || value === 0
}

function getCode(columns) {
    const colCode = columns.map(col => {
        return `21212`
    }).join('\n')
    return `
const Billing = app.model.define('billing', {
    id: {
        type: BIGINT,
        primaryKey: true,
        autoIncrement: true,
        field: 'id_'
    },
    deviceId: {
        type: BIGINT,
        field: 'device_id'
    },
    cycleEndTime: {
        type: DATE,
        field: 'cycle_end_time'
    },
}, {
    freezeTableName: true,
    tableName: 'biz_device_billing',
    timestamps: false
})    
`
}


function parseColumns(item) {
    const { sql } = item
    if (!sql) {
        return []
    }
    const m = sql.match(/\(([\d\D]+)\)/)
    if (!m) {
        return []
    }
    const cols = m[1].split(',')
        .map(item => item.replace(/\s/g, ''))
        .map(item => item.substring(1, item.length - 1))
    return cols

}
const idxTest = [
    {
        "type": "index",
        "name": "sqlite_autoindex_redis_history_1",
        "tbl_name": "redis_history",
        "rootpage": 5,
        "sql": null
    },
    {
        "type": "index",
        "name": "idx_db",
        "tbl_name": "redis_history",
        "rootpage": 6,
        "sql": "CREATE INDEX \"idx_db\"\nON \"redis_history\" (\n  \"db\"\n)"
    },
    {
        "type": "index",
        "name": "idx_db_time",
        "tbl_name": "redis_history",
        "rootpage": 7,
        "sql": "CREATE INDEX \"idx_db_time\"\nON \"redis_history\" (\n  \"db\",\n  \"create_time\"\n)"
    }
]

// parseColumns(idxTest[1])
// parseColumns(idxTest[2])

function ColumnSelector({ value: _value, onChange, options }) {
    const { t } = useTranslation()
    const [modalVisible, setModalVisible] = useState(false)
    const [value, setValue] = useState([])
    // const [columns] = useState
    const columns = [
        {
            title: t('index_column'),
            dataIndex: 'label',
        },
        {
            title: t('position'),
            dataIndex: 'position',
            render(_value, item) {
                const idx = value.findIndex(v => v == item.value)
                // if (idx)
                return (
                    <div className={styles.ColumnSelectorCheck}>
                        <Checkbox
                            className={styles.checkbox}
                            checked={idx != -1}
                            onClick={() => {
                                let newValue
                                if (value.includes(item.value)) {
                                    newValue = value.filter(v => v != item.value)
                                }
                                else {
                                    newValue = [
                                        ...value,
                                        item.value
                                    ]
                                }
                                setValue(newValue)
                            }}
                        />
                        <div className={styles.index}>{idx == -1 ? '' : (idx + 1)}</div>
                    </div>
                )
            }
        },
    ]
    
    
    useEffect(() => {
        setValue([..._value])
    }, [_value, modalVisible])
    return (
        <>
            <div className={styles.ColumnSelector}
                onClick={() => {
                    setModalVisible(true)
                }}
            >
                {_value.join(', ')}
            </div>
            <Modal
                open={modalVisible}
                title={t('column_select')}
                onCancel={() => {
                    setModalVisible(false)
                }}
                // footer={null}
                onOk={() => {
                    setModalVisible(false)
                    onChange && onChange(value)
                }}
            >
                <div className={styles.ColumnSelectorModal}
                    onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                    }}
                >
                    <Table
                        dataSource={options}
                        columns={columns}
                        size="small"
                        bordered
                        pagination={false}
                        scroll={{
                            y: 480,
                        }}
                        // rowSelection={{
                        //     selectedRowKeys: value,
                        //     onChange(selectedRowKeys) {
                        //         onChange && onChange(selectedRowKeys)
                        //     }
                        // }}
                        rowKey="value"
                    />
                </div>
            </Modal>
        </>
    )
}


function Cell({ value, selectOptions, index, dataIndex, onChange }) {
    // const inputRef = useRef(null)
    const id = useMemo(() => {
        return uid(32)
    }, [])

    if (!value) {
        return <div>?</div>
    }
    const [isEdit, setIsEdit] = useState(false)
    const [inputValue, setInputValue] = useState(value.value)
    useEffect(() => {

        setInputValue(value.value)
    }, [value.value])
    
    
    
    return (
        <div
            className={styles.cell}
            onClick={(e) => {
                e.stopPropagation()
            }}
        >
            
            {isEdit ?
                // <SimpleInput
                <SimpleInput
                    inputId={id}
                    // ref={inputRef}
                    value={inputValue}
                    onChange={e => {
                        setInputValue(e.target.value)
                    }}
                    onBlur={() => {
                        console.log('onBlur')
                        // console.log('change', index, dataIndex, inputValue)
                        onChange && onChange({
                            ...value,
                            newValue: inputValue,
                        })
                        setIsEdit(false)    
                    }}
                />
            :
                <>
                    {dataIndex == 'IS_NULLABLE' ?
                        <div>
                            <Checkbox
                                checked={inputValue == 'YES'}
                                onChange={(e) => {
                                    console.log('check', e.target.checked)
                                    const newValue = e.target.checked ? 'YES' : 'NO'
                                    setInputValue(newValue)
                                    onChange && onChange({
                                        ...value,
                                        newValue,
                                    })

                                }}
                            />
                        </div>
                    : dataIndex == 'EXTRA' ?
                        <div>
                            <Checkbox
                                checked={inputValue == 'auto_increment'}
                                onChange={(e) => {
                                    console.log('check', e.target.checked)
                                    const newValue = e.target.checked ? 'auto_increment' : 'no_increment'
                                    setInputValue(newValue)
                                    onChange && onChange({
                                        ...value,
                                        newValue,
                                    })

                                }}
                            />
                        </div>
                    : dataIndex == 'COLUMN_KEY' ?
                        <div>
                            <Checkbox
                                checked={inputValue == 'PRI'}
                                onChange={(e) => {
                                    console.log('check', e.target.checked)
                                    const newValue = e.target.checked ? 'PRI' : ''
                                    setInputValue(newValue)
                                    // onChange && onChange({
                                    //     ...value,
                                    //     newValue,
                                    // })

                                }}
                            />
                        </div>
                    : dataIndex == 'type2' ?
                        <div>
                            {/* {inputValue} */}
                            <Select
                                size="small"
                                // key={value}
                                value={inputValue}
                                onChange={v => {
                                    console.log('Select.value', v)
                                    const newValue = v
                                    setInputValue(newValue)
                                    onChange && onChange({
                                        value: value.value,
                                        newValue,
                                    })
                                }}
                                options={[
                                    {
                                        label: 'Normal',
                                        value: 'Normal',
                                    },
                                    {
                                        label: 'Unique',
                                        value: 'Unique',
                                    },
                                ]}
                                style={{
                                    width: 96,
                                }}
                            />
                        </div>
                    : dataIndex == 'columns' ?
                        <div>
                            {/* {inputValue} */}
                            <ColumnSelector
                                // size="small"
                                // mode="multiple"
                                // maxTagCount="responsive"
                                value={inputValue}
                                onChange={v => {
                                    console.log('Select.value', v)
                                    const newValue = v
                                    setInputValue(newValue)
                                    onChange && onChange({
                                        value: value.value,
                                        newValue,
                                    })
                                }}
                                options={selectOptions}
                                // style={{
                                //     width: 400,
                                // }}
                            />
                        </div>
                    :
                        <div
                            className={styles.text}
                            onClick={() => {
                                setIsEdit(true)
                                setTimeout(() => {
                                    document.getElementById(id)?.focus()
                                }, 0)
                            }}
                        >
                            {inputValue || value.value}
                            {/* （->{value.newValue}） */}
                            </div>
                    }
                </>
            }
        </div>
    )
}

function SimpleInput({ inputId, value, onChange, onBlur }) {
    return (
        <input
            id={inputId}
            className={styles.simpleInput}
            value={value}
            onChange={e => {
                onChange && onChange(e)
            }}
            // onFocus(())
            onBlur={onBlur}
        />
    )
}

function EditableCellRender({ dataIndex, onChange } = {}) {
    return (value, _item, index) => {
        return (
            <Cell
                value={value}
                dataIndex={dataIndex}
                index={index}
                onChange={value => {
                    onChange && onChange({
                        index,
                        dataIndex,
                        value,
                    })
                }}
            />
        )
    }
}

export function TableViewer({ config, databaseType = 'mysql', connectionId, event$, dbName, tableName: oldTableName }) {

    const { t } = useTranslation()
    const [tableName,setTableName] = useState(oldTableName)
    const [editType,setEditType] = useState(oldTableName ? 'update' : 'create')
    // const editType = 
    const newNameRef = useRef(null)
    
    const [columnKeyword, setColumnKeyword] = useState('')
    const [tableColumns, setTableColumns] = useState([])

    const filteredTableColumns = useMemo(() => {
        if (!columnKeyword) {
            return tableColumns
        }
        return tableColumns.filter(item => {
            return (item.COLUMN_NAME.newValue || item.COLUMN_NAME.value || '').toLowerCase().includes(columnKeyword.toLowerCase())
        })
    }, [tableColumns, columnKeyword])

    const [loading, setLoading] = useState(false)
    const [indexes, setIndexes] = useState([])
    const [removedRows, setRemovedRows] = useState([])
    const [removedIndexes, setRemovedIndexes] = useState([])
    const [partitions, setPartitions] = useState([])
    const [triggers, setTriggers] = useState([])
    const [tableInfo, setTableInfo] = useState({})
    const [execSql, setExecSql] = useState('')
    const [curTab, setCurTab] = useState('basic')
    const [form] = Form.useForm()
    const [nginxs, setNginxs] = useState([])

    const [characterSets, setCharacterSets] = useState([])
    const [characterSetMap, setCharacterSetMap] = useState({})
    const characterSet = Form.useWatch('characterSet', form)
    const _old_characterSet_ref = useRef(null)
    const collations = useMemo(() => {
        if (!characterSet) {
            return []
        }
        if (!characterSetMap[characterSet]) {
            return []
        }
        return characterSetMap[characterSet].map(item => {
            return {
                label: item,
                value: item,
            }
        })
    }, [characterSet, characterSetMap])

    async function emitRefresh() {
        if (execSql.toLowerCase().includes('rename to') || execSql.toLowerCase().includes('create table')) {
            event$.emit({
                type: 'ev_refresh_table',
                data: {
                    connectionId,
                    schemaName: dbName,
                }
            })
        }
    }

    async function debug() {
        event$.emit({
            type: 'ev_refresh_table',
            data: {
                connectionId,
                schemaName: dbName,
            }
        })
    }

    function initForm(charData = []) {
        const characterSetMap: any = {}
        const characterSets = []
        for (let item of charData) {
            if (!characterSetMap[item.CHARACTER_SET_NAME]) {
                characterSetMap[item.CHARACTER_SET_NAME] = []
                characterSets.push({
                    label: item.CHARACTER_SET_NAME,
                    value: item.CHARACTER_SET_NAME
                })
            }
            characterSetMap[item.CHARACTER_SET_NAME].push(item.COLLATION_NAME)
        }
        console.log('set', characterSetMap)
        characterSets.sort((a, b) => a.label.localeCompare(b.label))
        setCharacterSets(characterSets)
        setCharacterSetMap(characterSetMap)
        // CHARACTER_SET_NAME: "ucs2"
        // COLLATION_NAME: "ucs2_esperanto_ci"
        let tableColl = charData.find(item => item.COLLATION_NAME == tableInfo.TABLE_COLLATION)
        console.log('tableColl', tableColl)
        let values = {
            characterSet: null,
            collation: null,
        }
        if (tableColl) {
            _old_characterSet_ref.current = tableColl.CHARACTER_SET_NAME
            values = {
                characterSet: tableColl.CHARACTER_SET_NAME,
                collation: tableColl.COLLATION_NAME,
            }
        }
        form.setFieldsValue({
            ...tableInfo,
            ...values,
        })
    }

    async function loadCharData() {
        let res = await request.post(`${config.host}/mysql/execSqlSimple`, {
            connectionId,
            sql: `SELECT *
    FROM \`information_schema\`.\`COLLATION_CHARACTER_SET_APPLICABILITY\``,
        })
        if (res.success) {
            const charData = res.data
            initForm(charData)
        }
    }
    // tableInfo

    useEffect(() => {
        if (editType == 'update' && !tableInfo.TABLE_NAME) {
            return
        }
        if (databaseType == 'mysql') {
            loadCharData()
        }
        else {
            initForm([])
        }
    }, [tableInfo])


    async function loadNginx() {
        let res = await request.post(`${config.host}/mysql/execSqlSimple`, {
            connectionId,
            sql: `SELECT *
    FROM \`information_schema\`.\`ENGINES\``,
        })
        if (res.success) {
            console.log('res.data', res.data)
            const nginxs = res.data
                .filter(item => item.SUPPORT != 'NO')
                .map(item => {
                    return {
                        label: item.ENGINE,
                        value: item.ENGINE,
                    }
                })
            setNginxs(nginxs)

            // const characterSetMap = {}
            // const characterSets = []
            // for (let item of res.data) {
            //     if (!characterSetMap[item.CHARACTER_SET_NAME]) {
            //         characterSetMap[item.CHARACTER_SET_NAME] = []
            //         characterSets.push({
            //             label: item.CHARACTER_SET_NAME,
            //             value: item.CHARACTER_SET_NAME
            //         })
            //     }
            //     characterSetMap[item.CHARACTER_SET_NAME].push(item.COLLATION_NAME)
            // }
            // console.log('set', characterSetMap)
            // characterSets.sort((a, b) => a.label.localeCompare(b.label))
            // setCharacterSets(characterSets)
            // setCharacterSetMap(characterSetMap)
            // CHARACTER_SET_NAME: "ucs2"
            // COLLATION_NAME: "ucs2_esperanto_ci"
        }
    }

    useEffect(() => {
        if (databaseType == 'mysql') {
            loadNginx()
        }
    }, [])



    // async function submitChange() {
    //     let sql = `ALTER TABLE \`${tableName}\``
        
        
    //     sql += '\n' + rowSqls.join(' ,\n')
    //     console.log('sql', sql)
    //     setExecSql(sql)
    // }

    const triggerColumns = [
        {
            title: t('name'),
            dataIndex: 'TRIGGER_NAME',
            width: 160,
            ellipsis: true,
        },
        {
            title: t('type'),
            dataIndex: 'EVENT_MANIPULATION',
            width: 160,
            ellipsis: true,
        },
        {
            title: t('statement'),
            dataIndex: 'ACTION_STATEMENT',
            // width: 200,
            ellipsis: true,
        },
        // {
        //     title: '',
        //     dataIndex: '__empty',
        // },
    ]

    const partitionColumns = [
        {
            title: t('name'),
            dataIndex: 'PARTITION_NAME',
            width: 160,
            ellipsis: true,
        },
        {
            title: t('expression'),
            dataIndex: 'PARTITION_EXPRESSION',
            width: 200,
            ellipsis: true,
        },
        {
            title: t('rows'),
            dataIndex: 'TABLE_ROWS',
            width: 110,
            ellipsis: true,
        },
        {
            title: t('data_length'),
            dataIndex: 'DATA_LENGTH',
            width: 120,
            ellipsis: true,
            render(value) {
                return filesize(value, { fixed: 1, }).human()
                // return (
                //     <div>{filesize(value, { fixed: 1, }).human()}</div>
                // )
            },
        },
        {
            title: t('description'),
            dataIndex: 'PARTITION_DESCRIPTION',
            width: 240,
            ellipsis: true,
        },
        {
            title: t('actions'),
            dataIndex: 'actions',
            // fixed: 'right',
            width: 320,
            render(value, item) {
                return (
                    <Space>
                        <Button
                            type="link"
                            size="small"
                            onClick={() => {
                                event$.emit({
                                    type: 'event_open_sql',
                                    data: {
                                        connectionId,
                                        sql: `ALTER TABLE \`${item.TABLE_SCHEMA}\`.\`${item.TABLE_NAME}\` TRUNCATE PARTITION ${item.PARTITION_NAME}`,
                                    }
                                })
                            }}
                        >{t('truncate')}</Button>
                        <Button
                            type="link"
                            size="small"
                            onClick={() => {
                                event$.emit({
                                    type: 'event_open_sql',
                                    data: {
                                        connectionId,
                                        sql: `ALTER TABLE \`${item.TABLE_SCHEMA}\`.\`${item.TABLE_NAME}\` DROP PARTITION ${item.PARTITION_NAME}`,
                                    }
                                })
                            }}
                        >{t('drop')}</Button>
                    </Space>
                )
            }
        },
        {
            title: '',
            dataIndex: '_empty',
        },
    ]

    function onColumnCellChange({ index, dataIndex, value,}) {
        console.log('onColumnCellChange', index, dataIndex, value)
        tableColumns[index][dataIndex] = value
        setTableColumns([...tableColumns])
    }

    function onIndexCellChange({ index, dataIndex, value,}) {
        console.log('onColumnCellChange', index, dataIndex, value)
        indexes[index][dataIndex] = value
        setIndexes([...indexes])
    }

    

    const columnColumns = [
        {
            title: t('column_name'),
            dataIndex: 'COLUMN_NAME',
            render(value, item) {
                return (
                    <Space>
                        <div>{value}</div>
                        {item.COLUMN_KEY == 'PRI' &&
                            <KeyOutlined className={styles.pk} />
                        }
                    </Space>
                )
            }
        },
        {
            title: t('type'),
            dataIndex: 'COLUMN_TYPE',
        },
        {
            // title: t('nullable'),
            title: 'Not Null',
            dataIndex: 'IS_NULLABLE',
            render(value) {
                return (
                    <div className={styles.checkBoxWrap}>
                        <Checkbox
                            checked={value == 'NO'}
                        />
                    </div>
                )
            }
        },
        {
            title: t('auto_increment'),
            dataIndex: 'EXTRA',
            render(value) {
                return (
                    <div className={styles.checkBoxWrap}>
                        <Checkbox
                            checked={value == 'auto_increment'}
                        />
                    </div>
                )
            }
        },
        {
            title: t('default'),
            dataIndex: 'COLUMN_DEFAULT',
            render(value) {
                if (value == null) {
                    return <div className={styles.null}>NULL</div>
                }
                // if (value == '') {
                //     return <div className={styles.null}>EMPTY TEXT</div>
                // }
                return (
                    <div>{value}</div>
                )
            }
        },
        {
            title: t('comment'),
            dataIndex: 'COLUMN_COMMENT',
        },
        {
            title: t('character_set'),
            dataIndex: 'CHARACTER_SET_NAME',
        },
        {
            title: t('collation'),
            dataIndex: 'COLLATION_NAME',
        },
        {
            title: '',
            dataIndex: '__empty',
        },
    ]
    const indexColumns = [
        {
            title: t('index_name'),
            dataIndex: 'name',
            width: 240,
            render(value, _item, index) {
                return (
                    <Cell
                        value={value}
                        dataIndex="name"
                        index={index}
                        onChange={value => {
                            onIndexCellChange && onIndexCellChange({
                                index,
                                dataIndex: 'name',
                                value,
                            })
                        }}
                    />
                )
            }
        },
        {
            title: t('type'),
            dataIndex: 'type2',
            width: 120,
            render(value, _item, index) {
                return (
                    <Cell
                        value={value}
                        dataIndex="type2"
                        index={index}
                        onChange={value2 => {
                            console.log('type2.change', value2)
                            onIndexCellChange && onIndexCellChange({
                                index,
                                dataIndex: 'type2',
                                value: value2,
                            })
                        }}
                    />
                )
            }
        },
        // {
        //     title: '类型',
        //     dataIndex: 'type',
        // },
        {
            title: t('index_columns'),
            dataIndex: 'columns',
            width: 400,
            render(value, _item, index) {
                return (
                    <Cell
                        value={value}
                        dataIndex="columns"
                        selectOptions={tableColumns.map(item => {
                            const value = item['COLUMN_NAME'].newValue || item['COLUMN_NAME'].value
                            return {
                                label: value,
                                value,
                            }
                        })}
                        index={index}
                        onChange={value2 => {
                            // console.log('type2.change', value2)
                            onIndexCellChange && onIndexCellChange({
                                index,
                                dataIndex: 'columns',
                                value: value2,
                            })
                        }}
                    />
                )
            }
        },
        // {
        //     title: 'COLUMN_NAME',
        //     dataIndex: 'COLUMN_NAME',
        // },
        {
            title: t('comment'),
            dataIndex: 'comment',
            width: 320,
            render: EditableCellRender({
                dataIndex: 'comment',
                onChange: onIndexCellChange,
            }),
        },
        // {
        //     title: '不唯一',
        //     dataIndex: 'NON_UNIQUE',
        // },
        {
            title: t('actions'),
            dataIndex: 'op',
            render(_value, item) {
                return (
                    <a
                        onClick={() => {
                            setIndexes(indexes.filter(_item => _item.__id != item.__id))
                            if (!item.__new) {
                                setRemovedIndexes([
                                    ...removedIndexes,
                                    item,
                                ])
                            }
                        }}
                    >删除</a>
                )
            }
        },
        {
            title: '',
            dataIndex: '__empty',
        },
        
    ]
    async function loadTableInfo() {
        console.log('loadTableInfo', dbName, tableName)
        
        setRemovedRows([])
        setRemovedIndexes([])
        if (dbName && tableName) {
            setLoading(true)
            let res = await request.post(`${config.host}/mysql/tableDetail`, {
                connectionId,
                dbName,
                tableName,
            }, {
                noMessage: true,
            })
            // console.log('loadTableInfo', res)
            if (res.success) {
                setTableColumns(res.data.columns.map(col => {
                    const newCol = {}
                    newCol.__id = uid(32)
                    for (let key in col) {
                        newCol[key] = col[key]
                    }
                    return newCol
                }))
                setTriggers(res.data.triggers)
                setPartitions(res.data.partitions
                    .filter(item => item.PARTITION_NAME)
                    .map(item => {
                        return {
                            __id: uid(32),
                            ...item,
                        }
                    }))

                // index
                let indexes = []
                if (databaseType != 'sqlite') {
                    const groupMap = _.groupBy(res.data.indexes, 'INDEX_NAME')
                    // console.log('groups2', groupMap)
                    for (let key in groupMap) {
                        const item0 = groupMap[key][0]
                        const columns = groupMap[key]
                        indexes.push({
                            __id: uid(32),
                            __INDEX_NAME: item0.INDEX_NAME,
                            name: {
                                value: item0.INDEX_NAME,
                            },
                            comment: {
                                value: item0.INDEX_COMMENT,
                            },
                            type2: {
                                value: item0.NON_UNIQUE == 1 ? 'Normal' : 'Unique',
                            },
                            type: item0.INDEX_TYPE,
                            NON_UNIQUE: item0.NON_UNIQUE,
                            columns: {
                                value: columns
                                    .sort((a, b) => {
                                        return a.SEQ_IN_INDEX - b.SEQ_IN_INDEX
                                    })
                                    .map(item => item.COLUMN_NAME)
                                    // .join(', ')
                            }
                            // {
                            //     title: 'SEQ_IN_INDEX',
                            //     dataIndex: 'SEQ_IN_INDEX',
                            // },
                            // {
                            //     title: 'COLUMN_NAME',
                            //     dataIndex: 'COLUMN_NAME',
                            // },
                        })
                    }
                    indexes = indexes.filter(item => item.__INDEX_NAME != "PRIMARY")
                    console.log('indexes', indexes)
                }
                else {
                    indexes = res.data.indexes.map(item => {
                        return {
                            __id: uid(32),
                            __INDEX_NAME: item.INDEX_NAME,
                            name: {
                                value: item.INDEX_NAME,
                            },
                            comment: {
                                value: item.INDEX_COMMENT,
                            },
                            type2: {
                                value: item.NON_UNIQUE == 1 ? 'Normal' : 'Unique',
                            },
                            type: item.INDEX_TYPE,
                            NON_UNIQUE: item.NON_UNIQUE,
                            columns: {
                                value: parseColumns(item['x-raw']),
                                // value: columns
                                //     .sort((a, b) => {
                                //         return a.SEQ_IN_INDEX - b.SEQ_IN_INDEX
                                //     })
                                //     .map(item => item.COLUMN_NAME)
                                    // .join(', ')
                            }
                            // {
                            //     title: 'SEQ_IN_INDEX',
                            //     dataIndex: 'SEQ_IN_INDEX',
                            // },
                            // {
                            //     title: 'COLUMN_NAME',
                            //     dataIndex: 'COLUMN_NAME',
                            // },
                        }
                    })
                    indexes = indexes.filter(item => item.columns && item.columns.value && item.columns.value.length)
                }

                setIndexes(indexes)
                setTableInfo(res.data.table)
            }
            setLoading(false)
        }
    }

    useEffect(() => {
        loadTableInfo()
    }, [tableName])
    
    console.log('render/indexes', indexes)

    const tabs = [
        {
            label: t('options'),
            key: 'basic',
        },
        {
            label: t('columns'),
            key: 'columns',
        },
        {
            label: t('indexes'),
            key: 'index',
        },
    ]
    if (editType == 'update') {
        // tabs.push({
        //     label: t('indexes'),
        //     key: 'index',
        // })
        console.log('databaseType', databaseType, dbFunConfigMap[databaseType])
        // if (functionMap[databaseType].partition) {
        //     tabs.push({
        //         label: t('partition'),
        //         key: 'partition',
        //     })
        // }
        // if (functionMap[databaseType].trigger) {
        //     tabs.push({
        //         label: t('triggers'),
        //         key: 'trigger',
        //     })
        // }
    }
    

	return (
        <div className={styles.detailBox}>
            {loading ?
                <div>{t('loading')}</div>
            :
                <>
                    <div className={styles.header}>
                        {/* {tableName}@{dbName} */}
                            
                            {/* <Button
                                // loading={loading}
                                size="small"
                                type="primary"
                                >
                                {t('save')}
                            </Button> */}
                            {/* <Button
                                size="small"
                                onClick={debug}
                                >
                                调试
                            </Button> */}
                            <div className={styles.tableNameBox}>
                                {tableInfo.TABLE_NAME}
                                <div className={styles.comment}>{tableInfo.TABLE_COMMENT}</div>
                            </div>
                            {editType == 'update' &&
                                <IconButton
                                    tooltip={t('refresh')}
                                    onClick={loadTableInfo}
                                >
                                    <ReloadOutlined />
                                </IconButton>
                                // <Button
                                //     size="small"
                                    
                                // >
                                //     {t('refresh')}
                                // </Button>
                            }
                            {/* <Button
                                    size="small"
                                    onClick={submitChange}
                                >
                                    提交修改
                                </Button> */}
                        {/* <Space>
                        </Space> */}
                    </div>
                    <div className={styles.body}>
                        {/* <div className={styles.bodyLeft}>
                            <Tabs
                                activeKey={curTab}
                                onChange={key => {
                                    setCurTab(key)
                                }}
                                tabPosition="left"
                                type="card"
                                items={tabs}
                            />
                        </div> */}
                        
                        <div className={styles.bodyRight}>
                            {tabs.map(item => {
                                return (
                                    <div
                                        className={styles.tabContent}
                                        key={item.key}
                                        style={{
                                            display: item.key == curTab ? undefined : 'none',
                                        }}
                                    >
                                        <div>
                                            <div className={styles.formBox}>
                                                <div className={styles.tableName}>{tableInfo.TABLE_NAME}</div>
                                                <div className={styles.bigComment}>{tableInfo.TABLE_COMMENT}</div>
                                            </div>
                                            {editType == 'update' &&
                                                <Descriptions column={1}>
                                                    {/* : null
                                                    CHECKSUM: null
                                                    CHECK_TIME: null
                                                    CREATE_OPTIONS: "row_format=DYNAMIC"
                                                    CREATE_TIME: "2022-07-28T08:20:02.000Z"
                                                    DATA_FREE: 0
                                                    INDEX_LENGTH: 0
                                                    MAX_DATA_LENGTH: 0
                                                    TABLE_CATALOG: "def"
                                                    TABLE_ROWS: 8
                                                    TABLE_SCHEMA: "linxot"
                                                    TABLE_TYPE: "BASE TABLE"
                                                    UPDATE_TIME: "2022-08-20T14:18:58.000Z"
                                                    VERSION: 10 */}
                                                </Descriptions>
                                            }
                                        </div>
                                        <div>
                                            <Table
                                                columns={columnColumns}
                                                dataSource={filteredTableColumns}
                                                bordered
                                                pagination={false}
                                                size="small"
                                                rowKey="__id"
                                            />
                                            {/* 生成的代码：
                                            <div>
                                                <code>
                                                    <pre>{getCode(filteredTableColumns)}</pre>
                                                </code>
                                            </div> */}
                                        </div>
                                        {item.key == 'index' &&
                                            <div>
                                                <div style={{
                                                    marginBottom: 8,
                                                }}>
                                                    <Space>
                                                        <Button
                                                            size="small"
                                                            onClick={() => {
                                                                indexes.push({
                                                                    __id: uid(32),
                                                                    __new: true,
                                                                    name: {
                                                                        value: '',
                                                                    },
                                                                    comment: {
                                                                        value: '',
                                                                    },
                                                                    columns: {
                                                                        value: [],
                                                                    },
                                                                    type2: {
                                                                        value: 'Normal',
                                                                    },
                                                                    type: '',
                                                                    NON_UNIQUE: '',
                                                                })
                                                                setIndexes([...indexes])
                                                            }}
                                                        >
                                                            {t('add')}
                                                        </Button>
                                                    </Space>
                                                </div>
                                                <Table
                                                    columns={indexColumns}
                                                    dataSource={indexes}
                                                    bordered
                                                    pagination={false}
                                                    size="small"
                                                    rowKey="__id"
                                                />
                                            </div>
                                        }
                                        {item.key == 'partition' &&
                                            <div>
                                                <Table
                                                    columns={partitionColumns}
                                                    dataSource={partitions}
                                                    bordered
                                                    pagination={false}
                                                    size="small"
                                                    rowKey="__id"
                                                    scroll={{
                                                        // x: 2400,
                                                    }}
                                                />
                                            </div>
                                        }
                                        {item.key == 'trigger' &&
                                            <div>
                                                <Table
                                                    columns={triggerColumns}
                                                    dataSource={triggers}
                                                    bordered
                                                    pagination={false}
                                                    size="small"
                                                    rowKey="__id"
                                                    scroll={{
                                                        // x: 2400,
                                                    }}
                                                />
                                            </div>
                                        }
                                    </div>
                                )
                            })}
                        </div>
                        {/* <CodeDebuger path="src/views/db-manager/table-detail/table-detail.tsx" /> */}
                    </div>
                </>
            }
            {!!execSql &&
                <ExecModal
                    config={config}
                    connectionId={connectionId}
                    sql={execSql}
                    tableName={tableName}
                    dbName={dbName}
                    onClose={() => {
                        setExecSql('')
                    }}
                    onSuccess={() => {
                        emitRefresh()
                        // if (editType)
                        if (newNameRef.current) {
                            setEditType('update')
                            setTableName(newNameRef.current)
                        }
                        else {
                            loadTableInfo()
                        }
                    }}
                />
            }
        </div>
    )
}
