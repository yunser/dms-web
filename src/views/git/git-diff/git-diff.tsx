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

export function DiffText({ text, editable = false, onDiscard, onConflictResolve }) {
    const { t } = useTranslation()
    const isDiff = text.includes('@@')
    
     // 防止多选时选中文字
    const [userSelectable, setUserSelectable] = useState(true)
    const [selectedLines, setSelectedLines] = useState([])

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
            let conflict = {
                position: '',
            }
            if (line.startsWith('++<<<<<<<')) {
                type = 'conflict'
                conflict.position = 'start'
                newLineCurrent++
            }
            else if (line.startsWith('++>>>>>>>')) {
                type = 'conflict'
                conflict.position = 'end'
                newLineCurrent++
            }
            else if (line.startsWith('++=======')) {
                type = 'conflict'
                conflict.position = 'center'
                newLineCurrent++
            }
            else if (line.startsWith('@@')) {
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
            if (isCode || type == 'desc' || type == 'conflict') {
                results.push({
                    id: i,
                    index: newLineCurrent,
                    type,
                    symbol,
                    content,
                    blockInfo,
                    conflict,
                })
            }
        }
        return results
    }, [text])

    function conflictResolve(index: number, type: string) {
        const start = index
        let center
        let end
        for (let i = index; i < lines.length; i++) {
            const line = lines[i]
            if (line.type == 'conflict') {
                if (line.conflict.position == 'center') {
                    center = i
                }
                else if (line.conflict.position == 'end') {
                    end = i
                    break
                }
            }
        }
        onConflictResolve({
            start: start - 1,
            center: center - 1,
            end: end - 1,
            type,
        })
    }

    useEffect(() => {
        const handleKeyDown = e => {
            if (e.code == 'ShiftLeft' || e.code == 'ShiftRight') {
                setUserSelectable(false)
            }
        }
        const handleKeyUp = e => {
            if (e.code == 'ShiftLeft' || e.code == 'ShiftRight') {
                setUserSelectable(true)
            }
        }
        
        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
        }
    }, [])

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
                            const isSelected = !!selectedLines.find(item => item.id == line.id)
                            return (
                                <div
                                    className={classNames(styles.lineItem, {
                                        [styles.active]: isSelected,
                                    })}
                                    key={index}
                                    style={{
                                        userSelect: userSelectable ? undefined : 'none',
                                    }}
                                    onClick={(e) => {
                                        if (!editable) {
                                            return
                                        }
                                        if (line.type == 'added' || line.type == 'deleted' || line.type == 'conflict') {
                                            if (e.metaKey || e.ctrlKey) {
                                                // 单个多选
                                                const exists = selectedLines.some(item => item.id == line.id)
                                                if (exists) {
                                                    setSelectedLines(selectedLines.filter(item => item.id != line.id))
                                                }
                                                else {
                                                    setSelectedLines([
                                                        ...selectedLines,
                                                        line
                                                    ])
                                                }
                                            }
                                            else if (e.shiftKey) {
                                                // 快速多选
                                                // 暂只支持上到下选择
                                                if (selectedLines[0]) {
                                                    const startIdx = selectedLines[0].index
                                                    const endIdx = line.index
                                                    setSelectedLines(lines.filter(line => (line.index >= startIdx) && (line.index <= endIdx)))
                                                }
                                                else {
                                                    setSelectedLines([line])
                                                }
                                            }
                                            else {
                                                // 单个选择
                                                const exists = selectedLines.some(item => item.id == line.id)
                                                if (exists) {
                                                    setSelectedLines([])
                                                }
                                                else {
                                                    setSelectedLines([line])
                                                }
                                            }
                                        }
                                        else {
                                            setSelectedLines([])
                                        }
                                    }}
                                >
                                    <div className={styles.noBox}>
                                        {(line.type == 'desc' || line.type == 'deleted') ? '' : (line.index + 1)}
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
                                            : line.type == 'conflict' ?
                                                <div className={styles.conflict}>
                                                    <pre>{line.content}</pre>
                                                    {line.conflict.position == 'start' &&
                                                        <div className={styles.conflictBtns}>
                                                            ({t('git.conflict.change.current')})
                                                            <a
                                                                onClick={() => {
                                                                    conflictResolve(index, 'current')
                                                                }}
                                                            >
                                                                {t('git.conflict.accept.current')}
                                                            </a>
                                                            <a
                                                                onClick={() => {
                                                                    conflictResolve(index, 'incoming')
                                                                }}
                                                            >
                                                                {t('git.conflict.accept.incoming')}
                                                            </a>
                                                            <a
                                                                onClick={() => {
                                                                    conflictResolve(index, 'both')
                                                                }}
                                                            >
                                                                {t('git.conflict.accept.both')}
                                                            </a>
                                                        </div>
                                                    }
                                                    {line.conflict.position == 'end' &&
                                                        <div className={styles.conflictInfo}>({t('git.conflict.change.incoming')})</div>
                                                    }
                                                </div>
                                            :
                                                <pre>{line.content}</pre>
                                            }
                                        </div>
                                    </div>
                                    {(selectedLines.length > 0) && (selectedLines[0].id == line.id) &&
                                        <div className={styles.action}>
                                            <a className={styles.discard}
                                                onClick={() => {
                                                    onDiscard && onDiscard(selectedLines)
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
