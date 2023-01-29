import { Button, Checkbox, Col, Descriptions, Empty, Form, Input, InputNumber, message, Modal, Popover, Row, Select, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './redis-ttl.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { request } from '@/views/db-manager/utils/http';


export function RedisTtlModal({ config, onCancel, onSuccess, redisKey, event$, connectionId, defaultDatabase = 0 }) {
    const [curDb, setCurDb] = useState(defaultDatabase)
    const { t } = useTranslation()
    const [code, setCode] = useState('')
    const [results, setResults] = useState([])
    const [noExpireLoading, setNoExpireLoading] = useState(false)
    const [loading, setLoading] = useState(false)
    const [form] = Form.useForm()

    async function _setTtl(seconds) {
        // setLoading(true)
        let ret = await request.post(`${config.host}/redis/expire`, {
            connectionId,
            key: redisKey,
            seconds,
        })
        // console.log('ret', ret)
        if (ret.success) {
            // message.success('连接成功')
            // onConnect && onConnect()
            message.success(t('success'))
            onSuccess && onSuccess()
        }
        // setLoading(false)
    }

    async function handleOk() {
        setLoading(true)
        const values = await form.validateFields()
        const unitValues = {
            second: 1000,
            minute: 60 * 1000,
            hour: 60 * 60 * 1000,
            day: 24 * 60 * 60 * 1000,
            month: 30 * 24 * 60 * 60 * 1000,
            year: 365 * 24 * 60 * 60 * 1000,
        }
        let ret = await request.post(`${config.host}/redis/expire`, {
            connectionId,
            key: redisKey,
            seconds: values.time * unitValues[values.unit] / 1000,
        })
        // console.log('ret', ret)
        if (ret.success) {
            // message.success('连接成功')
            // onConnect && onConnect()
            message.success(t('success'))
            onSuccess && onSuccess()
        }
        setLoading(false)
    }

    async function noExpire() {
        setNoExpireLoading(true)
        await _setTtl(-1)
        setNoExpireLoading(false)
    }

    const units = [
        {
            label: t('second'),
            value: 'second',
        },
        {
            label: t('minute'),
            value: 'minute',
        },
        {
            label: t('hour'),
            value: 'hour',
        },
        {
            label: t('day'),
            value: 'day',
        },
        {
            label: t('month'),
            value: 'month',
        },
        {
            label: t('year'),
            value: 'year',
        },
    ]
    

    return (
        <Modal
            title={`TTL ${t('setting')}`}
            visible={true}
            onCancel={onCancel}
            maskClosable={true}
            footer={(
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <Button key="back"
                        loading={noExpireLoading}
                        disabled={loading || noExpireLoading}
                        onClick={noExpire}
                    >
                        {t('no_expire')}
                    </Button>
                    <Space>
                        <Button
                            // key="submit"
                            // type="primary"
                            disabled={loading || noExpireLoading}
                            onClick={onCancel}
                        >
                            {t('cancel')}
                        </Button>
                        <Button
                            type="primary"
                            loading={loading}
                            disabled={loading || noExpireLoading}
                            onClick={handleOk}
                        >
                            {t('ok')}
                        </Button>
                    </Space>
                </div>
            )}
        >
            <Form
                form={form}
                labelCol={{ span: 6 }}
                wrapperCol={{ span: 18 }}
                initialValues={{
                    unit: 'minute',
                    // port: 6379,
                    // db: 0,
                }}
                // layout={{
                //     labelCol: { span: 0 },
                //     wrapperCol: { span: 24 },
                // }}
            >
                <Form.Item
                    name="time"
                    label={t('time')}
                    rules={[ { required: true, }, ]}
                >
                    <InputNumber
                        // disabled={!(editType == 'create')}
                    />
                </Form.Item>
                <Form.Item
                    name="unit"
                    label={t('unit')}
                    // rules={editType == 'create' ? [] : [ { required: true, }, ]}
                >
                    <Select
                        options={units}
                        // onChange={() => {
                        //     console.log('change')
                        //     form.setFieldsValue({
                        //         collation: null,
                        //     })
                        // }}
                        // onChange={}
                    />
                </Form.Item>
                {/* <Form.Item
                    name="collation"
                    label="Collation"
                    // rules={[ { required: true, }, ]}
                >
                    <Select
                        options={collations}
                        // onChange={}
                    />
                </Form.Item> */}
                
                
            </Form>
        </Modal>
    )
}
