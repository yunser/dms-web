import React, { useState, useEffect, useRef, useMemo } from 'react'
import styles from './index.module.less'
import { message, Input, Modal, Button, Table, Popover, Space, Empty, Result, Tabs, Select } from 'antd'
// import http from '@/utils/http'
import classNames from 'classnames'
import { Editor } from '../../editor/Editor'
// import axios from 'axios'
import copy from 'copy-to-clipboard';
import { request } from '../../utils/http'
import { format } from 'sql-formatter'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import {  SqlParser } from '../../sql-parse-lib/sqlParser'
import { ExecDetail } from '../../exec-detail/exec-detail'
import { uid } from 'uid'
// var parse = require('sql-parse').parse;
// console.log('asd')

// var result = SqlParser.parse('SELECT id,name FROM users u left join asd a on u.id = a.id');
// console.log('result', JSON.stringify(result, null, 4))
// import * as sqlParser from 'typescript-sql';

const { TabPane } = Tabs
const { confirm } = Modal

const { TextArea } = Input

export interface Props {
    defaultSql?: string;
    style: any
}

const limits = [10, 20, 50, 100, 200, 500, 1000]

function SqlBox({ config, tableName, dbName, className, defaultSql = '', style }: Props) {

    const defaultDbName = dbName
    // console.log('defaultSql', defaultSql)

    const [limit, setLimit] = useState(100)
    const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
    const [code, setCode] = useState(defaultSql)
    const [code2, setCode2] = useState(defaultSql)

    const [execResults, setExecResults] = useState([
        // {
        //     type: 'all',
        //     title: '历史记录',
        //     key: 'all',
        // },
        // {
        //     type: 'single',
        //     title: '执行结果1',
        //     key: 'result-1',
        // },
        // {
        //     type: 'single',
        //     title: '执行结果2',
        //     key: 'result-2',
        // },
    ])
    const [activeKey, setActiveKey] = useState(execResults[0]?.key)

    

    useEffect(() => {
        // console.log('onMouneed', storage.get('dbInfo', ''))
        // setCode(storage.get('dbInfo', ''))

        // run()
    }, [])

    

    

    function runPlain() {
        if (!code2) {
            message.warn('没有要执行的 SQL')
            return
        }
        _run(code2, {
            explain: true,
        })
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

    async function _run(execCode: string, { explain = false } = {}) {
        let newTabs: any = []
        setExecResults(newTabs)
        const lines = execCode.split(';').filter(item => item.trim())
        let lineIdx = 0
        for (let line of lines) {
            let lineCode = explain ? ('EXPLAIN ' + line) : line
            if (lineCode.toLowerCase().includes('select') && !lineCode.toLowerCase().includes('limit')) {
                lineCode += ` limit ${limit}`
            }
            const tabKey = uid(16)
            const tabTitle = `执行结果 ${lineIdx + 1}`
            newTabs = [
                ...newTabs,
                {
                    key: tabKey,
                    type: 'single',
                    title: tabTitle,
                    // key: 'result-2',
                    data: {
                        sql: lineCode,
                        loading: true,
                        // fields,
                        // result: res.data,
                        // list,
                        // error: '',
                        // hasReq: true,
                        // results,
                        // tableName,
                        // dbName,
                    }
                }
            ]
            setExecResults(newTabs)
            setActiveKey(tabKey)
            // return

            // console.log('line', line)
            let tableName = null
            let dbName = null
            try {
                const ast = SqlParser.parse(line.replace(/`/g, ''));
                console.log('ast', ast)
                if (ast[0]) {
                    if (!ast[0].joinmap) {
                        if (ast[0].source) {
                            const key = Object.keys(ast[0].source)[0]
                            tableName = ast[0].source[key].source || null
                            dbName = ast[0].source[key].type || null
                        }
                        // "source": {
                        //     "u": {
                        //         "type": "",
                        //             "source": "users"
                        //     }
                        // },
                    }
                }
            }
            catch (err) {
                console.error(err)
            }
            console.log('tableName', tableName)
            console.log('dbName', dbName)
// => [{"tag":"select","columns": [...],"from":[...],"where":null,"group_by":null,"having":null}]
            

            let res = await request.post(`${config.host}/mysql/execSql`, {
                sql: lineCode,
                tableName,
                dbName,
            }, {
                noMessage: true,
            })
            console.log('res', res)
            if (res.status === 200) {
                // message.success('执行成功')
                console.log(res)
                const { results, fields, columns: rawColumns } = res.data
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

                // setList(list)
                // setFields(fields)

                const tabKey = uid(16)
                newTabs[lineIdx] = {
                    key: tabKey,
                    type: 'single',
                    title: tabTitle,
                    // key: 'result-2',
                    data: {
                        sql: lineCode,
                        loading: false,
                        fields,
                        result: res.data,
                        list,
                        error: '',
                        hasReq: true,
                        results,
                        tableName,
                        dbName: dbName || defaultDbName,
                        rawColumns,
                    }
                }
                setExecResults([...newTabs])
                setActiveKey(tabKey)
            }
            else {

                const tabKey = uid(16)
                newTabs[lineIdx] = {
                    key: tabKey,
                    type: 'single',
                    title: tabTitle,
                    // key: 'result-2',
                    data: {
                        sql: lineCode,
                        loading: false,
                        fields: [],
                        result: res.data,
                        list: [],
                        error: res.data.message || 'Unknown Error',
                        hasReq: true,
                        results: [],
                        tableName,
                        dbName,
                    }
                }
                setExecResults([...newTabs])
                setActiveKey(tabKey)
            }
            lineIdx++
        }
        // return
        // else {
        //     message.error('执行失败')
        // }
    }


    // let columns = [

    // ]
    // console.log('render.list.length', list.length)
    console.log('render.execResults', execResults)

    function TabItem(item: TabProps) {
        return (
            <TabPane
                tab={item.title}
                key={item.key}
                closable={true}>
            </TabPane>
            // <SqlBox defaultSql={item.defaultSql} />
        )
    }

    return (
        <div className={classNames(styles.sqlBox, className)} style={style}>
            <div className={styles.editorBox}>
                <div className={styles.toolBox}>
                    <Space>
                        <Button type="primary" size="small" onClick={run}>执行</Button>
                        <Button size="small" onClick={runPlain}>执行计划</Button>
                        <Button size="small" onClick={formatSql}>格式化</Button>
                        <Select
                            size="small"
                            value={limit}
                            options={limits.map(num => {
                                return {
                                    label: `Limit ${num}`,
                                    value: num,
                                }
                            })}
                            onChange={value => {
                                setLimit(value)
                            }}
                            // options={[
                            //     {
                            //         label: 'Limit 1000',
                            //         value: 100,
                            //     },
                            // ]}
                            style={{
                                width: 110
                            }}
                        >

                        </Select>
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
                <div className={styles.resultTabs}>
                    <Tabs
                        // onEdit={onEdit}
                        activeKey={activeKey}
                        hideAdd={true}
                        onChange={key => {
                            setActiveKey(key)
                        }}
                        type="editable-card"
                        style={{
                            height: '100%',
                        }}
                    >
                        {execResults.map(TabItem)}
                    </Tabs>
                    {/* {execResults.map(execResult => {
                        return (
                        )
                    })} */}
                </div>
                {execResults.map(item => {
                    return (
                        <div className={styles.resultTabContent}
                            style={{
                                // visibility: item.key == activeKey ? 'visible' : 'hidden',
                                display: item.key == activeKey ? undefined : 'none',
                            }}
                        >
                            {item.type == 'all' &&
                                <div>ALL</div>
                            }
                            {item.type == 'single' &&
                                <ExecDetail
                                    data={item.data}
                                    config={config}
                                    // tableName, dbName
                                    // defaultDbName={dbName}
                                />
                            }
                        </div>   
                    )
                })}
                {/* <div className={styles.resultTabContent}>
                </div> */}
            </div>
            
        </div>
    )
}
export default SqlBox
