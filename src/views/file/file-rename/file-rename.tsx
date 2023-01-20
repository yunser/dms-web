import { Button, Descriptions, Dropdown, Empty, Form, Input, Menu, message, Modal, Popover, Space, Table, Tabs, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './file-rename.module.less';
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

function getParentPath(curPath) {
    const idx = curPath.lastIndexOf('/') // TODO
    const newPath = curPath.substring(0, idx)
    console.log('newPath', newPath)
    return newPath || '/'
}

export function FileRenameModal({ config, type, item, onSuccess, sourceType, onCancel }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    // const [list, setList] = useState<File[]>([])
    // const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)

    const [form] = Form.useForm()

    async function handleOk() {
        const values = await form.validateFields()
        setLoading(true)
        const folder = getParentPath(item.path)
        const res = await request.post(`${config.host}/file/rename`, {
            // connectionId: connectionId,
            fromPath: item.path,
            toPath: (folder == '/' ? '/' : (folder + '/')) + values.name,
            sourceType,
            type,
            // field: '',
            // value: 'New Item',
            // dbName,
        })
        if (res.success) {
            onSuccess && onSuccess()
        }
        setLoading(false)
    }

    useEffect(() => {
        // loadDetail()
        form.setFieldsValue({
            name: item.name,
        })
    }, [item])

    return (
        <Modal
            title={t('rename')}
            open={true}
            onCancel={onCancel}
            onOk={handleOk}
            confirmLoading={loading}
            maskClosable={false}
            // footer={null}
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
                // layout={{
                //     labelCol: { span: 0 },
                //     wrapperCol: { span: 24 },
                // }}
            >
                <Form.Item
                    name="name"
                    label={t('name')}
                    rules={[ { required: true, }, ]}
                >
                    <Input
                        // disabled={!(editType == 'create')}
                    />
                </Form.Item>
                {/* <Form.Item
                    name="characterSet"
                    label="Character Set"
                    // rules={editType == 'create' ? [] : [ { required: true, }, ]}
                >
                    <Select
                        options={characterSets}
                        onChange={() => {
                            console.log('change')
                            form.setFieldsValue({
                                collation: null,
                            })
                        }}
                        // onChange={}
                    />
                </Form.Item> */}
                
            </Form>
        </Modal>
    )
}
