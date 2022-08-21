import React, { useState, useEffect, useRef, useMemo } from 'react'
import styles from './index.module.less'
import { message, Input, Modal, Button, Table, Popover, Space, Empty, Result } from 'antd'
// import http from '@/utils/http'
import classNames from 'classnames'
import { Editor } from '../../editor/Editor'
// import axios from 'axios'
import copy from 'copy-to-clipboard';
import { request } from '../../utils/http'
import { format } from 'sql-formatter'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

const { confirm } = Modal

const { TextArea } = Input

export interface Props {
    defaultSql?: string;
    style: any
}


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
                >NULL({item.newValue})</span>
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

function SqlBox({ config, tableName, dbName, className, defaultSql, style }: Props) {

    console.log('defaultSql', defaultSql)

    const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
    const [error, setError] = useState('')
    const [selectedRowKeys, setSelectedRowKeys] = useState([])
    const [selectedRows, setSelectedRows] = useState([])
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState({})
    const [editing, setEditing] = useState(false)
    // const [editing, setEditing] = useState(false)
    const [hasReq, setHasReq] = useState(false)
    const [code, setCode] = useState(defaultSql)
    const [code2, setCode2] = useState(defaultSql)
    const [list, setList] = useState([])
    // const [columns, setColumns] = useState([])
    const [tableInfo, setTableInfo] = useState([])
    const [modelVisible, setModalVisible] = useState(false)
    const [modelCode, setModalCode] = useState('')
    const [fields, setFields] = useState([])
    const [results, setResults] = useState([])


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

    useEffect(() => {
        // console.log('onMouneed', storage.get('dbInfo', ''))
        // setCode(storage.get('dbInfo', ''))

        // run()
    }, [])

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
                    fieldNames.push(fieldName)
                    let value = null
                    for (let rowKey in row) {
                        if (rowKey != '_idx') { // TODO
                            const cell = row[rowKey]
                            if (cell.fieldName == fieldName) {
                                value = cell.newValue || cell.value
                                break // TODO 重名
                            }
                        }
                    }
                    // for (let cell of row) {
                    // }
                    values.push(value)
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

    async function doRemove() {
        let res = await request.post(`${config.host}/mysql/execSql`, {
            sql: modelCode,
        }, {
            // noMessage: true,
        })
        if (res.status == 200) {
            message.success('提交成功')
            setModalVisible(false)
            run()
        }
        console.log('res', res)


    }

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

    useEffect(() => {
        loadTableInfo()
    }, [])

    function runPlain() {
        if (!code2) {
            message.warn('没有要执行的 SQL')
            return
        }
        _run('explain ' + code2)
    }

    function formatSql() {
        // console.log('ff', format(code2))
        // setCode('1212 format' + new Date().getTime())
        // setCode(format(code2))
        // editor?.setValue('1212 format' + new Date().getTime())
        editor?.setValue(format(code2, {
            tabWidth: 4,
        }))
    }

    async function run() {
        if (!code2) {
            message.warn('没有要执行的 SQL')
            return
        }
        _run(code2)
    }

    async function _run(execCode) {
        setLoading(true)
        setError('')
        setResult(null)
        setSelectedRows([])
        setSelectedRowKeys([])
        setEditing(false)
        let res = await request.post(`${config.host}/mysql/execSql`, {
            sql: execCode,
        }, {
            noMessage: true,
        })
        console.log('res', res)
        if (res.status === 200) {
            // message.success('执行成功')
            console.log(res)
            const { results, fields } = res.data
            setResults(results)
            // let columns = [
            //     {
            //         title: '#',
            //         key: '__idx',
            //         fixed: 'left',
            //         // width: 120,
            //         render(_value, _item, _idx) {
            //             return (
            //                 <SimpleCell text={_idx + 1} color="#999" />
            //             )
            //         }
            //     }
            // ]
            // let idx = 0
            // for (let field of fields) {
            //     const key = '' + idx
            //     columns.push({
            //         title: field.name,
            //         dataIndex: key,
            //         key,
            //         // width: 120,
            //         render(value: any, item) {
            //             return (
            //                 <Cell
            //                     editing={editing}
            //                     item={value}
            //                     onChange={newItem => {
            //                         console.log('change', item)
            //                         console.log('change.newItem', newItem)
            //                         console.log('change.key', key)
            //                         console.log('change.list', list)
            //                         console.log('change.item._idx', item._idx)
            //                         list[item._idx][key] = newItem
            //                         setList([
            //                             ...list,
            //                         ])
            //                         setEditing(true)
            //                     }}
            //                 />
            //                 // <div
            //                 //     className={styles.cell}
            //                 //     style={{
            //                 //         // minWidth: 120,
            //                 //     }}
            //                 // >{value}</div>
            //             )
            //         },
            //     })
            //     idx++
            // }
            const list = results.map((result, rowIdx) => {
                let item = {
                    _idx: rowIdx,
                }
                // idx = 0
                fields.forEach((field, idx) => {
                    const key = '' + idx
                    item[key] = {
                        fieldName: field.name,
                        value: result[idx],
                        index: idx,
                    }
                })
                // for (let field of fields) {
                //     idx++
                // }
                return item
            })

            // for (let result of results) {
            // }
            // console.log('list', list)

            // if (res.data[0]) {
            //     for (let key in res.data[0]) {
            //         columns.push({
            //             title: key,
            //             dataIndex: key,
            //             key,
            //             // width: 120,  
            //             render(value: any) {
            //                 return (
            //                     <Cell text={value} />
            //                     // <div
            //                     //     className={styles.cell}
            //                     //     style={{
            //                     //         // minWidth: 120,
            //                     //     }}
            //                     // >{value}</div>
            //                 )
            //             },
            //         })
            //     }
            // }
            setList(list)
            // setColumns(columns)
            setLoading(false)
            setHasReq(true)
            setResult(res.data)
            setFields(fields)
        }
        else {
            setLoading(false)
            setHasReq(true)
            setError(res.data.message || 'Unknown Error')
        }
        // else {
        //     message.error('执行失败')
        // }
    }


    // let columns = [

    // ]
    console.log('render.list.length', list.length)

    return (
        <div className={classNames(styles.sqlBox, className)} style={style}>
            <div className={styles.editorBox}>
                <div className={styles.toolBox}>
                    <Space>
                        <Button type="primary" size="small" onClick={run}>执行</Button>
                        <Button size="small" onClick={runPlain}>执行计划</Button>
                        <Button size="small" onClick={formatSql}>格式化</Button>
                    </Space>
                </div>
                <div className={styles.codeBox}>
                    <Editor
                        value={code}
                        onChange={value => setCode2(value)}
                        onEditor={editor => {
                            setEditor(editor)
                        }}
                    />
                    {/* <TextArea 
                        className={styles.textarea} 
                        value={code}
                        rows={4} 
                        // onChange={e => setCode(e.target.value)} />
                        onChange={e => setCode2(e.target.value)} /> */}
                </div>
            </div>
            <div className={styles.resultBox}>
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
                        {!!result &&
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
                                </Space>
                            </div>
                        }
                        <div className={styles.tableBox}>
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
                        {!!result &&
                            <div className={styles.footer}>
                                Time: {result.time} ms
                            </div>
                        }
                    </>
                :
                    <div className={styles.emptyFullBox}>
                        <Empty description="No Request"></Empty>
                    </div>
                }
            </div>
            {modelVisible &&
                <Modal
                    title="提交修改" 
                    visible={true}
                    width={800  }
                    // onOk={handleOk}
                    okButtonProps={{
                        children: '执行',
                    }}
                    onCancel={() => {
                        setModalVisible(false)
                    }}
                    onOk={() => {
                        doRemove()
                    }}
                >
                    <div>以下是待执行 SQL，请确认</div>

                    <TextArea 
                        // className={styles.textarea} 
                        value={modelCode}
                        rows={4}
                        // disabled
                        // onChange={e => setCode(e.target.value)}
                    />
                    {/* <p>Some contents...</p>
                    <p>Some contents...</p>
                    <p>Some contents...</p> */}
                </Modal>
            }
        </div>
    )
}
export default SqlBox
