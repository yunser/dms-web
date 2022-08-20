import React, { useState, useEffect } from 'react'
import styles from './index.module.less'
import { message, Input, Button, Table, Popover, Space, Empty } from 'antd'
// import http from '@/utils/http'
import classNames from 'classnames'
import { Editor } from '../../editor/Editor'
import axios from 'axios'
import copy from 'copy-to-clipboard';
import { request } from '../../utils/http'

const { TextArea } = Input

export interface Props {
    defaultSql?: string;
    style: any
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

function SqlBox({ config, className, defaultSql, style }: Props) {

    console.log('defaultSql', defaultSql)

    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [hasReq, setHasReq] = useState(false)
    const [code, setCode] = useState(defaultSql)
    const [code2, setCode2] = useState(defaultSql)
    const [table, setTable] = useState({
        columns: [],
        list: [],
    })

    useEffect(() => {
        // console.log('onMouneed', storage.get('dbInfo', ''))
        // setCode(storage.get('dbInfo', ''))

        // run()
    }, [])

    function runPlain() {
        _run('explain ' + code2)
    }

    async function run() {
        _run(code2)
        // setLoading(true)
        // let res = await axios.post(`${config.host}/mysql/execSql`, {
        //     sql: code2,
        // })
        // if (res.status === 200) {
        //     // message.success('执行成功')
        //     console.log(res)
        //     let columns = [
        //         {
        //             title: '序号',
        //             key: '__idx',
        //             fixed: 'left',
        //             // width: 120,
        //             render(_value, _item, _idx) {
        //                 return (
        //                     <Cell text={_idx} />
        //                 )
        //             }
        //         }
        //     ]
        //     if (res.data[0]) {
        //         for (let key in res.data[0]) {
        //             columns.push({
        //                 title: key,
        //                 dataIndex: key,
        //                 key,
        //                 // width: 120,  
        //                 render(value: any) {
        //                     return (
        //                         <Cell text={value} />
        //                         // <div
        //                         //     className={styles.cell}
        //                         //     style={{
        //                         //         // minWidth: 120,
        //                         //     }}
        //                         // >{value}</div>
        //                     )
        //                 },
        //             })
        //         }
        //     }
        //     setTable({
        //         columns,
        //         list: res.data
        //     })
        //     setLoading(false)
        // } else {
        //     message.error('执行失败')
        // }
    }

    async function _run(execCode) {
        setLoading(true)
        setError('')
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
                            <Cell text={_idx} color="#999" />
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
            const list = []
            idx = 0
            for (let result of results) {
                let item = {}
                for (let field of fields) {
                    const key = '' + idx
                    item[key] = result[idx]
                    idx++
                }
                list.push(item)
            }
            console.log('list', list)

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
                        scroll={{
                            x: true,
                            // x: 2000,
                            // y: document.body.clientHeight - 396,
                        }}
                    />
                :
                    <div className={styles.emptyFullBox}>
                        <Empty description="No Request"></Empty>
                    </div>
                }
            </div>
        </div>
    )
}
export default SqlBox
