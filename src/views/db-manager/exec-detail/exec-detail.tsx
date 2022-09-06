import { Button, Descriptions, Dropdown, Empty, Input, Menu, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useMemo } from 'react';
import { VFC, useRef, useState, useEffect } from 'react';
import { request } from '../utils/http';
import styles from './exec-detail.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import copy from 'copy-to-clipboard';
import { CheckCircleOutlined, CloseCircleOutlined, CopyOutlined, EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { IconButton } from '../icon-button';
import { CopyButton } from '../copy-button';
import { ExecModal } from '../exec-modal/exec-modal';
import saveAs from 'file-saver';
import { DownloadOutlined } from '@ant-design/icons';

const { TabPane } = Tabs
const { TextArea } = Input

function getMaxWidth(columnNum) {
    if (columnNum <= 4) {
        return columnNum * 320
    }
    return undefined
}

function SimpleCell({ onClick, text, color }) {
    return (
        <div
        onClick={onClick}
            className={styles.idxCell}
        // style={{
        //     color,
        // }}
        >
            <span className={styles.text}>{text}</span>
        </div>
    )
}

function HeaderCell({ name }) {
    const [isHover, setIsHover] = useState(false)

    const timer_ref = useRef(0)

    useEffect(() => {
        return () => {
            if (timer_ref.current) {
                clearTimeout(timer_ref.current)
            }
        }
    }, [])

    return (
        <div
            className={styles.titleCell}
            onMouseEnter={() => {
                timer_ref.current = setTimeout(() => {
                    timer_ref.current = 0
                    setIsHover(true)
                }, 1000)
            }}
            onMouseLeave={() => {
                setIsHover(false)
                if (timer_ref.current) {
                    clearTimeout(timer_ref.current)
                }
            }}
        >
            {name}
            {isHover &&
                <div className={styles.tool}>
                    <CopyButton
                        text={name}
                    >
                        <IconButton title="复制">
                            <CopyOutlined />
                        </IconButton>
                    </CopyButton>
                    {/* <IconButton
                        title="复制"
                        onClick={() => {
                            copy(name)
                            message.success('Copied')
                        }}
                    >
                        <CopyOutlined />
                    </IconButton> */}
                </div>
            }
        </div>
    )
}
function Cell({ item, editing, onChange }) {
    // console.log('Cell.item', item)
    // TODO 先 run 再 explain item 就会为空，不清楚原因
    if (!item) {
        return null
    }
    const [isEdit, setIsEdit] = useState(false)
    const text = item.newValue || item.value
    const [value, setValue] = useState(text)
    const inputRef = useRef(null)
    const [isHover, setIsHover] = useState(false)
    const timer_ref = useRef(0)

    useEffect(() => {
        if (isEdit) {
            inputRef.current!.focus();
        }
    }, [isEdit]);

    useEffect(() => {
        return () => {
            if (timer_ref.current) {
                clearTimeout(timer_ref.current)
            }
        }
    }, [])

    return (
        <div
            className={classNames(styles.cell, {
                [styles.edited]: !!item.newValue
            })}
            onMouseEnter={() => {
                timer_ref.current = setTimeout(() => {
                    timer_ref.current = 0
                    setIsHover(true)
                }, 1000)
            }}
            onMouseLeave={() => {
                setIsHover(false)
                if (timer_ref.current) {
                    clearTimeout(timer_ref.current)
                }
            }}
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
            {!isEdit && isHover &&
                <div className={styles.tool}>
                    <CopyButton
                        text={text == null ? 'null' : text}
                    >
                        <IconButton title="复制">
                            <CopyOutlined />
                        </IconButton>
                    </CopyButton>
                    <Popover
                        title="Content"
                        content={
                            <div className={styles.content}>{text}</div>
                        }
                    >
                        <IconButton title="查看">
                            <EyeOutlined />
                        </IconButton>
                    </Popover>
                </div>
            }
        </div>
    )
}

// let g_last
// export function ExecDetail(props) {
//     console.warn('ExecDetail/render', props)
//     console.log('ExecDetail/g_last', g_last)
//     if (!g_last) {
//         g_last = props.data
//         console.log('ExecDetail/same_init')
//     }
//     else {
//         console.log('ExecDetail/same', g_last === props.data)
//     }
//     return (
//         <div>1212</div>
//     )
// }
export function ExecDetail(props) {
    console.warn('ExecDetail/render')
    const { config, onJson, data, } = props
    const { t } = useTranslation()
    const { 
        sql,
        // loading, 
        results = [],
        fields = [],
        result, 
        list: _list = [],
        error,
        hasReq,
        tableName,
        dbName,
        
    } = data || {}

    // console.timeEnd()
    const rawExecResult = result?.result
    // console.log('ExecDetail/render', JSON.stringify(props))
    // console.warn('ExecDetail/render')
    if (window._startTime) {
        // console.log('ExecDetail/time', new Date().getTime() - window._startTime.getTime())
    }
    else {
        // console.log('ExecDetail/time')
    }
    // console.log('ExecDetail/rawExecResult', rawExecResult)
    // console.log('ExecDetail/results.length', results.length)

    const tableInfoList = useRef([])
    // console.log('tableInfo_will', tableInfoList)

    const [modelCode, setModalCode] = useState('')
    const tableBoxRef = useRef(null)
    const [editing, setEditing] = useState(false)
    const [list, setList] = useState(_list)
    const [selectedRowKeys, setSelectedRowKeys] = useState([])

    async function loadTableInfo() {
        if (dbName && tableName) {
            let res = await request.post(`${config.host}/mysql/tableInfo`, {
                dbName,
                tableName,
            }, {
                noMessage: true,
            })
            // console.log('loadTableInfo', res)
            if (res.success) {
                tableInfoList.current = res.data
            }
        }
    }

    function resetSubmit() {

    }

    useEffect(() => {
        // console.log('ExecDetail/useEffect/loadTableInfo')
        loadTableInfo()
    }, [dbName, tableName])

    function submitModify() {
        let pkField: string | number
        for (let field of tableInfoList.current) {
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

    function exportJson() {
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
        onJson && onJson(content)
        // copy(content)
        // message.success('Copied')
    }

    function exportCsv() {
        const headers = fields.map(item => item.name)
        // console.log('exportCsv', fields)
        // for (let field of fields) {
        //     headers.push(field.name)
        // }
        const results = list.map((row, rowIdx) => {
            const rows = []
            for (let rowKey in row) {
                if (rowIdx == 0 && rowKey == '_idx') {
                    const cell = row[rowKey]
                    // console.log('header_cell', cell)
                }
                if (rowKey != '_idx') { // TODO
                    const cell = row[rowKey]
                    rows.push(cell.value)
                }
            }
            return rows
        })
            // .filter(item => item)
            // .join('\n')
        // console.log('results', results)
        const table = [
            headers,
            ...results,
        ]
        // console.log('table', table)
        const content = table.map(row => row.join(',')).join('\n')
        // console.log('content', content)
        // onJson && onJson(content)
        // copy(content)
        // message.success('Copied')
        const blob = new Blob([content], {type: 'text/csv;charset=utf-8'});
        saveAs(blob, 'unnamed.csv')
    }

    async function removeSelection() {
        // if 
        console.log('tableInfo', tableInfoList.current)
        let pkField: string | number
        for (let field of tableInfoList.current) {
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
        const pkColIdx = fields.findIndex(item => item.name == pkField)
        console.log('pkColIdx', pkColIdx)
        if (pkColIdx == -1) {
            message.error('找不到表格主键')
            return
        }
        
        const codes = selectedRowKeys.map(rowKey => {
            return `DELETE FROM \`${dbName}\`.\`${tableName}\` WHERE \`${pkField}\` = '${list[rowKey][pkColIdx].value}';`
        }).join('\n')
        console.log('codes', codes)
        setModalCode(codes)

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


    const columns = useMemo(() => {
        // console.warn('ExecDetail/useMemo')
        const startTime = new Date()
        // console.log('useMemo', results, fields, list)
        let columns = []
        let idx = 0
        for (let field of fields) {
            const key = '' + idx
            columns.push({
                // title: <div>{field.name}</div>,
                // title: '' + field.name,
                title: (
                    <HeaderCell name={field.name} />
                ),
                dataIndex: key,
                key,
                // width: 120,
                render(value: any, item) {
                    // console.log('Cell.value?', value)
                    // return (
                    //     <div>{value.value}</div>
                    // )
                    return (
                        <Cell
                            editing={editing}
                            item={value}
                            onChange={newItem => {
                                // console.log('change', item)
                                // console.log('change.newItem', newItem)
                                // console.log('change.key', key)
                                // console.log('change.list', list)
                                // console.log('change.item._idx', item._idx)
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
        // console.log('ExecDetail/useMemo/End', new Date().getTime() - startTime.getTime())
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


	return (
        <div className={styles.resultBox}>
            {/* ExecDetail */}
            {/* <div>
            </div> */}
            {
            // loading ?
            //     <div className={styles.emptyFullBox}>
            //         <div>Loading...</div>
            //     </div>
            !!error ?
                <div className={styles.resultFullBox}>
                    <div className={styles.titleContentBox}>
                        <div className={styles.title}>SQL</div>
                        <div className={styles.content}>
                            <code><pre>{sql}</pre></code>
                        </div>
                    </div>
                    <div className={styles.titleContentBox}>
                        <div className={styles.title}>Error</div>
                        <div className={styles.content}>
                            <div className={styles.errorBox}>{error}</div>
                        </div>
                    </div>
                </div>
            : hasReq ?
                <>
                    {!!result && !rawExecResult &&
                        <div className={styles.header}>
                            <Space>
                                {/* 提交修改 */}
                                <Button
                                    size="small"
                                    type="primary"
                                    disabled={!(tableName && dbName && editing)}
                                    onClick={() => {
                                        submitModify()
                                    }}
                                >{t('submit_modify')}</Button>
                                {/* 新增 */}
                                <Button
                                    size="small"
                                    onClick={() => {
                                        addRow()
                                    }}
                                >{t('add')}</Button>
                                {/* 删除 */}
                                <Button
                                    danger
                                    size="small"
                                    disabled={!(selectedRowKeys.length > 0)}
                                    onClick={() => {
                                        removeSelection()
                                    }}
                                >{t('delete')}</Button>
                                {/* {!editing &&
                                    <Button
                                        // danger
                                        size="small"
                                        // disabled={!(selectedRowKeys.length > 0)}
                                        onClick={() => {
                                            setEditing(true)
                                        }}
                                    >编辑模式</Button>
                                } */}
                                <Dropdown
                                    overlay={
                                        <Menu
                                            onClick={info => {
                                                console.log('info', info)
                                                if (info.key == 'export_csv') {
                                                    exportCsv()
                                                }
                                                else if (info.key == 'export_json') {
                                                    exportJson()
                                                }
                                            }}
                                            items={[
                                                {
                                                    label: t('export_csv'),
                                                    key: 'export_csv',
                                                },
                                                {
                                                    label: t('export_json'),
                                                    key: 'export_json',
                                                },
                                            ]}
                                        />
                                    }
                                >
                                    {/* <Button>
                                        <Space>
                                        Button
                                        <DownOutlined />
                                        </Space>
                                    </Button> */}
                                    <IconButton
                                        size="small"
                                    >
                                        <DownloadOutlined />   
                                    </IconButton>
                                </Dropdown>
                                {/* <Button
                                    size="small"
                                    onClick={() => {
                                        exportJson()
                                    }}
                                >{t('export')}</Button> */}
                                {/* <Button
                                    size="small"
                                    onClick={() => {
                                        exportCsv()
                                    }}
                                >
                                    Export CSV
                                </Button> */}
                            </Space>
                        </div>
                    }
                    {!rawExecResult ?
                        <div
                            className={styles.tableBox}
                            ref={tableBoxRef}
                        >
                            {/* TTT */}
                            <Table
                                // loading={loading}
                                dataSource={list}
                                pagination={false}
                                columns={columns}
                                // columns={[
                                //     {
                                //         title: 'Name',
                                //         dataIndex: '_idx',
                                //     }
                                // ]}
                                bordered
                                style={{
                                    maxWidth: getMaxWidth(columns.length),
                                    // width: 600,
                                    // height: '300px',
                                    // border: '1px solid #09c',
                                }}
                                // size="middle"
                                size="small"
                                rowSelection={{
                                    selectedRowKeys,
                                    hideSelectAll: true,
                                    fixed: true,
                                    renderCell(_value, _item, _idx) {
                                        // return (
                                        //     <div>
                                        //         <Button>1</Button>
                                        //     </div>
                                        // )
                                        return (
                                            <SimpleCell
                                                onClick={(e) => {
                                                    // console.log('_value', _value)
                                                    console.log('e', e)
                                                    
                                                    const itemKey = _item._idx
                                                    console.log('itemKey', itemKey)
                                                    // 多选

                                                    if (e.metaKey) {
                                                        console.log('metaKey')
                                                        if (selectedRowKeys.includes(itemKey)) {
                                                            console.log('又了')
                                                            setSelectedRowKeys(selectedRowKeys.filter(it => it != itemKey))
                                                        }
                                                        else {
                                                            console.log('没有')
                                                            setSelectedRowKeys([...selectedRowKeys, itemKey])
                                                        }
                                                    }
                                                    else if (e.shiftKey) {
                                                        if (selectedRowKeys.length) {
                                                            const fromIdx = selectedRowKeys[0]
                                                            const min = Math.min(fromIdx, itemKey)
                                                            const max = Math.max(fromIdx, itemKey)
                                                            const newKeys = []
                                                            for (let i = min; i <= max; i++) {
                                                                newKeys.push(i)
                                                            }
                                                            setSelectedRowKeys(newKeys)
                                                        }
                                                        else {
                                                            setSelectedRowKeys([itemKey])
                                                        }
                                                    }
                                                    else {
                                                        console.log('单选')
                                                        // 单选
                                                        
                                                        setSelectedRowKeys([itemKey])
                                                    }
                                                }}
                                                text={_idx + 1} color="#999" />
                                        )
                                    },
                                    columnWidth: 0,
                                    onChange(selectedRowKeys, selectedRows) {
                                        setSelectedRowKeys(selectedRowKeys)
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
                    :
                        <div className={styles.emptyFullBox}>
                            {t('no_content')}
                        </div>
                    }
                    {!!result &&
                        <div className={styles.footer}>
                            <div>{t('time')}: {(result.time / 1000).toFixed(3)} s</div>
                            {!!rawExecResult ?
                                <div style={{ color: 'green' }}>{!!rawExecResult.info ? rawExecResult.info : `影响行数：${rawExecResult.affectedRows}`}</div>
                            :
                                <div>{_list.length} {t('rows')}</div>
                            }
                            <Popover
                                title="SQL"
                                content={
                                    <div className={styles.content}>
                                        {/* {sql} */}
                                        <code><pre>{sql}</pre></code>
                                    </div>
                                }
                            >
                                <div className={styles.sql}>{sql}</div>
                            </Popover>
                        </div>
                    }
                </>
                :
                <div className={styles.emptyFullBox}>
                    <Empty description="No Request"></Empty>
                </div>
            }
            {!!modelCode &&
                <ExecModal
                    config={config}
                    sql={modelCode}
                    tableName={null}
                    dbName={dbName}
                    onClose={() => {
                        setModalCode('')
                    }}
                />
            }
        </div>
    )
}
