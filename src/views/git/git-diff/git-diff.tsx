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

function parseHunkLine(line: string) {
    const matches = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
    if (!matches || matches.length !== 5) {
      return null;
    }
  
    const oldLineStart = parseInt(matches[1], 10);
    const oldLineCount = parseInt(matches[2] || "1", 10);
    const newLineStart = parseInt(matches[3], 10);
    const newLineCount = parseInt(matches[4] || "1", 10);
  
    return {
      oldLineStart,
      oldLineCount,
      newLineStart,
      newLineCount,
    };
}

export function DiffText({ text }) {
    console.log('DiffText/text', text)
    // const arr_will = text.split('\n')

    const isDiff = text.includes('@@')
    const lines = useMemo(() => {
        const arr = text.split('\n')
        const results = []
        let isCode = isDiff ? false : true
        let newLineStart = 0
        let newLineCurrent = 0
        let newLineIndex = 0
        let blockIndex = 0
        let blockInfo = ''
        for (let i = 0; i < arr.length; i++) {
            const line = arr[i] as string
            let type = ''
            let symbol = ''
            let content = line
            if (line.startsWith('@@')) {
                type = 'desc'
                isCode = true
                newLineIndex = i
                const hunk = parseHunkLine(line)
                newLineStart = hunk.newLineStart
                newLineCurrent = i - newLineIndex + newLineStart - 1
                blockInfo = `block ${blockIndex + 1}: line ${hunk.newLineStart} start`
                blockIndex++
            }
            else if (line.startsWith('+') && !line.startsWith('+++')) {
                type = 'added'
                symbol = '+'
                content = content.substring(1)
                newLineCurrent++
            }
            else if (line.startsWith('-') && !line.startsWith('---')) {
                type = 'deleted'
                symbol = '-'
                content = content.substring(1)
            }
            else {
                if (isCode) {
                    console.log('content', content)
                    if (isDiff) {
                        content = content.substring(1)
                    }
                    else {

                    }
                }
                newLineCurrent++
            }
            if (isCode || type == 'desc') {
                results.push({
                    // index: i,
                    index: newLineCurrent,
                    type,
                    symbol,
                    content,
                    blockInfo,
                })
            }
        }
        console.log('results', results)
        return results
    }, [text])

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
                {lines.map((line, index) => {
                    // let type = ''
                    // if (line.content.startsWith('@@')) {
                    //     type = 'desc'
                    // }
                    // else if (line.content.startsWith('+') && !line.content.startsWith('+++')) {
                    //     type = 'added'
                    // }
                    // else if (line.content.startsWith('-') && !line.content.startsWith('---')) {
                    //     type = 'deleted'
                    // }
                    return (
                        <div className={styles.lineItem}
                            key={index}
                        >
                            <div className={styles.noBox}>
                                {(line.type == 'desc' || line.type == 'deleted') ? '' : line.index}
                            </div>
                            <div 
                                className={classNames(styles.lineWrap, {
                                    [styles[line.type]]: true,
                                })}
                            >
                                <div className={styles.symbol}>{line.symbol}</div>
                                <div
                                    className={styles.line}
                                    // style={{
                                    //     color,
                                    //     backgroundColor
                                    // }}
                                >
                                    <pre>{line.type == 'desc' ? line.blockInfo : line.content}</pre>
                                </div>
                            </div>
                        </div>
                    )
                })}       
            </div>
            <div className={styles.border}></div>
            {/* <pre>{text}</pre> */}
        </div>
    )
}
