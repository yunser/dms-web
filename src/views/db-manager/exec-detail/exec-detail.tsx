import { Button, Descriptions, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useMemo } from 'react';
import { VFC, useRef, useState, useEffect } from 'react';
import { request } from '../utils/http';
import styles from './exec-detail.module.less';
import _ from 'lodash';
import classNames from 'classnames'
console.log('lodash', _)
import copy from 'copy-to-clipboard';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { TabPane } = Tabs
const { TextArea } = Input

function SimpleCell({ text, color }) {
    return (
        <div
            className={styles.idxCell}
        // style={{
        //     color,
        // }}
        >
            <span className={styles.text}>{text}</span>
        </div>
    )
}

function Cell({ item, editing, onChange }) {
    const [isEdit, setIsEdit] = useState(false)
    const text = item.newValue || item.value
    const [value, setValue] = useState(text)
    const inputRef = useRef(null)

    useEffect(() => {
        if (isEdit) {
            inputRef.current!.focus();
        }
    }, [isEdit]);

    return (
        <div
            className={classNames(styles.cell, {
                [styles.edited]: !!item.newValue
            })}
        // style={{
        //     color,
        // }}
        >
            {isEdit ?
                <div>
                    <Input
                        ref={inputRef}
                        value={value}
                        onChange={e => {
                            setValue(e.target.value)
                        }}
                        onBlur={() => {
                            setIsEdit(false)
                            if (value != item.value) {
                                onChange && onChange({
                                    ...item,
                                    newValue: value,
                                })
                            }
                            if (value == item.value && item.newValue) {
                                onChange && onChange({
                                    ...item,
                                    newValue: undefined,
                                })
                            }
                        }}
                    />
                </div>
                : text == null ?
                    <span className={styles.null}
                        onClick={() => {
                            setIsEdit(true)
                        }}
                    >NULL</span>
                    :
                    <span className={classNames(styles.text, {

                    })}
                        onClick={() => {
                            setIsEdit(true)
                        }}
                    >{text}</span>
            }
            {/* {!isEdit && !editing && */}
            {!isEdit &&
                <div className={styles.tool}>
                    <a
                        onClick={() => {
                            copy(text == null ? 'null' : text)
                            message.success('Copied')
                        }}
                    >复制</a>
                    <Popover
                        title="Content"
                        content={
                            <div className={styles.content}>{text}</div>
                        }
                    >
                        <a>查看</a>
                    </Popover>
                </div>
            }
        </div>
    )
}


export function ExecDetail({ config, data, }) {
    const { 
        sql,
        loading, 
        results = [],
        fields = [],
        result, 
        list: _list = [],
        error,
        hasReq,
        tableName,
        dbName
    } = data || {}

    const rawExecResult = result?.result
    console.log('ExecDetail/rawExecResult', rawExecResult)
    console.log('ExecDetail/results.length', results.length)

    const [tableInfo, setTableInfo] = useState([])
    const [modelVisible, setModalVisible] = useState(false)
    const [modelCode, setModalCode] = useState('')
    const tableBoxRef = useRef(null)
    // const [fields, setFields] = useState([])
    // const [results, setResults] = useState([])
    const [editing, setEditing] = useState(false)
    const [list, setList] = useState([])
    useEffect(() => {
        if (loading) {
            return
        }
        console.log('ExecDetail/useEffect/_list')
        setList(_list)
        setEditing(false)
        setSelectedRowKeys([])
        setSelectedRows([])
    }, [_list, loading])
    const [selectedRowKeys, setSelectedRowKeys] = useState([])
    const [selectedRows, setSelectedRows] = useState([])
    // 执行状态弹窗
    const [resultModelVisible, setResultModalVisible] = useState(false)
    const [resultActiveKey, setResultActiveKey] = useState('')
    const [resultTabs, setResultTabs] = useState([
        // {
        //     title: '执行结果1',
        //     key: '0',
        // }
    ])

    async function loadTableInfo() {
        if (dbName && tableName) {
            let res = await request.post(`${config.host}/mysql/tableInfo`, {
                dbName,
                tableName,
            }, {
                noMessage: true,
            })
            console.log('loadTableInfo', res)
            if (res.status == 200) {
                setTableInfo(res.data)



            }
        }
    }

    function resetSubmit() {

    }

    useEffect(() => {
        if (loading) {
            return
        }
        console.log('ExecDetail/useEffect/loadTableInfo')
        loadTableInfo()
    }, [dbName, tableName, loading])

    function submitModify() {
        let pkField: string | number
        for (let field of tableInfo) {
            // Default: null
            // Extra: ""
            // Field: "id_"
            // Key: "PRI"
            // Null: "NO"
            // Type: "bigint(20)"
            if (field.Key == 'PRI') {
                pkField = field.Field
                break
            }
        }
        console.log('fields', fields)
        console.log('pkField', pkField)
        console.log('selectedRows', selectedRows)
        const pkColIdx = fields.findIndex(item => item.name == pkField)
        console.log('pkColIdx', pkColIdx)
        if (pkColIdx == -1) {
            message.error('找不到表格主键')
            return
        }


        console.log('list', list)
        const results = list.map(row => {
            // let 
            if (row.isNew) {
                const updatedFields = []
                const fieldNames = []
                const values = []
                for (let field of fields) {
                    const fieldName = field.name

                    // fieldNames.push(fieldName)
                    let value = null
                    for (let rowKey in row) {
                        if (rowKey != '_idx') { // TODO
                            const cell = row[rowKey]
                            if (cell.fieldName == fieldName) {
                                if (cell.newValue) {
                                    fieldNames.push(fieldName)
                                    // value = cell.newValue || cell.value
                                    value = cell.newValue
                                    values.push(value)
                                    break // TODO 重名
                                }
                            }
                        }
                    }
                    // for (let cell of row) {
                    // }
                    // values.push(value)
                    // if (fieldName.newValue) {
                    // }
                }
                const fieldNamesText = fieldNames.map(fieldName => {
                    return `\`${fieldName}\``
                }).join(', ')
                const valuesText = values.map(value => {
                    return `'${value}'`
                }).join(', ')
                const sql = `INSERT INTO \`${dbName}\`.\`${tableName}\` (${fieldNamesText}) VALUES (${valuesText});`
                return sql
            }
            const updatedFields = []
            for (let rowKey in row) {
                if (rowKey != '_idx') { // TODO
                    const cell = row[rowKey]
                    if (cell.newValue) {
                        updatedFields.push(`\`${cell.fieldName}\` = '${cell.newValue}'`)
                    }
                }

            }
            // row.map(cell => {
            //     // let 
            // })
            if (updatedFields.length) {
                let sql = `UPDATE \`${dbName}\`.\`${tableName}\` SET ${updatedFields.join(', ')} WHERE \`${pkField}\` = '${row[pkColIdx].value}';`
                return sql
            }
        })
            .filter(item => item)
            .join('\n')
        console.log('results', results)

        setModalCode(results)
        setModalVisible(true)
    }

    function addRow() {
        let newRow = {
            _idx: list.length,
            isNew: true,
        }
        fields.forEach((field, idx) => {
            newRow[idx] = {
                fieldName: field.name,
                value: null,
            }
        })
        setList([
            ...list,
            newRow,
        ])
        setEditing(true)

        // var div = document.getElementById('wenti-body-div');
        setTimeout(() => {
            const tableBox = tableBoxRef.current
            if (tableBox) {
                tableBox.scrollTop = tableBox.scrollHeight
            }
        }, 1)
    }

    function exportData() {
        const results = list.map(row => {
            // let 
            const rowObj: any = {}
            const updatedFields = []
            for (let rowKey in row) {
                if (rowKey != '_idx') { // TODO
                    const cell = row[rowKey]
                    rowObj[cell.fieldName] = cell.value
                }
            }
            return rowObj
        })
            // .filter(item => item)
            // .join('\n')
        console.log('results', results)
        const content = JSON.stringify(results, null, 4)
        copy(content)
        message.success('Copied')
    }

    async function removeSelection() {
        // if 
        let pkField: string | number
        for (let field of tableInfo) {
            // Default: null
            // Extra: ""
            // Field: "id_"
            // Key: "PRI"
            // Null: "NO"
            // Type: "bigint(20)"
            if (field.Key == 'PRI') {
                pkField = field.Field
                break
            }
        }
        console.log('fields', fields)
        console.log('pkField', pkField)
        console.log('selectedRows', selectedRows)
        const pkColIdx = fields.findIndex(item => item.name == pkField)
        console.log('pkColIdx', pkColIdx)
        if (pkColIdx == -1) {
            message.error('找不到表格主键')
            return
        }
        const codes = selectedRows.map(row => {
            return `DELETE FROM \`${dbName}\`.\`${tableName}\` WHERE \`${pkField}\` = '${row[pkColIdx].value}';`
        }).join('\n')
        setModalCode(codes)
        setModalVisible(true)

        // Modal.confirm({
        //     title: 'Confirm',
        //     // icon: <ExclamationCircleOutlined />,
        //     content: `删除 ${selectedRowKeys.length} 行记录？`,
        //     okText: '确认',
        //     cancelText: '取消',
        //     async onOk() {

        //     }
        // })
    }

    async function doSubmit() {
        setModalVisible(false)
        setResultModalVisible(true)

        const lines = modelCode.split(';').map(item => item.trim()).filter(item => item)
        let lineIdx = 0
        let newTabs = []
        console.log('lines', lines)
        for (let line of lines) {
            console.log('line', line)
            let res = await request.post(`${config.host}/mysql/execSql`, {
                sql: line,
            }, {
                noMessage: true,
            })
            let error = ''
            if (res.status == 200) {
                // message.success('提交成功')
                
                // run()
                
            }
            else {
                error = res.data.message || 'Unknown Error'
            }
            console.log('res', res)
            const key = `tab-${lineIdx}`
            newTabs = [
                ...newTabs,
                {
                    title: `执行结果 ${lineIdx + 1}`,
                    key,
                    data: {
                        sql: line,
                        resData: res.data,
                        error,
                    }
                }
            ]
            setResultTabs(newTabs)
            setResultActiveKey(key)

            lineIdx++
        }


        resetSubmit()

    }

    const columns = useMemo(() => {
        let columns = [
            {
                title: '#',
                key: '__idx',
                fixed: 'left',
                // width: 120,
                render(_value, _item, _idx) {
                    return (
                        <SimpleCell text={_idx + 1} color="#999" />
                    )
                }
            }
        ]
        let idx = 0
        for (let field of fields) {
            const key = '' + idx
            columns.push({
                title: field.name,
                dataIndex: key,
                key,
                // width: 120,
                render(value: any, item) {
                    return (
                        <Cell
                            editing={editing}
                            item={value}
                            onChange={newItem => {
                                console.log('change', item)
                                console.log('change.newItem', newItem)
                                console.log('change.key', key)
                                console.log('change.list', list)
                                console.log('change.item._idx', item._idx)
                                list[item._idx][key] = newItem
                                setList([
                                    ...list,
                                ])
                                setEditing(true)
                            }}
                        />
                        // <div
                        //     className={styles.cell}
                        //     style={{
                        //         // minWidth: 120,
                        //     }}
                        // >{value}</div>
                    )
                },
            })
            idx++
        }
        return columns
        // return results.map((result, rowIdx) => {
        //     let item = {
        //         _idx: rowIdx,
        //     }
        //     // idx = 0
        //     fields.forEach((field, idx) => {
        //         const key = '' + idx
        //         item[key] = {
        //             fieldName: field.name,
        //             value: result[idx],
        //             index: idx,
        //         }
        //     })
        //     // for (let field of fields) {
        //     //     idx++
        //     // }
        //     return item
        // })
    }, [results, fields, list])

    function TabItem(item: any) {
        return (
            <TabPane
                tab={(
                    <span>
                        {item.data.error ?
                            <CloseCircleOutlined className={styles.failIcon} />
                        :
                            <CheckCircleOutlined className={styles.successIcon} />
                        }
                        {item.title}
                    </span>
                )}
                key={item.key}
                closable={true}
            >
                <div className={styles.modalResultBox}>
                    <div className={styles.sqlBox}>
                        <div>SQL:</div>
                        <div><code>{item.data.sql}</code></div>
                    </div>
                    {!!item.data.error ?
                        <div>
                            <div>Error</div>
                            <div className={styles.errMsg}>{item.data.error}</div>
                        </div>
                    :
                        <div>
                            <div>Info:</div>
                            <div className={styles.info}>
                                {!!item.data.resData.result?.info ? item.data.resData.result?.info : `影响行数：${rawExecResult.affectedRows}`}</div>
                        </div>
                    }
                </div>
            </TabPane>
            // <SqlBox defaultSql={item.defaultSql} />
        )
    }

	return (
        <div className={styles.resultBox}>
            {/* ExecDetail */}
            {/* <div>
            </div> */}
            {loading ?
                <div className={styles.emptyFullBox}>
                    <div>Loading...</div>
                </div>
        : !!error ?
            <div className={styles.emptyFullBox}>
                <div className={styles.errorBox}>{error}</div>
            </div>
            : hasReq ?
                <>
                    {!!result && !rawExecResult &&
                        <div className={styles.header}>
                            <Space>
                                <Button
                                    size="small"
                                    type="primary"
                                    disabled={!(tableName && dbName && editing)}
                                    onClick={() => {
                                        submitModify()
                                    }}
                                >提交修改</Button>
                                <Button
                                    size="small"
                                    onClick={() => {
                                        addRow()
                                    }}
                                >新增</Button>
                                <Button
                                    danger
                                    size="small"
                                    disabled={!(selectedRowKeys.length > 0)}
                                    onClick={() => {
                                        removeSelection()
                                    }}
                                >删除</Button>
                                {!editing &&
                                    <Button
                                        // danger
                                        size="small"
                                        // disabled={!(selectedRowKeys.length > 0)}
                                        onClick={() => {
                                            setEditing(true)
                                        }}
                                    >编辑模式</Button>
                                }
                                <Button
                                    size="small"
                                    // disabled={!(selectedRowKeys.length > 0)}
                                    onClick={() => {
                                        exportData()
                                    }}
                                >导出</Button>
                            </Space>
                        </div>
                    }
                    {!rawExecResult &&
                        <div
                            className={styles.tableBox}
                            ref={tableBoxRef}
                        >
                            <Table
                                loading={loading}
                                dataSource={list}
                                pagination={false}
                                columns={columns}
                                bordered
                                style={{
                                    // width: 600,
                                    // height: '300px',
                                    // border: '1px solid #09c',
                                }}
                                // size="middle"
                                size="small"
                                rowSelection={{
                                    selectedRowKeys,
                                    onChange(selectedRowKeys, selectedRows) {
                                        setSelectedRowKeys(selectedRowKeys)
                                        setSelectedRows(selectedRows)
                                    }
                                }}
                                rowKey="_idx"
                                scroll={{
                                    x: true,
                                    // x: 2000,
                                    // y: document.body.clientHeight - 396,
                                }}
                            />
                        </div>
                    }
                    {!!result &&
                        <div className={styles.footer}>
                            <div>Time: {(result.time / 1000).toFixed(3)} s</div>
                            {!!rawExecResult ?
                                <div>{!!rawExecResult.info ? rawExecResult.info : `影响行数：${rawExecResult.affectedRows}`}</div>
                            :
                                <div>{_list.length} rows</div>
                            }
                            <div>{sql}</div>
                        </div>
                    }
                </>
                :
                <div className={styles.emptyFullBox}>
                    <Empty description="No Request"></Empty>
                </div>
            }
            {modelVisible &&
                <Modal
                    title="提交修改"
                    maskClosable={false}
                    visible={true}
                    width={800}
                    okText="执行"
                    // onOk={handleOk}
                    okButtonProps={{
                        children: '执行',
                    }}
                    onCancel={() => {
                        setModalVisible(false)
                    }}
                    onOk={() => {
                        doSubmit()
                    }}
                >
                    <div className={styles.safeTip}>以下是待执行 SQL，请确认</div>

                    <TextArea
                        // className={styles.textarea} 
                        value={modelCode}
                        rows={4}
                    // disabled
                        onChange={e => setModalCode(e.target.value)}
                    />
                    {/* <p>Some contents...</p>
                    <p>Some contents...</p>
                    <p>Some contents...</p> */}
                </Modal>
            }
            {resultModelVisible &&
                <Modal
                    title="执行状态"
                    visible={true}
                    width={800}
                    // onOk={handleOk}
                    // okButtonProps={{
                    //     children: '执行',
                    // }}
                    onCancel={() => {
                        setResultModalVisible(false)
                    }}
                    // onOk={() => {
                    //     doSubmit()
                    // }}
                    footer={null}
                >
                    <Tabs
                        // onEdit={onEdit}
                        activeKey={resultActiveKey}
                        hideAdd={true}
                        onChange={key => {
                            setResultActiveKey(key)
                        }}
                        type="card"
                        style={{
                            // height: '100%',
                        }}
                    >
                        {resultTabs.map(TabItem)}
                    </Tabs>

                </Modal>
            }
        </div>
    )
}
