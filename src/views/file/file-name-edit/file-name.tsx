import { Button, Descriptions, Dropdown, Empty, Form, Input, Menu, message, Modal, Popover, Space, Table, Tabs, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './file-name.module.less';
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

interface File {
    name: string
}

export function FileNameModal({ config, type, path, onSuccess, sourceType, onCancel }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [list, setList] = useState<File[]>([])
    const [loading, setLoading] = useState(false)
    const [content, setContent] = useState('')
    const [form] = Form.useForm()

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

    async function handleOk() {
        const values = await form.validateFields()
        setLoading(true)
        const res = await request.post(`${config.host}/file/create`, {
            path,
            name: values.name,
            sourceType,
            type,
            link: values.link,
        })
        // TODO
        const newPath = path + '/' + values.name
        if (res.success) {
            onSuccess && onSuccess({
                newPath,
            })
        }
        setLoading(false)
    }

    useEffect(() => {
        // loadDetail()
    }, [])

    return (
        <Modal
            title={type == 'FILE' ? t('file_new') : t('folder_new')}
            open={true}
            onCancel={onCancel}
            onOk={handleOk}
            confirmLoading={loading}
            // footer={null}
            maskClosable={false}
        >
            <Form
                form={form}
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
                initialValues={{
                    position: 'last',
                    // port: 6379,
                    // db: 0,
                }}
                onFinish={() => {
                    console.log('onFinish', )
                    handleOk()
                }}
                // layout={{
                //     labelCol: { span: 0 },
                //     wrapperCol: { span: 24 },
                // }}
            >
                <Form.Item
                    name="name"
                    label={t('name')}
                    rules={[ { required: true, }, ]}
                    extra={type == 'FILE' ? '支持绝对路径；文件所在目录不存在时会自动创建' : '支持绝对路径；支持同时创建多层目录'}
                >
                    <Input
                        autoFocus
                        // on
                        // disabled={!(editType == 'create')}
                    />
                </Form.Item>
                {type == 'LINK' &&
                    <Form.Item
                        name="link"
                        label={t('file.link')}
                        rules={[ { required: true, }, ]}
                    >
                        <Input />
                    </Form.Item>
                }
            </Form>
        </Modal>
    )
}
