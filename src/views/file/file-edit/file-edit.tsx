import { Button, Descriptions, Dropdown, Empty, Input, Menu, message, Modal, Popover, Space, Spin, Table, Tabs, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './file-edit.module.less';
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
import { FullCenterBox } from '@/views/common/full-center-box';
import moment from 'moment';
// import { saveAs } from 'file-saver'
import filesize from 'file-size'
import { FileList } from '../file-list'
import { Editor } from '@/views/db-manager/editor/Editor';
import { FileUtil } from '../utils/utl';

interface File {
    name: string
}

export function FileEdit({ config, path, initContent = '', sourceType, onSuccess, onCancel, onMin }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(true)
    const [saveLoading, setSaveLoading] = useState(false)
    const isJson = path.endsWith('.json')
    const isJs = path.endsWith('.js')
    const editorRef = useRef(null)
    async function loadDetail() {
        setLoading(true)
        let res = await request.post(`${config.host}/file/read`, {
            path,
            sourceType,
        }, {
            // noMessage: true,
        })
        // console.log('res', res)
        if (res.success) {
            setContent(initContent || res.data.content)
        }
        setLoading(false)
    }

    useEffect(() => {
        loadDetail()
    }, [])

    async function handleOk() {
        const content = editorRef.current.getValue()
        setSaveLoading(true)
        let res = await request.post(`${config.host}/file/write`, {
            path,
            sourceType,
            content,
        }, {
            // noMessage: true,
        })
        setSaveLoading(false)
        // console.log('res', res)
        if (res.success) {
            message.success(t('success'))
            onSuccess && onSuccess()
        }
    }

    return (
        <Modal
            title={path}
            open={true}
            width={1200}
            centered
            onCancel={onCancel}
            // onOk={handleOk}
            maskClosable={false}
            confirmLoading={saveLoading}
            footer={
                <Space>
                    <Button
                        onClick={() => {
                            const content = editorRef.current.getValue()
                            onMin && onMin(content)
                        }}
                    >
                        {t('minimize')}
                    </Button>
                    <Button
                        onClick={onCancel}
                    >
                        {t('cancel')}
                    </Button>
                    <Button
                        type="primary"
                        onClick={handleOk}
                    >
                        {t('ok')}
                    </Button>
                </Space>
            }
        >
            {/* <Input.TextArea
                value={content}
                rows={16}
                onChange={e => {
                    setContent(e.target.value)
                }}
            /> */}
            {loading ?
                <FullCenterBox>
                    <Spin />
                </FullCenterBox>
            :
                <div className={styles.editorBox}>
                    <Editor
                        lang={FileUtil.getLang(path)}
                        value={content}
                        autoFocus={false}
                        // value=""
                        // event$={event$}
                        // onChange={value => setCodeASD(value)}
                        // autoFoucs={true}
                        // destroy={true}
                        onEditor={editor => {
                            // setEditor(editor)
                            // console.log('degg', content == contentRef.current, content, contentRef.current)
                            // editor.setValue(content)
                            // content
                            editorRef.current = editor
                        }}
                        // onSelectionChange={({selection, selectionTextLength}) => {
                        //     console.log('selection', selection)
                        //     selectionEvent.emit({
                        //         data: {
                        //             selection: {
                        //                 ...selection,
                        //                 textLength: selectionTextLength,
                        //             }
                        //         }
                        //     })
                        // }}
                    />
                </div>
            }
        </Modal>
    )
}
