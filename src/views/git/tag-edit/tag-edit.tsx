import { Checkbox, Form, Input, Modal } from 'antd';
import React, { useEffect, useState } from 'react';
import styles from './tag-edit.module.less';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { request } from '@/views/db-manager/utils/http';
import { CommitItem } from '../commit-item';

export function TagEditor({ config, commit, event$, projectPath, onSuccess, onCancel, onList }) {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [curCommit, setCurCommit] = useState(null)
    const [pushRemote, setPushRemote] = useState(false)
    const [form] = Form.useForm()

    useEffect(() => {
        loadList()
    }, [])

    async function loadList() {
        let res = await request.post(`${config.host}/git/commit/list`, {
            projectPath,
            limit: 1,
        })
        if (res.success) {
            const list = res.data
            if (list.length > 0) {
                setCurCommit(list[0])
            }
        }
    }

    async function handleOk() {
        const values = await form.validateFields()
        const reqData = {
            projectPath,
            name: values.name,
            pushRemote,
        }
        if (commit) {
            reqData.commit = commit.hash
        }
        setLoading(true)
        let res = await request.post(`${config.host}/git/tag/create`, reqData)
        setLoading(false)
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
            open={true}
            title={t('git.tag.create')}
            onCancel={onCancel}
            onOk={handleOk}
            width={560}
            maskClosable={false}
            confirmLoading={loading}
        >
            <Form
                form={form}
                labelCol={{ span: 4 }}
                wrapperCol={{ span: 20 }}
                initialValues={{
                    port: 3306,
                }}
                onFinish={() => {
                    handleOk()
                }}
            >
                <Form.Item
                    name="name"
                    label={t('name')}
                    rules={[ { required: true, }, ]}
                >
                    <Input autoFocus />
                </Form.Item>
                {!!commit ?
                    <Form.Item
                        label={t('git.commit')}
                    >
                        <CommitItem
                            commit={commit}
                        />
                    </Form.Item>
                :
                    <Form.Item
                        label={t('git.commit')}
                    >
                        {curCommit &&
                            <CommitItem
                                commit={curCommit}
                            />
                        }
                    </Form.Item>
                }
                <Form.Item wrapperCol={{ offset: 4, span: 20 }}>
                    <Checkbox
                        checked={pushRemote}
                        onChange={e => {
                            setPushRemote(e.target.checked)
                        }}
                    >
                        {t('git.tag.create.push_to_remote')}
                    </Checkbox>
                </Form.Item>
            </Form>
        </Modal>
    )
}
