import React, { useState, useEffect, ReactNode, useMemo } from 'react'
import styles from './index.module.less'
import { message, Input, Button, Tabs, Space, Form, Checkbox, InputNumber, ConfigProvider, Tree } from 'antd'
import storage from './storage'
import axios from 'axios'
import DatabaseList from './databases'
import { DataBaseDetail } from './databaseDetail'
import { request } from './utils/http'
import { useTranslation } from 'react-i18next'
import { IconButton } from './icon-button'
import { CloseOutlined, DatabaseOutlined, FolderOutlined, PlusOutlined } from '@ant-design/icons'
import enUS from 'antd/es/locale/en_US';
import zhCN from 'antd/es/locale/zh_CN';
import { EsConnnector } from './es-connectot'
import { EsDetail } from './es-detail'
import { uid } from 'uid'
import { Help } from './help'
import { Json } from './json'
import { RedisConnect } from './redis-connect'
import { RedisClient } from './redis-client'
import { Workbench } from './workbench'

console.log('styles', styles)
const { TextArea } = Input
const { TabPane } = Tabs

function lastSplit(text: string, sep: string) {
    const idx = text.lastIndexOf(sep)
    if (idx == -1) {
        return [text]
    }
    return [
        text.substring(0, idx),
        text.substring(idx + 1),
    ]
}


function list2Tree(list) {
    const unGroupList = []
    const map = {}
    for (let item of list) {
        // let _name = item.name
        function getNode(name) {
            return {
                title: (
                    <Space>
                        <DatabaseOutlined />
                        {name}
                    </Space>
                ),
                key: `dbkey-${item.id}`,
                icon() {
                    return (
                        <PlusOutlined />
                    )
                },
                data: item,
            }
        }
        
        if (item.name.includes('/')) {
            const [key, name] = lastSplit(item.name, '/')
            if (!map[key]) {
                map[key] = []
            }
            const node = getNode(name)
            map[key].push(node)
        }
        else {
            const node = getNode(item.name)
            unGroupList.push(node)
        }
    }
    const treeData = [
        // {
        //     title: 'UnGroup',
        //     key: 'root',
        //     children: unGroupList,
        // }
    ]
    for (let key of Object.keys(map)) {
        treeData.push({
            title: (
                <Space>
                    <FolderOutlined />
                    {key}
                </Space>
            ),
            key: `group-${key}`,
            children: map[key],
        })
    }
    // treeData.push({
    //     title: (
    //         <Space>
    //             <FolderOutlined />
    //             UnGroup
    //         </Space>
    //     ),
    //     key: `group-default-0`,
    //     children: unGroupList,
    // })
    treeData.push(...unGroupList)
    return treeData
}

function Connnector({ config, onConnnect }) {
    const { t } = useTranslation()

    const [curConnect, setCurConnect] = useState(null)
    const [connections, setConnections] = useState([
        // {
        //     id: '1',
        //     name: 'first',
        //     host: 'HHH',
        //     port: 3306,
        //     user: 'UUU',
        //     password: 'PPP',
        // },
        // {
        //     id: '2',
        //     name: 'second',
        //     host: 'HHH2',
        //     port: 3306,
        //     user: 'UUU',
        //     password: 'PPP',
        // },
    ])

    function loadConnect(data) {
        form.setFieldsValue({
            ...data,
        })
        setCurConnect(data)
        setEditType('update')
    }

    useEffect(() => {
        const connections = storage.get('connections', [])
        if (connections.length) {
            setConnections(connections)
            loadConnect(connections[0])
        }   
    }, [])

    const [loading, setLoading] = useState(false)
    const [form] = Form.useForm()
//     const [code, setCode] = useState(`{
//     "host": "",
//     "user": "",
//     "password": ""
// }`)
    const [editType, setEditType] = useState('create')

//     useEffect(() => {
// //         console.log('onMouneed', storage.get('dbInfo', `{
// //     "host": "",
// //     "user": "",
// //     "password": ""
// // }`))
//         const dbInfo = storage.get('dbInfo', {
//             "host": "",
//             "user": "",
//             "password": "",
//             port: 3306,
//             remember: true,
//         })
//         // setCode(storage.get('dbInfo', `{
//         //     "host": "",
//         //     "user": "",
//         //     "password": ""
//         // }`))
//         form.setFieldsValue(dbInfo)
//     }, [])

    async function  connect() {
        const values = await form.validateFields()
        setLoading(true)
        const reqData = {
            host: values.host,
            port: values.port,
            user: values.user,
            password: values.password,
            // remember: values.remember,
        }
        // if (values.remember) {
        //     storage.set('dbInfo', reqData)
        // }
        let ret = await request.post(`${config.host}/mysql/connect`, reqData)
        console.log('ret', ret)
        if (ret.status === 200) {
            // message.success('连接成功')
            onConnnect && onConnnect()
        }
        setLoading(false)
        // else {
        //     message.error('连接失败')
        // }
    }

    function add() {
        const newItem = {
            id: uid(32),
            name: 'Unnamed',
            host: '',
            port: '',
            user: '',
            password: '',
        }
        const newConnects = [
            newItem,
            ...connections,
        ]
        setConnections(newConnects)
        storage.set('connections', newConnects)
        loadConnect(newItem)
    }

    function remove() {
        let newConnects = connections.filter(item => item.id != curConnect.id)
        setConnections(newConnects)
        if (newConnects.length) {
            loadConnect(newConnects[0])
        }
    }

    async function save() {
        // storage.set('dbInfo', code)
        // message.success('保存成功')
        const values = await form.validateFields()
        let newConnects
        if (editType == 'create') {
            newConnects = [
                {
                    id: uid(32),
                    name: values.name || 'Unnamed',
                    host: values.host,
                    port: values.port,
                    user: values.user,
                    password: values.password,
                },
                ...connections,
            ]
        }
        else {
            const idx = connections.findIndex(item => item.id == curConnect.id)
            console.log('idx', idx)
            const newConnect = {
                ...curConnect,
                name: values.name || 'Unnamed',
                host: values.host,
                port: values.port,
                user: values.user,
                password: values.password,
            }
            connections[idx] = newConnect
            newConnects = [
                ...connections,
            ]
            setCurConnect(newConnect)
        }
        setConnections(newConnects)
        storage.set('connections', newConnects)
    }

    function help() {
        window.open('https://project.yunser.com/products/167b35305d3311eaa6a6a10dd443ff08', '_blank')
    }

    function ConnectionItem(item) {
        return (
            <div
                className={styles.item}
                key={item.id}
            >
                122
            </div>
        )
    }


    const treeData = list2Tree(connections)
    // const treeData = [
    //     {
    //         title: 'root',
    //         key: 'root',
    //         children: connections.map(item => {
    //             return {
    //                 title: (
    //                     <Space>
    //                         <DatabaseOutlined />
    //                         {item.name}
    //                     </Space>
    //                 ),
    //                 key: `dbkey-${item.id}`,
    //                 icon() {
    //                     return (
    //                         <PlusOutlined />
    //                     )
    //                 },
    //                 data: item,
    //             }
    //         })
    //     }
    // ]
    // const treeData = 

    return (
        <div className={styles.connectBox}>
            <div className={styles.layoutLeft}>
                {/* {curConnect.id} */}
                <div className={styles.header}>
                    <IconButton
                        onClick={add}
                    >
                        <PlusOutlined />
                    </IconButton>
                    {/* <Button
                    >新增</Button> */}
                </div>
                <div className={styles.connections}>
                    {/* {connections.map(ConnectionItem)} */}
                    <Tree
                        treeData={treeData}
                        // checkable
                        defaultExpandAll
                        // defaultExpandedKeys={['root']}
                        expandedKeys={treeData.map(item => item.key)}
                        selectedKeys={curConnect ? [`dbkey-${curConnect.id}`] : []}
                        // defaultCheckedKeys={['0-0-0', '0-0-1']}
                        onSelect={(selectKeys, info) => {
                            console.log('onSelect', info)
                            const data = info.node.data
                            loadConnect(data)
                        }}
                        // onCheck={onCheck}
                    />
                </div>
            </div>
            <div className={styles.layoutRight}>

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
                            name="name"
                            label={t('name')}
                            rules={[]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="host"
                            label={t('host')}
                            rules={[ { required: true, }, ]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="port"
                            label={t('port')}
                            rules={[{ required: true, },]}
                        >
                            <InputNumber />
                        </Form.Item>
                        <Form.Item
                            name="user"
                            label={t('user')}
                            rules={[{ required: true, },]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="password"
                            label={t('password')}
                            rules={[{ required: true, },]}
                        >
                            <Input />
                        </Form.Item>
                        {/* <Form.Item name="remember" valuePropName="checked" wrapperCol={{ offset: 8, span: 16 }}>
                            <Checkbox>{t('remember_me')}</Checkbox>
                        </Form.Item> */}
                        <Form.Item
                            wrapperCol={{ offset: 8, span: 16 }}
                            // name="passowrd"
                            // label="Passowrd"
                            // rules={[{ required: true, },]}
                        >
                            <Space>
                                <Button
                                    type="primary"
                                    onClick={connect}
                                >
                                    {t('connect')}
                                </Button>
                                <Button onClick={save}>保存</Button>
                                {editType == 'update' &&
                                    <Button
                                        danger
                                        onClick={remove}>删除</Button>
                                }
                            </Space>
                        </Form.Item>
                    </Form>
                </div>
            </div>
            {/* <TextArea className={styles.textarea} value={code} rows={4} 
                onChange={e => setCode(e.target.value)} /> */}
            {/* <Button type="primary" onClick={help}>帮助</Button> */}
        </div>
    );
}

const tab_mySql = {
    title: 'MySQL',
    key: 'mysql-connect-0',
    type: 'connnect',
    data: {},
    // closable: false,
}



export function DbManager({ config }) {

    const { t, i18n } = useTranslation()
    // console.log('i18n', i18n)
    // const [lang, setLang] = useState('en')
    const lang = useMemo(() => {
        if (i18n.language.includes('zh')) {
            return 'zh'
        }
        else {
            return 'en'
        }
    }, [i18n.language])

    const tab_workbench = {
        title: t('workbench'),
        key: 'workbench',
        type: 'workbench',
        data: {},
        closable: false,
    }

    const tabs_default = [
        tab_workbench,
        tab_mySql,
        // {
        //     title: 'Elasticsearch',
        //     key: 'key-es',
        //     type: 'elasticsearch',
        //     data: {},
        //     closable: false,
        // },
        // {
        //     title: 'JSON',
        //     key: 'key-json',
        //     type: 'json',
        //     data: {},
        //     closable: false,
        // },
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
    
    const [tabs, setTabs] = useState(tabs_default)
    const [activeKey, setActiveKey] = useState(() => {
        return tabs[1].key
    })

    

    function closeTabByKey(key) {
        console.log('closeTabByKey', key)
        setTabs(tabs.filter(item => item.key != key))
    }

    function addOrActiveTab(tab, { closeCurrentTab = false,} = {}) {
        const exists = tabs.find(t => t.key == tab.key)
        if (!exists) {
            let newTabs = [
                ...tabs,
                tab,
            ]
            if (closeCurrentTab) {
                newTabs = newTabs.filter(item => item.key != activeKey)
            }
            setTabs(newTabs)
        }
        setActiveKey(tab.key)
    }

    function handleTabChange(key: string) {
        console.log('set key', key)
        setActiveKey(key)
    }

    function TabItem(item) {
        return (
            <TabPane
                tab={item.title}
                key={item.key}
                // closable={true}
                closable={item.closable !== false}
                closeIcon={
                    <IconButton
                        size="small"
                    >
                        <CloseOutlined style={{ color: '#999' }} />
                    </IconButton>
                }
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
            if (tabs.length == 0) {
                tabs.push(tab_workbench)
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
        <ConfigProvider
            locale={lang == 'en' ? enUS : zhCN}
        >
            <div className={styles.app}>
                <div className={styles.appHeader}>
                    <Tabs
                        onEdit={onEdit}
                        activeKey={activeKey}
                        onChange={handleTabChange}
                        type="editable-card"
                        hideAdd={true}
                        tabBarExtraContent={{
                            right: (
                                <div className={styles.langBox}>
                                    <Space>
                                        <Button
                                            type="text"
                                            onClick={() => {
                                                addOrActiveTab(tab_mySql)
                                            }}
                                        >
                                            MySQL
                                        </Button>
                                        <Button
                                            type="text"
                                            onClick={() => {
                                                addOrActiveTab({
                                                    title: t('json'),
                                                    key: 'json-' + uid(16),
                                                    type: 'json',
                                                    data: {
                                                        // url,
                                                    },
                                                })
                                            }}
                                        >
                                            {t('json')}
                                        </Button>
                                        <Button
                                            type="text"
                                            onClick={() => {
                                                addOrActiveTab({
                                                    title: 'Redis Connect',
                                                    // key: 'redis-' + uid(16),
                                                    key: 'redis-connect',
                                                    type: 'redis-connect',
                                                    data: {
                                                        // url,
                                                    },
                                                })
                                            }}
                                        >
                                            Redis
                                            {/* {t('json')} */}
                                        </Button>
                                        <Button
                                            type="text"
                                            onClick={() => {
                                                addOrActiveTab({
                                                    title: 'Elasticsearch',
                                                    key: 'key-es',
                                                    type: 'elasticsearch',
                                                    data: {},
                                                    // closable: false,
                                                })
                                            }}
                                        >
                                            {/* {t('json')} */}
                                            Elasticsearch
                                        </Button>
                                        <Button
                                            type="text"
                                            onClick={() => {
                                                addOrActiveTab({
                                                    title: t('help'),
                                                    key: 'help',
                                                    type: 'help',
                                                    data: {
                                                        // url,
                                                    },
                                                })
                                            }}
                                        >
                                            {t('help')}
                                        </Button>
                                        <Button
                                            type="text"
                                            onClick={() => {
                                                i18n.changeLanguage(lang == 'zh' ? 'en' : 'zh')
                                            }}
                                        >
                                            {lang == 'zh' ? 'English' : '中文'}
                                        </Button>
                                        {/* <Button
                                            type="text"
                                            onClick={() => {
                                                i18n.changeLanguage(lang == 'zh' ? 'en' : 'zh')
                                            }}
                                        >
                                            {lang == 'zh' ? 'English' : '中文'}
                                        </Button> */}
                                    </Space>
                                </div>
                            )
                        }}
                    >
                        {tabs.map(TabItem)}
                        
                    </Tabs>
                </div>
                <div className={styles.appBody}>
                    {tabs.map(item => {
                        return (
                            <div
                                className={styles.tabContent}
                                key={item.key}
                                style={{
                                    display: item.key == activeKey ? undefined : 'none',
                                }}
                            >
                                    {item.type == 'elasticsearch' &&
                                        <EsConnnector
                                            onConnnect={({ url }) => {
                                                addOrActiveTab({
                                                    title: 'ES Indexs',
                                                    key: 'es-indexs',
                                                    type: 'es-index',
                                                    data: {
                                                        url,
                                                    },
                                                }, {
                                                    closeCurrentTab: true,
                                                })
                                                // setTabs([
                                                //     ...tabs,
                                                //     {
                                                //         title: 'ES Indexs',
                                                //         key: 'es-indexs',
                                                //         type: 'es-index',
                                                //         data: {
                                                //             url,
                                                //         },
                                                //     },
                                                // ])
                                                // setActiveKey('es-indexs')
                                            }}
                                        />
                                    }
                                    {item.type == 'connnect' &&
                                        <Connnector
                                            config={config}
                                            onConnnect={() => {
                                                addOrActiveTab({
                                                    title: 'MySQL Databases',
                                                    key: 'mysql-database-0',
                                                    type: 'databases',
                                                    data: {},
                                                }, {
                                                    closeCurrentTab: true,
                                                })
                                                // setTabs([
                                                //     ...tabs,
                                                //     {
                                                //         title: 'MySQL Databases',
                                                //         key: '11111',
                                                //         type: 'databases',
                                                //         data: {},
                                                //     },
                                                // ])
                                                // setActiveKey('11111')
                                            }}
                                        />
                                    }
                                    {item.type == 'es-index' &&
                                        <EsDetail
                                            config={{
                                                url: item.data.url,
                                            }}
                                            // url={item.data.url}
                                            // dbName={item.data.name}
                                        />
                                    }
                                    {item.type == 'database' &&
                                        <DataBaseDetail
                                            config={config}
                                            dbName={item.data.name}
                                            onJson={json => {
                                                console.log('onJson/2')
                                                addOrActiveTab({
                                                    title: t('json'),
                                                    key: 'json-' + uid(16),
                                                    type: 'json',
                                                    data: {
                                                        // url,
                                                        defaultJson: json,
                                                    },
                                                })
                                            }}
                                        />
                                    }
                                    {item.type == 'help' &&
                                        <Help
                                            config={config}
                                        />
                                    }
                                    {item.type == 'json' &&
                                        <Json
                                            config={config}
                                            data={item.data}
                                        />
                                    }
                                    {item.type == 'workbench' &&
                                        <Workbench
                                            config={config}
                                        />
                                    }
                                    {item.type == 'redis-connect' &&
                                        <RedisConnect
                                            config={config}
                                            onConnnect={() => {
                                                // closeTabByKey(item.key)
                                                addOrActiveTab({
                                                    title: 'Redis',
                                                    key: 'redis-' + uid(16),
                                                    type: 'redis-client',
                                                    data: {},
                                                }, {
                                                    closeCurrentTab: true,
                                                })
                                            }}
                                        />
                                    }
                                    {item.type == 'redis-client' &&
                                        <RedisClient
                                            config={config}
                                        />
                                    }
                                    {item.type == 'databases' &&
                                        <DatabaseList
                                            config={config}
                                            onSelectDatabase={({name}) => {
                                                const key = '' + new Date().getTime()
                                                addOrActiveTab({
                                                    title: `${name} - DB`,
                                                    key,
                                                    type: 'database',
                                                    data: {
                                                        name,
                                                    }
                                                }, {
                                                    closeCurrentTab: true,
                                                })
                                                // setTabs([
                                                //     ...tabs,
                                                //     {
                                                //         title: `${name} - DB`,
                                                //         key,
                                                //         type: 'database',
                                                //         data: {
                                                //             name,
                                                //         }
                                                //     }
                                                // ])
                                                // setActiveKey(key)

                                                request.post(`${config.host}/mysql/execSql`, {
                                                    sql: `use ${name}`,
                                                    // tableName,
                                                    // dbName,
                                                }, {
                                                    // noMessage: true,
                                                })
                                            }}
                                        />
                                    }
                            </div>
                        )
                    })}
                </div>
            </div>
        </ConfigProvider>
    );
}
