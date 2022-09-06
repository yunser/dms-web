import { Button, Checkbox, Descriptions, Form, Input, message, Select, Space, Table, Tabs } from 'antd';
import React, { useMemo } from 'react';
import { VFC, useRef, useState, useEffect } from 'react';
import { request } from '../utils/http';
import styles from './table-detail.module.less';
import _ from 'lodash';
import { ExecModal } from '../exec-modal/exec-modal';
import { uid } from 'uid';
import { useTranslation } from 'react-i18next';
// console.log('lodash', _)
const { TabPane } = Tabs

function hasValue(value) {
    return !!value || value === 0
}

// function TableInfoEditor({ config, tableInfo, tableName, dbName }) {
    

//     return (
//         <div>
            
//         </div>
//     )
// }


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
                                    width: 160,
                                }}
                            />
                        </div>
                    : dataIndex == 'columns' ?
                        <div>
                            {/* {inputValue} */}
                            <Select
                                size="small"
                                mode="multiple"
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
                                options={selectOptions}
                                style={{
                                    width: 240,
                                }}
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

export function TableDetail({ config, dbName, tableName }) {

    const { t } = useTranslation()
    
    const editType = tableName ? 'update' : 'create'

    const [tableColumns, setTableColumns] = useState([])
    const [indexes, setIndexes] = useState([])
    const [removedRows, setRemovedRows] = useState([])
    const [removedIndexes, setRemovedIndexes] = useState([])
    const [partitions, setPartitions] = useState([])
    const [tableInfo, setTableInfo] = useState({})
    const [modelVisible, setModalVisible] = useState(false)
    const [modelCode, setModalCode] = useState('')
    const [fields, setFields] = useState([])
    const [execSql, setExecSql] = useState('')
    
    const [form] = Form.useForm()
    const [nginxs, setNginxs] = useState([])
    // useEffect(() => {
    //     form.setFieldsValue({
    //         ...tableInfo,
    //     })
    // }, [tableInfo])

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

    async function loadCharData() {
        let res = await request.post(`${config.host}/mysql/execSqlSimple`, {
            sql: `SELECT *
    FROM \`information_schema\`.\`COLLATION_CHARACTER_SET_APPLICABILITY\``,
        })
        if (res.success) {
            console.log('res.data', res.data)
            const characterSetMap: any = {}
            const characterSets = []
            for (let item of res.data) {
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
            let tableColl = res.data.find(item => item.COLLATION_NAME == tableInfo.TABLE_COLLATION)
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
    }
    // tableInfo

    useEffect(() => {
        if (editType == 'update' && !tableInfo.TABLE_NAME) {
            return
        }
        loadCharData()
    }, [tableInfo])


    async function loadNginx() {
        let res = await request.post(`${config.host}/mysql/execSqlSimple`, {
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
        loadNginx()
    }, [])


    async function update() {
        // setLoading(true)
        const values = await form.validateFields()
        const attrSqls = []
        if (editType == 'update' && values.TABLE_NAME != tableInfo.TABLE_NAME) {
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
                    .join('')
                const commentSql = hasValue(idxRow.comment.newValue || idxRow.comment.value) ? `COMMENT '${idxRow.comment.newValue || idxRow.comment.value}'` : ''
                const idxSql = (idxRow.type2.newValue || idxRow.type2.value) == 'Unique' ? 'UNIQUE INDEX' : 'INDEX'
                console.log('idxRow.type2', idxRow.type2)
                idxSqls.push(`ADD ${idxSql} \`${idxRow['name'].newValue || idxRow['name'].value}\` (${columnsSql}) ${commentSql}`)
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
            sql = `ALTER TABLE \`${tableInfo.TABLE_NAME}\`
${[...attrSqls, ...rowSqls, ...idxSqls].join(' ,\n')}`
        }
        else {
            sql = `CREATE TABLE \`${values.TABLE_NAME}\` (
${rowSqls.join(' ,\n')}
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

    const partitionColumns = [
        {
            title: '分区名',
            dataIndex: 'PARTITION_NAME',
        },
        {
            title: '表达式',
            dataIndex: 'PARTITION_EXPRESSION',
        },
        {
            title: '数据长度',
            dataIndex: 'DATA_LENGTH',
        },
        {
            title: '描述',
            dataIndex: 'PARTITION_DESCRIPTION',
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
            title: '列名',
            dataIndex: 'COLUMN_NAME',
            render: EditableCellRender({
                dataIndex: 'COLUMN_NAME',
                onChange: onColumnCellChange,
            }),
        },
        {
            title: '类型',
            dataIndex: 'COLUMN_TYPE',
            render: EditableCellRender({
                dataIndex: 'COLUMN_TYPE',
                onChange: onColumnCellChange,
            }),
        },
        {
            title: '可空',
            dataIndex: 'IS_NULLABLE',
            render: EditableCellRender({
                dataIndex: 'IS_NULLABLE',
                onChange: onColumnCellChange,
            }),
        },
        {
            title: '主键',
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
            title: '自增',
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
            title: '默认值',
            dataIndex: 'COLUMN_DEFAULT',
            render: EditableCellRender({
                dataIndex: 'COLUMN_DEFAULT',
                onChange: onColumnCellChange,
            }),
        },
        {
            title: '注释',
            dataIndex: 'COLUMN_COMMENT',
            render: EditableCellRender({
                dataIndex: 'COLUMN_COMMENT',
                onChange: onColumnCellChange,
            }),
        },
        {
            title: '操作',
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
                    >删除</a>
                )
            }
        },
    ]
    const indexColumns = [
        {
            title: '索引名',
            dataIndex: 'name',
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
            title: '类型',
            dataIndex: 'type2',
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
            title: '包含列',
            dataIndex: 'columns',
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
            title: '注释',
            dataIndex: 'comment',
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
            title: '操作',
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
        
    ]
    async function loadTableInfo() {
        setRemovedRows([])
        setRemovedIndexes([])
        if (dbName && tableName) {
            let res = await request.post(`${config.host}/mysql/tableDetail`, {
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
                setPartitions(res.data.partitions.map(item => {
                    return {
                        __id: uid(32),
                        ...item,
                    }
                }))
                
                const groupMap = _.groupBy(res.data.indexes, 'INDEX_NAME')
                // console.log('groups2', groupMap)
                const indexes = []
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
                setIndexes(indexes.filter(item => item.__INDEX_NAME != "PRIMARY"))
                setTableInfo(res.data.table)
            }
        }
    }

    useEffect(() => {
        loadTableInfo()
    }, [])
    
    console.log('render/indexes', indexes)

	return (
        <div className={styles.detailBox}>
            <div className={styles.header}>
                <Space>
                    {editType == 'update' &&
                        <Button
                            size="small"
                            onClick={loadTableInfo}
                        >
                            {t('refresh')}
                        </Button>
                    }
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
                            onClick={submitChange}
                        >
                            提交修改
                        </Button> */}
                </Space>
            </div>
            <div className={styles.body}>
                <Tabs
                    tabPosition="left"
                    type="card"
                >
                    <TabPane tab={t('options')} key="basic">
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
                                            {tableInfo.DATA_LENGTH}
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
                                            {tableInfo.CREATE_TIME}
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
                    </TabPane>
                    
                    <TabPane tab={t('columns')} key="columns">
                        <div style={{
                            marginBottom: 8,
                        }}>
                            <Space>
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
                                    新增
                                </Button>
                                
                            </Space>
                        </div>
                        <Table
                            columns={columns}
                            dataSource={tableColumns}
                            bordered
                            pagination={false}
                            size="small"
                            rowKey="__id"
                        />
                    </TabPane>
                    {editType == 'update' &&
                        <>
                            <TabPane tab={t('indexes')} key="index">
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
                                            新增
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
                            </TabPane>
                            <TabPane tab={t('partition')} key="partition">
                                <Table
                                    columns={partitionColumns}
                                    dataSource={partitions}
                                    bordered
                                    pagination={false}
                                    size="small"
                                    rowKey="__id"
                                />
                            </TabPane>
                        </>
                    }
                </Tabs>
            </div>
            {!!execSql &&
                <ExecModal
                    config={config}
                    sql={execSql}
                    tableName={tableName}
                    dbName={dbName}
                    onClose={() => {
                        setExecSql('')
                    }}
                    onSuccess={() => {
                        loadTableInfo()
                    }}
                />
            }
        </div>
    )
}
