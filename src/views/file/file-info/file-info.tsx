import { Button, Checkbox, Descriptions, Dropdown, Empty, Input, Menu, message, Modal, Popover, Space, Spin, Table, Tabs, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './file-info.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { request } from '@/views/db-manager/utils/http';
import { FullCenterBox } from '@/views/common/full-center-box';
import moment from 'moment';
// import { saveAs } from 'file-saver'
import { FileUtil } from '../utils/utl';
import Mode from 'stat-mode'

// console.log('mode', Mode)
interface File {
    name: string
}

function ModeView({ mode, onSave }) {
    const { t } = useTranslation()
    const [curMode, setCurMode] = useState(-1)

    useEffect(() => {
        setCurMode(mode)
    }, [mode])
    
    const m = new Mode(curMode)

    // let owner = `${m.owner.read ? 'r' : '-'}${m.owner.write ? 'w' : '-'}${m.owner.execute ? 'x' : '-'}`
    // let group = `${m.group.read ? 'r' : '-'}${m.group.write ? 'w' : '-'}${m.owner.execute ? 'x' : '-'}`
    // let others = `${m.others.read ? 'r' : '-'}${m.others.write ? 'w' : '-'}${m.others.execute ? 'x' : '-'}`
    
    // let modeText = `${m.isDirectory() ? 'd' : '-'} ${owner} ${group} ${others}`

    function mode2Int(m) {
        function parseRole(value) {
            return parseInt(`${value.read ? 1 : 0}${value.write ? 1 : 0}${value.execute ? 1 : 0}`, 2)
        }
        return parseInt(`${parseRole(m.owner)}${parseRole(m.group)}${parseRole(m.others)}`, 8)
    }

    // const code = mode2Int(m)
    const dataSource = ['owner', 'group', 'others'].map(who => {
        return {
            who,
            read: m[who].read,
            write: m[who].write,
            execute: m[who].execute,
        }
    })
    if (curMode == -1) {
        return <div></div>
    }
    return (
        <div>
            {/* {mode} */}
            <div>
                {/* {mode}/{curMode}/int: {code} */}
                {/* {modeText} */}
                <Table
                    pagination={false}
                    dataSource={dataSource}
                    size="small"
                    columns={[
                        {
                            title: t('file.mode.role'),
                            dataIndex: 'who',
                            render(value) {
                                return (
                                    <div>
                                        {t(`file.mode.role.${value}`)}
                                    </div>
                                )
                            }
                        },
                        {
                            title: t('file.mode.read'),
                            dataIndex: 'read',
                            render(value, item) {
                                return (
                                    <div className={styles.checkboxBox}>
                                        <Checkbox
                                            checked={value}
                                            onChange={e => {
                                                const { checked } = e.target
                                                m[item.who].read = checked
                                                setCurMode(m.stat.mode)
                                            }}
                                        />
                                    </div>
                                )
                            }
                        },
                        {
                            title: t('file.mode.write'),
                            dataIndex: 'write',
                            render(value, item) {
                                return (
                                    <div className={styles.checkboxBox}>
                                        <Checkbox
                                            checked={value}
                                            onChange={e => {
                                                const { checked } = e.target
                                                m[item.who].write = checked
                                                setCurMode(m.stat.mode)
                                            }}
                                        />
                                    </div>
                                )
                            }
                        },
                        {
                            title: t('file.mode.execute'),
                            dataIndex: 'execute',
                            render(value, item) {
                                return (
                                    <div className={styles.checkboxBox}>
                                        <Checkbox
                                            checked={value}
                                            onChange={e => {
                                                const { checked } = e.target
                                                m[item.who].execute = checked
                                                setCurMode(m.stat.mode)
                                            }}
                                        />
                                    </div>
                                )
                            }
                        },
                    ]}
                />
                {mode != curMode &&
                    <div className={styles.saveBox}>
                        <Button
                            size="small"
                            onClick={() => {
                                onSave && onSave({
                                    mode: curMode,
                                    modeInt: mode2Int(m)
                                })
                            }}
                            disabled={mode == curMode}
                        >
                            {t('save')}
                        </Button>
                    </div>
                }
            </div>
        </div>
    )
}

export function FileInfo({ config, path, sourceType, onCancel }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [stat, setStat] = useState(null)
    const isImage = FileUtil.isImage(path)
    const isMarkdown = path.endsWith('.md')
    const isAudio = path.endsWith('.mp3')
    const isVideo = path.endsWith('.mp4')


    async function loadDetail() {
        setLoading(true)
        let res = await request.post(`${config.host}/file/stat`, {
            path,
            sourceType,
        }, {
            // noMessage: true,
        })
        // console.log('res', res)
        if (res.success) {
            setStat(res.data.stat)
        }
        setLoading(false)
    }

    async function updateMode(modeObj) {
        setLoading(true)
        let _mode
        if (sourceType == 'local') {
            _mode = modeObj.mode
        }
        else {
            _mode = modeObj.modeInt
        }
        let res = await request.post(`${config.host}/file/modeUpdate`, {
            path,
            sourceType,
            mode: _mode,
        })
        if (res.success) {
            loadDetail()
        }
    }

    useEffect(() => {
        // hack 经常会因为 path 为空接口报错
        if (!path) {
            return
        }
        loadDetail()
    }, [path])

    return (
        <Modal
            title={path}
            open={true}
            // width={800}
            onCancel={onCancel}
            footer={null}
        >
            {loading ?
                <FullCenterBox>
                    <Spin />
                </FullCenterBox>
            :
                <div>
                    {!!stat &&
                        <Descriptions column={1}>
                            <Descriptions.Item
                                label={t('create_time')}
                            >
                                {moment(stat.createTime).format('YYYY-MM-DD HH:mm:ss')}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={t('file.modify_time')}
                            >
                                {moment(stat.modifyTime).format('YYYY-MM-DD HH:mm:ss')}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={t('file.permission')}
                            >
                                <ModeView
                                    mode={stat.mode}
                                    onSave={value => {
                                        updateMode(value)
                                    }}
                                />
                                {/* {stat.mode} */}
                            </Descriptions.Item>
                        </Descriptions>
                    }
                </div>
            }
        </Modal>
    )
}
