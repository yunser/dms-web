import { Form, Input, Modal } from 'antd';
import React from 'react';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';

export function PathModal({ onSuccess, onCancel }) {
    const { t } = useTranslation()
    const [form] = Form.useForm()

    async function handleOk() {
        const values = await form.validateFields()
        onSuccess && onSuccess(values.path)
    }

    return (
        <Modal
            title={t('git.file_filter')}
            open={true}
            onCancel={onCancel}
            onOk={handleOk}
            maskClosable={false}
        >
            <Form
                form={form}
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
                initialValues={{
                    path: '',
                }}
                onFinish={() => {
                    handleOk()
                }}
            >
                <Form.Item
                    name="path"
                    label={t('path')}
                    rules={[ { required: true, }, ]}
                >
                    <Input
                        autoFocus
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}
