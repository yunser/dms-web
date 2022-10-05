import { Button, Descriptions, Dropdown, Empty, Input, Menu, message, Modal, Popover, Space, Table, Tabs, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './ssh-home.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { DownloadOutlined, EllipsisOutlined, FileOutlined, FolderOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter, useKeyPress } from 'ahooks';
import { request } from '@/views/db-manager/utils/http';
import { IconButton } from '@/views/db-manager/icon-button';
import { FullCenterBox } from '@/views/db-manager/redis-client';
import moment from 'moment';
// import { saveAs } from 'file-saver'
import filesize from 'file-size'
import { Terminal } from 'xterm'
import '~xterm/css/xterm.css'
import { uid } from 'uid';

interface File {
    name: string
}

export function SshDetail({ config, local = false, item, onBack }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [list, setList] = useState<File[]>([])
    const [curPath, setCurPath] = useState('')
    const [term, setTerm] = useState(null)
    // const config = {
    //     host: 'http://localhost:10086'
    // }

    const xtermRef = useRef<Terminal>(null)
    // const _xterm = xtermRef.current
    const wsRef = useRef(null)
    const termIdRef = useRef('')

    if (!termIdRef.current) {
        termIdRef.current = `terminal-${uid(32)}`
    }
    // const _ws = wsRef.current

    // async function loadList() {
    //     let res = await request.post(`${config.host}/file/list`, {
    //         path: curPath,
    //         // projectPath,
    //         // connectionId,
    //         // sql: lineCode,
    //         // tableName,
    //         // dbName,
    //         // logger: true,
    //     }, {
    //         // noMessage: true,
    //     })
    //     // console.log('res', res)
    //     if (res.success) {
    //         // setProjects([])
    //         const list = (res.data.list as File[])
    //             .filter(file => {
    //                 return !file.name.startsWith('.')
    //             })
    //             .sort((a, b) => {
    //                 return a.name.localeCompare(b.name)
    //             })
    //         setList(list)
    //         // setCurrent(res.data.current)
    //     }
    // }

    useEffect(() => {
        const xterm = new Terminal({
            // ursorBlink: true, // 关标闪烁
            // cursorStyle: "bar", // 光标样式 'block' | 'underline' | 'bar'
            // scrollback: 100, // 当行的滚动超过初始值时保留的行视窗，越大回滚能看的内容越多，
        })
        xtermRef.current = xterm
        xterm.open(document.getElementById(termIdRef.current) as HTMLElement);
        xterm.onData(data =>  {
            console.log('onData', data)
            // console.log('_ws', _ws)
            console.log('wsRef', wsRef)
            if (wsRef.current) {
                console.log('send')
                wsRef.current.send(JSON.stringify({
                    type: 'command',
                    data,
                }))
            }
        })
        xterm.focus()
        // xterm.writeln('Welcome to use webssh!')
        // xterm.write('Hello from \x1B[1;3;31mxterm.js\x1B[0m $ ')
        // xterm.on('data',(data)=>{
        //     console.log(Buffer.from(data))
        //     console.log('xterm:' + Buffer.from(data).toString())
        //     ptyProcess.write(Buffer.from(data))
        // })
        //   ptyProcess.on('data', function (data) {
        //     console.log(data)
        //     console.log('ptyProcess:' + data.toString())
        //     xterm.write(data.toString())
        //   })

        // xterm.4.x 输入
        // xterm.onKey(e => {
        //     const ev = e.domEvent
        //     const printable = !ev.altKey && !ev.altGraphKey && !ev.ctrlKey && !ev.metaKey
        //     if (ev.keyCode === 13) {
        //         // 回车
        //         // xterm
        //         xterm.writeln('')
        //     } else if (ev.keyCode === 8) {
        //         // Do not delete the prompt
        //         if (xterm._core.buffer.x > 2) {
        //             xterm.write('\b \b')
        //         }
        //     } else if (printable) {
        //         xterm.write(e.key);
        //         // webSocket.send(e.key);
        //     }
        // })

        setTerm(xterm)

        return () => {
            xtermRef.current = null
            xterm.dispose()
        }
    }, [])

    useEffect(() => {
        if (!term) {
            return
        }
        const ws = new WebSocket('ws://localhost:2000/')
        ws.onclose = () => {
            console.log('close socket')
        }
        ws.onopen = () => {
            console.log('onopen', )
            ws.send(JSON.stringify({
                type: 'connect',
                data: item || null,
            }))
            console.log('sended')
            // // 连接成功后
            // this.initTerm()
        }
        ws.onerror = () => {
            console.log('socket error')
        }
        ws.onmessage = (event) => {
            const text = event.data.toString()
            console.log('onmessage', text)
            // 接收推送的消息
            let msg
            try {
                msg = JSON.parse(text)
            }
            catch (err) {
                console.log('JSON.parse err', err)
                return
            }
            const _xterm = xtermRef.current
            if (msg.type == 'res') {
                _xterm.write(msg.data)
            }

        }
        wsRef.current = ws
        return () => {
            // ws.close()
        }
    }, [term])

    function back() {
        console.log('cur', curPath)
        const idx = curPath.lastIndexOf('/') // TODO
        const newPath = curPath.substring(0, idx)
        console.log('newPath', newPath)
        setCurPath(newPath)
    }

    useEffect(() => {
        // loadList()
    }, [curPath])

    // useKeyPress([], e => {
    //     function handleKeyDown(e) {
    //         console.log('e', e.code)
    //     }
    //     window.addEventListener('keydown', handleKeyDown)
    //     return () => {
    //         window.removeEventListener('keydown', handleKeyDown)
    //     }
    // })

    console.log('termIdRef.current', termIdRef.current)

    return (
        <div>
            <div className={styles.terminalBox}>
                {/* ssh */}
                {/* <button
                    onClick={() => {
                        _xterm.write('1212')
                    }}
                >
                    hello
                </button> */}
                {/* <hr /> */}
                {/* 命令行234 */}
                <div id={termIdRef.current}></div>
                
            </div>
            {!local &&
                <div className={styles.toolBox}>
                    <Button onClick={() => {
                        onBack && onBack()
                    }}>返回</Button>
                </div>
            }
        </div>
    )
}
