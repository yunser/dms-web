import { Button, Descriptions, Form, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import styles from './remote-edit.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { DownloadOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
import { CommitList } from '../commit-list';
import { BranchList } from '../branch-list';
import { GitStatus } from '../git-status';
import { RemoteList } from '../remote-list';
import { TagList } from '../tag-list';
import { request } from '@/views/db-manager/utils/http';
// import { saveAs } from 'file-saver'

export function TagEditor({ config, projectPath, onSuccess, onCancel, onList }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [curTab, setCurTab] = useState('status')
    // const [curTab, setCurTab] = useState('commit-list')
    
    const [form] = Form.useForm()


    async function handleOk() {
        const values = await form.validateFields()
        let res = await request.post(`${config.host}/git/tag/create`, {
            projectPath,
            name: values.name,
            // url: values.url,
        })
        // console.log('res', res)
        if (res.success) {
            onSuccess && onSuccess()
        }
    }

    return (
        <Modal
            visible={true}
            title="新建标签"
            onCancel={onCancel}
            onOk={handleOk}
            maskClosable={false}
        >
            <Form
                form={form}
                labelCol={{ span: 8 }}
                wrapperCol={{ span: 16 }}
                initialValues={{
                    port: 3306,
                }}
                // layout={{
                //     labelCol: { span: 0 },
                //     wrapperCol: { span: 24 },
                // }}
            >
                <Form.Item
                    name="name"
                    label="Name"
                    rules={[ { required: true, }, ]}
                >
                    <Input />
                </Form.Item>
                {/* <Form.Item
                    name="url"
                    label="URL"
                    rules={[ { required: true, }, ]}
                >
                    <Input />
                </Form.Item> */}
            </Form>
        </Modal>
    )
}
