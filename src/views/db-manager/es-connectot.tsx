import React, { useState, useEffect, ReactNode, useMemo } from 'react'
import styles from './index.module.less'
import { message, Input, Button, Tabs, Space, Form, Checkbox, InputNumber, ConfigProvider } from 'antd'
import storage from './storage'
import DatabaseList from './databases'
import { DataBaseDetail } from './databaseDetail'
import { request } from './utils/http'
import { useTranslation } from 'react-i18next'
import { IconButton } from './icon-button'
import { CloseOutlined } from '@ant-design/icons'
import enUS from 'antd/es/locale/en_US';
import zhCN from 'antd/es/locale/zh_CN';

// console.log('styles', styles)
const { TextArea } = Input
const { TabPane } = Tabs

export function EsConnnector({ config, onConnnect }) {
    const { t } = useTranslation()

    const [loading, setLoading] = useState(false)
    const [form] = Form.useForm()
    const [code, setCode] = useState(`{
    "host": "",
    "user": "",
    "password": ""
}`)

    useEffect(() => {
//         console.log('onMouneed', storage.get('dbInfo', `{
//     "host": "",
//     "user": "",
//     "password": ""
// }`))
        const dbInfo = storage.get('esInfo', {
            "url": "",
            "host": "",
            "user": "",
            "password": "",
            port: 3306,
            remember: true,
        })
        form.setFieldsValue(dbInfo)
    }, [])

    async function  connect() {
        setLoading(true)
        const values = await form.validateFields()
        const pureUrl = values.url.replace(/\/$/, '')
        const reqData = {
            url: pureUrl,
            host: values.host,
            port: values.port,
            user: values.user,
            password: values.password,
            remember: values.remember, 
        }
        if (values.remember) {
            storage.set('esInfo', reqData)
        }
        let ret = await request.get(pureUrl + '/', reqData)
        // console.log('ret', ret)
        if (ret.success) {
            // message.success('连接成功')
            onConnnect && onConnnect({
                url: pureUrl,
            })
        }
        setLoading(false)
        // else {
        //     message.error('连接失败')
        // }
    }

    function save() {
        storage.set('esInfo', code)
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
                        port: 3306,
                    }}
                    // layout={{
                    //     labelCol: { span: 0 },
                    //     wrapperCol: { span: 24 },
                    // }}
                >
                    <Form.Item
                        name="url"
                        label="URL"
                        rules={[ { required: true, }, ]}
                    >
                        <Input />
                    </Form.Item>
                    {/* <Form.Item
                        name="host"
                        label="Host"
                        rules={[ { required: true, }, ]}
                    >
                        <Input />
                    </Form.Item> */}
                    {/* <Form.Item
                        name="port"
                        label="Port"
                        rules={[{ required: true, },]}
                    >
                        <InputNumber />
                    </Form.Item>
                    <Form.Item
                        name="user"
                        label="User"
                        rules={[{ required: true, },]}
                    >
                        <Input />
                    </Form.Item> */}
                    {/* <Form.Item
                        name="password"
                        label="Password"
                        rules={[{ required: true, },]}
                    >
                        <Input />
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
