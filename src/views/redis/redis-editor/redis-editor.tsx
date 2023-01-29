import { Button, Checkbox, Col, Descriptions, Empty, Form, Input, InputNumber, message, Modal, Popover, Row, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './redis-editor.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { Editor } from '@/views/db-manager/editor/Editor';
import { request } from '@/views/db-manager/utils/http';
import { FullCenterBox } from '@/views/common/full-center-box'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

function handleRes(res) {
    if (res == null) {
        return `(nil)`
    }
    if (typeof res == 'string') {
        // return `"${res}"`
        return `${res}`
    }
    if (Array.isArray(res)) {
        if (res.length == 0) {
            return '(empty list or set)'
        }
        return res.join('\n')
    }
    return res
}

export function RedisEditor({ config, event$, defaultCommand = '', connectionId, defaultDatabase = 0 }) {
    const [curDb, setCurDb] = useState(defaultDatabase)
    const { t } = useTranslation()
    const [code, setCode] = useState(defaultCommand)
    const [hasResult, setHasResult] = useState(false)
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
    const code_ref = useRef('')
    const refData = useRef({
        selection: null,
    })

    function getCode() {
        return code_ref.current
    }

    function setCodeASD(code) {
        code_ref.current = code
    }

    async function _run(lines) {
        setLoading(true)
        let res = await request.post(`${config.host}/redis/execCommands`, {
            connectionId,
            commands: lines,
            // dbName,
        })
        console.log('data', res.data)
        if (res.success) {
            setResults(res.data.results)
            setHasResult(true)
        }
        setLoading(false)
    }

    async function run() {
        const lines = getCode().split('\n').map(item => item.trim()).filter(item => item)
        if (lines.length == 0) {
            message.error('请输入代码')
            return
        }
        await _run(lines)
    }

    async function runSelection() {
        // console.log('refData.current.selection', refData.current.selection)
        const { selection } = refData.current
        if (selection) {
            // const range = {
            //     startLineNumber: selection.startLineNumber,
            //     startColumn: 0,
            //     endLineNumber: selection.startLineNumber,
            //     endColumn: 4
            // }
            const line = editor.getModel().getLineContent(selection.startLineNumber).trim()
            if (!line) {
                message.error('empty')
                return
            }
            await _run([line])
            // console.log('value', value)

        }
        else {
            message.error('no_selection')
        }
    }

    return (
        <div className={styles.root}>
            <div className={styles.editorBox}>
                {/* <Input.TextArea
                    className={styles.input}
                    placeholder={t('command')}
                    value={code}
                    onChange={e => {
                        setCode(e.target.value)
                    }}
                /> */}
                <Editor
                    // lang="plain"
                    lang="redis"
                    event$={event$}
                    connectionId={connectionId}
                    value={code}
                    onChange={value => setCodeASD(value)}
                    onEditor={editor => {
                        // console.warn('ExecDetail/setEditor')
                        setEditor(editor)
                    }}
                    onSelectionChange={({ selection }) => {
                        // console.log('selection', selection)
                        refData.current.selection = selection
                    }}
                />
            </div>
            <div className={styles.toolBox}>
                <Space>
                    <Button
                        size="small"
                        loading={loading}
                        onClick={() => {
                            run()
                        }}
                    >
                        {t('run')}
                    </Button>
                    <Button
                        size="small"
                        loading={loading}
                        onClick={() => {
                            runSelection()
                        }}
                    >
                        {t('run_selected_row')}
                    </Button>
                </Space>
            </div>
            <div className={styles.resultBox}>
                {hasResult ?
                    <>
                        {/* <div className={styles.title}>{t('Result')}：</div> */}
                        <div className={styles.results}>
                            {results.map(item => {
                                return (
                                    <div className={styles.item}
                                        key={item.id}
                                    >
                                        <div className={styles.command}>{item.command}</div>
                                        {item.result.success ?
                                            <div className={styles.res}>
                                                <pre>{handleRes(item.result.res)}</pre>
                                            </div>
                                        :
                                            <div className={styles.msg}>{item.result.message}</div>
                                        }
                                    </div>
                                )
                            })}
                        </div>
                    </>   
                :
                    <FullCenterBox
                    >
                        <Empty
                            description="No Request"
                        />
                        {/* <div>--</div> */}
                    </FullCenterBox>
                }
            </div>
        </div>
    )
}
