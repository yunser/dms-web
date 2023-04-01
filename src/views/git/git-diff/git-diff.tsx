import { Button, Checkbox, Descriptions, Empty, Form, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import styles from './git-diff.module.less';
import _, { add } from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useEventEmitter, useSize } from 'ahooks';
import { FullCenterBox } from '@/views/common/full-center-box';
import VList from 'rc-virtual-list';

interface Size {
    width: number
    height: number
}

interface SizeDivProps {
    className: string
    render: (size: Size) => ReactNode
}

function SizeDiv({ className, render }: SizeDivProps) {

    const [size, setSize] = useState<Size | null>(null)

    const root = useRef<HTMLDivElement>(null)
    useEffect(() => {
        console.log('SizeDiv', !!root.current)
        if (root.current) {
            const { width, height } = root.current.getBoundingClientRect()
            setSize({
                width,
                height,
            })
            // setSize()
        }
    }, [])

    return (
        <div
            className={className}
            // className={styles.test}
            ref={root}
            style={{ height: '100%' }}
        >
            {size ? render(size) : '--'}
        </div>
    )
}

// by ChatGTP
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
    // console.log('DiffText/text', text)
    // const arr_will = text.split('\n')
    const lineBoxRef = useRef(null)
    const size = useSize(lineBoxRef)
    console.log('DiffText/size', size)
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
                    reactKey: i,
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
                        itemKey="reactKey"
                    >
                        {(line, index) => {
                            return (
                                <div
                                    className={styles.lineItem}
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
                        }}
                    </VList>
                )}
            />
        </div>
    )
}
