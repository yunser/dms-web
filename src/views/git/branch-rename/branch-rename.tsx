import { Form, Input, Modal } from 'antd';
import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { request } from '@/views/db-manager/utils/http';


export function BranchRenameModal({ config, projectPath, item, onSuccess, onCancel }) {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)

    const [form] = Form.useForm()

    async function handleOk() {
        const values = await form.validateFields()
        setLoading(true)
        const res = await request.post(`${config.host}/git/branch/rename`, {
            projectPath,
            oldBranchName: item.name,
            newBranchName: values.name,
        })
        if (res.success) {
            onSuccess && onSuccess()
        }
        setLoading(false)
    }

    useEffect(() => {
        form.setFieldsValue({
            name: item.name,
        })
    }, [item])

    return (
        <Modal
            title={t('git.branch.rename')}
            open={true}
            onCancel={onCancel}
            onOk={handleOk}
            confirmLoading={loading}
            maskClosable={false}
        >
            <Form
                form={form}
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
                initialValues={{}}
                onFinish={() => {
                    handleOk()
                }}
            >
                <Form.Item
                    name="name"
                    label={t('name')}
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
