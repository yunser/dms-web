import React, { useState, useEffect, ReactNode } from 'react'
import styles from './index.module.less'
import { message, Input, Button, Tabs } from 'antd'
import storage from './storage'
import axios from 'axios'
import DatabaseList from './databases'
import { DataBaseDetail } from './databaseDetail'

console.log('styles', styles)
const { TextArea } = Input
const { TabPane } = Tabs

function Connnector() {
    const [code, setCode] = useState(`{
    "host": "",
    "user": "",
    "password": ""
}`)

//     useEffect(() => {
//         console.log('onMouneed', storage.get('dbInfo', `{
//     "host": "",
//     "user": "",
//     "password": ""
// }`))
//         setCode(storage.get('dbInfo', `{
//             "host": "",
//             "user": "",
//             "password": ""
//         }`))
//     }, [])

    async function  connect() {
        let ret = await axios.post(`${config.host}/mysql/connect`, JSON.parse(code))
        console.log('ret', ret)
        if (ret.status === 200) {
            message.success('连接成功')
        } else {
            message.error('连接失败')
        }
    }

    function save() {
        storage.set('dbInfo', code)
        message.success('保存成功')
    }

    function help() {
        window.open('https://project.yunser.com/products/167b35305d3311eaa6a6a10dd443ff08', '_blank')
    }

    interface TestProps {
        asd: ReactNode,
    }
    function Test(props: TestProps) {
        const {asd} = props
        return (
            <div>测试组件
                {asd}
            </div>
        )
        
    }

    const Asd = (
        <div>asd</div>
    )

    return (
        <div className={styles.normal}>
            {/* <Test asd={Asd} /> */}
            <TextArea className={styles.textarea} value={code} rows={4} onChange={e => setCode(e.target.value)} />
            <Button type="primary" onClick={connect}>连接数据库</Button>
            <Button type="primary" onClick={save}>保存</Button>
            <Button type="primary" onClick={help}>帮助</Button>
        </div>
    );
}

const tabs_default = [
    {
        title: 'DB linxot',
        key: '2',
        type: 'database',
        data: {
            name: 'linxot',
        },
    },
    {
        title: 'Connect',
        key: '0',
        type: 'connnect',
        data: {},
    },
    {
        title: 'Databases',
        key: '1',
        type: 'databases',
        data: {},
    },
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

    return (
        <div className={styles.app}>
            <div className={styles.appHeader}>
                <Tabs
                    // onEdit={onEdit}
                    activeKey={activeKey}
                    onChange={handleTabChange}
                    type="editable-card">
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
                                    <Connnector />
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
                                            setTabs([
                                                ...tabs,
                                                {
                                                    title: `DB ${name}`,
                                                    key: '' + new Date().getTime(), // TODO
                                                    type: 'database',
                                                    data: {
                                                        name,
                                                    }
                                                }
                                            ])
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
