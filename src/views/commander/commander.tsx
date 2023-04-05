import React, { useEffect, useRef, useState } from 'react'

import styles from './commander.module.less'
import classNames from 'classnames'
import { Empty, message, Modal } from 'antd'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import storage from '../db-manager/storage'
import { AppstoreOutlined, SettingOutlined, ToolOutlined } from '@ant-design/icons'
import { FullCenterBox } from '../common/full-center-box'

function ModalContent({ commands, onCommand, onCancel }) {
    const { t } = useTranslation()
    const [keyword, setKeyword] = useState('')
    const [curIndex, setCurIndex] = useState(0)
    const inputRef = useRef({
        inputing: false,
    })
    

    // const id = useId
    useEffect(() => {
        document.getElementById('search-input')?.focus()
    }, [])

    const actions = [
        ...commands.map(item => {
            return {
                ...item,
                // command: item.command,
                // name: item.name,
                onItemClick() {
                    onCommand && onCommand(item.command)
                    // message.info('About')
                    storage.set('command_latest', item.command)
                }
            }
        }),
        // {
        //     id: 'ip',
        //     name: 'IP',
        //     onItemClick() {
        //         onCommand && onCommand('ip')
        //         // message.info('About')
        //     }
        // },
        // {
        //     id: 'close',
        //     name: 'Close',
        //     onItemClick() {
        //         onCommand && onCommand('close')
        //         message.info('Close')
        //     }
        // },
        // {
        //     id: 'reload',
        //     name: 'Reload',
        //     onItemClick() {
        //         onCommand && onCommand('reload')
        //         message.info('Reload')
        //     }
        // },
    ]

    const results = useMemo(() => {
        const commandLatest = storage.get('command_latest')
        // console.log('commandLatest', commandLatest)
        function score(item) {
            // console.log('item', item)
            // console.log('a.command == commandLatest', item.command, commandLatest)
            if (item.command == commandLatest) {
                return 100000 // 大于 order
            }
            if (item.order) {
                return item.order
            }
            return 0
        }

        function sorter(a, b) {
            return score(b) - score(a)
        }
        if (!keyword) {
            // console.log('actions', actions)
            return actions.sort(sorter)
        }
        return actions
            .filter(item => item.name.toLowerCase().includes(keyword.toLowerCase()))
            .sort(sorter)
    }, [actions, keyword])

    function afterItemClick() {
        onCancel()
    }

    useEffect(() => {
        const handleKeyDown = e => {
            // console.log('e', e.code, e)
            if (e.code == 'Escape') {
                onCancel && onCancel()
            }
            else if (e.code == 'ArrowDown') {
                let newIdx = curIndex + 1
                if (newIdx > results.length - 1) {
                    newIdx = 0
                }
                setCurIndex(newIdx)
            }
            else if (e.code == 'ArrowUp') {
                let newIdx = curIndex - 1
                if (newIdx < 0) {
                    newIdx = results.length - 1
                }
                setCurIndex(newIdx)
            }
            else if (e.code == 'Enter') {
                if (inputRef.current.inputing) {
                    return
                }
                if (results[curIndex]?.onItemClick) {
                    results[curIndex]?.onItemClick()
                    afterItemClick()
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [curIndex, results, inputRef])

    const iconMap = {
        'system': '',
        'tool': <ToolOutlined className={styles.icon} />,
        'app': <AppstoreOutlined className={styles.icon} />,
    }

    return (
        <div className={styles.mask}
            onClick={onCancel}
        >
            {/* 212 */}
            <div
                // title={null}
                // visible={true}
                // mask={true}
                // title="1212"
                // footer={null}
                // closeIcon={<></>}
                // onCancel={onCancel}
                // style={{
                //     top: 160
                // }}
            >
                <div className={styles.content}
                    onClick={(e) => {
                        e.preventDefault()
                        // else.pre
                        e.stopPropagation()
                    }}
                >
                    <div className={styles.searchBox}>
                        <i className={classNames(styles.iconfont, styles['icon-search'], styles.icon)}></i>
                        <input
                            className={styles.input}
                            id="search-input"
                            placeholder={t('command.search')}
                            value={keyword}
                            onChange={e => {
                                setKeyword(e.target.value)
                            }}
                            onCompositionStart={() => {
                                console.log('onCompositionStart')
                                inputRef.current.inputing = true
                            }}
                            onCompositionEnd={() => {
                                console.log('onCompositionEnd')
                                inputRef.current.inputing = false
                            }}
                        />
                    </div>
                    <div className={styles.results}>
                        {results.length == 0 ?
                            <div>
                                <FullCenterBox
                                    height={240}
                                >
                                    <Empty />
                                </FullCenterBox>
                            </div>
                        :
                            <>
                                {results.map((result, idx) => {
                                    return (
                                        <div 
                                            key={result.command}
                                            className={classNames(styles.item, {
                                                [styles.active]: idx == curIndex,
                                            })}
                                            onClick={() => {
                                                result.onItemClick && result.onItemClick()
                                                afterItemClick()
                                            }}
                                        >
                                            <div className={styles.iconBox}>
                                                {iconMap[result.icon] ?
                                                    iconMap[result.icon]
                                                :
                                                    <SettingOutlined className={styles.icon} />
                                                }
                                                {/* <AppstoreOutlined /> */}
                                            </div>
                                            {/* <div>{result.icon}|</div> */}
                                            <div className={styles.name}>{result.name}</div>
                                        </div>
                                    )
                                })}
                            </>
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}

export function Commander({ commands, onCommand, onRef }) {


    const [modalVisible, setModalVisible] = useState(false)

    
    useEffect(() => {
        const handleKeyDown = e => {
            // console.log('e', e.code, e)
            if ((e.code == 'KeyK' || e.code == 'KeyP') && (e.metaKey || e.ctrlKey)) {
                // console.log('ok')
                e.preventDefault()
                setModalVisible(!modalVisible)

            }
        }
        window.addEventListener('keydown', handleKeyDown)

        
        onRef && onRef({
            show() {
                setModalVisible(true)
            }
        })
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [modalVisible])

    return (
        <div className={styles.layoutPage}>
            {/* Ctrl/Cmd + K */}
            {modalVisible &&
                <ModalContent
                    commands={commands}
                    onCommand={(command) => {
                        onCommand && onCommand(command)
                        setModalVisible(false)
                    }}
                    onCancel={() => {
                        setModalVisible(false)
                    }}
                />
            }
        </div>
    )
}
