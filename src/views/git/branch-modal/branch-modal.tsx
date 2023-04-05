import { Button, Descriptions, Form, Input, message, Modal, Popover, Select, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './pull-modal.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { DownloadOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
import { request } from '@/views/db-manager/utils/http';
import { CommitItem } from '../commit-item';
// import { saveAs } from 'file-saver'

export function BranchModal({ config, event$, remoteName, current, projectPath, commit, onSuccess, onCancel }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()

    const [form] = Form.useForm()
    const [remotes, setRemotes] = useState([])
    // const [current, setCurrent] = useState('')
    const [loading, setLoading] = useState(false)


    const [branches, setBranches] = useState([])

    

    console.log('remotes', remotes)

    async function handleOk() {
        const values = await form.validateFields()
        setLoading(true)
        // const values = await form.validateFields()
        // console.log('values', values)
        // return
        const reqData = {
            projectPath,
            name: values.name,
        }
        if (commit) {
            reqData.commit = commit.hash
        }
        if (remoteName) {
            reqData.remoteBranch = remoteName.substring(8)
        }
        let res = await request.post(`${config.host}/git/branch/create`, reqData)
        console.log('pull/res', res)
        if (res.success) {
            // setRemotes(res.data)
            onSuccess && onSuccess()
            // setCurrent(res.data.current)
            event$.emit({
                type: 'event_reload_history',
                data: {
                    commands: res.data.commands,
                }
            })
        }
        setLoading(false)
    }

    useEffect(() => {
        // loadRemotes()
        // loadBranches()
        // pull()
    }, [])

    useEffect(() => {
        if (remoteName) {
            const after = remoteName.substring(8)
            const idx = after.indexOf(config.pathSeparator)
            form.setFieldsValue({
                name: after.substring(idx + 1),
            })
        }
    }, [remoteName])

    return (
        <div>
            <Modal
                open={true}
                title={t('git.branch.create')}
                onCancel={onCancel}
                onOk={handleOk}
                confirmLoading={loading}
                maskClosable={false}
                okText={t('git.branch.create')}
                // footer={null}
            >
                {/* {loading ? 'Pulling' : 'Pull Finished'} */}
                <Form
                    form={form}
                    labelCol={{ span: 6 }}
                    wrapperCol={{ span: 18 }}
                    initialValues={{
                        port: 3306,
                    }}
                    onFinish={() => {
                        handleOk()
                    }}
                    // layout={{
                    //     labelCol: { span: 0 },
                    //     wrapperCol: { span: 24 },
                    // }}
                >
                    <Form.Item
                        name="name"
                        label={t('git.branch.name')}
                        rules={[ { required: true, }, ]}
                    >
                        <Input autoFocus />
                    </Form.Item>
                    {!!current &&
                        <Form.Item
                            label={t('git.branch.current')}
                        >
                            {current}
                        </Form.Item>
                    }
                    {!!commit &&
                        <Form.Item
                            label={t('git.commit')}
                        >
                            <CommitItem
                                commit={commit}
                            />
                        </Form.Item>
                    }
                    {!!remoteName &&
                        <Form.Item
                            label={t('git.remote_branch')}
                        >
                            {remoteName.substring(8)}
                        </Form.Item>
                    }
                </Form>
            </Modal>
        </div>
    )
}
