import { Button, Descriptions, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useMemo, useState } from 'react';
import styles from './text.module.less';
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
// import { saveAs } from 'file-saver'

export function TextEditor({ config, event$, data = {} }) {
    const { defaultJson = '' } = data
    const { t } = useTranslation()

    const [code] = useState(defaultJson)
    const [code2, setCode2] = useState('')
    const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
    
    function getCode() {
        return code2
    }

    function setCodeASD(code) {
        setCode2(code)
    }

    return (
        <div className={styles.jsonBox}>
            <div className={styles.toolBox}>
                <Space>
                    <Button
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
                    </Button>
                    <IconButton
                        size="small"
                        tooltip={t('download')}
                        onClick={() => {
                            const code = getCode()
                            // const formatedCode = JSON.stringify(JSON.parse(code))
                            // editor?.setValue(formatedCode)
                            const blob = new Blob([code], {type: 'text/plain;charset=utf-8'});
                            saveAs(blob, `${t('unnamed')}.txt`)
                        }}
                    >
                        <DownloadOutlined />   
                    </IconButton>
                </Space>
            </div>
            <div className={styles.editorBox}>
                <Editor
                    lang="plain"
                    value={code}
                    event$={event$}
                    onChange={value => setCodeASD(value)}
                    // autoFoucs={true}
                    onEditor={editor => {
                        setEditor(editor)
                    }}
                />
            </div>
            {/* <article className={styles.article}>
                <h1>JSON</h1>
            </article> */}
        </div>
    )
}
