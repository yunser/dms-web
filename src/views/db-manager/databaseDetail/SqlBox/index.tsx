import React, { useState, useEffect } from 'react'
import styles from './index.module.less'
import { message, Input, Button, Table } from 'antd'
import http from '@/utils/http'
import classNames from 'classnames'

const { TextArea } = Input

export interface Props {
    defaultSql?: string;
    style: any
}

function SqlBox({ className, defaultSql, style }: Props) {

    console.log('defaultSql', defaultSql)

    const [loading, setLoading] = useState(false)
    const [code, setCode] = useState(defaultSql)
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
        let res = await axios.post('/mysql/execSql', {
            sql: code,
        })
        if (res.status === 200) {
            // message.success('执行成功')
            console.log(res)
            let columns = [
                {
                    title: '序号',
                    key: '__idx',
                    width: 80,
                    render(_value, _item, _idx) {
                        return <div>{_idx}</div>
                    }
                }
            ]
            if (res.data[0]) {
                for (let key in res.data[0]) {
                    columns.push({
                        title: key,
                        dataIndex: key,
                        key,
                        render(value: any) {
                            return '' + value
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


    let columns = [

    ]

    return (
        <div className={classNames(styles.sqlBox, className)} style={style}>
            <div className={styles.editorBox}>
                <div className={styles.toolBox}>
                    <Button type="primary" size="small" onClick={run}>执行</Button>
                </div>
                <TextArea 
                    className={styles.textarea} 
                    value={code} 
                    rows={4} 
                    onChange={e => setCode(e.target.value)} />
            </div>
            <div className={styles.resultBox}>
                <Table
                    loading={loading}
                    dataSource={table.list}
                    pagination={false}
                    columns={table.columns}
                    bordered
                    style={{
                        // height: '300px',
                        // border: '1px solid #09c',
                    }}
                    // size="middle"
                    size="small"
                    scroll={{
                        x: true,
                        y: document.body.clientHeight - 396,
                    }}
                />
            </div>
        </div>
    )
}
export default SqlBox
