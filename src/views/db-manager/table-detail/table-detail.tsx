import { Button, Checkbox, Descriptions, Form, Input, message, Modal, Select, Space, Table, Tabs } from 'antd';
import React, { useMemo } from 'react';
import { VFC, useRef, useState, useEffect } from 'react';
import { request } from '../utils/http';
import styles from './table-detail.module.less';
import _ from 'lodash';
import { ExecModal } from '../exec-modal/exec-modal';
import { uid } from 'uid';
import { useTranslation } from 'react-i18next';
import { IconButton } from '../icon-button';
import { ReloadOutlined } from '@ant-design/icons';
import filesize from 'file-size';
import { CodeDebuger } from '../code-debug';
import moment from 'moment';
// console.log('lodash', _)
const { TabPane } = Tabs

function hasValue(value) {
    return !!value || value === 0
}

function parseColumns(item) {
    const { sql } = item
    console.log('parseColumns/sql', sql)
    if (!sql) {
        return []
    }
    const m = sql.match(/\(([\d\D]+)\)/)
    console.log('parseColumns/m', m)
    if (!m) {
        return []
    }
    const cols = m[1].split(',')
        .map(item => item.replace(/\s/g, ''))
        .map(item => item.substring(1, item.length - 1))
    console.log('parseColumns/cols', cols)
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
    // console.log('Cell/value', value)
    // const inputRef = useRef(null)
    const id = useMemo(() => {
        return uid(32)
    }, [])

    if (!value) {
        // console.log('?', value)
        return <div>?</div>
    }
    const [isEdit, setIsEdit] = useState(false)
    const [inputValue, setInputValue] = useState(value.value)
    useEffect(() => {

        setInputValue(value.value)
    }, [value.value])
    
    
    

    // useEffect(() => {
    //     const clickHandler = () => {
    //         // console.log('document click', )
    //         // setIsEdit(false)
    //         if (isEdit) {
    //             const notInput = index == 'type2'
    //             if (notInput) {
    //                 return
    //             }
    //             console.log('document click isEdit')
    //             onChange && onChange({
    //                 ...value,
    //                 newValue: inputValue,
    //             })
    //             setIsEdit(false)

    //         }
    //     }
    //     document.addEventListener('click', clickHandler)
    //     return () => {
    //         document.removeEventListener('click', clickHandler)
    //     }
    // }, [isEdit, value, inputValue, dataIndex])
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
                                    const newValue = e.target.checked ? 'PRI' : 'NOT_PRI'
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

export function TableDetail({ config, databaseType = 'mysql', connectionId, event$, dbName, tableName: oldTableName }) {

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


    async function update() {
        // setLoading(true)
        const values = await form.validateFields()
        const attrSqls = []
        newNameRef.current = null
        if (editType == 'update' && values.TABLE_NAME != tableInfo.TABLE_NAME) {
            newNameRef.current = values.TABLE_NAME
            attrSqls.push(`RENAME TO \`${values.TABLE_NAME}\``)
        }
        if (values.TABLE_COMMENT != tableInfo.TABLE_COMMENT) {
            attrSqls.push(`COMMENT='${values.TABLE_COMMENT}'`)
        }
        if (values.ENGINE != tableInfo.ENGINE) {
            attrSqls.push(`ENGINE=${values.ENGINE}`)
        }
        if (values.collation != tableInfo.TABLE_COLLATION) {
            if (values.characterSet != _old_characterSet_ref.current) {
                attrSqls.push(`DEFAULT CHARACTER SET=${values.characterSet}`)
            }
            if (values.collation != tableInfo.TABLE_COLLATION && values.collation) {
                attrSqls.push(`COLLATE=${values.collation}`)
            }
        }

        // let changed = false
        const rowSqls = []
        for (let row of tableColumns) {
            // console.log('row', row)
            let rowChanged = false
            for (let field in row) {
                // console.log('field', field)
                const checkFields = [
                    'COLUMN_NAME',
                    'COLUMN_TYPE',
                    'IS_NULLABLE',
                    // 'COLUMN_KEY',
                    'EXTRA',
                    'COLUMN_DEFAULT',
                    'COLUMN_COMMENT',
                ]
                if (hasValue(row[field].newValue) && checkFields.includes(field)) {
                    rowChanged = true
                }
            }
            if (rowChanged) {
                // changed = true
                const changeType = editType == 'create' ? '' : row.__new ? 'ADD COLUMN' : row.COLUMN_NAME.newValue ? 'CHANGE COLUMN' : 'MODIFY COLUMN'
                let _nameSql = hasValue(row.COLUMN_NAME.newValue) ? `\`${row.COLUMN_NAME.newValue}\`` : ''
                let nameSql
                if (row.__new) {
                    nameSql = `\`${row.COLUMN_NAME.newValue}\``
                }
                else {
                    nameSql = `\`${row.COLUMN_NAME.value}\` ${_nameSql}`
                }
                const typeSql = row.COLUMN_TYPE.newValue || row.COLUMN_TYPE.value
                const nullSql = (row.IS_NULLABLE.newValue || row.IS_NULLABLE.value) == 'YES' ? 'NULL' : 'NOT NULL'
                const autoIncrementSql = (row.EXTRA.newValue || row.EXTRA.value) == 'auto_increment' ? 'AUTO_INCREMENT' : ''
                const defaultSql = hasValue(row.COLUMN_DEFAULT.newValue || row.COLUMN_DEFAULT.value) ? `DEFAULT '${row.COLUMN_DEFAULT.newValue || row.COLUMN_DEFAULT.value}'` : ''
                const commentSql = hasValue(row.COLUMN_COMMENT.newValue || row.COLUMN_COMMENT.value) ? `COMMENT '${row.COLUMN_COMMENT.newValue || row.COLUMN_COMMENT.value}'` : ''
                // const commentSql = hasValue(row.COLUMN_COMMENT.newValue) ? `COMMENT '${row.COLUMN_COMMENT.newValue}'` : ''
                const rowSql = `${changeType} ${nameSql} ${typeSql} ${nullSql} ${autoIncrementSql} ${defaultSql} ${commentSql}`
                //  int(11) NULL AFTER \`content\`
                
                rowSqls.push(rowSql)
            }
        }
        // 列删除逻辑
        if (removedRows.length) {
            for (let removedRow of removedRows) {
                rowSqls.push(`DROP COLUMN \`${removedRow.COLUMN_NAME.value}\``)
            }
        }
        // 主键逻辑
        const oldKeyColumns = tableColumns.filter(item => item.COLUMN_KEY.value == 'PRI')
        const newKeyColumns = tableColumns.filter(item => (item.COLUMN_KEY.newValue || item.COLUMN_KEY.value) == 'PRI')
        const oldKeys = oldKeyColumns.map(item => item.COLUMN_NAME.value).join(',')
        const newKeys = newKeyColumns.map(item => (item.COLUMN_NAME.newValue || item.COLUMN_NAME.value)).join(',')

        const isKeyChanged = oldKeys != newKeys
        console.log('oldKeyColumns', oldKeyColumns)
        console.log('newKeyColumns', newKeyColumns)
        console.log('oldKeys', oldKeys)
        console.log('newKeys', newKeys)

        if (isKeyChanged && oldKeyColumns.length) {
            rowSqls.push(`DROP PRIMARY KEY`)
        }
        if (isKeyChanged && newKeyColumns.length) {
            let keySql = newKeyColumns.map(item => (item.COLUMN_NAME.newValue || item.COLUMN_NAME.value))
                .map(item => `\`${item}\``)
                .join(',')
            rowSqls.push(`ADD PRIMARY KEY(${keySql})`)
        }
        // return

        // 索引删除逻辑
        const idxSqls = []
        if (removedIndexes.length) {
            for (let removedIndex of removedIndexes) {
                idxSqls.push(`DROP INDEX \`${removedIndex.name.value}\``)
            }
        }
        console.log('indexes', indexes)
        // 新增索引逻辑
        for (let idxRow of indexes) {
            const checkFields = [
                'name',
                'type2',
                'columns',
                'comment',
            ]
            let rowChanged = false
            for (let field in idxRow) {
                if (hasValue(idxRow[field].newValue) && checkFields.includes(field)) {
                    rowChanged = true
                }
            }
            // if (rowChanged) {
            function addIndex() {
                const columnsSql = (idxRow['columns'].newValue || idxRow['columns'].value)
                    // .trim()
                    // .split(', ')
                    .map(item => `\`${item}\``)
                    .join(', ')
                const commentSql = hasValue(idxRow.comment.newValue || idxRow.comment.value) ? `COMMENT '${idxRow.comment.newValue || idxRow.comment.value}'` : ''
                const idxSql = (idxRow.type2.newValue || idxRow.type2.value) == 'Unique' ? 'UNIQUE INDEX' : 'INDEX'
                console.log('idxRow.type2', idxRow.type2)
                if (editType == 'create') {
                    idxSqls.push(`${idxSql} \`${idxRow['name'].newValue || idxRow['name'].value}\` (${columnsSql}) ${commentSql}`)
                }
                else {
                    idxSqls.push(`ADD ${idxSql} \`${idxRow['name'].newValue || idxRow['name'].value}\` (${columnsSql}) ${commentSql}`)
                }
            }
            if (idxRow.__new) {
                addIndex()
            }
            else if (rowChanged) {
                idxSqls.push(`DROP INDEX \`${idxRow['name'].value}\``)
                addIndex()
            }
        }


        // must before 「No changed」check
        if (editType == 'create' && !rowSqls.length) {
            message.info('No columns')
            return
        }
        const allSqls = [
            ...attrSqls,
            ...rowSqls,
            ...idxSqls,
        ]
        if (!allSqls.length) {
            message.info('No changed')
            return
        }
        let sql
        if (editType == 'update') {
            sql = `ALTER TABLE \`${dbName}\`.\`${tableInfo.TABLE_NAME}\`
${[...attrSqls, ...rowSqls, ...idxSqls].join(' ,\n')}`
        }
        else {
            newNameRef.current = values.TABLE_NAME
            sql = `CREATE TABLE \`${dbName}\`.\`${values.TABLE_NAME}\` (
${[...rowSqls, ...idxSqls].join(' ,\n')}
) ${attrSqls.join(' ,\n')}`
        }
        console.log('sql', sql)
        // setSql(sql)
        setExecSql(sql)
    }

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

    

    const columns = [
        {
            title: t('column_name'),
            dataIndex: 'COLUMN_NAME',
            width: 360,
            render: EditableCellRender({
                dataIndex: 'COLUMN_NAME',
                onChange: onColumnCellChange,
            }),
        },
        {
            title: t('type'),
            dataIndex: 'COLUMN_TYPE',
            render: EditableCellRender({
                dataIndex: 'COLUMN_TYPE',
                onChange: onColumnCellChange,
            }),
        },
        {
            title: t('nullable'),
            dataIndex: 'IS_NULLABLE',
            render: EditableCellRender({
                dataIndex: 'IS_NULLABLE',
                onChange: onColumnCellChange,
            }),
        },
        {
            title: t('primary_key'),
            dataIndex: 'COLUMN_KEY',
            // render(value) {
            //     return (
            //         <div>{value.value}</div>
            //     )
            // }
            render: EditableCellRender({
                dataIndex: 'COLUMN_KEY',
                onChange: onColumnCellChange,
            }),
        },
        {
            title: t('auto_increment'),
            dataIndex: 'EXTRA',
            // render(value) {
            //     return (
            //         <div>{value.value}</div>
            //     )
            // }
            render: EditableCellRender({
                dataIndex: 'EXTRA',
                onChange: onColumnCellChange,
            }),
        },
        {
            title: t('default'),
            dataIndex: 'COLUMN_DEFAULT',
            width: 240,
            render: EditableCellRender({
                dataIndex: 'COLUMN_DEFAULT',
                onChange: onColumnCellChange,
            }),
        },
        {
            title: t('comment'),
            dataIndex: 'COLUMN_COMMENT',
            render: EditableCellRender({
                dataIndex: 'COLUMN_COMMENT',
                onChange: onColumnCellChange,
            }),
        },
        {
            title: t('actions'),
            dataIndex: 'op',
            render(_value, item) {
                return (
                    <a
                        onClick={() => {
                            setTableColumns(tableColumns.filter(_item => _item.__id != item.__id))
                            if (!item.__new) {
                                setRemovedRows([
                                    ...removedRows,
                                    item,
                                ])
                            }
                        }}
                    >{t('delete')}</a>
                )
            }
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
            // render: EditableCellRender({
            //     dataIndex: 'type2',
            //     onChange: onIndexCellChange,
            // }),
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
            // render: EditableCellRender({
            //     dataIndex: 'columns',
            //     onChange: onIndexCellChange,
            // }),
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
                        newCol[key] = {
                            value: col[key],
                            newValue: undefined,
                        }
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
        }
    ]
    if (editType == 'update') {
        // tabs.push({
        //     label: t('indexes'),
        //     key: 'index',
        // })
        tabs.push({
            label: t('partition'),
            key: 'partition',
        })
        tabs.push({
            label: t('triggers'),
            key: 'trigger',
        })
    }
    

	return (
        <div className={styles.detailBox}>
            {loading ?
                <div>{t('loading')}</div>
            :
                <>
                    <div className={styles.header}>
                        {/* {tableName}@{dbName} */}
                            
                            <Button
                                // loading={loading}
                                size="small"
                                type="primary"
                                onClick={update}
                                >
                                {t('save')}
                            </Button>
                            {/* <Button
                                size="small"
                                onClick={debug}
                                >
                                调试
                            </Button> */}
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
                        <div className={styles.bodyLeft}>
                            <Tabs
                                activeKey={curTab}
                                onChange={key => {
                                    setCurTab(key)
                                }}
                                tabPosition="left"
                                type="card"
                                items={tabs}
                            />
                        </div>
                        
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
                                        {item.key == 'basic' &&
                                            <div>
                                                <div className={styles.formBox}>
                                                    <Form
                                                        form={form}
                                                        labelCol={{ span: 10 }}
                                                        wrapperCol={{ span: 16 }}
                                                        initialValues={{
                                                            port: 3306,
                                                        }}
                                                        size="small"
                                                        // layout={{
                                                        //     labelCol: { span: 0 },
                                                        //     wrapperCol: { span: 24 },
                                                        // }}
                                                    >
                                                        <Form.Item
                                                            name="TABLE_NAME"
                                                            label={t('name')}
                                                            rules={[ { required: true, }, ]}
                                                        >
                                                            <Input />
                                                        </Form.Item>
                                                        <Form.Item
                                                            name="TABLE_COMMENT"
                                                            label={t('comment')}
                                                            rules={[]}
                                                        >
                                                            <Input.TextArea rows={4} />
                                                        </Form.Item>
                                                        <Form.Item
                                                            name="ENGINE"
                                                            label={t('nginx')}
                                                            rules={[]}
                                                        >
                                                            <Select
                                                                options={nginxs}
                                                            />
                                                        </Form.Item>
                                                        <Form.Item
                                                            name="characterSet"
                                                            label={t('character_set')}
                                                            // rules={editType == 'create' ? [] : [ { required: true, }, ]}
                                                        >
                                                            <Select
                                                                options={characterSets}
                                                                onChange={() => {
                                                                    console.log('change')
                                                                    form.setFieldsValue({
                                                                        collation: null,
                                                                    })
                                                                }}
                                                                // onChange={}
                                                            />
                                                        </Form.Item>
                                                        <Form.Item
                                                            name="collation"
                                                            label={t('collation')}
                                                            // rules={[ { required: true, }, ]}
                                                        >
                                                            <Select
                                                                options={collations}
                                                                // onChange={}
                                                            />
                                                        </Form.Item>
                                                        {/* <Form.Item
                                                                wrapperCol={{ offset: 8, span: 16 }}
                                                                // name="passowrd"
                                                                // label="Passowrd"
                                                                // rules={[{ required: true, },]}
                                                            >
                                                                <Space>
                                                                    
                                                                </Space>
                                                            </Form.Item> */}
                                                        {editType == 'update' &&
                                                            <>
                                                                <Form.Item label={t('data_length')}>
                                                                    {tableInfo.DATA_LENGTH ? filesize(tableInfo.DATA_LENGTH, { fixed: 1, }).human() : '--'}
                                                                </Form.Item>
                                                                <Form.Item label={t('avg_row_length')}>
                                                                    {tableInfo.AVG_ROW_LENGTH}
                                                                </Form.Item>
                                                                <Form.Item label={t('auto_increment')}>
                                                                    {tableInfo.AUTO_INCREMENT}
                                                                </Form.Item>
                                                                <Form.Item label={t('row_format')}>
                                                                    {tableInfo.ROW_FORMAT}
                                                                </Form.Item>
                                                                <Form.Item label={t('create_time')}>
                                                                    {tableInfo.CREATE_TIME ? moment(tableInfo.CREATE_TIME).format('YYYY-MM-DD HH:mm:ss') : '--'}
                                                                </Form.Item>
                                                                <Form.Item label={t('update_time')}>
                                                                    {tableInfo.UPDATE_TIME ? moment(tableInfo.UPDATE_TIME).format('YYYY-MM-DD HH:mm:ss') : '--'}
                                                                </Form.Item>
                                                                {/* <Form.Item label="UPDATE_TIME">
                                                                    {tableInfo.UPDATE_TIME}
                                                                </Form.Item> */}
                                                            </>
                                                        }
                                                    </Form>
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
                                        }
                                        {item.key == 'columns' &&
                                            <div>
                                                <div className={styles.columnHeader}>
                                                    {/* <input
                                                        onBlur={() => {
                                                            console.log('Bour OK')
                                                        }}
                                                    /> */}
                                                    
                                                    <Button
                                                        size="small"
                                                        onClick={() => {
                                                            tableColumns.push({
                                                                __id: uid(32),
                                                                __new: true,
                                                                COLUMN_NAME: {
                                                                    value: '',
                                                                },
                                                                COLUMN_TYPE: {
                                                                    value: '',
                                                                },
                                                                IS_NULLABLE: {
                                                                    value: 'YES',
                                                                },
                                                                COLUMN_DEFAULT: {
                                                                    value: null,
                                                                },
                                                                COLUMN_COMMENT: {
                                                                    value: '',
                                                                },
                                                                COLUMN_KEY: {
                                                                    value: '',
                                                                },
                                                                EXTRA: {
                                                                    value: '',
                                                                },
                                                                // CHARACTER_MAXIMUM_LENGTH: 32
                                                                // CHARACTER_OCTET_LENGTH: 96
                                                                // CHARACTER_SET_NAME: "utf8"
                                                                // COLLATION_NAME: "utf8_general_ci"
                                                                // COLUMN_KEY: ""
                                                                // DATA_TYPE: "varchar"
                                                                // DATETIME_PRECISION: null
                                                                // EXTRA: ""
                                                                // GENERATION_EXPRESSION: ""
                                                                // NUMERIC_PRECISION: null
                                                                // NUMERIC_SCALE: null
                                                                // ORDINAL_POSITION: 2
                                                                // PRIVILEGES: "select,insert,update,references"
                                                                // TABLE_CATALOG: "def"
                                                                // TABLE_NAME: "a_test5"
                                                                // TABLE_SCHEMA: "linxot"
                                                            })
                                                            setTableColumns([...tableColumns])
                                                        }}
                                                    >
                                                        {t('add')}
                                                    </Button>
                                                    {/* <Input
                                                        value={columnKeyword}
                                                        onChange={e => {
                                                            setColumnKeyword(e.target.value)
                                                        }}
                                                        allowClear
                                                        className={styles.filter}
                                                        placeholder={t('filter')}
                                                        size="small"
                                                    /> */}
                                                </div>
                                                <Table
                                                    columns={columns}
                                                    dataSource={filteredTableColumns}
                                                    bordered
                                                    pagination={false}
                                                    size="small"
                                                    rowKey="__id"
                                                />
                                            </div>
                                        }
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
