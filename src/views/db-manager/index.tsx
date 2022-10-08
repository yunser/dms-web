import React, { useState, useId, useEffect, ReactNode, useMemo } from 'react'
import styles from './index.module.less'
import { message, Input, Button, Tabs, Space, Form, Checkbox, InputNumber, ConfigProvider, Tree, Empty, Modal, Dropdown, Menu } from 'antd'
import storage from './storage'
import DatabaseList from './databases'
import { DataBaseDetail } from './databaseDetail'
import { request } from './utils/http'
import { useTranslation } from 'react-i18next'
import { IconButton } from './icon-button'
import { BulbOutlined, CloseOutlined, DatabaseOutlined, EllipsisOutlined, ExportOutlined, FolderOutlined, MenuOutlined, PlusOutlined } from '@ant-design/icons'
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
import { GitHome } from '../git/git-home'
import { SshConnect } from '../ssh/ssh-connect'
import { FileHome } from '../file/file-home'
import { SshDetail } from '../ssh/ssh-home'
import { MarkdownEditor } from './markdown'

// console.log('styles', styles)
const { TextArea } = Input
const { TabPane } = Tabs

window._terminalCount = 0
window._fileCount = 0
window._sshCount = 0

const tab_mySql = {
    title: 'MySQL',
    key: 'mysql-connect-0',
    type: 'connnect',
    data: {},
    // closable: false,
}

function AboutModal({ config, ...otherProps }) {
    
    const { t } = useTranslation()
    const [version, setVersion] = useState('')
    
    async function loadData() {
        let res = await request.post(`${config.host}/version`, {
        })
        console.log('res', res)
        if (res.success) {
            setVersion(res.data.version)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    return (
        <Modal
            {...otherProps}
            open={true}
            title={t('about')}
            footer={false}
        >
            <div>DMS v{version}</div>
        </Modal>
    )
}

export function DbManager({ config }) {

    console.warn('DbManager/render')
    const event$ = useEventEmitter()
    const { t, i18n } = useTranslation()
    // console.log('i18n', i18n)
    const [aboutVisible, setAboutVisible] = useState(false)

    // const [lang, setLang] = useState('en')
    const lang = useMemo(() => {
        if (i18n.language.includes('zh')) {
            return 'zh'
        }
        else {
            return 'en'
        }
    }, [i18n.language])

    useEffect(() => {
        document.title = t('site_title')
    }, [lang])

    const tab_workbench = {
        title: '$i18n.workbench',
        key: 'workbench',
        type: 'workbench',
        data: {},
        closable: false,
    }

    const tabs_default = [
        tab_workbench,
        // tab_mySql,
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
    const [activeKey, _setActiveKey] = useState(() => {
        return tabs[0].key
    })
    function setActiveKey(key) {
        _setActiveKey(key)
        window.__activeKey = key
    }
    
    
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

    function openTerminal(path) {
        addOrActiveTab({
            title: t('terminal') + `-${(window._terminalCount++) + 1}`,
            // key: 'redis-' + uid(16),
            key: `terminal-${uid(16)}`,
            type: 'terminal',
            data: {
                path,
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
        else if (msg.type == 'event_open_terminal') {
            const { path } = msg.data
            openTerminal(path)
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
                                        {/* <Button
                                            type="text"
                                            onClick={() => {
                                                addOrActiveTab(tab_mySql)
                                            }}
                                        >
                                            MySQL
                                        </Button> */}
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
                                                    title: '$i18n.text',
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
                                        <Dropdown
                                            overlay={
                                                <Menu
                                                    onClick={({ key }) => {
                                                        if (key == 'help') {
                                                            addOrActiveTab({
                                                                title: '$i18n.help',
                                                                key: 'help',
                                                                type: 'help',
                                                                data: {
                                                                    // url,
                                                                },
                                                            })
                                                        }
                                                        else if (key == 'elasticsearch') {
                                                            addOrActiveTab({
                                                                title: 'Elasticsearch',
                                                                key: 'key-es',
                                                                type: 'elasticsearch',
                                                                data: {},
                                                                // closable: false,
                                                            })
                                                        }
                                                        else if (key == 'redis') {
                                                            addOrActiveTab({
                                                                title: 'Redis',
                                                                // key: 'redis-' + uid(16),
                                                                key: 'redis-connect',
                                                                type: 'redis-connect',
                                                                data: {
                                                                    // url,
                                                                },
                                                            })
                                                        }
                                                        else if (key == 'git') {
                                                            addOrActiveTab({
                                                                title: 'GIT',
                                                                // key: 'redis-' + uid(16),
                                                                key: 'git-project',
                                                                type: 'git-project',
                                                                data: {
                                                                    // url,
                                                                },
                                                            })
                                                        }
                                                        else if (key == 'ssh') {
                                                            addOrActiveTab({
                                                                title: 'SSH/SFTP' + `-${(window._sshCount++) + 1}`,
                                                                // key: 'redis-' + uid(16),
                                                                key: `ssh-home-${uid(16)}`,
                                                                type: 'ssh-connect',
                                                                data: {
                                                                    // url,
                                                                },
                                                            })
                                                        }
                                                        else if (key == 'file') {
                                                            addOrActiveTab({
                                                                title: t('file') + `-${(window._fileCount++) + 1}`,
                                                                // key: 'redis-' + uid(16),
                                                                key: `file-${uid(16)}`,
                                                                type: 'file-home',
                                                                data: {
                                                                    // url,
                                                                },
                                                            })
                                                        }
                                                        else if (key == 'terminal') {
                                                            openTerminal()
                                                        }
                                                        else if (key == 'about') {
                                                            setAboutVisible(true)
                                                        }
                                                        else if (key == 'setting') {
                                                            setAboutVisible(true)
                                                        }
                                                        else if (key == 'markdown') {
                                                            addOrActiveTab({
                                                                title: t('markdown') + `-${(window._fileCount++) + 1}`,
                                                                // key: 'redis-' + uid(16),
                                                                key: `markdown-${uid(16)}`,
                                                                type: 'markdown',
                                                                data: {
                                                                    // url,
                                                                },
                                                            })
                                                        }
                                                        else if (key == 'mysql') {
                                                            addOrActiveTab(tab_mySql)
                                                        }
                                                    }}
                                                    items={[
                                                        {
                                                            label: t('mysql'),
                                                            key: 'mysql',
                                                        },
                                                        {
                                                            label: t('redis'),
                                                            key: 'redis',
                                                        },
                                                        {
                                                            label: t('git'),
                                                            key: 'git',
                                                        },
                                                        {
                                                            label: t('ssh/sftp'),
                                                            key: 'ssh',
                                                        },
                                                        {
                                                            label: t('file'),
                                                            key: 'file',
                                                        },
                                                        {
                                                            label: t('terminal'),
                                                            key: 'terminal',
                                                        },
                                                        {
                                                            label: t('markdown'),
                                                            key: 'markdown',
                                                        },
                                                        {
                                                            label: t('elasticsearch'),
                                                            key: 'elasticsearch',
                                                        },
                                                        {
                                                            // ========
                                                            type: 'divider',
                                                        },
                                                        {
                                                            label: t('about'),
                                                            key: 'about',
                                                        },
                                                        // {
                                                        //     label: t('setting'),
                                                        //     key: 'setting',
                                                        // },
                                                        {
                                                            label: t('help'),
                                                            key: 'help',
                                                        },
                                                    ]}
                                                />
                                            }
                                        >
                                            <IconButton
                                                onClick={e => e.preventDefault()}
                                            >
                                                <EllipsisOutlined />
                                            </IconButton>
                                        </Dropdown>
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
                        items={tabs.map(item => {
                            const staticLabels = {
                                '__workbench__': t('workbench'),
                            }
                            return {
                                label: (
                                    <div className={styles.tabLabel}>{item.title.startsWith('$i18n.') ? t(item.title.replace('$i18n.', '')) : item.title}</div>
                                ),
                                key: item.key,
                                closable: item.closable !== false,
                            }
                        })}
                    />
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
                                    {item.type == 'markdown' &&
                                        <MarkdownEditor
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
                                            onConnnect={({ connectionId, name, defaultDatabase }) => {
                                                console.log('onConnnect', connectionId)
                                                // closeTabByKey(item.key)
                                                addOrActiveTab({
                                                    // title: 'Redis',
                                                    title: `${name} - Redis`,
                                                    key: 'redis-' + uid(16),
                                                    type: 'redis-client',
                                                    data: {
                                                        connectionId,
                                                        defaultDatabase,
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
                                            event$={event$}
                                            connectionId={item.data.connectionId}
                                            defaultDatabase={item.data.defaultDatabase}
                                        />
                                    }
                                    {item.type == 'git-project' &&
                                        <GitHome
                                        />
                                    }
                                    {item.type == 'ssh-connect' &&
                                        <SshConnect
                                            config={config}
                                            event$={event$}
                                            tabKey={item.key}
                                        />
                                    }
                                    {item.type == 'file-home' &&
                                        <FileHome
                                            config={config}
                                            event$={event$}
                                            tabKey={item.key}
                                        />
                                    }
                                    {item.type == 'terminal' &&
                                        <SshDetail
                                            config={config}
                                            local={true}
                                            defaultPath={item.data.path}
                                        />
                                    }
                            </div>
                        )
                    })}
                </div>
                {aboutVisible &&
                    <AboutModal
                        config={config}
                        onCancel={() => {
                            setAboutVisible(false)
                        }}
                    />
                }
            </div>
        </ConfigProvider>
    );
}
