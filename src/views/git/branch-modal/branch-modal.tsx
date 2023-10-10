import { Form, Input, Modal, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import styles from './branch-modal.module.less';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { request } from '@/views/db-manager/utils/http';
import { CommitItem } from '../commit-item';

export function BranchModal({ config, event$, remoteName, current, projectPath, commit, onSuccess, onCancel }) {
    const { t } = useTranslation()

    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)

    const names = [
        {
            content: 'feature/',
        },
        {
            content: 'development',
        },
        {
            content: 'production',
        },
        {
            content: 'main',
        },
    ]
    
    async function handleOk() {
        const values = await form.validateFields()
        setLoading(true)
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
        if (res.success) {
            onSuccess && onSuccess()
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
            >
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
                <div>
                    {names.map(name => (
                        <Tag
                            className={styles.tag}
                            onClick={() => {
                                form.setFieldsValue({
                                    name: name.content,
                                })
                            }}
                        >
                                {name.content}
                        </Tag>
                    ))}
                </div>
            </Modal>
        </div>
    )
}
