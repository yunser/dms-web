import { Button, Checkbox, Descriptions, Empty, Form, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import styles from './git-diff.module.less';
import _, { add } from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useEventEmitter, useSize } from 'ahooks';
import { FullCenterBox } from '@/views/common/full-center-box';
import VList from 'rc-virtual-list';
import { useTranslation } from 'react-i18next';
import { SizeDiv } from '@/views/common/size-dev';

// TODO
function parseHunkLine(line: string) {
    if (line.startsWith('@@@')) {
        // @@@ -1,1 -1,3 +1,6 @@@
        const arr = line.replace(/@@@/g, '')
            .trim()
            .split(/\s+/)
            .map(item => item.split(',').map(num => {
                return parseInt(num)
            }))
        if (arr.length > 4) {
            return {
                oldLineStart: arr[0],
                oldLineCount: arr[1],
                newLineStart: arr[2],
                newLineCount: arr[3],
            }
        }
        return {
            raw: line,
        }
    }
    // by ChatGPT
    const matches = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/)
    if (!matches || matches.length !== 5) {
        return {
            raw: line,
        }
    }
  
    const oldLineStart = parseInt(matches[1], 10)
    const oldLineCount = parseInt(matches[2] || "1", 10)
    const newLineStart = parseInt(matches[3], 10)
    const newLineCount = parseInt(matches[4] || "1", 10)
  
    return {
        oldLineStart,
        oldLineCount,
        newLineStart,
        newLineCount,
    }
}

export function DiffText({ text, editable = false, onDiscard }) {
    const { t } = useTranslation()
    const isDiff = text.includes('@@')
    
    const [selectedLine, setSelectedLine] = useState(null)

    const lines = useMemo(() => {
        const arr = text.split('\n')
        const results = []
        let isCode = isDiff ? false : true
        let newLineStart = 0
        let newLineCurrent = 0
        let newLineIndex = 0
        let blockIndex = 0
        let blockInfo = {
            index: 0,
        }
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
                // TODO
                newLineStart = hunk?.newLineStart || 0
                newLineCurrent = i - newLineIndex + newLineStart - 1
                // blockInfo = `${t('git.block')} ${blockIndex + 1}: line ${hunk?.newLineStart}`
                blockInfo = {
                    index: blockIndex,
                    lineStart: hunk?.newLineStart || 0,
                }
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
                    id: i,
                    index: newLineCurrent,
                    type,
                    symbol,
                    content,
                    blockInfo,
                })
            }
        }
        return results
    }, [text])

    if (!text) {
        return (
            <FullCenterBox>
                <Empty description={t('git.file.empty')} />
            </FullCenterBox>
        )
    }
    return (
        <div className={styles.diffBox}>
            <div className={styles.vLine}></div>
            {/* <pre>{text}</pre> */}
            <SizeDiv
                className={styles.lineBox}
                render={size => (
                    // <div className={styles.lineBox}>
                    //     <div className={styles.lines}>
                    //         {lines.map((line, index) => {
                    //         })}       
                    //     </div>
                    // </div>
                    <VList 
                        data={lines} 
                        height={size.height} 
                        itemHeight={20} 
                        itemKey="id"
                    >
                        {(line, index) => {
                            return (
                                <div
                                    className={classNames(styles.lineItem, {
                                        [styles.active]: selectedLine && selectedLine.id == line.id,
                                    })}
                                    key={index}
                                    onClick={() => {
                                        if (!editable) {
                                            return
                                        }
                                        if (line.type == 'added' || line.type == 'deleted') {
                                            setSelectedLine(line)
                                        }
                                        else {
                                            setSelectedLine(null)
                                        }
                                    }}
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
                                            {line.type == 'desc' ? 
                                                <div>
                                                    {`${t('git.block')} ${line.blockInfo.index + 1}: ${t('git.line')} ${line.blockInfo.lineStart}`}
                                                    {/* <a className={styles.discard}
                                                        onClick={() => {
                                                            // fileDiscard
                                                        }}
                                                    >丢弃区块</a> */}
                                                </div>
                                            :
                                                <pre>{line.content}</pre>
                                            }
                                        </div>
                                    </div>
                                    {selectedLine && selectedLine.id == line.id &&
                                        <div className={styles.action}>
                                            <a className={styles.discard}
                                                onClick={() => {
                                                    onDiscard && onDiscard({
                                                        type: line.type,
                                                        line: line.index,
                                                        content: line.content,
                                                    })
                                                }}
                                            >
                                                {t('git.discard')}
                                            </a>
                                        </div>
                                    }
                                </div>
                            )
                        }}
                    </VList>
                )}
            />
        </div>
    )
}
