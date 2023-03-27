import { Button, Descriptions, Dropdown, Empty, Input, Menu, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useMemo } from 'react';
import { VFC, useRef, useState, useEffect } from 'react';
import { request } from '@/views/db-manager/utils/http';;
import styles from './exec-detail.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import copy from 'copy-to-clipboard';
import { CheckCircleOutlined, CloseCircleOutlined, CopyOutlined, EllipsisOutlined, EyeOutlined, FullscreenOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { IconButton } from '@/views/db-manager/icon-button';
import { CopyButton } from '../copy-button';
import { ExecModal } from '../exec-modal/exec-modal';
import saveAs from 'file-saver'
import { DownloadOutlined } from '@ant-design/icons';
import { t } from 'i18next';
import { RowDetailModal } from '../sql-row-detail-modal/sql-row-detail-modal';
import { RowEditModal } from '../sql-row-edit-modal/sql-row-edit-modal';
import { utils, writeFile } from 'xlsx'


// console.log('XLSX', XLSX)

function getTextLength(text) {
    // let width = 0
    if (text == null) {
        return 0
    }
    // console.log('text', text)
    let length = 0
    const _text = '' + text
    for (let char of _text) {
        // if (char.match(/\d/)) {
        //     width += 1  
        // }
        // else if (char.match(/[a-zA-Z]/)) {
        //     width += 1
        // }
        // else {
        //     width += 12.6
        // }
        if (char.match(/[\u4E00-\u9FA5]/)) {
            length += 2
        }
        else {
            length += 1
        }
    }
    return length
}

function getTextWidth(text) {
    if (text == null) {
        return 0
    }
    // let width = 0
    // console.log('text', text)
    const _text = '' + text
    // for (let char of _text) {
    //     if (char.match(/\d/)) {
    //         width += 10    
    //     }
    //     else if (char.match(/[a-zA-Z]/)) {
    //         width += 10
    //     }
    //     else {
    //         width += 12.6
    //     }
    // }
    // console.log('getTextWidth', _text)

    if (!window.g_canvasForMeasureText) {
        const canvas = document.createElement('CANVAS') as HTMLCanvasElement
        canvas.setAttribute('id', 'g_canvasForMeasureText')
        window.g_canvasForMeasureText = canvas
    }
    let canvas = window.g_canvasForMeasureText as HTMLCanvasElement
    const ctx = canvas.getContext('2d')
    ctx.font = '14px -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji'
    const textWidth = ctx.measureText(_text).width
    // console.log('textWidth', textWidth)
    return textWidth
}

const { TabPane } = Tabs
const { TextArea } = Input

function getMaxWidth(columnNum) {
    const layout_left_width = 320
    const cell_max_width = 320
    const isNotFull = (columnNum * cell_max_width) < (document.body.clientWidth - layout_left_width)
    if (isNotFull) {
        return columnNum * cell_max_width
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

function HeaderCell({ name, onCopyValue }) {
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
            <div className={styles.title}>{name}</div>
            {isHover &&
                <div className={styles.tool}>
                    {/* <CopyButton
                        text={name}
                    >
                        <IconButton title="复制">
                            <CopyOutlined />
                        </IconButton>
                    </CopyButton>
                    <IconButton
                        title="复制"
                        onClick={() => {
                            copy(name)
                            message.success('Copied')
                        }}
                    >
                        <CopyOutlined />
                    </IconButton> */}
                    <Dropdown
                        trigger={['click']}
                        overlay={
                            <Menu
                                items={[
                                    {
                                        label: t('copy'),
                                        key: 'copy',
                                    },
                                    {
                                        label: t('copy_value') + ` (,)`,
                                        key: 'copy_value',
                                    },
                                    {
                                        label: t('copy_value') + ` (\\n)`,
                                        key: 'copy_value_2',
                                    },
                                ]}
                                onClick={({ key, domEvent }) => {
                                    // domEvent.preventDefault()
                                    domEvent.stopPropagation()
                                    if (key == 'copy') {
                                        copy(name)
                                        message.info(t('copied'))
                                    }
                                    else if (key == 'copy_value') {
                                        onCopyValue && onCopyValue('')
                                    }
                                    else if (key == 'copy_value_2') {
                                        onCopyValue && onCopyValue('mult_line')
                                    }
                                }}
                            />
                        }
                    >
                        <IconButton
                            // tooltip={t('add')}
                            className={styles.refresh}
                            // onClick={() => {
                            //     setProjectModalVisible(true)
                            // }}
                        >
                            <EllipsisOutlined />
                        </IconButton>
                    </Dropdown>
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
                        title={t('content')}
                        content={
                            <div className={styles.popoverContent}>
                                <pre>{text}</pre>
                            </div>
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
    const { config, databaseType, connectionId, onJson, data, } = props
    const { t } = useTranslation()
    const { 
        sql,
        // loading, 
        results: _results = [],
        fields = [],
        result, 
        // list: _list = [],
        error,
        hasReq,
        tableName,
        dbName,
        
    } = data || {}

    // const [rowCount] = useState(_results.length)
    const [results, setResults] = useState(_results)

    const tableEditable = useMemo(() => {
        const lowerSql = sql.toLowerCase()
        if (!lowerSql.includes('select')) {
            return false
        }
        if (lowerSql.includes('explain')) {
            return false
        }
        return true
    }, [sql])

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

    const g_dataRef = useRef({})
    const [modelCode, setModalCode] = useState('')
    const [rowEditItem, setRowEditItem] = useState(null)
    const [rowModalItem, setRowModalItem] = useState(null)
    const tableBoxRef = useRef(null)
    const [editing, setEditing] = useState(false)
    const [list, setList] = useState([])
    const [filterKeyword, setFilterKeyword] = useState('')
    const [filterColKeyword, setFilterColKeyword] = useState('')
    const [isFull] = useState(true)
    useEffect(() => {
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
        setList(list)
    }, [results])
    const [removedRows, setRemovedRows] = useState([])

    const [selectedRowKeys, setSelectedRowKeys] = useState([])

    const filteredList = useMemo(() => {
        // console.log('list', list)
        if (!filterKeyword) {
            return list
        }
        const _filterKeyword = filterKeyword.toLowerCase()
        return list.filter(item => {

            for (let key in item) {
                if (item[key] && item[key].value 
                    // && item[key].value.includes
                    && (('' + item[key].value).toLowerCase()).includes(_filterKeyword)) {
                    return true
                }
            }
            return false
        })
    }, [list, filterKeyword])
    async function loadTableInfo() {
        if (dbName && tableName) {
            let res = await request.post(`${config.host}/mysql/tableInfo`, {
                connectionId,
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

    async function updateRows({ schemaName, tableName, pkField, ids }) {
        console.log('updateRows', schemaName, tableName, ids)
        // const sql = `SELECT * FROM \`${schemaName}\`.\`${tableName}\` WHERE \`${pkField}\` IN (${ids.join(', ')})`
        console.log('sql', sql)
        let res = await request.post(`${config.host}/mysql/execSql`, {
            connectionId,
            sql,
            tableName,
            dbName: schemaName,
            logger: false,
        }, {
            // noMessage: true,
        })
        console.log('oldResult', result)
        if (res.success) {
            console.log('newResult', res.data)
            setResults(res.data.results)
            setEditing(false)
        }
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
        

        g_dataRef.current.pkField = pkField

        function wrapName(name) {
            if (databaseType == 'postgresql') {
                return `"${name}"`
            }
            return `\`${name}\``
        }

        const changedKeys = []
        console.log('list', list)
        const sqls = list.map(row => {
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
                    return wrapName(fieldName)
                }).join(', ')
                const valuesText = values.map(value => {
                    return `'${value}'`
                }).join(', ')
                const sql = `INSERT INTO ${wrapName(dbName)}.${wrapName(tableName)} (${fieldNamesText}) VALUES (${valuesText});`
                return sql
            }
            else {

                
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
                    if (pkColIdx == -1) {
                        message.error('找不到表格主键')
                        throw new Error('找不到表格主键')
                        return
                    }
                    let sql = `UPDATE \`${dbName}\`.\`${tableName}\` SET ${updatedFields.join(', ')} WHERE \`${pkField}\` = '${row[pkColIdx].value}';`
                    changedKeys.push(row[pkColIdx].value)
                    
                    return sql
                }
            }
        })
            .filter(item => item)
        if (removedRows.length) {
            sqls.push(...removedRows)
        }
        console.log('sqls', sqls.join('\n'))

        console.log('changedKeys', changedKeys)
        g_dataRef.current.changedKeys = changedKeys
        g_dataRef.current.tableName = tableName
        g_dataRef.current.schemaName = dbName

        setModalCode(sqls.join('\n'))
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
        const resultList = list.map(row => {
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
        console.log('results', resultList)
        const content = JSON.stringify(resultList, null, 4)
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
        const bodyRows = list.map((row, rowIdx) => {
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
            ...bodyRows,
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

    function exportXlsx() {
        const headers = fields.map(item => item.name)
        // console.log('exportCsv', fields)
        // for (let field of fields) {
        //     headers.push(field.name)
        // }
        const bodyRows = list.map((row, rowIdx) => {
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
            ...bodyRows,
        ]
        // console.log('table', table)
        
        function num2leter(num: number) {
            const leters = '_ABCDEFGHIJKLMNOPQRSTUVWXYZ'
            if (num > 26) {
                const first  = Math.floor(num / 26)
                const second = num % 26
                return `${leters.charAt(first)}${leters.charAt(second)}`
            }
            return leters.charAt(num)
        }

        function toString(value: any) {
            if (value == null) {
                return ''
            }
            return '' + value
        }

        function json_to_sheet(table: string[][]) {
            const result = {
                '!ref': `A1:${num2leter(table[0].length)}${table.length}`
            }
            for (let row = 0; row < table.length; row++) {
                const rowData = table[row]
                for (let col = 0; col < rowData.length; col++) {
                    result[`${num2leter(col + 1)}${row + 1}`] = {
                        t: 's',
                        v: toString(rowData[col]),
                    }
                }
            }
            return result
        }

        let ss = json_to_sheet(table)
        // console.log('ss', ss)
        // {
        //     !ref: "A1:B4"
        //     A1: {t: 's', v: '0'}
        //     B4: {t: 's', v: 'u2'}
        // }
        // let keys = Object.keys(ss).sort(); //排序 [需要注意，必须从A1开始]
        
        // let ref = keys[1]+':'+keys[keys.length - 1]; //这个是定义一个字符串 也就是表的范围[A1:C5] 
        let ref = ss['!ref']
        
        const workbook = {
            SheetNames: ['sheetname'],
            Sheets: {
                'sheetname': Object.assign({}, ss, {'!ref': ref})
            },
        }

        writeFile(workbook, `unnamed.xlsx`)
    }

    function exportSql() {
        const resultList = list.map(row => {
            // let 
            const fields = []
            const values = []
            const rowObj: any = {}
            const updatedFields = []
            for (let rowKey in row) {
                if (rowKey != '_idx') { // TODO
                    const cell = row[rowKey]
                    rowObj[cell.fieldName] = cell.value
                    fields.push(cell.fieldName)
                    values.push(cell.value)
                }
            }
            // return rowObj
            function getValue(value) {
                if (typeof value == 'number') {
                    return `${value}`
                }
                if (value === null) {
                    return `NULL`
                }
                return `'${value}'`
            }
            const fields_sql = fields.map(field => `\`${field}\``).join(', ')
            const values_sql = values.map(value => getValue(value)).join(', ')
            const sql = `INSERT INTO \`${dbName}\`.\`${tableName}\` (${fields_sql}) VALUES (${values_sql});`
            return sql
        })
            // .filter(item => item)
            // .join('\n')
        console.log('results', resultList)
        // const content = JSON.stringify(resultList, null, 4)
        onJson && onJson(resultList.join('\n'))
    }

    function selectionDetail() {
        const rowKey = selectedRowKeys[0]
        console.log('rowKey', rowKey)
        console.log('list', list)
        setRowModalItem(list[rowKey])
    }

    function duplicateRow() {
        const rowKey = selectedRowKeys[0]
        console.log('复制', list[rowKey])
        // console.log('list', list)
        // setRowEditItem(list[rowKey])
        const targetRow = list[rowKey]
        let newRow = {
            ...list[rowKey],
            _idx: list.length,
            isNew: true,
        }
        fields.forEach((field, idx) => {
            newRow[idx] = {
                fieldName: field.name,
                value: null,
                newValue: targetRow[idx].newValue || targetRow[idx].value || null,
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

    function selectionEdit() {
        const rowKey = selectedRowKeys[0]
        console.log('rowKey', rowKey)
        console.log('list', list)
        setRowEditItem(list[rowKey])
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
        })
        // console.log('codes', codes)
        // setModalCode(codes.join('\n'))
        setRemovedRows(codes)
        setList(list.filter(item => !selectedRowKeys.includes(item._idx)))
        setSelectedRowKeys([])
        setEditing(true)
        // Modal.confirm({
        //     title: 'Confirm',
        //     // icon: <ExclamationCircleOutlined />,
        //     content: `删除 ${selectedRowKeys.length} 行记录？`,
        //     async onOk() {

        //     }
        // })
    }


    const { columns, tableWidth } = useMemo(() => {
        // console.warn('ExecDetail/useMemo')
        const startTime = new Date()
        // console.log('useMemo', results, fields, list)
        let columns = [
            {
                alwaysShow: true,
                title: '',
                dataIndex: '__start',
                key: '__start',
                width: 48,
                render(value: any, item) {
                    return (
                        <div></div>
                    )
                },
            }
        ]
        let colIdx = 0
        let totalWidth = 0
        const topList = list.slice(0, 1000) // 取前 20 条用于计算，避免行太多导致性能问题
        // console.log('topList', topList)
        for (let field of fields) {
            let width = 280 // UUID 刚好完整显示的宽度 280
            const cellTexts = [field.name] // 这一列头部和内容的数据
            const key = '' + colIdx
            // HACK 加 * 用于修复没有内容的列标题宽度不太够的问题
            let maxTextLength = getTextLength(field.name + '*')
            let maxWidthText = field.name + '*'
            for (let row of topList) {
                const cellText = row[key].newValue || row[key].value || ''
                cellTexts.push(cellText)
                let textWidth = getTextLength(cellText)
                if (textWidth > maxTextLength) {
                    maxTextLength = textWidth
                    maxWidthText = cellText
                }
            }
            let maxTextWidth = getTextWidth(maxWidthText)
            // console.log('maxTextWidth', maxTextWidth)
            // console.log('cellTexts', field.name, cellTexts)
            // for ()
            width = maxTextWidth + 16
                + 16 // hack 修复数字列无法完全显示的问题
            // 至少完整显示 null
            if (width < 48) {
                width = 48
            }
            if (width > 320) {
                width = 320
            }
            totalWidth += width
            columns.push({
                // title: <div>{field.name}</div>,
                // title: '' + field.name,
                __rawTitle: field.name,
                title: (
                    <HeaderCell
                        name={field.name}
                        onCopyValue={(type) => {
                            const values = []
                            for (let item of list) {
                                values.push(item[key].value)
                            }
                            let copyText
                            if (type == 'mult_line') {
                                copyText = values.filter(item => item != null)
                                    // .map(value => {
                                    //     if (value == null) {
                                    //         return 'null'
                                    //     }
                                    //     return `'${value}'`
                                    // })
                                    .join('\n')
                            }
                            else {
                                copyText = values.map(value => {
                                    if (value == null) {
                                        return 'null'
                                    }
                                    return `'${value}'`
                                }).join(', ')
                            }
                            copy(copyText)
                            message.success('Copied')
                        }}
                    />
                ),
                dataIndex: key,
                key,
                width,
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
            colIdx++
        }
        columns.push({
            alwaysShow: true,
            title: '',
            dataIndex: '__end',
            key: '__end',
            // width: 
            render(value: any, item) {
                return (
                    <div data-end="true"></div>
                )
            },
        })
        // console.log('ExecDetail/useMemo/End', new Date().getTime() - startTime.getTime())
        // console.log('totalWidth', totalWidth)
        const tableMinWidth = document.body.clientWidth - 320
        // console.log('tableMinWidth', tableMinWidth)
        return {
            columns,
            tableWidth: Math.max(tableMinWidth, totalWidth),
        }
        
    }, [fields, list])

    const filteredColumns = useMemo(() => {
        // console.log('columns', columns)
        if (!filterColKeyword) {
            return columns
        }
        const _keywords = filterColKeyword.toLowerCase().split(/\s+/).filter(item => item)
        return columns.filter(col => {
            // console.log('col.__rawTitle', )
            if (col.alwaysShow) {
                return true
            }
            for (let _keyword of _keywords) {
                if (col.__rawTitle.toLowerCase().includes(_keyword)) {
                    return true
                }
            }
            return false
        })
    }, [filterColKeyword, columns])

	return (
        <div className={classNames(styles.resultBox, isFull ? styles.full : '')}>
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
                                <Button
                                    size="small"
                                    disabled={!(selectedRowKeys.length == 1)}
                                    onClick={() => {
                                        selectionDetail()
                                    }}
                                >{t('detail')}</Button>
                                {tableEditable &&
                                    <Button
                                        size="small"
                                        type="primary"
                                        disabled={!(tableName && dbName && editing)}
                                        onClick={() => {
                                            submitModify()
                                        }}
                                    >{t('submit_modify')}</Button>
                                }
                                {tableEditable &&
                                    <Button
                                        size="small"
                                        onClick={() => {
                                            addRow()
                                        }}
                                    >{t('add')}</Button>
                                }
                                {tableEditable &&
                                    <Button
                                        size="small"
                                        disabled={!(selectedRowKeys.length == 1)}
                                        onClick={() => {
                                            selectionEdit()
                                        }}
                                    >{t('edit')}</Button>
                                }
                                {tableEditable &&
                                    <Button
                                        size="small"
                                        disabled={!(selectedRowKeys.length == 1)}
                                        onClick={() => {
                                            duplicateRow()
                                        }}
                                    >{t('row_duplicate')}</Button>
                                }
                                {tableEditable &&
                                    <Button
                                        danger
                                        size="small"
                                        disabled={!(selectedRowKeys.length > 0)}
                                        onClick={() => {
                                            removeSelection()
                                        }}
                                    >{t('delete')}</Button>
                                }
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
                                                if (info.key == 'export_csv') {
                                                    exportCsv()
                                                }
                                                else if (info.key == 'export_json') {
                                                    exportJson()
                                                }
                                                else if (info.key == 'export_xlsx') {
                                                    exportXlsx()
                                                }
                                                else if (info.key == 'export_sql') {
                                                    exportSql()
                                                }
                                            }}
                                            items={[
                                                {
                                                    label: t('export_json'),
                                                    key: 'export_json',
                                                },
                                                {
                                                    label: t('export_csv'),
                                                    key: 'export_csv',
                                                },
                                                {
                                                    label: t('export_xlsx'),
                                                    key: 'export_xlsx',
                                                },
                                                {
                                                    label: t('export_sql'),
                                                    key: 'export_sql',
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
                                {/* <IconButton
                                    tooltip={t('fullscreen')}
                                    onClick={() => {
                                        // setAllList(allList.filter(_item => _item.id != item.id))
                                        setIsFull(true)
                                    }}
                                >
                                    <FullscreenOutlined />   
                                </IconButton> */}
                            </Space>
                            <Space>
                                <Input.Search
                                    className={styles.filterSearch}
                                    placeholder={t('filter_column')}
                                    size="small"
                                    allowClear
                                    onChange={e => {
                                        const value = e.target.value
                                        // console.log('onChange', value)
                                        if (!value) {
                                            setFilterColKeyword('')
                                        }
                                    }}
                                    onSearch={value => {
                                        // console.log('onSearch', value)
                                        setFilterColKeyword(value)
                                    }}
                                />
                                <Input.Search
                                    placeholder={t('filter_row')}
                                    size="small"
                                    allowClear
                                    onChange={e => {
                                        const value = e.target.value
                                        // console.log('onChange', value)
                                        if (!value) {
                                            setFilterKeyword('')
                                        }
                                    }}
                                    onSearch={value => {
                                        // console.log('onSearch', value)
                                        setFilterKeyword(value)
                                    }}
                                />
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
                                dataSource={filteredList}
                                pagination={false}
                                columns={filteredColumns}
                                bordered
                                style={{
                                    // maxWidth: getMaxWidth(columns.length),
                                    maxWidth: tableWidth,
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
                                    renderCell(_value, _item, rowIdx) {
                                        // return (
                                        //     <div>
                                        //         <Button>1</Button>
                                        //     </div>
                                        // )
                                        return (
                                            <SimpleCell
                                                onClick={(e) => {
                                                    // console.log('_value', _value)
                                                    // console.log('e', e)
                                                    
                                                    const itemKey = _item._idx
                                                    // console.log('itemKey', itemKey)
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
                                                        if (selectedRowKeys.includes(itemKey)) {
                                                            setSelectedRowKeys([])
                                                        }
                                                        else {
                                                            setSelectedRowKeys([itemKey])
                                                        }
                                                    }
                                                }}
                                                text={rowIdx + 1} color="#999" />
                                        )
                                    },
                                    columnWidth: 0,
                                    onChange(selectedRowKeys, selectedRows) {
                                        setSelectedRowKeys(selectedRowKeys)
                                    }
                                }}
                                rowKey="_idx"
                                scroll={{
                                    // x: true,
                                    x: tableWidth,
                                    y: document.body.clientHeight - 546,
                                }}
                            />
                            <div className={styles.topLeft}></div>
                        </div>
                    :
                        <div className={styles.emptyFullBox}>
                            <CheckCircleOutlined className={styles.successIcon} />
                            {/* {t('no_content')} */}
                            {t('success')}
                        </div>
                    }
                    {!!result &&
                        <div className={styles.footer}>
                            <div>{t('duration')}: {' '}
                                <span
                                    style={{
                                        color: result.time < 1000 ? 'green': 'red',
                                    }}
                                >{(result.time / 1000).toFixed(3)} s</span>
                            </div>
                            {!!rawExecResult ?
                                <div style={{ color: 'green' }}>{!!rawExecResult.info ? rawExecResult.info : `影响行数：${rawExecResult.affectedRows}`}</div>
                            :
                                <div>{results.length} {t('rows')}</div>
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
                    connectionId={connectionId}
                    sql={modelCode}
                    tableName={null}
                    dbName={dbName}
                    onClose={() => {
                        setModalCode('')
                    }}
                    onSuccess={() => {
                        console.log('成功了，刷新数据', g_dataRef)
                        // changedKeys
                        // pkField
                        console.log('成功了，刷新数据/sql', sql)
                        console.log('成功了，刷新数据/time', result.time)
                        updateRows({
                            schemaName: g_dataRef.current.schemaName,
                            tableName: g_dataRef.current.tableName,
                            pkField: g_dataRef.current.pkField,
                            ids: g_dataRef.current.changedKeys,
                        })
                    }}
                />
            }
            {!!rowModalItem &&
                <RowDetailModal
                    item={rowModalItem}
                    onCancel={() => {
                        setRowModalItem(null)
                    }}
                />
            }
            {!!rowEditItem &&
                <RowEditModal
                    item={rowEditItem}
                    onCancel={() => {
                        setRowEditItem(null)
                    }}
                    onOk={(values) => {
                        console.log('onOk', values, rowEditItem)
                        console.log('list[rowEditItem._idx]', list[rowEditItem._idx])
                        for (let field in values) {
                            // list[rowEditItem._idx][field] = values[field]
                            for (let idx in list[rowEditItem._idx]) {
                                const cell = list[rowEditItem._idx][idx]
                                if (cell.fieldName == field) {
                                    if (values[field] != list[rowEditItem._idx][idx].value) {
                                        list[rowEditItem._idx][idx].newValue = values[field]
                                    }
                                }
                            }
                        }
                        console.log('newItem', list[rowEditItem._idx])
                        setList([
                            ...list,
                        ])
                        setEditing(true)
                        setRowEditItem(null)
                    }}
                />
            }
        </div>
    )
}
