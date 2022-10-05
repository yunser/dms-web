import { Button, Descriptions, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import styles from './markdown.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { Editor } from '../editor/Editor';
import { IconButton } from '../icon-button';
import { FormatPainterOutlined } from '@ant-design/icons';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { DownloadOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
// import { saveAs } from 'file-saver'

function SelectionInfo({ event$ }) {

    const [selection, setSelection] = useState({
        endLineNumber: 1,  
        endColumn: 1,
        textLength: 0,
    })

    event$.useSubscription(msg => {
        // console.log('SelectionInfo/onmessage', msg)
        // console.log(val);
        if (msg.type == 'event_update_use') {
        }
        const { selection } = msg.data
        setSelection(selection)
    })
    
    return (
        <div>
            {!!selection &&
                <div className={styles.selection}>
                    <div>行 {selection.endLineNumber}</div>
                    <div>列 {selection.endColumn}</div>
                    {selection.textLength > 0 &&
                        <span>已选择 {selection.textLength}</span>
                    }
                </div>
            }
        </div>
    )
}

export function MarkdownEditor({ config, event$, data = {} }) {
    const { defaultJson = '' } = data
    const { t } = useTranslation()

    const [code] = useState(defaultJson)
    // const [code2, setCode2] = useState('')
    const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
    
    const code_ref = useRef('')

    function getCode() {
        return code_ref.current
    }

    function setCodeASD(code) {
        code_ref.current = code
    }

    const selectionEvent = useEventEmitter()
    
    return (
        <div className={styles.jsonBox}>
            <div className={styles.header}>
                <Space>
                    {/* <Button
                        size="small"
                        onClick={() => {
                            const code = getCode()
                            editor?.setValue(code.toLowerCase())
                        }}
                    >
                        {t('lower_case')}
                    </Button>
                    <Button
                        size="small"
                        onClick={() => {
                            const code = getCode()
                            editor?.setValue(code.toUpperCase())
                        }}
                    >
                        {t('upper_case')}
                    </Button> */}
                    <IconButton
                        size="small"
                        tooltip={t('download')}
                        onClick={() => {
                            const code = getCode()
                            // const formatedCode = JSON.stringify(JSON.parse(code))
                            // editor?.setValue(formatedCode)
                            const blob = new Blob([code], {type: 'text/plain;charset=utf-8'});
                            saveAs(blob, `${t('unnamed')}.md`)
                        }}
                    >
                        <DownloadOutlined />   
                    </IconButton>
                </Space>
            </div>
            <div className={styles.editorBox}>
                <Editor
                    lang="markdown"
                    value={code}
                    event$={event$}
                    onChange={value => setCodeASD(value)}
                    // autoFoucs={true}
                    onEditor={editor => {
                        setEditor(editor)
                    }}
                    onSelectionChange={({selection, selectionTextLength}) => {
                        console.log('selection', selection)
                        selectionEvent.emit({
                            data: {
                                selection: {
                                    ...selection,
                                    textLength: selectionTextLength,
                                }
                            }
                        })
                    }}
                />
            </div>
            <div className={styles.footer}>
                <SelectionInfo
                    event$={selectionEvent}
                />
            </div>
            {/* <article className={styles.article}>
                <h1>JSON</h1>
            </article> */}
        </div>
    )
}
