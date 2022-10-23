import React, { useEffect, useState } from 'react'

import classes from './commander.module.less'
import classNames from 'classnames'
import { message, Modal } from 'antd'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

function ModalContent({ commands, onCommand, onCancel }) {
    const { t } = useTranslation()
    const [keyword, setKeyword] = useState('')
    const [curIndex, setCurIndex] = useState(0)

    

    // const id = useId
    useEffect(() => {
        document.getElementById('search-input')?.focus()
    }, [])

    const actions = [
        ...commands.map(item => {
            return {
                id: item.command,
                name: item.name,
                onItemClick() {
                    onCommand && onCommand(item.command)
                    // message.info('About')
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
        if (!keyword) {
            return actions
        }
        return actions.filter(item => item.name.toLowerCase().includes(keyword.toLowerCase()))
    }, [keyword])

    function afterItemClick() {
        onCancel()
    }

    useEffect(() => {
        const handleKeyDown = e => {
            console.log('e', e.code, e)
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
    }, [curIndex, results])

    return (
        <div className={classes.mask}
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
                <div className={classes.content}
                    onClick={(e) => {
                        e.preventDefault()
                        // else.pre
                        e.stopPropagation()
                    }}
                >
                    <div className={classes.searchBox}>
                        <i className={classNames(classes.iconfont, classes['icon-search'], classes.icon)}></i>
                        <input
                            className={classes.input}
                            id="search-input"
                            placeholder={t('command.search')}
                            value={keyword}
                            onChange={e => {
                                setKeyword(e.target.value)
                            }}
                        />
                    </div>
                    <div className={classes.results}>
                        {results.map((result, idx) => {
                            return (
                                <div className={classNames(classes.item, {
                                    [classes.active]: idx == curIndex,
                                })}
                                    onClick={() => {
                                        result.onItemClick && result.onItemClick()
                                        afterItemClick()
                                    }}
                                >
                                    <div className={classes.name}>{result.name}</div>
                                </div>
                            )
                        })}
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
            if ((e.code == 'KeyK' || e.code == 'KeyP') && e.metaKey) {
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
        <div className={classes.layoutPage}>
            {/* Ctrl/Cmd + K */}
            {modalVisible &&
                <ModalContent
                    commands={commands}
                    onCommand={onCommand}
                    onCancel={() => {
                        setModalVisible(false)
                    }}
                />
            }
        </div>
    )
}
