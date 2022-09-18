import { Button, Checkbox, Col, Descriptions, Empty, Form, Input, InputNumber, message, Modal, Popover, Row, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './redis-editor.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { Editor } from '../editor/Editor';
import storage from '../storage'
import { request } from '../utils/http'
import { CodeDebuger } from '../code-debug';
import { uid } from 'uid';
import { FullCenterBox } from '../redis-client';
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
    
    function getCode() {
        return code_ref.current
    }

    function setCodeASD(code) {
        code_ref.current = code
    }

    async function run() {
        const lines = getCode().split('\n').map(item => item.trim()).filter(item => item)
        if (lines.length == 0) {
            message.error('请输入代码')
            return
        }
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
                />
            </div>
            <div className={styles.toolBox}>
                <Button
                    size="small"
                    loading={loading}
                    onClick={() => {
                        run()
                    }}
                >
                    {t('run')}
                </Button>
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
