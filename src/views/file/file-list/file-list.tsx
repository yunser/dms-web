import { Button, Descriptions, Dropdown, Empty, Input, Menu, message, Modal, Popover, Space, Table, Tabs, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './file-list.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { DownloadOutlined, EllipsisOutlined, FileOutlined, FolderOutlined, LeftOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
import { request } from '@/views/db-manager/utils/http';
import { IconButton } from '@/views/db-manager/icon-button';
import { FullCenterBox } from '@/views/db-manager/redis-client';
import moment from 'moment';
// import { saveAs } from 'file-saver'
import filesize from 'file-size'
import { FileDetail } from '../file-detail';
import { FileNameModal } from '../file-name-edit';

interface File {
    name: string
    path: string
}

export function FileList({ config, sourceType }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [list, setList] = useState<File[]>([])
    const [curPath, setCurPath] = useState('')
    const [fileModalVisible, setFileModalVisible] = useState(false)
    const [fileModalPath, setFileModalPath] = useState('')
    const [folderVisible, setFolderVisible] = useState(false)
    async function loadList() {
        let res = await request.post(`${config.host}/file/list`, {
            path: curPath,
            sourceType,
            // projectPath,
            // connectionId,
            // sql: lineCode,
            // tableName,
            // dbName,
            // logger: true,
        }, {
            // noMessage: true,
        })
        // console.log('res', res)
        if (res.success) {
            // setProjects([])
            const list = (res.data.list as File[])
                .filter(file => {
                    return !file.name.startsWith('.')
                })
                .sort((a, b) => {
                    return a.name.localeCompare(b.name)
                })
            setList(list)
            // setCurrent(res.data.current)
        }
    }

    function back() {
        console.log('cur', curPath)
        const idx = curPath.lastIndexOf('/') // TODO
        const newPath = curPath.substring(0, idx)
        console.log('newPath', newPath)
        setCurPath(newPath)
    }

    useEffect(() => {
        loadList()
    }, [curPath])

    return (
        <div className={styles.fileBox}>
            <div className={styles.header}>
                <IconButton
                    tooltip="返回"
                    onClick={() => {
                        back()
                    }}
                >
                    <LeftOutlined />
                </IconButton>
                <IconButton
                    tooltip="刷新"
                    onClick={() => {
                        loadList()
                    }}
                >
                    <ReloadOutlined />
                </IconButton>
                <Dropdown
                    trigger={['click']}
                    overlay={
                        <Menu
                            onClick={({ key }) => {
                                if (key == 'create_folder') {
                                    setFolderVisible(true)
                                }
                            }}
                            items={[
                                {
                                    label: t('文件夹'),
                                    key: 'create_folder',
                                },
                            ]}
                        />
                    }
                >
                    <IconButton
                        tooltip="新建"
                    >
                        <PlusOutlined />
                    </IconButton>
                </Dropdown>
                <div className={styles.path}>{curPath}</div>
            </div>
            <div className={styles.body}>
                <div className={styles.bodyHeader}>
                    <div className={classNames(styles.cell, styles.name)}>文件名</div>
                    <div className={classNames(styles.cell, styles.updateTime)}>修改时间</div>
                    <div className={classNames(styles.cell, styles.size)}>大小</div>
                </div>
                <div className={styles.bodyBody}>
                    {list.length == 0 ?
                        <FullCenterBox>
                            <Empty />
                        </FullCenterBox>
                    :
                        <div className={styles.list}>
                            {list.map(item => {
                                return (
                                    <div className={styles.item}
                                        onClick={() => {
                                            if (item.type == 'FILE') {
                                                if (sourceType == 'local') {

                                                }
                                                else {
                                                    if (item.size > 1 * 1024 * 1024) {
                                                        message.info('文件太大，暂不支持查看')
                                                        return
                                                    }
                                                }
                                                setFileModalVisible(true)
                                                setFileModalPath(item.path)
                                            }
                                            else {
                                                setCurPath(item.path)
                                            }
                                        }}
                                    >
                                        <div className={classNames(styles.cell, styles.name)}>
                                            <div className={styles.icon}>
                                                {item.type == 'FILE' ?
                                                    <FileOutlined />
                                                :
                                                    <FolderOutlined />
                                                }
                                            </div>
                                            <div className={styles.label}>
                                                {item.name}
                                            </div>
                                        </div>
                                        <div className={classNames(styles.cell, styles.updateTime)}>
                                            {moment(item.updateTime).format('YYYY-MM-DD HH:mm')}
                                        </div>
                                        <div className={classNames(styles.cell, styles.size)}>
                                            {/* {item.size} */}
                                            {item.type == 'FILE' ?
                                                filesize(item.size, { fixed: 1, }).human()
                                            :
                                                '--'
                                            }
                                            {/* {} */}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    }
                </div>
            </div>
            {fileModalVisible &&
                <FileDetail
                    config={config}
                    path={fileModalPath}
                    sourceType={sourceType}
                    onCancel={() => {
                        setFileModalVisible(false)
                    }}
                />
            }
            {folderVisible &&
                <FileNameModal
                    config={config}
                    path={curPath}
                    sourceType={sourceType}
                    onCancel={() => {
                        setFolderVisible(false)
                    }}
                    onSuccess={() => {
                        setFolderVisible(false)
                        loadList()
                    }}
                />
            }
        </div>
    )
}
