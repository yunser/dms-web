import { Form, Input, Modal } from 'antd';
import React, { useState } from 'react';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { request } from '@/views/db-manager/utils/http';
import { lastSplit } from '@/utils/helper';

export function FileDownloadModal({ config, info, curPath, type, item, onSuccess, sourceType, onCancel }) {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)

    const [form] = Form.useForm()

    async function handleOk() {
        const values = await form.validateFields()
        setLoading(true)
        const [_prefix, fileName] = lastSplit(values.url, '/')
        
        console.log('info', info)
        const res = await request.post(`${config.host}/file/downloadFromUrl`, {
            url: values.url,
            savePath: curPath + info.pathSeparator + fileName,
        })
        if (res.success) {
            onSuccess && onSuccess()
        }
        setLoading(false)
    }

    return (
        <Modal
            title={t('rename')}
            open={true}
            onCancel={onCancel}
            onOk={handleOk}
            okText={t('download')}
            confirmLoading={loading}
            maskClosable={false}
        >
            <Form
                form={form}
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
                initialValues={{
                    // url: 'https://icons.yunser.com/icons/dev.png',
                }}
                onFinish={() => {
                    handleOk()
                }}
            >
                <Form.Item
                    name="url"
                    label={t('url')}
                    rules={[ { required: true, }, ]}
                >
                    <Input
                        autoFocus
                    />
                </Form.Item>
                <Form.Item
                    label={t('file.save_path')}
                    rules={[ { required: true, }, ]}
                >
                    {curPath}
                </Form.Item>
            </Form>
        </Modal>
    )
}
