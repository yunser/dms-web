import { Form, Input, Modal } from 'antd';
import React, { useState } from 'react';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { request } from '@/views/db-manager/utils/http';

export function GitAuthorEditModal({ config, item, projectPath, onSuccess, onCancel }) {
    const { t } = useTranslation()

    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)

    async function handleOk() {
        const values = await form.validateFields()
        setLoading(true)
        const reqData = {
            projectPath,
            user: {
                name: values.name,
                email: values.email,
            }
        }
        let res = await request.post(`${config.host}/git/setConfig`, reqData)
        console.log('pull/res', res)
        if (res.success) {
            onSuccess && onSuccess()
        }
        setLoading(false)
    }

    return (
        <div>
            <Modal
                open={true}
                title={t('git.update_local_author')}
                onCancel={onCancel}
                onOk={handleOk}
                confirmLoading={loading}
                maskClosable={false}
            >
                <Form
                    form={form}
                    labelCol={{ span: 6 }}
                    wrapperCol={{ span: 18 }}
                    initialValues={{
                        ...item,
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
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="email"
                        label={t('email')}
                        rules={[ { required: true, }, ]}
                    >
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}
