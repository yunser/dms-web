import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './hex-editor.module.less';
import _ from 'lodash';
import classNames from 'classnames'
import { useTranslation } from 'react-i18next';
import { uid } from 'uid';
import { SizeDiv } from '@/views/common/size-dev';
import VList from 'rc-virtual-list'
import { IconButton } from '@/views/db-manager/icon-button';
import { DownloadOutlined } from '@ant-design/icons';

const col_num = 16

function index2RowCol(index: number) {
    return {
        row: Math.floor(index / col_num),
        column: index % col_num
    }
}

class HexCore {

    intList: number[]

    constructor() {
        this.intList = [104, 101, 108, 108, 111]
    }

    static integer2Hex(int: number) {
        return int.toString(16).toUpperCase()
    }

    static hex2Integer(hex: string) {
        return parseInt(hex, 16)
    }

    static integer2Binary(int: number) {
        return int.toString(2).padStart(8, '0')
    }

    static integer2Ascii(charCode: number) {
        if (charCode < 31) {
            return '.'
        }
        return String.fromCharCode(charCode)
    }

    getLength() {
        return this.intList.length
    }

    setIndexValue(index: number, value: number) {
        this.intList[index] = value
    }

    removeIndexValue(index: number) {
        this.intList.splice(index, 1)
    }

    getIntegerByIndex(index: number) {
        if (index >= this.intList.length) {
            return null
        }
        return this.intList[index]
    }

    getHexByIndex(index: number) {
        if (index >= this.intList.length) {
            return null
        }
        return HexCore.integer2Hex(this.intList[index]).padStart(2, '0')
    }

    getAsciiByIndex(index: number) {
        if (index >= this.intList.length) {
            return null
        }
        return HexCore.integer2Ascii(this.intList[index])
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

    download() {
        console.log(this.intList)
        var b64 = btoa(String.fromCharCode.apply(null, this.intList));

        var a = document.createElement("a");
        a.style = "display: none";
        let fileType = this.fileType || 'application/octet-stream';
        a.setAttribute('download', 'hex.bin');
        a.href = 'data:' + fileType + ';base64,' + b64;

        document.body.appendChild(a);
        a.click();
    }
}

export function HexEditor({ }) {
    const { t } = useTranslation()
    
    const editor = useMemo(() => {
        return new HexCore()
    }, [])

    const [selection, setSelection] = useState([0])
    // left: input hex; right: input ascii
    const [editPosition, setEditPosition] = useState('left')
    
    const [detailItem, setDetailItem] = useState(-1)
    const headers = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '0A', '0B', '0C', '0D', '0E', '0F']

    const [rows, setRows] = useState([
        {
            key: uid(32),
        },
    ])
    const comData = useRef({
        lastAsciiChar: '',
        column: 0,
        row: 0,
        time: new Date(),
    })
    const [loaded, setLoaded] = useState(false)
    const [loading, setLoading] = useState(false)

    function activeNextCell() {
        if (selection.length) {
            const newSelectIdx = selection[0] + 1
            if (newSelectIdx <= editor.getLength()) {
                setSelection([newSelectIdx])
            }
        }
    }

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            console.log('e', e.code, e)
            if (['ShiftLeft', 'ShiftRight'].includes(e.code)) {
                e.preventDefault()
                return
            }
            if (e.code == 'ArrowRight') {
                e.preventDefault()
                activeNextCell()
                return
            }
            else if (e.code == 'ArrowLeft') {
                e.preventDefault()
                if (selection.length) {
                    const newSelectIdx = selection[0] - 1
                    if (newSelectIdx >= 0) {
                        setSelection([newSelectIdx])
                    }
                }
                return
            }
            else if (e.code == 'ArrowDown') {
                e.preventDefault()
                if (selection.length) {
                    const newSelectIdx = selection[0] += col_num
                    if (newSelectIdx < editor.getLength()) {
                        setSelection([newSelectIdx])
                    }
                }
                return
            }
            else if (e.code == 'ArrowUp') {
                e.preventDefault()
                if (selection.length) {
                    const newSelectIdx = selection[0] -= col_num
                    if (newSelectIdx < editor.getLength()) {
                        setSelection([newSelectIdx])
                    }
                }
                return
            }
            else if (e.code == 'Backspace') {
                if (selection.length) {
                    const idx = selection[0]
                    if (idx > 0) {
                        editor.removeIndexValue(idx - 1)
                        setRows([...rows])
                        setSelection([idx - 1])
                    }
                }
                return
            }

            var keyCode = e.keyCode;
            var asciiChar = String.fromCharCode(keyCode);
            console.log('Keycode: ' + keyCode + ', ASCII Code: ' + asciiChar);
            
            if (selection.length) {
                const idx = selection[0]
                const { row, column } = index2RowCol(idx)
                
                const _comData = comData.current
                
                let hex = ''
                if (editPosition == 'left') {
                    if (!asciiChar.match(/^[0-9a-fA-F]$/)) {
                        return
                    }
                    if (_comData.lastAsciiChar && _comData.column == column && _comData.row == row 
                        && _comData.time && new Date().getTime() - _comData.time.getTime() < 1000) {
                        hex = _comData.lastAsciiChar + asciiChar
                        comData.current.lastAsciiChar = ''
                        activeNextCell()
                    }
                    else {
                        hex = asciiChar
                        _comData.lastAsciiChar = asciiChar
                        _comData.column = column
                        _comData.row = row
                        _comData.time = new Date()
                    }
                    editor.setIndexValue(idx, HexCore.hex2Integer(hex))
                    rows[row].key = uid(32)
                    setRows([...rows])

                }
                else {
                    let int = keyCode
                    if (int >= 65 && int <= 90) { // A-Z
                        if (!e.shiftKey) {
                            // A-Z -> a-z
                            int += 32
                        }
                    }
                    console.log('keyCode', keyCode, int)
                    editor.setIndexValue(idx, int)
                    rows[row].key = uid(32)
                    setRows([...rows])
                    activeNextCell()
                }

                
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [selection])

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

    function selectCell(index, position) {
        setSelection([index])
        setEditPosition(position)
        if (index < editor.getLength()) {
            setDetailItem(editor.getIntegerByIndex(index))
        }
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
            <div className={styles.layoutSide}>
                {detailItem != -1 &&
                    <div className={styles.infoBox}>
                        <div className={styles.item}>
                            <div className={styles.key}>{t('hex.integer')}（8 {t('hex.bit')}）：</div>
                            <div className={styles.value}>
                                {detailItem}
                            </div>
                        </div>
                        <div className={styles.item}>
                            <div className={styles.key}>{t('hex.hex')}：</div>
                            <div className={styles.value}>
                                {HexCore.integer2Hex(detailItem)}
                            </div>
                        </div>
                        <div className={styles.item}>
                            <div className={styles.key}>{t('hex.ascii')}：</div>
                            <div className={styles.value}>
                                {HexCore.integer2Ascii(detailItem)}
                            </div>
                        </div>
                        <div className={styles.item}>
                            <div className={styles.key}>{t('hex.binary')}（8 {t('hex.bit')}）：</div>
                            <div className={styles.value}>
                                {HexCore.integer2Binary(detailItem)}
                            </div>
                        </div>
                    </div>
                }
            </div>
            <div className={styles.layoutMain}>
                <div className={styles.toolBox}>
                    <div>{t('hex.drop')}</div>
                    <IconButton
                        tooltip={t('download')}
                        onClick={() => {
                            editor.download()
                        }}
                    >
                        <DownloadOutlined />
                    </IconButton>
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
                                                    const idx = row * col_num + col
                                                    const cellValue = editor.getHexByIndex(idx)
                                                    
                                                    let isActive = false
                                                    if (selection.length == 1) {
                                                        isActive = idx == selection[0]
                                                    }
                                                    return (
                                                        <div className={classNames(styles.cell, {
                                                            [styles.active]: isActive,
                                                        })}
                                                            key={`${item.key}-${col}`}
                                                        >
                                                            {idx < length ?
                                                                <div className={classNames(styles.value, {
                                                                    [styles.edit]: isActive && editPosition == 'left'
                                                                })}
                                                                    onClick={() => {
                                                                        selectCell(idx, 'left')
                                                                    }}
                                                                >
                                                                    {cellValue}
                                                                </div>
                                                            : (idx == length) ?
                                                                <div className={classNames(styles.value, styles.add)}
                                                                    onClick={() => {
                                                                        selectCell(length, 'left')
                                                                    }}
                                                                >
                                                                    +
                                                                </div>
                                                            :
                                                                <div></div>
                                                            }
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                            <div className={styles.ascList}>
                                                {headers.map((_, col) => {
                                                    const idx = row * col_num + col
                                                    const cellValue = editor.getAsciiByIndex(idx)
                                                    
                                                    let isActive = false
                                                    if (selection.length == 1) {
                                                        isActive = idx == selection[0]
                                                    }

                                                    return (
                                                        <div className={classNames(styles.cell, {
                                                            [styles.active]: isActive,
                                                        })}
                                                            key={`${item.key}-${col}`}
                                                        >
                                                            {idx < length ?
                                                                <div
                                                                    className={classNames(styles.value, {
                                                                        [styles.edit]: isActive && editPosition == 'right'
                                                                    })}
                                                                    onClick={() => {
                                                                        selectCell(idx, 'right')
                                                                    }}
                                                                >{cellValue}</div>
                                                            : (idx == length) ?
                                                                <div className={classNames(styles.value, styles.add, {
                                                                    [styles.edit]: isActive && editPosition == 'right'
                                                                })}
                                                                    onClick={() => {
                                                                        selectCell(length, 'right')
                                                                    }}
                                                                >
                                                                </div>
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
            
        </div>
    )
}
