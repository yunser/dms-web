import { Button, Descriptions, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import styles from './json.module.less';
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
import ReactJson from 'react-json-view'

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

// function Json
export function JsonEditor({ key, event$, data = {} }) {
    console.warn('JsonEditor/render', data)
    const { defaultJson = '' } = data
    const { t } = useTranslation()

    const [code] = useState(defaultJson)
    // const [code2, setCode2] = useState('')
    const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
    const [jsonObj, setJsonObj] = useState(null)

    const code_ref = useRef('')

    function getCode() {
        return code_ref.current
    }

    function setCodeASD(code) {
        code_ref.current = code
        try {
            setJsonObj(JSON.parse(code))
        }
        catch (err) {
            // nothing
            setJsonObj(null)
        }
    }

    const selectionEvent = useEventEmitter()
    const contentEvent = useEventEmitter()

    return (
        <div className={styles.jsonBox}>
            <div className={styles.layoutLeftRight}>
                <div className={styles.layoutLeft}>
                    <div className={styles.header}>
                        <Space>
                            {/* <IconButton
                                size="small"
                            >
                                <FormatPainterOutlined />
                            </IconButton> */}
                            <Button
                                size="small"
                                onClick={() => {
                                    const code = getCode()
                                    const formatedCode = JSON.stringify(JSON.parse(code), null, 4)
                                    editor?.setValue(formatedCode)
                                }}
                            >
                                {t('format')}
                            </Button>
                            <Button
                                size="small"
                                onClick={() => {
                                    const code = getCode()
                                    const formatedCode = JSON.stringify(JSON.parse(code))
                                    editor?.setValue(formatedCode)
                                }}
                            >
                                {t('compress')}
                            </Button>
                            <IconButton
                                size="small"
                                tooltip={t('download')}
                                onClick={() => {
                                    const code = getCode()
                                    // const formatedCode = JSON.stringify(JSON.parse(code))
                                    // editor?.setValue(formatedCode)
                                    const blob = new Blob([code], {type: 'application/json;charset=utf-8'});
                                    saveAs(blob, `${t('unnamed')}.json`)
                                }}
                            >
                                <DownloadOutlined />   
                            </IconButton>
                            {/* <Button
                                size="small"
                                onClick={() => {
                                    const code = getCode()
                                    const formatedCode = JSON.stringify(JSON.parse(code))
                                    editor?.setValue(formatedCode)
                                }}
                            >
                                <DownloadOutlined />
                                {t('download')}
                            </Button> */}
                        </Space>
                    </div>
                    <div className={styles.editorBox}>
                        <Editor
                            lang="json"
                            event$={event$}
                            value={code}
                            onChange={value => setCodeASD(value)}
                            // autoFoucs={true}
                            onEditor={editor => {
                                setEditor(editor)
                            }}
                            onSelectionChange={({selection, selectionTextLength}) => {
                                // console.log('selection', selection)
                                selectionEvent.emit({
                                    data: {
                                        selection: {
                                            ...selection,
                                            textLength: selectionTextLength,
                                        }
                                    }
                                })
                                // setSelection({
                                //     ...selection,
                                //     selectionTextLength,
                                // })
                            }}
                        />
                    </div>
                </div>
                <div className={styles.layoutRight}>
                    {!!jsonObj &&
                        <ReactJson 
                            src={jsonObj}
                            displayDataTypes={false}
                        />
                    }
                </div>
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
