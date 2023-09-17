import { Button, Checkbox, Descriptions, Dropdown, Form, Input, InputNumber, Menu, message, Modal, Popover, Select, Space, Table, Tabs, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './redis-client.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { request } from '@/views/db-manager/utils/http';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import humanFormat from 'human-format'
import { Editor } from '@/views/db-manager/editor/Editor';

const timeScale = new humanFormat.Scale({
  ms: 1,
  s: 1000,
  min: 60000,
  h: 3600000,
  d: 86400000
})


export function StringContent({ curDb, event$, connectionId, onSuccess, data, config }) {
    const { t } = useTranslation()
    // const [curDb] = useState(0)
    const [itemDetail, setItemDetail] = useState(null)
    const [inputValue, setInputValue] = useState(data.value)
    const editType = 'update'
    const [code, setCode] = useState(data.value || '')
    const [lang, setLang] = useState(() => {
        if (data.value) {
            const code = data.value.trim()
            if (code.startsWith('{') && code.endsWith('}')) {
                return 'json'
            }
        }
        return 'plain'
    })
    console.log('data?', data)

    const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
    const code_ref = useRef('')
    
    function getCode() {
        return code_ref.current
    }

    function setCodeASD(code) {
        code_ref.current = code
    }

    return (
        <>
            <div className={classNames(styles.body, styles.stringBody)}>

                <Editor
                    lang={lang}
                    event$={event$}
                    connectionId={connectionId}
                    value={code}
                    onChange={value => setCodeASD(value)}
                    onEditor={editor => {
                        // console.warn('ExecDetail/setEditor')
                        setEditor(editor)
                    }}
                />
                <div className={styles.stringBox2}>
                    {/* <Input.TextArea
                        className={styles.textarea}
                        value={inputValue}
                        onChange={e => {
                            setInputValue(e.target.value)
                        }}
                        rows={24}
                        // style={{
                        //     width: 400,
                        // }}
                    /> */}
                    {/* <Button
                        onClick={async () => {
                            let res = await request.post(`${config.host}/redis/set`, {
                                connectionId: connectionId,
                                key: inputKey,
                                value: inputValue,
                                // dbName,
                            })
                            console.log('get/res', res.data)
                            if (res.success) {
                                message.success('新增成功')
                                loadKeys()
                                loadKey(inputKey)
                                // setResult(null)
                                // setResult({
                                //     key: item,
                                //     ...res.data,
                                // })
                                // setInputValue(res.data.value)
                            }
                        }}
                    >
                        新增
                    </Button> */}
                </div>
            </div>
            <div className={styles.footer}>
                <Space>
                    <Button
                        size="small"
                        onClick={async () => {
                            const code = getCode()
                            if (!code) {
                                message.error('请输入代码')
                                return
                            }
                            let res = await request.post(`${config.host}/redis/set`, {
                                connectionId: connectionId,
                                key: data.key,
                                value: code,
                                // dbName,
                            })
                            console.log('get/res', res.data)
                            if (res.success) {
                                // message.success('修改成功')
                                message.success(t('success'))
                                onSuccess && onSuccess()
                                // setResult({
                                //     key: item,
                                //     ...res.data,
                                // })
                                // setInputValue(res.data.value)
                            }
                        }}
                    >
                        {t('update')}
                    </Button>
                    
                </Space>
                <Space>
                    {/* <div>
                        {lang}
                    </div> */}
                    <Select
                        size="small"
                        value={lang}
                        onChange={value => {
                            setLang(value)
                            monaco.editor.setModelLanguage(editor.getModel(), value)
                        }}
                        options={[
                            {
                                label: t('text'),
                                value: 'plain',
                            },
                            {
                                label: 'JSON',
                                value: 'json',
                            },
                        ]}
                    />
                </Space>
            </div>
        </>
    )
}
