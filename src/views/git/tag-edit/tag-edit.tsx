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

export function TagEditor({ config, commit, event$, projectPath, onSuccess, onCancel, onList }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [curTab, setCurTab] = useState('status')
    // const [curTab, setCurTab] = useState('commit-list')
    
    const [form] = Form.useForm()

    console.log('commitHash', commit)
    async function handleOk() {
        const values = await form.validateFields()
        const reqData = {
            projectPath,
            name: values.name,
        }
        if (commit) {
            reqData.commit = commit.hash
        }
        let res = await request.post(`${config.host}/git/tag/create`, reqData)
        // console.log('res', res)
        if (res.success) {
            onSuccess && onSuccess()
            event$.emit({
                type: 'event_reload_history',
                data: {
                    commands: res.data.commands,
                }
            })
        }
    }

    return (
        <Modal
            visible={true}
            title={t('git.tag.create')}
            onCancel={onCancel}
            onOk={handleOk}
            width={560}
            maskClosable={false}
        >
            <Form
                form={form}
                labelCol={{ span: 4 }}
                wrapperCol={{ span: 20 }}
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
                    label={t('name')}
                    rules={[ { required: true, }, ]}
                >
                    <Input />
                </Form.Item>
                {!!commit &&
                    <Form.Item
                        // name="name"
                        label={t('git.commit')}
                        // rules={[ { required: true, }, ]}
                    >
                        {commit.hash}
                    </Form.Item>
                }
                
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
