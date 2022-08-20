import React, { useState, useEffect, ReactNode } from 'react'
import styles from './index.module.less'
import { message, Input, Button, Tabs, Space, Form, Checkbox, InputNumber } from 'antd'
import storage from './storage'
import axios from 'axios'
import DatabaseList from './databases'
import { DataBaseDetail } from './databaseDetail'
import { request } from './utils/http'

console.log('styles', styles)
const { TextArea } = Input
const { TabPane } = Tabs

function Connnector({ config, onConnnect }) {
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
        const dbInfo = storage.get('dbInfo', {
            "host": "",
            "user": "",
            "password": "",
            port: 3306,
            remember: true,
        })
        // setCode(storage.get('dbInfo', `{
        //     "host": "",
        //     "user": "",
        //     "password": ""
        // }`))
        form.setFieldsValue(dbInfo)
    }, [])

    async function  connect() {
        const values = await form.validateFields()
        const reqData = {
            host: values.host,
            port: values.port,
            user: values.user,
            password: values.password,
            remember: values.remember,
        }
        if (values.remember) {
            storage.set('dbInfo', reqData)
        }
        let ret = await request.post(`${config.host}/mysql/connect`, reqData)
        console.log('ret', ret)
        if (ret.status === 200) {
            message.success('连接成功')
            onConnnect && onConnnect()
        }
        // else {
        //     message.error('连接失败')
        // }
    }

    function save() {
        storage.set('dbInfo', code)
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
                    <Form.Item
                        name="user"
                        label="User"
                        rules={[{ required: true, },]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        label="Password"
                        rules={[{ required: true, },]}
                    >
                        <Input />
                    </Form.Item>
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
                            <Button type="primary" onClick={connect}>连接数据库</Button>
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

const tabs_default = [
    {
        title: 'Connect',
        key: '0',
        type: 'connnect',
        data: {},
    },
    // {
    //     title: 'DB linxot',
    //     key: '2',
    //     type: 'database',
    //     data: {
    //         name: 'linxot',
    //     },
    // },
    // {
    //     title: 'Databases',
    //     key: '1',
    //     type: 'databases',
    //     data: {},
    // },
]

export function DbManager({ config }) {
    const [tabs, setTabs] = useState(tabs_default)
    const [activeKey, setActiveKey] = useState(tabs[0].key)

    function handleTabChange(key: string) {
        console.log('set key', key)
        setActiveKey(key)
    }

    function TabItem(item) {
        return (
            <TabPane
                tab={item.title}
                key={item.key}
                closable={true}
            >
                
            </TabPane>
        )
    }

    const onEdit = (targetKey: string, action: string) => {
        console.log('targetKey, action', targetKey, action)
        // this[action](targetKey);
        if (action === 'add') {
            // let tabKey = '' + new Date().getTime()
            // setActiveKey(tabKey)
            // setTabs([
            //     ...tabs,
            //     {
            //         title: 'SQL',
            //         key: tabKey,
            //         defaultSql: '',
            //     }
            // ])
            // _this.setState({
            //     activeKey: tabKey,
            //     tabs: tabs.concat([{

            //     }]),
            // })
        }
        else if (action === 'remove') {
            for (let i = 0; i < tabs.length; i++) {
                if (tabs[i].key === targetKey) {
                    tabs.splice(i, 1)
                    break
                }
            }
            setTabs([
                ...tabs,
            ])
            setActiveKey(tabs[tabs.length - 1].key)
            // _this.setState({
            //     tabs
            // })
        }
    }

    return (
        <div className={styles.app}>
            <div className={styles.appHeader}>
                <Tabs
                    onEdit={onEdit}
                    activeKey={activeKey}
                    onChange={handleTabChange}
                    type="editable-card"
                    hideAdd={true}
                >
                    {tabs.map(TabItem)}
                    
                </Tabs>
            </div>
            <div className={styles.appBody}>
                {tabs.map(item => {
                    return (
                        <div
                            className={styles.tabContent}
                            key={item.id}
                            style={{
                                display: item.key == activeKey ? undefined : 'none',
                            }}
                        >
                                {item.type == 'connnect' &&
                                    <Connnector
                                        config={config}
                                        onConnnect={() => {
                                            setTabs([
                                                ...tabs,
                                                {
                                                    title: 'Databases',
                                                    key: '1',
                                                    type: 'databases',
                                                    data: {},
                                                },
                                            ])
                                            setActiveKey('1')
                                        }}
                                    />
                                }
                                {item.type == 'database' &&
                                    <DataBaseDetail
                                        config={config}
                                        dbName={item.data.name}
                                    />
                                }
                                {item.type == 'databases' &&
                                    <DatabaseList
                                        config={config}
                                        onSelectDatabase={({name}) => {
                                            const key = '' + new Date().getTime()
                                            setTabs([
                                                ...tabs,
                                                {
                                                    title: `DB ${name}`,
                                                    key,
                                                    type: 'database',
                                                    data: {
                                                        name,
                                                    }
                                                }
                                            ])
                                            setActiveKey(key)
                                        }}
                                    />
                                }
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
