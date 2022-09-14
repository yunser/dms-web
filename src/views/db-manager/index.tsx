import React, { useState, useId, useEffect, ReactNode, useMemo } from 'react'
import styles from './index.module.less'
import { message, Input, Button, Tabs, Space, Form, Checkbox, InputNumber, ConfigProvider, Tree, Empty, Modal } from 'antd'
import storage from './storage'
import DatabaseList from './databases'
import { DataBaseDetail } from './databaseDetail'
import { request } from './utils/http'
import { useTranslation } from 'react-i18next'
import { IconButton } from './icon-button'
import { BulbOutlined, CloseOutlined, DatabaseOutlined, ExportOutlined, FolderOutlined, PlusOutlined } from '@ant-design/icons'
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
import { SqlConnector } from './sql-connect'
import { UserList } from './user-list'
import { TextEditor } from './text'
import { useEventEmitter } from 'ahooks'
import { getTheme, toggleTheme } from '../../theme'

// console.log('styles', styles)
const { TextArea } = Input
const { TabPane } = Tabs



const tab_mySql = {
    title: 'MySQL',
    key: 'mysql-connect-0',
    type: 'connnect',
    data: {},
    // closable: false,
}



export function DbManager({ config }) {

    console.warn('DbManager/render')
    const event$ = useEventEmitter()
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

    
    
    function addJsonTab(json: string) {
        addOrActiveTab({
            title: t('json'),
            key: 'json-' + uid(16),
            type: 'json',
            data: {
                // url,
                defaultJson: json,
            },
        })
    }

    event$.useSubscription(msg => {
        console.log('dbManager/onmessage', msg)
        // console.log(val);
        if (msg.type == 'event_show_json') {
            const { json } = msg.data
            addJsonTab(json)
        }
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
                // closeIcon={
                //     <IconButton
                //         size="small"
                //     >
                //         <CloseOutlined style={{ color: '#999' }} />
                //     </IconButton>
                // }
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
                    {/* <div className={styles.headerLeft}>
                        <div className={styles.logoBox}>
                            DMS
                        </div>
                    </div> */}
                    <Tabs
                        onEdit={onEdit}
                        activeKey={activeKey}
                        onChange={handleTabChange}
                        type="editable-card"
                        hideAdd={true}
                        tabBarExtraContent={{
                            left: (
                                <div className={styles.logoBox}>
                                    DMS
                                </div>
                            ),
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
                                                    title: t('text'),
                                                    key: 'text-' + uid(16),
                                                    type: 'text',
                                                    data: {
                                                        // url,
                                                    },
                                                })
                                            }}
                                        >
                                            {t('text')}
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
                                        <IconButton
                                            size="small"
                                            tooltip={t('toggle_theme')}
                                            onClick={async () => {
                                                toggleTheme()
                                                event$.emit({
                                                    type: 'type_theme_changed',
                                                    data: {
                                                        theme: getTheme(),
                                                    }
                                                })
                                                // message.info('正在开发...')
                                                // const code = getCode()
                                                // let res = await request.post(`${config.host}/mysql/sql/create`, {
                                                    //     name: '123',
                                                    //     sql: code,
                                                    // })
                                                    // if (res.success) {
                                                        //     message.success('保存成功')
                                                        // }
                                            }}
                                        >
                                            <BulbOutlined />
                                        </IconButton>
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
                                        <SqlConnector
                                            config={config}
                                            onJson={json => addJsonTab(json)}
                                            onConnnect={({ id, curConnect }) => {
                                                // TODO 通过 setTimeout 解决这个问题，原因未知
                                                // Can't perform a React state update on an unmounted component. This is a no-op, but it indicates a memory leak in your application. To fix, cancel all subscriptions and asynchronous tasks in a useEffect cleanup function
                                                setTimeout(() => {
                                                    const key = '' + new Date().getTime()
                                                    addOrActiveTab({
                                                        title: `${curConnect.name || 'Unnamed'}`,
                                                        key,
                                                        type: 'database',
                                                        data: {
                                                            name: null,
                                                            connectionId: id,
                                                        }
                                                    }, {
                                                        closeCurrentTab: true,
                                                    })
                                                }, 0)
                                            }}
                                        />
                                    }
                                    {item.type == 'es-index' &&
                                        <EsDetail
                                            event$={event$}
                                            config={{
                                                url: item.data.url,
                                            }}
                                            // url={item.data.url}
                                            // dbName={item.data.name}
                                        />
                                    }
                                    {item.type == 'database' &&
                                        <DataBaseDetail
                                            event$={event$}
                                            config={config}
                                            // dbName={item.data.name}
                                            connectionId={item.data.connectionId}
                                            onJson={json => {
                                                addJsonTab(json)
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
                                            event$={event$}
                                            data={item.data}
                                        />
                                    }
                                    {item.type == 'text' &&
                                        <TextEditor
                                            config={config}
                                            event$={event$}
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
                                            event$={event$}
                                            config={config}
                                            onConnnect={({ connectionId, name }) => {
                                                console.log('onConnnect', connectionId)
                                                // closeTabByKey(item.key)
                                                addOrActiveTab({
                                                    // title: 'Redis',
                                                    title: name,
                                                    key: 'redis-' + uid(16),
                                                    type: 'redis-client',
                                                    data: {
                                                        connectionId,
                                                    },
                                                }, {
                                                    closeCurrentTab: true,
                                                })
                                            }}
                                        />
                                    }
                                    {item.type == 'redis-client' &&
                                        <RedisClient
                                            config={config}
                                            connectionId={item.data.connectionId}
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
