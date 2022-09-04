import { Button, Checkbox, Descriptions, Form, Input, message, Space, Table, Tabs } from 'antd';
import React, { useMemo } from 'react';
import { VFC, useRef, useState, useEffect } from 'react';
import { request } from '../utils/http';
import styles from './table-detail.module.less';
import _ from 'lodash';
import { ExecModal } from '../exec-modal/exec-modal';
import { uid } from 'uid';
// console.log('lodash', _)
const { TabPane } = Tabs

function hasValue(value) {
    return !!value || value === 0
}

function TableInfoEditor({ config, tableInfo, tableName, dbName }) {
    const [form] = Form.useForm()
    const [sql, setSql] = useState('')

    useEffect(() => {
        form.setFieldsValue({
            ...tableInfo,
        })
    }, [tableInfo])

    async function update() {
        // setLoading(true)
        const values = await form.validateFields()
        if (values.TABLE_NAME != tableInfo.TABLE_NAME) {
            const sql = `ALTER TABLE \`${tableInfo.TABLE_NAME}\`
    RENAME TO \`${values.TABLE_NAME}\`
;`
            console.log('sql', sql)
            setSql(sql)
        }
    }

    return (
        <div>
            <Form
                form={form}
                labelCol={{ span: 8 }}
                wrapperCol={{ span: 16 }}
                initialValues={{
                    port: 3306,
                }}
                // layout={{
                //     labelCol: { span: 0 },
                //     wrapperCol: { span: 24 },
                // }}
            >
                <Form.Item
                    name="TABLE_NAME"
                    label="表名称"
                    rules={[ { required: true, }, ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="TABLE_COMMENT"
                    label="注释"
                    rules={[]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                        wrapperCol={{ offset: 8, span: 16 }}
                        // name="passowrd"
                        // label="Passowrd"
                        // rules={[{ required: true, },]}
                    >
                        <Space>
                            <Button
                                // loading={loading}
                                type="primary"
                                onClick={update}>提交</Button>
                            {/* <Button onClick={save}>保存</Button> */}
                        </Space>
                    </Form.Item>
            </Form>
            {!!sql &&
                <ExecModal
                    config={config}
                    sql={sql}
                    tableName={tableName}
                    dbName={dbName}
                />
            }
        </div>
    )
}


function Cell({ value, index, dataIndex, onChange }) {
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
    
    useEffect(() => {
        const clickHandler = () => {
            // console.log('document click', )
            // setIsEdit(false)
            if (isEdit) {
                console.log('document click isEdit')
                onChange && onChange({
                    ...value,
                    newValue: inputValue,
                })
                setIsEdit(false)

            }
        }
        document.addEventListener('click', clickHandler)
        return () => {
            document.removeEventListener('click', clickHandler)
        }
    }, [isEdit, value, inputValue])
    return (
        <div
            className={styles.cell}
            onClick={(e) => {
                e.stopPropagation()
            }}
        >
            
            {isEdit ?
                <SimpleInput
                    inputId={id}
                    // ref={inputRef}
                    value={inputValue}
                    onChange={e => {
                        setInputValue(e.target.value)
                    }}
                    // onBlur={() => {
                    //     console.log('onBlur')
                    //     // console.log('change', index, dataIndex, inputValue)
                        
                    // }}
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

    const [tableColumns, setTableColumns] = useState([])
    const [indexes, setIndexes] = useState([])
    const [removedRows, setRemovedRows] = useState([])
    const [partitions, setPartitions] = useState([])
    const [tableInfo, setTableInfo] = useState({})
    const [modelVisible, setModalVisible] = useState(false)
    const [modelCode, setModalCode] = useState('')
    const [fields, setFields] = useState([])
    const [execSql, setExecSql] = useState('')
    
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

    async function submitChange() {
        let sql = `ALTER TABLE \`${tableName}\``
        
        let changed = false
        const rowSqls = []
        for (let row of tableColumns) {
            // console.log('row', row)
            let rowChanged = false
            for (let field in row) {
                // console.log('field', field)
                if (hasValue(row[field].newValue)) {
                    rowChanged = true

                }
            }
            if (rowChanged) {
                changed = true
                const changeType = row.__new ? 'ADD' : row.COLUMN_NAME.newValue ? 'CHANGE' : 'MODIFY'
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
                const defaultSql = hasValue(row.COLUMN_DEFAULT.newValue || row.COLUMN_DEFAULT.value) ? `DEFAULT '${row.COLUMN_DEFAULT.newValue || row.COLUMN_DEFAULT.value}'` : ''
                const commentSql = hasValue(row.COLUMN_COMMENT.newValue || row.COLUMN_COMMENT.value) ? `COMMENT '${row.COLUMN_COMMENT.newValue || row.COLUMN_COMMENT.value}'` : ''
                // const commentSql = hasValue(row.COLUMN_COMMENT.newValue) ? `COMMENT '${row.COLUMN_COMMENT.newValue}'` : ''
                const rowSql = `${changeType} COLUMN ${nameSql} ${typeSql} ${nullSql} ${defaultSql} ${commentSql}`
                //  int(11) NULL AFTER \`content\`
                
                rowSqls.push(rowSql)
            }
        }
        if (removedRows.length) {
            for (let removedRow of removedRows) {
                rowSqls.push(`DROP COLUMN \`${removedRow.COLUMN_NAME.value}\``)
            }
        }
        if (!rowSqls.length) {
            message.info('No changed')
            return
        }
        sql += '\n' + rowSqls.join(' ,\n')
        console.log('sql', sql)
        setExecSql(sql)
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
            title: '键',
            dataIndex: 'COLUMN_KEY',
            // render: EditableCellRender(),
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
            title: '备注',
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
        },
        {
            title: '包含列',
            dataIndex: 'columns',
        },
        // {
        //     title: 'COLUMN_NAME',
        //     dataIndex: 'COLUMN_NAME',
        // },
        {
            title: '备注',
            dataIndex: 'comment',
        },
        {
            title: '类型',
            dataIndex: 'type',
        },
        {
            title: '不唯一',
            dataIndex: 'NON_UNIQUE',
        },
        
        
        
    ]
    async function loadTableInfo() {
        setRemovedRows([])
        if (dbName && tableName) {
            let res = await request.post(`${config.host}/mysql/tableDetail`, {
                dbName,
                tableName,
            }, {
                noMessage: true,
            })
            // console.log('loadTableInfo', res)
            if (res.status == 200) {
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
                        name: item0.INDEX_NAME,
                        comment: item0.INDEX_COMMENT,
                        type: item0.INDEX_TYPE,
                        NON_UNIQUE: item0.NON_UNIQUE,
                        columns: columns
                            .sort((a, b) => {
                                return a.SEQ_IN_INDEX - b.SEQ_IN_INDEX
                            })
                            .map(item => item.COLUMN_NAME)
                            .join(', ')
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
                setIndexes(indexes)
                setTableInfo(res.data.table)
            }
        }
    }

    useEffect(() => {
        loadTableInfo()
    }, [])
    
	return (
        <div className={styles.detailBox}>
            <Tabs
                tabPosition="left"
                type="card"
            >
                <TabPane tab="基本信息" key="basic">
                    <TableInfoEditor
                        config={config}
                        tableInfo={tableInfo}
                        tableName={tableName}
                        dbName={dbName}
                    />
                    <Descriptions column={1}>
                        {/* <Descriptions.Item label="label">{tableInfo.AUTO_INCREMENT}</Descriptions.Item> */}
                        <Descriptions.Item label="表名称">{tableInfo.TABLE_NAME}</Descriptions.Item>
                        <Descriptions.Item label="排序规则">{tableInfo.TABLE_COLLATION}</Descriptions.Item>
                        <Descriptions.Item label="行">{tableInfo.DATA_LENGTH}</Descriptions.Item>
                        <Descriptions.Item label="引擎">{tableInfo.ENGINE}</Descriptions.Item>
                        <Descriptions.Item label="注释">{tableInfo.TABLE_COMMENT}</Descriptions.Item>
                        <Descriptions.Item label="平均行长度">{tableInfo.AVG_ROW_LENGTH}</Descriptions.Item>
                        <Descriptions.Item label="当前值">{tableInfo.AUTO_INCREMENT}</Descriptions.Item>
                        <Descriptions.Item label="行格式">{tableInfo.ROW_FORMAT}</Descriptions.Item>
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
                </TabPane>
                <TabPane tab="列信息" key="columns">
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
                                onClick={loadTableInfo}
                            >
                                刷新
                            </Button>
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
                            <Button
                                size="small"
                                onClick={submitChange}
                            >
                                提交修改
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
                <TabPane tab="索引信息" key="index">
                    <Table
                        columns={indexColumns}
                        dataSource={indexes}
                        bordered
                        pagination={false}
                        size="small"
                        rowKey="__id"
                    />
                </TabPane>
                <TabPane tab="分区信息" key="partition">
                    <Table
                        columns={partitionColumns}
                        dataSource={partitions}
                        bordered
                        pagination={false}
                        size="small"
                        rowKey="__id"
                    />
                </TabPane>
            </Tabs>
            {!!execSql &&
                <ExecModal
                    config={config}
                    sql={execSql}
                    tableName={tableName}
                    dbName={dbName}
                    onClose={() => {
                        setExecSql('')
                        loadTableInfo()
                    }}
                />
            }
        </div>
    )
}
