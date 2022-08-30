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
import { useTranslation, Trans } from "react-i18next";
import { HistoryList } from '../../history'
import { CloseOutlined } from '@ant-design/icons'
import { IconButton } from '../../icon-button'
// var parse = require('sql-parse').parse;
// console.log('asd')

function removeComment(sql: string) {
    return sql.split('\n').map(item => {
        if (item.includes('--')) {
            return item.split('--')[0]
        }
        return item
    }).join('\n')
}
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

const history_tab = {
    type: 'all',
    title: '历史记录',
    key: 'all',
    closable: false,
}

function SqlBox({ config, esIndex, esType, dbName, className, defaultSql = '', style }: Props) {

    const { t, i18n } = useTranslation()

    const defaultDbName = dbName
    // console.log('defaultSql', defaultSql)

    const [limit, setLimit] = useState(100)
    const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
    const [code, setCode] = useState(defaultSql)
    const [code2, setCode2] = useState(defaultSql)

    const [execResults, setExecResults] = useState([
        // history_tab,
        // {
        //     type: 'all',
        //     title: '历史记录',
        //     key: 'all',
        //     closable: false,
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
        _query(code2, {
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

    async function query() {
        if (!code2) {
            message.warn('没有要执行的 JSON')
            return
        }
        _query(code2)
    }

    async function _query(execCode: string, { explain = false } = {}) {
        let newTabs: any = [
            // history_tab,
        ]
        // console.log('config', config, esIndex, esType)
        // return
        const searchUrl = `${config.url}/${esIndex}/${esType}`
        setExecResults(newTabs)
        // const removedCommentCode = removeComment(execCode)
        // const lines = removedCommentCode.split(';').filter(item => item.trim())
        let lineIdx = 0
        {
            // const noCommentLine = removeComment(rawLine)
            // console.log('noCommentLine', noCommentLine)
            const tabKey = uid(16)
            const tabTitle = `Result`
            newTabs = [
                ...newTabs,
                {
                    key: tabKey,
                    type: 'single',
                    title: tabTitle,
                    // key: 'result-2',
                    loading: true,
                    data: {
                        dataOld: true,
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

            let res = await request.post(searchUrl, JSON.parse(execCode), {
                noMessage: true,
            })
            console.log('res?', res)
            if (res.status == 200 || res.status == 201) {
                // message.success('执行成功')
                console.log('success', res)

                newTabs[0] = {
                    key: tabKey,
                    type: 'single',
                    title: tabTitle,
                    // key: 'result-2',
                    loading: false,
                    data: {
                        resJson: res.data,
                        // loading: false,
                        // fields,
                        // result: res.data,
                        // list,
                        // error: '',
                        // hasReq: true,
                        // results,
                        // dbName: dbName || defaultDbName,
                        // rawColumns,
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
                        loading: false,
                        fields: [],
                        result: res.data,
                        list: [],
                        error: res.data.message || 'Unknown Error',
                        hasReq: true,
                        results: [],
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
                closable={item.closable !== false}
                closeIcon={
                    <IconButton
                        size="small"
                    >
                        <CloseOutlined style={{ color: '#999' }} />
                    </IconButton>
                }
            >
            </TabPane>
            // <SqlBox defaultSql={item.defaultSql} />
        )
    }

    const onEdit = (targetKey: string, action: string) => {
        console.log('targetKey, action', targetKey, action)
        // this[action](targetKey);
        if (action === 'add') {
        }
        else if (action === 'remove') {
            for (let i = 0; i < execResults.length; i++) {
                if (execResults[i].key === targetKey) {
                    execResults.splice(i, 1)
                    break
                }
            }
            setExecResults([
                ...execResults,
            ])
            if (execResults.length) {
                setActiveKey(execResults[execResults.length - 1].key)
            }
            else {
                setActiveKey('')
            }
            // _this.setState({
            //     tabs
            // })
        }
    }

    return (
        <div className={classNames(styles.sqlBox, className)} style={style}>
            <div className={styles.editorBox}>
                <div className={styles.toolBox}>
                    <Space>
                        <Button type="primary" size="small" onClick={query}>
                            Search
                        </Button>
                    </Space>
                </div>
                <div className={styles.codeBox}>
                    <Editor
                        lang="json"
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
                        onEdit={onEdit}
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
                            {item.type == 'single' &&
                                // <div>{item.resJson}</div>
                                <div>{JSON.stringify(item.data.resJson)}</div>
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
