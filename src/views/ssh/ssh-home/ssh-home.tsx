import { Button, message, Space } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import styles from './ssh-home.module.less';
import _ from 'lodash';
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { request } from '@/views/db-manager/utils/http';
// import { saveAs } from 'file-saver'

import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { WebLinksAddon } from 'xterm-addon-web-links'
import { Unicode11Addon } from 'xterm-addon-unicode11'
import { SearchAddon } from 'xterm-addon-search'
import { WebglAddon } from 'xterm-addon-webgl'
import { SerializeAddon } from "xterm-addon-serialize"

import '~xterm/css/xterm.css'
import { uid } from 'uid';

interface File {
    name: string
}

function Commands({ config, onClickItem }) {
    const [list, setList] = useState([
        // {
        //     id: '1',
        //     name: 'get registry',
        //     command: 'npm config get registry',
        // }
    ])

    async function loadList() {
        let res = await request.post(`${config.host}/ssh/command/list`, {
        }, {
            noMessage: true,
        })
        // console.log('res', res)
        if (res.success) {
            setList(res.data.list)
        }
    }

    useEffect(() => {
        loadList()
    }, [])

    return (
        <div className={styles.commands}>
            {list.map(item => {
                return (
                    <div
                        className={styles.item}
                        onClick={() => {
                            onClickItem && onClickItem(item)
                        }}
                        key={item.id}
                    >
                        {item.name}</div>
                )
            })}
        </div>
    )
}

export function SshDetail({ config, defaultPath, item, onSftpPath, onClone }) {
    const isSsh = !!item
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [list, setList] = useState<File[]>([])
    const [curPath, setCurPath] = useState('')
    const [connected, setConnected] = useState(false)
    const [isActive, setIsActive] = useState(false)
    const [term, setTerm] = useState(null)

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
            cols: 80,
            rows: 30,
            allowProposedApi: true,
            // ursorBlink: true, // 关标闪烁
            // cursorStyle: "bar", // 光标样式 'block' | 'underline' | 'bar'
            // scrollback: 100, // 当行的滚动超过初始值时保留的行视窗，越大回滚能看的内容越多，
        })

        xtermRef.current = xterm
        const elem = document.getElementById(termIdRef.current) as HTMLElement
        xterm.open(elem)

        // FitAddon
        const fitAddon = new FitAddon()
        xterm.loadAddon(fitAddon)
        // const terminal = new Terminal();

        xterm.loadAddon(new WebLinksAddon())

        const serializeAddon = new SerializeAddon();
        xterm.loadAddon(serializeAddon)

        // terminal.write("something...", () => {
        //     console.log(serializeAddon.serialize());
        // });

        const unicode11Addon = new Unicode11Addon();
        xterm.loadAddon(unicode11Addon)
        xterm.unicode.activeVersion = '11'
        // 🥵
        
        const searchAddon = new SearchAddon()
        xterm.loadAddon(searchAddon)

        const webglAddon = new WebglAddon()
        xterm.loadAddon(webglAddon)

        
        // searchAddon.findNext('foo');


        function fit() {
            fitAddon.fit()
            if (wsRef.current) {
                const pd = fitAddon.proposeDimensions()
                const rect = elem.getBoundingClientRect()
                wsRef.current.send(JSON.stringify({
                    type: 'resize',
                    data: {
                        ...pd,
                        width: rect.width,
                        height: rect.height,
                    },
                    //  + '\r'
                }))
            }
        }
        fit()
        xterm.onData(data =>  {
            if (wsRef.current) {
                if (wsRef.current.readyState != 1) {
                    message.error(t('disconnected'))
                    return
                }
                // console.log('send')
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

        function handleResize() {
            fit()
            // fitAddon.fit()
            // const pd = fitAddon.proposeDimensions()
            // console.log('_pd', pd)
        }

        window.addEventListener('resize', handleResize)

        return () => {
            xtermRef.current = null
            xterm.dispose()
            fitAddon.dispose()
            searchAddon.dispose()
            serializeAddon.dispose()
            webglAddon.dispose()
            unicode11Addon.dispose()
            // const ele
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    function initWebSocket() {
        let first = true

        term && term.focus()

        const ws = new WebSocket('ws://localhost:10087/')
        ws.onclose = () => {
            console.log('close socket')
            message.error(t('disconnected'))
            setConnected(false)
        }
        ws.onopen = () => {
            console.log('onopen', )

            // const pd = fitAddon.proposeDimensions()
            //     // console.log('_pd', pd)
            //     wsRef.current.send(JSON.stringify({
            //         type: 'resize',
            //         data: pd,
            //         //  + '\r'
            //     }))

            const _xterm = xtermRef.current
            ws.send(JSON.stringify({
                type: 'connect',
                data: {
                    ...((item || {})),
                    defaultPath,
                    ptySize: {
                        rows: _xterm?.rows,
                        cols: _xterm?.cols,
                    }
                },
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
            // console.log('onmessage', text)
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
                if (first) {
                    first = false
                    setConnected(true)
                }
                _xterm.write(msg.data)
            }
            else if (msg.type == 'pwd') {
                const { path } = msg.data
                console.log('path', path)
                onSftpPath && onSftpPath(path)
            }

        }
        wsRef.current = ws
    }

    useEffect(() => {
        if (!term) {
            return
        }
        initWebSocket()
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

    function checkConnection() {
        wsRef.current.send(JSON.stringify({
            type: 'pwd',
            data: {},
            //  + '\r'
        }))
    }

    function newTab() {
        onClone && onClone()
    }

    return (
        <div className={styles.terminalApp}>
            <div className={styles.terminalBox}
                onFocus={() => {
                    setIsActive(true)
                }}
                onBlur={() => {
                    setIsActive(false)
                }}
                style={{
                    opacity: isActive ? 1 : 0.7,
                }}
            >
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
            <div>
                <Commands
                    config={config}
                    onClickItem={item => {
                        wsRef.current.send(JSON.stringify({
                            type: 'command',
                            data: item.command,
                            //  + '\r'
                        }))
                        term.focus()
                    }}
                />
            </div>
            <div className={styles.statusBox}>
                <Space>
                    <div>{connected ? t('connected') : t('disconnected')}</div>
                    {!connected &&
                        <Button
                            size="small"
                            onClick={() => {
                                initWebSocket()
                            }}
                        >
                            {t('connect')}
                        </Button>
                    }
                    <Button
                        size="small"
                        onClick={() => {
                            newTab()
                        }}
                    >
                        {t('new_tab')}
                    </Button>
                    {connected && isSsh &&
                        <Button
                            size="small"
                            onClick={() => {
                                checkConnection()
                            }}
                        >
                            SFTP
                        </Button>
                    }
                </Space>
                {!!item &&
                    <div>{item.username}@{item.host}:{item.port}</div>
                }
            </div>
            {/* {!local &&
                <div className={styles.toolBox}>
                    <Button onClick={() => {
                        onBack && onBack()
                    }}>返回</Button>
                </div>
            } */}
            {/* <Button
                onClick={() => {
                    const _xterm = xtermRef.current
                    // if (msg.type == 'res') {
                    // }
                    // _xterm.write("1 \r\u001b[K")
                    _xterm.write("1 \r\n")
                }}
            >
                调试
            </Button> */}
        </div>
    )
}
