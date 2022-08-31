import { Button, Descriptions, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useMemo, useState } from 'react';
import styles from './json.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { Editor } from '../editor/Editor';


export function Json({ config, }) {
    const { t } = useTranslation()

    const [code] = useState('')
    
    return (
        <div className={styles.jsonBox}>
            <Editor
                lang="json"
                value={code}
                // autoFoucs={true}
                // onChange={value => setCode2(value)}
                // onEditor={editor => {
                //     setEditor(editor)
                // }}
            />
            {/* <article className={styles.article}>
                <h1>JSON</h1>
            </article> */}
        </div>
    )
}
