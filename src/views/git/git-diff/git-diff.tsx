import { Button, Checkbox, Descriptions, Empty, Form, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './git-diff.module.less';
import _, { add } from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { DownloadOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
import { request } from '@/views/db-manager/utils/http';
import { FullCenterBox } from '@/views/common/full-center-box';
// import { saveAs } from 'file-saver'

export function DiffText({ text }) {
    const arr = text.split('\n')

    if (text === '') {
        return (
            <FullCenterBox>
                <Empty />
            </FullCenterBox>
        )
    }
    return (
        <div className={styles.diffBox}>
            <div className={styles.lines}>
                {arr.map((line, index) => {
                    let type = ''
                    if (line.startsWith('@@')) {
                        type = 'desc'
                    }
                    else if (line.startsWith('+') && !line.startsWith('+++')) {
                        type = 'added'
                    }
                    else if (line.startsWith('-') && !line.startsWith('---')) {
                        type = 'deleted'
                    }
                    return (
                        <div 
                            className={classNames(styles.lineWrap, {
                                [styles[type]]: true,
                            })}
                            key={index}
                        >
                            <div
                                className={styles.line}
                                // style={{
                                //     color,
                                //     backgroundColor
                                // }}
                            >
                                <pre>{line}</pre>
                            </div>
                        </div>
                    )
                })}       
            </div>
            {/* <pre>{text}</pre> */}
        </div>
    )
}
