import { Button, Checkbox, Col, Descriptions, Empty, Form, Input, InputNumber, message, Modal, Popover, Row, Select, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './redis-rename.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { Editor } from '../editor/Editor';
import storage from '../storage'
import { request } from '../utils/http'
import { CodeDebuger } from '../code-debug';
import { uid } from 'uid';
import { t } from 'i18next';



function handleRes(res) {
    if (res == null) {
        return `(nil)`
    }
    if (typeof res == 'string') {
        return `"${res}"`
    }
    if (Array.isArray(res)) {
        return res.join('\n')
    }
    return res
}

export function RedisRenameModal({ config, onCancel, onSuccess, redisKey, event$, connectionId, defaultDatabase = 0 }) {
    const [curDb, setCurDb] = useState(defaultDatabase)
    const { t } = useTranslation()
    const [code, setCode] = useState('')
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [form] = Form.useForm()

    async function handleOk() {
    }
    
    // useEffect(())
    
    return (
        <Modal
            title={t('rename')}
            visible={true}
            onCancel={onCancel}
            confirmLoading={loading}
            onOk={async () => {
                const values = await form.validateFields()
                setLoading(true)
                let ret = await request.post(`${config.host}/redis/rename`, {
                    connectionId,
                    key: redisKey,
                    newKey: values.name,
                })
                // console.log('ret', ret)
                if (ret.success) {
                    // message.success('连接成功')
                    // onConnect && onConnect()
                    message.success(t('success'))
                    onSuccess && onSuccess()
                }
                setLoading(false)
            }}
            maskClosable={false}
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
                // layout={{
                //     labelCol: { span: 0 },
                //     wrapperCol: { span: 24 },
                // }}
            >
                <Form.Item
                    name="name"
                    label={t('name')}
                    rules={[ { required: true, }, ]}
                >
                    <Input
                        // disabled={!(editType == 'create')}
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}
