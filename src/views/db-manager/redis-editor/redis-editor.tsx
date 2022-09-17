import { Button, Checkbox, Col, Descriptions, Empty, Form, Input, InputNumber, message, Modal, Popover, Row, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
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

function handleRes(res) {
    if (res == null) {
        return `(nil)`
    }
    if (typeof res == 'string') {
        return `"${res}"`
    }
    if (Array.isArray(res)) {
        return res.join('\n')
    }
    return res
}

export function RedisEditor({ config, event$, connectionId, defaultDatabase = 0 }) {
    const [curDb, setCurDb] = useState(defaultDatabase)
    const { t } = useTranslation()
    const [code, setCode] = useState('')
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)

    async function run() {
        const lines = code.split('\n').map(item => item.trim()).filter(item => item)
        if (lines.length == 0) {
            message.error('请输入代码')
            return
        }
        let res = await request.post(`${config.host}/redis/execCommands`, {
            connectionId,
            commands: lines,
            // dbName,
        })
        console.log('data', res.data)
        if (res.success) {
            setResults(res.data.results)
        }
    }

    return (
        <div className={styles.root}>
            <div className={styles.editorBox}>
                <Input.TextArea
                    className={styles.input}
                    placeholder={t('command')}
                    value={code}
                    onChange={e => {
                        setCode(e.target.value)
                    }}
                    rows={12}
                    // style={{
                    //     // width: 400,
                    // }}
                />
                <div className={styles.tool}>
                    <Button
                        size="small"
                        onClick={() => {
                            run()
                        }}
                    >
                        {t('run')}
                    </Button>
                </div>
            </div>
            <div className={styles.resultBox}>
                <div className={styles.title}>{t('Result')}：</div>
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
            </div>
        </div>
    )
}
