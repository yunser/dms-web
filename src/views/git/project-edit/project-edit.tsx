import { Button, Descriptions, Form, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './project-edit.module.less';
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

export function ProjectEditor({ config, sourceType = 'exist', onSuccess, onCancel, onList }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [curTab, setCurTab] = useState('status')
    // const [curTab, setCurTab] = useState('commit-list')
    
    const [form] = Form.useForm()

    const tabs = [
        {
            label: '文件状态',
            key: 'status',
        },
        {
            label: '提交记录',
            key: 'commit-list',
        },
    ]

    async function handleOk() {
        setLoading(true)
        const values = await form.validateFields()
        let res = await request.post(`${config.host}/git/project/create`, {
            url: values.url,
            name: values.name,
            path: values.path,
        })
        // console.log('res', res)
        if (res.success) {
            onSuccess && onSuccess()
        }
        setLoading(false)
    }

    useEffect(() => {

        form.setFieldsValue({
            // url: 'git@github.com:yunser/git-auto3.git',
            // path: '/Users/yunser/app/git-auto3',
            // name: 'git-auto3',
        })
    }, [])

    return (
        <Modal
            visible={true}
            title="新建项目"
            onCancel={onCancel}
            onOk={handleOk}
            confirmLoading={loading}
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
                {sourceType == 'clone' &&
                    <Form.Item
                        name="url"
                        label="URL"
                        rules={[ { required: true, }, ]}
                    >
                        <Input />
                    </Form.Item>
                }
                <Form.Item
                    name="name"
                    label="Name"
                    rules={[ { required: true, }, ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="path"
                    label="Path"
                    rules={[ { required: true, }, ]}
                >
                    <Input />
                </Form.Item>
            </Form>
        </Modal>
    )
}
