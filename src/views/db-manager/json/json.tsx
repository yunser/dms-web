import { Button, Descriptions, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useMemo, useState } from 'react';
import styles from './json.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { Editor } from '../editor/Editor';
import { IconButton } from '../icon-button';
import { FormatPainterOutlined } from '@ant-design/icons';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

export function Json({ config, }) {
    const { t } = useTranslation()

    const [code] = useState('')
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
                        Format
                    </Button>
                    <Button
                        size="small"
                        onClick={() => {
                            const code = getCode()
                            const formatedCode = JSON.stringify(JSON.parse(code))
                            editor?.setValue(formatedCode)
                        }}
                    >
                        Compress
                    </Button>
                </Space>
            </div>
            <div className={styles.editorBox}>
                <Editor
                    lang="json"
                    value={code}
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
