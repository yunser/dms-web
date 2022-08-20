import React, { useState, useEffect } from 'react'
import styles from './index.module.less'
import { message, Input, Modal, Button, Table, Popover, Space, Empty, Result } from 'antd'
// import http from '@/utils/http'
import classNames from 'classnames'
import { Editor } from '../../editor/Editor'
import axios from 'axios'
import copy from 'copy-to-clipboard';
import { request } from '../../utils/http'

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

function Cell({ text, color }) {
    return (
        <div
            className={styles.cell}
            style={{
                color,
            }}
        >
            {text == null ?
                <span className={styles.null}>NULL</span>
            :
                <span className={styles.text}>{text}</span>
            }
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
        </div>
    )
}

function SqlBox({ config, tableName, dbName, className, defaultSql, style }: Props) {

    console.log('defaultSql', defaultSql)

    const [error, setError] = useState('')
    const [selectedRowKeys, setSelectedRowKeys] = useState([])
    const [selectedRows, setSelectedRows] = useState([])
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState({})
    const [hasReq, setHasReq] = useState(false)
    const [code, setCode] = useState(defaultSql)
    const [code2, setCode2] = useState(defaultSql)
    const [table, setTable] = useState({
        columns: [],
        list: [],
    })
    const [tableInfo, setTableInfo] = useState([])
    const [modelVisible, setModalVisible] = useState(false)
    const [modelCode, setModalCode] = useState('')
    const [fields, setFields] = useState([])

    useEffect(() => {
        // console.log('onMouneed', storage.get('dbInfo', ''))
        // setCode(storage.get('dbInfo', ''))

        // run()
    }, [])

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
            return `DELETE FROM \`${dbName}\`.\`${tableName}\` WHERE \`${pkField}\` = '${row[pkColIdx]}';`
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
            message.success('删除成功')
            setModalVisible(false)
            run()
        }
        console.log('res', res)


    }

    async function loadTableInfo() {
        if (dbName && tableName) {
            let res = await request.get(`${config.host}/mysql/databases/${dbName}/tables/${tableName}`, {
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
        _run('explain ' + code2)
    }

    async function run() {
        _run(code2)
    }

    async function _run(execCode) {
        setLoading(true)
        setError('')
        setResult(null)
        setSelectedRows([])
        setSelectedRowKeys([])
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
                    render(value: any) {
                        return (
                            <Cell text={value} />
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
            const list = results.map((result, rowIdx) => {
                let item = {
                    _idx: rowIdx,
                }
                idx = 0
                for (let field of fields) {
                    const key = '' + idx
                    item[key] = result[idx]
                    idx++
                }
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
            setTable({
                columns,
                list,
            })
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

    return (
        <div className={classNames(styles.sqlBox, className)} style={style}>
            <div className={styles.editorBox}>
                <div className={styles.toolBox}>
                    <Space>
                        <Button type="primary" size="small" onClick={run}>执行</Button>
                        <Button size="small" onClick={runPlain}>执行计划</Button>
                    </Space>
                </div>
                <div className={styles.codeBox}>
                    <Editor
                        value={code}
                        onChange={value => setCode2(value)}
                    />
                    {/* <TextArea 
                        className={styles.textarea} 
                        value={code}
                        rows={4} 
                        onChange={e => setCode(e.target.value)} /> */}
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
                                        danger
                                        size="small"
                                        disabled={!(selectedRowKeys.length > 0)}
                                        onClick={() => {
                                            removeSelection()
                                        }}
                                    >删除</Button>
                                </Space>
                            </div>
                        }
                        <div className={styles.tableBox}>
                            <Table
                                loading={loading}
                                dataSource={table.list}
                                pagination={false}
                                columns={table.columns}
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
                    title="删除" 
                    visible={true}
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
