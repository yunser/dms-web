import { Button, Checkbox, Descriptions, Form, Input, InputNumber, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './redis-connect.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { Editor } from '../editor/Editor';
import storage from '../../db-manager/storage'
import { request } from '../utils/http'
import { CodeDebuger } from '../code-debug';

export function RedisConnect({ config, onConnnect, }) {
    const { t } = useTranslation()

    const [loading, setLoading] = useState(false)
    const [form] = Form.useForm()
    const [code, setCode] = useState(`{
    "host": "",
    "user": "",
    "password": ""
}`)

    useEffect(() => {
//         console.log('onMouneed', storage.get('redisInfo', `{
//     "host": "",
//     "user": "",
//     "password": ""
// }`))
        const redisInfo = storage.get('redisInfo', {
            "host": "",
            "user": "",
            "password": "",
            port: 6379,
            remember: true,
        })
        // setCode(storage.get('redisInfo', `{
        //     "host": "",
        //     "user": "",
        //     "password": ""
        // }`))
        form.setFieldsValue(redisInfo)
    }, [])

    async function  connect() {
        setLoading(true)
        const values = await form.validateFields()
        const reqData = {
            host: values.host,
            port: values.port,
            user: values.user,
            password: values.password,
            db: 0,
            remember: values.remember,
        }
        if (values.remember) {
            storage.set('redisInfo', reqData)
        }
        let ret = await request.post(`${config.host}/redis/connect`, reqData)
        // console.log('ret', ret)
        if (ret.success) {
            // message.success('连接成功')
            onConnnect && onConnnect()
        }
        setLoading(false)
        // else {
        //     message.error('连接失败')
        // }
    }

    function save() {
        storage.set('redisInfo', code)
        message.success('保存成功')
    }

    function help() {
        window.open('https://project.yunser.com/products/167b35305d3311eaa6a6a10dd443ff08', '_blank')
    }

    return (
        <div className={styles.connectBox}>
            {/* <Test asd={Asd} /> */}
            <div className={styles.content}>
                
                <Form
                    form={form}
                    labelCol={{ span: 8 }}
                    wrapperCol={{ span: 16 }}
                    initialValues={{
                        port: 6379,
                        db: 0,
                    }}
                    // layout={{
                    //     labelCol: { span: 0 },
                    //     wrapperCol: { span: 24 },
                    // }}
                >
                    <Form.Item
                        name="host"
                        label="Host"
                        rules={[ { required: true, }, ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="port"
                        label="Port"
                        rules={[{ required: true, },]}
                    >
                        <InputNumber />
                    </Form.Item>
                    {/* <Form.Item
                        name="user"
                        label="User"
                        rules={[{ required: true, },]}
                    >
                        <Input />
                    </Form.Item> */}
                    <Form.Item
                        name="password"
                        label="Password"
                        rules={[{ required: true, },]}
                    >
                        <Input />
                    </Form.Item>
                    {/* <Form.Item
                        name="db"
                        label="DB"
                        rules={[{ required: true, },]}
                    >
                        <InputNumber />
                    </Form.Item> */}
                    <Form.Item name="remember" valuePropName="checked" wrapperCol={{ offset: 8, span: 16 }}>
                        <Checkbox>Remember me</Checkbox>
                    </Form.Item>
                    <Form.Item
                        wrapperCol={{ offset: 8, span: 16 }}
                        // name="passowrd"
                        // label="Passowrd"
                        // rules={[{ required: true, },]}
                    >
                        <Space>
                            <Button
                                loading={loading}
                                type="primary"
                                onClick={connect}>{t('connect')}</Button>
                            {/* <Button onClick={save}>保存</Button> */}
                        </Space>
                    </Form.Item>
                </Form>
            </div>
            {/* <TextArea className={styles.textarea} value={code} rows={4} 
                onChange={e => setCode(e.target.value)} /> */}
            {/* <Button type="primary" onClick={help}>帮助</Button> */}
        </div>
    );
}
