import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './hex-editor.module.less';
import _ from 'lodash';
import classNames from 'classnames'
import { useTranslation } from 'react-i18next';
import { uid } from 'uid';
import { SizeDiv } from '@/views/common/size-dev';
import VList from 'rc-virtual-list'

class HexCore {

    intList: number[]

    constructor() {
        this.intList = [104, 101, 108, 108, 111]
    }

    getLength() {
        return this.intList.length
    }

    getHexByIndex(index: number) {
        if (index >= this.intList.length) {
            return null
        }
        return this.intList[index].toString(16).toUpperCase()
    }

    getAsciiByIndex(index: number) {
        if (index >= this.intList.length) {
            return null
        }
        return String.fromCharCode(this.intList[index])
    }

    async readFile(file: File): Promise<void> {
        return new Promise((resolve) => {
            let reader = new FileReader()
            reader.onload = e => {
                let array = new Uint8Array(e.target.result)
                this.loadData(array)
                resolve()
            }
            reader.readAsArrayBuffer(file)
        })
    }

    loadData(array: Uint8Array) {
        this.intList = []
        for (let i = 0; i < array.length; i++) {
            this.intList.push(array[i])
        }
    }
}

export function HexEditor({ }) {
    const { t } = useTranslation()
    
    const editor = useMemo(() => {
        return new HexCore()
    }, [])

    const headers = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '0A', '0B', '0C', '0D', '0E', '0F']

    const [rows, setRows] = useState([
        {
            key: uid(32),
        },
    ])
    const [loaded, setLoaded] = useState(false)
    const [loading, setLoading] = useState(false)

    function getOffset(index: number) {
        return ((index) * 16).toString(16).toUpperCase().padStart(8, '0')
    }

    async function uploadFiles(files: File[] = []) {

        const file = files[0]
        if (!file) {
            return
        }
        await editor.readFile(file)
    }

    return (
        <div className={styles.app}
            onDragOver={(e) => {
                e.stopPropagation();
                e.preventDefault();
            }}
            onDrop={async (e) => {
                e.stopPropagation()
                e.preventDefault()
                await uploadFiles(e.dataTransfer.files)
                const rowNum = Math.ceil(editor.getLength() / 16)
                const newRows = []
                for (let i = 0; i < rowNum; i++) {
                    newRows.push({
                        key: uid(32),
                    })
                }
                setRows(newRows)
            }}
        >
            <div className={styles.layoutLeft}>
                <div className={styles.toolBox}>
                    <div>{t('hex.drop')}</div>
                </div>
                <div className={styles.rows}>
                    <div className={classNames(styles.row, styles.header)}>
                        <div className={styles.offset}>
                            {t('hex.offset')}
                        </div>
                        <div className={styles.cells}>
                            {headers.map(cell => {
                                return (
                                    <div className={styles.cell}>
                                        {cell}
                                    </div>
                                )
                            })}
                        </div>
                        <div className={styles.ascCell}>ASCII</div>
                    </div>
                    <div className={styles.rowContent}>
                    <SizeDiv
                        className={styles.listBox}
                        render={size => (
                            <VList
                                className={styles.list}
                                data={rows} 
                                height={size.height} 
                                itemHeight={32} 
                                itemKey="key"
                            >
                                {(item, row) => {
                                    const length = editor.getLength()
                                    return (
                                        <div className={styles.row}
                                            key={item.key}
                                        >
                                            <div className={styles.offset}>{getOffset(row)}</div>
                                            <div className={styles.cells}>
                                                {headers.map((_, col) => {
                                                    const idx = row * 8 + col
                                                    const cellValue = editor.getHexByIndex(idx)
                                                    
                                                    return (
                                                        <div className={styles.cell}
                                                            key={`${item.key}-${col}`}
                                                        >
                                                            {idx < length ?
                                                                <div className={styles.value}>{cellValue}</div>
                                                            :
                                                                <div></div>
                                                            }
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                            <div className={styles.ascList}>
                                                {headers.map((_, col) => {
                                                    const idx = row * 8 + col
                                                    const cellValue = editor.getAsciiByIndex(idx)
                                                    
                                                    return (
                                                        <div className={styles.cell}
                                                            key={`${item.key}-${col}`}
                                                        >
                                                            {idx < length ?
                                                                <div className={styles.value}>{cellValue}</div>
                                                            :
                                                                <div></div>
                                                            }
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
                                }}
                            </VList>
                        )}
                    />
                    </div>
                </div>
            </div>
            <div className={styles.layoutRight}>

            </div>
        </div>
    )
}
