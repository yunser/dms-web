import { Form, Modal, Select } from 'antd';
import React, { useEffect, useState } from 'react';
import styles from './fetch-modal.module.less';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { request } from '@/views/db-manager/utils/http';


export function FetchModal({ config, event$, projectPath, onSuccess, onCancel }) {
    const { t } = useTranslation()

    const [form] = Form.useForm()
    const [remotes, setRemotes] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        loadRemotes()
    }, [])

    async function loadRemotes() {
        let res = await request.post(`${config.host}/git/remote/list`, {
            projectPath,
        })
        if (res.success) {
            const remotes = res.data
            setRemotes(remotes)
            if (remotes.length) {
                form.setFieldsValue({
                    remoteName: remotes[0].name,
                })
            }
        }
    }

    async function fetch() {
        const values = await form.validateFields()
        setLoading(true)
        setError('')
        let res = await request.post(`${config.host}/git/fetch`, {
            projectPath,
            remoteName: values.remoteName,
        }, {
            noMessage: true,
        })
        console.log('pull/res', res)
        if (res.success) {
            onSuccess && onSuccess()
            event$.emit({
                type: 'event_reload_history',
                data: {
                    commands: res.data.commands,
                }
            })
        }
        else {
            setError(res.data.message)
        }
        setLoading(false)
    }

    return (
        <div>
            <Modal
                open={true}
                title={t('git.fetch')}
                onCancel={onCancel}
                onOk={fetch}
                okText={t('git.fetch')}
                confirmLoading={loading}
            >
                <Form
                    form={form}
                    labelCol={{ span: 8 }}
                    wrapperCol={{ span: 16 }}
                    initialValues={{
                        port: 3306,
                    }}
                >
                    <Form.Item
                        name="remoteName"
                        label={t('git.remote')}
                        rules={[ { required: true, }, ]}
                    >
                        <Select
                            options={remotes.map(r => {
                                return {
                                    label: r.name,
                                    value: r.name,
                                }
                            })}
                        />
                    </Form.Item>
                </Form>
                {!!error &&
                    <div className={styles.error}>
                        <pre>{error}</pre>
                    </div>
                }
            </Modal>
        </div>
    )
}
