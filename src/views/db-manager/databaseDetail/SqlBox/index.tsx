import React, { useState, useEffect, useRef, useMemo } from 'react'
import styles from './index.module.less'
import { message, Input, Modal, Button, Table, Popover, Space, Empty, Result, Tabs, Select, Tooltip, Spin } from 'antd'
// import http from '@/utils/http'
import classNames from 'classnames'
import { Editor } from '../../editor/Editor'
import copy from 'copy-to-clipboard';
import { request } from '../../utils/http'
import { format } from 'sql-formatter'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import {  SqlParser } from '../../sql-parse-lib/sqlParser'
import { ExecDetail } from '../../exec-detail/exec-detail'
import { uid } from 'uid'
import { useTranslation, Trans } from "react-i18next";
import { HistoryList } from '../../sql-history'
import { CloseOutlined } from '@ant-design/icons'
import { IconButton } from '../../icon-button'
import storage from '@/utils/storage'
import { CloseCircleOutlined } from '@ant-design/icons'
import { CheckCircleOutlined } from '@ant-design/icons'
import { SaveOutlined } from '@ant-design/icons'
import { SqlEditHandler } from '../../sql-edit'
import { FullCenterBox } from '../../redis-client'
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



function SqlBox({ config, tabViewId, event$, databaseType, connectionId, onJson, className, defaultSql = '', style }: Props) {
    console.warn('SqlBox/render')
    
    const { t, i18n } = useTranslation()

    // console.log('defaultSql', defaultSql)

    const [limit, _setLimit] = useState(() => {
        return storage.get('default_limit', 100)
    })
    function setLimit(limit: number) {
        _setLimit(limit)
        storage.set('default_limit', limit)
    }
    const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
    const [code, setCode] = useState(defaultSql)
    const [codeLoading, setCodeLoading] = useState(false)
    const [tab, setTab] = useState({
        // activeKey: execResults[0]?.key,
        activeKey: null,
        execResults: []
    })
    const { activeKey, execResults } = tab
    
    const code_ref = useRef(defaultSql)
    function getCode() {
        return code_ref.current
    }

    function setCodeASD(code) {
        code_ref.current = code
    }

    useEffect(() => {
        if (tabViewId && editor) {
            editor.layout()
        }
    }, [tabViewId, editor])
    
    
    // const [execResults, setExecResults] = useState([
    //     // history_tab,
    //     // {
    //     //     type: 'all',
    //     //     title: '历史记录',
    //     //     key: 'all',
    //     //     closable: false,
    //     // },
    //     // {
    //     //     type: 'single',
    //     //     title: '执行结果1',
    //     //     key: 'result-1',
    //     // },
    //     // {
    //     //     type: 'single',
    //     //     title: '执行结果2',
    //     //     key: 'result-2',
    //     // },
    // ])
    function setExecResults(results) {
        setTab({
            ...tab,
            execResults: results,
        })
    }
    function setActiveKey(at) {
        setTab({
            ...tab,
            // execResults: results,
            activeKey: at,
        })
    }
    // const [activeKey, setActiveKey] = useState(execResults[0]?.key)

    

    // useEffect(() => {
    //     // console.log('onMouneed', storage.get('dbInfo', ''))
    //     // setCode(storage.get('dbInfo', ''))

    //     // run()
    // }, [])

    

    

    function runPlain() {
        const code = getCode()
        if (!code) {
            message.warn(t('no_sql'))
            return
        }
        if (!code.toLowerCase().includes('select')) {
            message.warn(t('explain_must_select'))
            return
        }
        _run(getCode(), {
            explain: true,
        })
    }

    function formatSql() {
        // console.log('ff', format(getCode()))
        // setCode('1212 format' + new Date().getTime())
        // setCode(format(getCode()))
        // editor?.setValue('1212 format' + new Date().getTime())
        editor?.setValue(format(getCode(), {
            tabWidth: 4,
        }))
    }

    function removeSymbol() {
        function _removeSymbol(text: string) {
            return text.replace(/`/g, '')
        }
        editor?.setValue(_removeSymbol(getCode()))
    }

    async function run() {
        if (!getCode()) {
            message.warn(t('no_sql'))
            return
        }
        _run(getCode())
    }

    async function _run(execCode: string, { explain = false } = {}) {
        let newTabs: any = [
            // history_tab,
        ]
        setExecResults(newTabs)
        setCodeLoading(true)
        // console.log('ExecDetail/setExecResults1')
        const removedCommentCode = removeComment(execCode)
        const lines = removedCommentCode.split(';').filter(item => item.trim())
        let lineIdx = 0
        // const successKeys = []
        // let isAllSuccess = true
        for (let rawLine of lines) {
            // const noCommentLine = removeComment(rawLine)
            // console.log('noCommentLine', noCommentLine)
            let lineCode = explain ? ('EXPLAIN ' + rawLine) : rawLine
            if (lineCode.toLowerCase().includes('select') && !lineCode.toLowerCase().includes('limit') && limit != -1) {
                if (databaseType != 'mssql') {
                    lineCode += ` limit ${limit}`
                }
            }
            // 移除空行
            lineCode = lineCode.split('\n').map(item => item.trim()).filter(item => item).join('\n')
            const tabKey = uid(16)
            const tabTitle = `${t('exec_result')} ${lineIdx + 1}`
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
            setTab({
                activeKey: tabKey,
                execResults: newTabs,
            })
            // setExecResults(newTabs)
            // console.log('ExecDetail/setExecResults2')
            // return
            // setActiveKey(tabKey)
            // return

            // console.log('line', line)
            let tableName = null
            let dbName = null
            try {
                const ast = SqlParser.parse(rawLine.replace(/`/g, '').replace(/'/g, '').replace(/"/g, ''));
                // console.log('ast', ast)
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
            // console.log('tableName', tableName)
            // console.log('dbName', dbName)
            // return
// => [{"tag":"select","columns": [...],"from":[...],"where":null,"group_by":null,"having":null}]
            

            let res = await request.post(`${config.host}/mysql/execSql`, {
                connectionId,
                sql: lineCode,
                tableName,
                dbName,
                logger: true,
            }, {
                noMessage: true,
            })
            // console.log('res', res)
            if (res.success) {
                // message.success('执行成功')
                // console.log('ExecDetail/runOk')
                // return
                window._startTime = new Date()
                // console.log(res)
                const { results, fields } = res.data

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
                        error: '',
                        hasReq: true,
                        results,
                        tableName,
                        dbName: dbName,
                    }
                }
                // console.log('ExecDetail/setExecResults3')
                // return
                setTab({
                    activeKey: tabKey,
                    execResults: [...newTabs],
                })
                // setExecResults([...newTabs])
                // setActiveKey(tabKey)

                if (lineCode.toLowerCase().startsWith('use')) {
                    event$.emit({
                        type: 'event_reload_use',
                        data: {
                            connectionId,
                        }
                    })
                }
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
                setTab({
                    activeKey: tabKey,
                    execResults: [...newTabs],
                })
                // setExecResults([...newTabs])
                // // console.log('ExecDetail/setExecResults4')
                // setActiveKey(tabKey)
            }
            lineIdx++
        }
        setCodeLoading(false)
        // return
        // else {
        //     message.error('执行失败')
        // }
    }


    // let columns = [

    // ]
    // console.log('render.list.length', list.length)
    // console.log('render.execResults', execResults)

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

    // console.log('ExecDetail/main_render')

    return (
        <div className={classNames(styles.sqlBox, className)} style={style}>
            <div className={styles.editorBox}>
                <div className={styles.toolBox}>
                    <Space>
                        <Button
                            type="primary"
                            size="small"
                            onClick={run}
                            disabled={codeLoading}
                        >
                            {t('run')}
                        </Button>
                        <Button
                            size="small"
                            onClick={runPlain}
                            disabled={codeLoading}
                        >
                            {t('explain')}
                        </Button>
                        <Button size="small" onClick={formatSql}>{t('format')}</Button>
                        <Select
                            size="small"
                            value={limit}
                            options={[
                                {
                                    label: t('no_limit'),
                                    value: -1,
                                },
                                ...limits.map(num => {
                                    return {
                                        label: `${t('limit')} ${num}`,
                                        value: num,
                                    }
                                })
                            ]}
                            onChange={value => {
                                setLimit(value)
                            }}
                            style={{
                                width: 110
                            }}
                        >

                        </Select>
                        <SqlEditHandler
                            config={config}
                            connectionId={connectionId}
                            event$={event$}
                            getCode={getCode}
                        >
                            <Button
                                // type="primary"
                                size="small" 
                                // onClick={run}
                                icon={<SaveOutlined />}
                            ></Button>
                            {/* <IconButton
                                size="small"
                                tooltip={t('save')}
                            >
                                <SaveOutlined />
                            </IconButton> */}
                        </SqlEditHandler>
                        <Button 
                            size="small" 
                            onClick={removeSymbol}
                        >
                            去掉 `
                        </Button>
                    </Space>

                    
                </div>
                <div className={styles.codeBox}>
                    <Editor
                        event$={event$}
                        connectionId={connectionId}
                        value={code}
                        onChange={value => setCodeASD(value)}
                        onEditor={editor => {
                            // console.warn('ExecDetail/setEditor')
                            setEditor(editor)
                        }}
                    />
                    {/* <TextArea 
                        className={styles.textarea} 
                        value={code}
                        rows={4} 
                        // onChange={e => setCode(e.target.value)} />
                        onChange={e => setgetCode()(e.target.value)} /> */}
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
                        items={execResults.map(item => {
                            return {
                                label: (
                                    <div>
                                        {item.data.error ?
                                            <CloseCircleOutlined className={styles.failIcon} />
                                        :
                                            <CheckCircleOutlined className={styles.successIcon} />
                                        }
                                        {item.title}
                                    </div>
                                ),
                                key: item.key,
                                closable: item.closable !== false,
                            }
                        })}
                    />
                </div>
                {execResults.map(item => {
                    return (
                        <div
                            className={styles.resultTabContent}
                            key={item.key}
                            style={{
                                // visibility: item.key == activeKey ? 'visible' : 'hidden',
                                display: item.key == activeKey ? undefined : 'none',
                            }}
                        >
                            {item.type == 'all' &&
                                <HistoryList config={config} />
                            }
                            {item.type == 'single' &&
                                <>
                                {!!item.data.loading ?
                                    <FullCenterBox
                                    >
                                        <Spin />
                                    </FullCenterBox>
                                    // <div className={styles.loadingBox}>Loding...</div>
                                :
                                    <ExecDetail
                                        data={item.data}
                                        databaseType={databaseType}
                                        config={config}
                                        connectionId={connectionId}
                                        onJson={onJson}
                                        // tableName, dbName
                                    />
                                }
                                </>
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
