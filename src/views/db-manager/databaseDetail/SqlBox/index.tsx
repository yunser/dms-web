import React, { useState, useEffect } from 'react'
import styles from './index.module.less'
import { message, Input, Button, Table, Popover } from 'antd'
// import http from '@/utils/http'
import classNames from 'classnames'
import { Editor } from '../../editor/Editor'
import axios from 'axios'
const { TextArea } = Input

export interface Props {
    defaultSql?: string;
    style: any
}

function Cell({ text }) {
    return (
        <div
            className={styles.cell}
        >
            {text}
            <div className={styles.tool}>
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

    const [loading, setLoading] = useState(false)
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

    async function run() {
        setLoading(true)
        let res = await axios.post(`${config.host}/mysql/execSql`, {
            sql: code2,
        })
        if (res.status === 200) {
            // message.success('执行成功')
            console.log(res)
            let columns = [
                {
                    title: '序号',
                    key: '__idx',
                    fixed: 'left',
                    // width: 120,
                    render(_value, _item, _idx) {
                        return (
                            <Cell text={_idx} />
                        )
                    }
                }
            ]
            if (res.data[0]) {
                for (let key in res.data[0]) {
                    columns.push({
                        title: key,
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
                }
            }
            setTable({
                columns,
                list: res.data
            })
            setLoading(false)
        } else {
            message.error('执行失败')
        }
    }


    // let columns = [

    // ]

    return (
        <div className={classNames(styles.sqlBox, className)} style={style}>
            <div className={styles.editorBox}>
                <div className={styles.toolBox}>
                    <Button type="primary" size="small" onClick={run}>执行</Button>
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
            </div>
        </div>
    )
}
export default SqlBox
