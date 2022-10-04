import { Button, Descriptions, Dropdown, Empty, Input, Menu, message, Modal, Popover, Space, Table, Tabs, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './file-detail.module.less';
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
import { FileList } from '../file-list'

interface File {
    name: string
}

export function FileEdit({ config, path, sourceType, onSuccess, onCancel }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [list, setList] = useState<File[]>([])
    const [content, setContent] = useState('')

    async function loadDetail() {
        let res = await request.post(`${config.host}/file/read`, {
            path,
            sourceType,
        }, {
            // noMessage: true,
        })
        // console.log('res', res)
        if (res.success) {
            setContent(res.data.content)
        }
    }

    useEffect(() => {
        loadDetail()
    }, [])

    async function handleOk() {
        let res = await request.post(`${config.host}/file/write`, {
            path,
            sourceType,
            content,
        }, {
            // noMessage: true,
        })
        // console.log('res', res)
        if (res.success) {
            onSuccess && onSuccess()
        }
    }

    return (
        <Modal
            title={path}
            open={true}
            width={1200}
            onCancel={onCancel}
            onOk={handleOk}
            maskClosable={false}
            // footer={null}
        >
            <Input.TextArea
                value={content}
                rows={16}
                onChange={e => {
                    setContent(e.target.value)
                }}
            />
        </Modal>
    )
}
