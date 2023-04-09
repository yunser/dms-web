import { Form, Input, Modal } from 'antd';
import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { request } from '@/views/db-manager/utils/http';
import styles from './global-info-modal.module.less'

export function GlobalInfoModal({ config, projectPath, onSuccess, onCancel }) {
    const { t } = useTranslation()

    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)

    async function loadGlobalConfig() {
        let res = await request.post(`${config.host}/git/getGlobalConfig`, {
        })
        if (res.success) {
            if (res.data.config?.user) {
                const { user } = res.data.config
                form.setFieldsValue({
                    name: user.name || '',
                    email: user.email || '',
                })
            }
        }
    }

    useEffect(() => {
        loadGlobalConfig()
    }, [])
    
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
        let res = await request.post(`${config.host}/git/setGlobalConfig`, reqData)
        if (res.success) {
            onSuccess && onSuccess()
        }
        setLoading(false)
    }

    return (
        <div>
            <Modal
                open={true}
                title={t('config')}
                onCancel={onCancel}
                onOk={handleOk}
                confirmLoading={loading}
                maskClosable={false}
            >
                <div className={styles.sectionTitle}>{t('user')}</div>
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
