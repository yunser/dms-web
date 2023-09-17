import { Form, Input, Modal, message } from 'antd';
import React, { useEffect } from 'react';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { request } from '@/views/db-manager/utils/http';

export function RedisLikeModal({ config, event$, item, onClose, onSuccess, onConnect, }) {
    const { t } = useTranslation()

    const [form] = Form.useForm()
    const editType = item?.id ? 'update' : 'create'

    useEffect(() => {
        if (item) {
            form.setFieldsValue({
                ...item,
            })
        }
        else {
            form.setFieldsValue({
                name: '',  
                key: '',
            })
        }
    }, [item])

    return (
        <Modal
            title={editType == 'create' ? t('redis.like.create') : t('redis.like.update')}
            open={true}
            onCancel={onClose}
            maskClosable={false}
            onOk={async () => {
                const values = await form.validateFields()
                if (editType == 'create') {
                    let ret = await request.post(`${config.host}/redis/key/create`, {
                        name: values.name,
                        key: values.key,
                    })
                    if (ret.success) {
                        message.success(t('saved'))
                        event$.emit({
                            type: 'event_sql_list_refresh',
                        })

                        onClose && onClose()
                        onSuccess && onSuccess()
                    }
                }
                else {
                    let ret = await request.post(`${config.host}/redis/key/update`, {
                        id: item.id,
                        data: {
                            name: values.name,
                            key: values.key,
                        }
                    })
                    if (ret.success) {
                        message.success(t('saved'))
                        onClose && onClose()
                        onSuccess && onSuccess()
                    }
                }
            }}
        >
            <Form
                form={form}
                labelCol={{ span: 4 }}
                wrapperCol={{ span: 20 }}
            >
                <Form.Item
                    name="name"
                    label={t('name')}
                    rules={[ { required: true, }, ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="key"
                    label={t('key')}
                    rules={[ { required: true, }, ]}
                >
                    <Input />
                </Form.Item>
            </Form>
        </Modal>
    );
}
