import { Button, Descriptions, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import styles from './json.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { Editor } from '../editor/Editor';
import { IconButton } from '../icon-button';
import { FormatPainterOutlined, QuestionOutlined } from '@ant-design/icons';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { DownloadOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
// import { saveAs } from 'file-saver'
import ReactJson from 'react-json-view'
// const JSON5 = require('json5')
import JSON5 from 'json5'
import copy from 'copy-to-clipboard';
import { request } from '../utils/http';
import moment from 'moment';

// console.log('JJJ', JSON.stringify({
//     name: 'root',
//     obj: JSON5.stringify({name: 'CJH'}) 
// }))

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

function JsonTable({ jsonObj }) {

    if (!Array.isArray(jsonObj)) {
        return 'not array'
    }
    if (!jsonObj.length) {
        return 'array empty'
    }

    const columns = useMemo(() => {
        let columns = []

        const names = Object.keys(jsonObj[0])
        for (let name of names) {
            columns.push(({
                title: name,
                dataIndex: name,
                render(value) {
                    if (value == null) {
                        return <div className={styles.null}>null</div>
                    }
                    if (typeof value == 'string') {
                        return <div className={styles.string}>{value}</div>
                    }
                    if (typeof value == 'number') {
                        return <div className={styles.number}>{value}</div>
                    }
                    if (typeof value == 'object') {
                        return <div>{JSON.stringify(value)}</div>
                    }
                    return <div>{value}</div>
                }
            }))
        }

        return columns
    }, [jsonObj])

    return (
        <div>
            <Table
                dataSource={jsonObj}
                columns={columns}
                pagination={false}
                size="small"
                bordered
            />
        </div>
    )
}

// function Json
export function JsonEditor({ config, key, event$, data = {}, onUploaded }) {
    console.warn('JsonEditor/render', data)
    const { defaultJson = '' } = data
    const { t } = useTranslation()

    const [tab, setTab] = useState('viewer')
    // const [tab, setTab] = useState('table')
    const [code] = useState(defaultJson)
    // const [code2, setCode2] = useState('')
    const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
    const [jsonObj, setJsonObj] = useState(null)

    const code_ref = useRef('')

    function getCode() {
        return code_ref.current
    }

    async function uploadJson(json) {
        let res = await request.post(`${config.host}/mysql/connect`, {
            type: 'alasql',
            tables: [
                {
                    name: moment().format('HHmmss'),
                    rows: json
                }
            ],
            // jsonList: json,
        })
        console.log('res', res)
        if (res.success) {
            // setCurIp(res.data)
            onUploaded && onUploaded(res.data)

        }
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
                            <IconButton
                                size="small"
                                tooltip={t('help')}
                                onClick={() => {
                                    event$.emit({
                                        type: 'event_show_help',
                                        data: {
                                            fileName: 'json',
                                        },
                                    })
                                }}
                            >
                                <QuestionOutlined />
                            </IconButton>
                            <Button
                                size="small"
                                onClick={() => {
                                    const code = getCode()
                                    let js
                                    try {
                                        js = JSON5.parse(code)
                                    }
                                    catch (err) {
                                        message.error(err.message)
                                    }
                                    if (js) {
                                        const json = JSON.stringify(js, null, 4)
                                        editor?.setValue(json)
                                    }
                                }}
                            >
                                {t('json.json5_to_json')}
                            </Button>
                            <Button
                                size="small"
                                onClick={() => {
                                    const code = getCode()
                                    copy(code)
                                    message.info(t('copied'))
                                }}
                            >
                                {t('copy')}
                            </Button>
                            <Button
                                size="small"
                                onClick={() => {
                                    const example = [
                                        {
                                            name: 'Alice',
                                            age: 16,
                                        },
                                        {
                                            name: 'Bob',
                                            age: 18,
                                        },
                                    ]
                                    const json = JSON.stringify(example, null, 4)
                                    editor?.setValue(json)
                                }}
                            >
                                {t('example')}
                            </Button>
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
                    <div className={styles.header}>
                        <Tabs
                            activeKey={tab}
                            onChange={key => {
                                setTab(key)
                            }}
                            size="small"
                            items={[
                                {
                                    label: t('viewer'),
                                    key: 'viewer',
                                },
                                {
                                    label: t('json.table_view'),
                                    key: 'table',
                                },
                            ]}
                        />
                    </div>
                    <div className={styles.body}>
                        {tab == 'viewer' && !!jsonObj &&
                            <ReactJson 
                                src={jsonObj}
                                displayDataTypes={false}
                            />
                        }
                        {tab == 'table' && !!jsonObj &&
                            <div className={styles.tableBox}>
                                <div className={styles.header}>
                                    <Button
                                        size="small"
                                        onClick={() => {
                                            uploadJson(jsonObj)
                                        }}
                                    >
                                        {t('query')}
                                    </Button>
                                </div>
                                <JsonTable
                                    jsonObj={jsonObj}
                                />
                            </div>
                        }
                    </div>
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
