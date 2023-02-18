import { Button, Checkbox, Col, Descriptions, Empty, Form, Input, InputNumber, message, Modal, Popover, Row, Select, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './redis-open.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { request } from '@/views/db-manager/utils/http';
import { uid } from 'uid';
import { t } from 'i18next';


export function RedisOpenModal({ config, onCancel, onSuccess, redisKey, event$, connectionId, defaultDatabase = 0 }) {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [form] = Form.useForm()

    
    async function handleOk() {
        const values = await form.validateFields()
        onSuccess && onSuccess({
            key: values.key,
        })
    }
    
    return (
        <Modal
            title={t('redis.key.open')}
            visible={true}
            onCancel={onCancel}
            // confirmLoading={loading}
            onOk={handleOk}
            maskClosable={true}
        >
            <Form
                form={form}
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
                initialValues={{
                    name: redisKey,
                    // port: 6379,
                    // db: 0,
                }}
                onFinish={handleOk}
                // layout={{
                //     labelCol: { span: 0 },
                //     wrapperCol: { span: 24 },
                // }}
            >
                <Form.Item
                    name="key"
                    label={t('redis.key')}
                    rules={[ { required: true, }, ]}
                >
                    <Input
                        autoFocus
                        // disabled={!(editType == 'create')}
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}
