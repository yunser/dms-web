import React, { useState, useId, useEffect, ReactNode, useMemo, useRef } from 'react'
import styles from './index.module.less'
import { message, Input, Button, Tabs, Space, Form, Checkbox, InputNumber, ConfigProvider, Tree, Empty, Modal, Dropdown, Menu } from 'antd'
import storage from './storage'
import DatabaseList from './databases'
import { DataBaseDetail } from './databaseDetail'
import { request } from './utils/http'
import { useTranslation } from 'react-i18next'
import { IconButton } from './icon-button'
import { BulbOutlined, CloseOutlined, DatabaseOutlined, EllipsisOutlined, ExportOutlined, FolderOutlined, MenuOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import enUS from 'antd/es/locale/en_US';
import zhCN from 'antd/es/locale/zh_CN';
import { EsConnnector } from './es-connectot'
import { EsDetail } from './es-detail'
import { uid } from 'uid'
import { Help } from './help'
import { JsonEditor } from './json'
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
import { OssHome } from '../oss/oss-home'
import { WebDavHome } from '../webdav/webdav-home'
import { SocketHome } from '../socket/socket-home'
import { HttpEditor } from '../http/editor'
import { JsonTable } from '../json/json-table'
import { AliyunHome } from '../aliyun/aliyun-home'
import { IpHome } from '../ip/ip-home'
import { Commander } from '../commander'
import { SwaggerHome } from '../swagger/swagger-home'
import { ProjectHome } from '../project/project-home'
import { MysqlCompare } from './mysql-compare'
import { ModelHome } from '../model/model-home'
import { MongoHome } from '../mongo/mongo-home'
import { MongoClient } from '../mongo/mongo-client'
import { GitProject } from '../git/git-project'
import { LoggerHome } from '../logger/logger-home'
import { LoggerDetail } from '../logger/logger-detail'
import { AlasqlHome } from '../slasql/ip-home'

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
    const commanderRef = useRef(null)
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


    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            console.log('e', e.code, e)
            if (document.activeElement?.nodeName == 'INPUT' || document.activeElement?.nodeName == 'TEXTAREA') {
                return
            }

            if (e.code == 'KeyW') {
                if (e.metaKey) {
                    // if (activeItem) {
                    //     copyItem(activeItem)
                    // }
                    console.log('okk')
                    // https://stackoverflow.com/questions/21695682/is-it-possible-to-catch-ctrlw-shortcut-and-prevent-tab-closing
                    e.stopPropagation()
                    e.preventDefault()
                    // alert((1))
                    // return
                }
            }
            else if (e.code == 'KeyV') {
                // if (e.metaKey) {
                //     doPaste()
                //     return
                // }
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [])

    event$.useSubscription(msg => {
        console.log('dbManager/onmessage', msg)
        // console.log(val);
        if (msg.type == 'event_show_json') {
            const { json } = msg.data
            addJsonTab(json)
        }
        else if (msg.type == 'event_show_help') {
            // addJsonTab(json)
            handleCommand('help', msg.data)
        }
        else if (msg.type == 'event_open_terminal') {
            const { path } = msg.data
            openTerminal(path)
        }
        else if (msg.type == 'event_open_folder') {
            const { path } = msg.data
            // openTerminal(path)
            addOrActiveTab({
                title: t('file') + `-${(window._fileCount++) + 1}`,
                // key: 'redis-' + uid(16),
                key: `file-${uid(16)}`,
                type: 'file-home',
                data: {
                    sourceType: 'local',
                    // url,
                    path,
                },
            })
        }
        else if (msg.type == 'event_mysql_compare') {
            addOrActiveTab({
                title: t('mysql-compare'),
                key: `mysql-compare-0`,
                type: 'mysql-compare',
                data: {
                },
            })
        }
        else if (msg.type == 'event_show_text') {
            const { text } = msg.data
            showTextTab(text)
        }
    })

    function closeTabByKey(targetKey) {
        // console.log('closeTabByKey', key)
        // setTabs(tabs.filter(item => item.key != key))
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
    }

    function closeCurrentTab() {
        closeTabByKey(activeKey)
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

    function showJsonTab() {
        addOrActiveTab({
            title: t('json'),
            key: 'json-' + uid(16),
            type: 'json',
            data: {
                // url,
            },
        })
    }

    function handleCommand(key, commandData = {}) {
        if (key == 'help') {
            addOrActiveTab({
                title: '$i18n.help',
                key: 'help',
                type: 'help',
                data: {
                    ...commandData,
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
        else if (key == 'mongo') {
            addOrActiveTab({
                title: t('mongo'),
                key: 'mongo-home' + uid(16),
                type: 'mongo',
                data: {},
                // closable: false,
            })
        }
        else if (key == 'alasql') {
            addOrActiveTab({
                // title: `${curConnect.name || 'Unnamed'}`,
                title: t('alasql'),
                key,
                type: 'alasql-home',
                data: {
                    // name: null,
                    // connectionId: 'alasql',
                    // databaseType: 'alasql',
                }
            }, {
                // closeCurrentTab: true,
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
                    sourceType: 'local',
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
        else if (key == 'oss-home') {
            addOrActiveTab({
                title: t('oss') + `-${(window._fileCount++) + 1}`,
                // key: 'redis-' + uid(16),
                key: `oss-${uid(16)}`,
                type: 'oss-home',
                data: {
                    // url,
                },
            })
        }
        else if (key == 'webdav-home') {
            addOrActiveTab({
                title: t('webdav') + `-${(window._fileCount++) + 1}`,
                // key: 'redis-' + uid(16),
                key: `webdav-${uid(16)}`,
                type: 'webdav-home',
                data: {
                    // url,
                },
            })
        }
        else if (key == 'http-home') {
            addOrActiveTab({
                title: t('http'),
                // title: t('http') + `-${(window._fileCount++) + 1}`,
                // key: 'redis-' + uid(16),
                key: `http-0`,
                type: 'http-home',
                data: {
                    // url,
                },
            })
        }
        else if (key == 'tcp/udp') {
            addOrActiveTab({
                title: t('tcp/udp') + `-${(window._fileCount++) + 1}`,
                // key: 'redis-' + uid(16),
                // key: `tcp/udp-${uid(16)}`,
                key: `tcp/udp-0`,
                type: 'tcp/udp',
                data: {
                    // url,
                },
            })
        }
        else if (key == 'json_table') {
            addOrActiveTab({
                title: t('json_table'),
                key: `json_table-0`,
                type: 'json-table',
                data: {
                    // url,
                },
            })
        }
        else if (key == 'aliyun') {
            addOrActiveTab({
                title: t('aliyun'),
                key: `aliyun-0`,
                type: 'aliyun',
                data: {
                    // url,
                },
            })
        }
        else if (key == 'ip') {
            showIpTab()
        }
        else if (key == 'command') {
            commanderRef.current?.show()
        }
        else if (key == 'json') {
            showJsonTab()
        }
        else if (key == 'text') {
            showTextTab()
        }
        else if (key == 'swagger') {
            addOrActiveTab({
                title: t('swagger') + `-${(window._fileCount++) + 1}`,
                key: `swagger-${uid(16)}`,
                type: 'swagger',
                data: {},
            })
        }
        else if (key == 'model') {
            addOrActiveTab({
                title: t('model'),
                key: `model-0`,
                type: 'model',
                data: {},
            })
        }
        else if (key == 'project') {
            addOrActiveTab({
                title: t('project'),
                key: `project-0`,
                type: 'project-home',
                data: {
                    // url,
                },
            })
        }
        else if (key == 'logger') {
            addOrActiveTab({
                title: t('logger'),
                key: `logger-0`,
                type: 'logger-home',
                data: {
                    // url,
                },
            })
        }
        else if (key == 'close_tab') {
            closeCurrentTab()
        }
        
    }

    function showTextTab(text = '') {
        addOrActiveTab({
            title: '$i18n.text',
            key: 'text-' + uid(16),
            type: 'text',
            data: {
                text
                // url,
            },
        })
    }

    function showIpTab() {
        addOrActiveTab({
            title: t('ip'),
            key: `ip-0`,
            type: 'ip',
            data: {
                // url,
            },
        })
    }

    const funCommands = [
        {
            label: t('mysql'),
            key: 'mysql',
        },
        {
            label: t('json'),
            key: 'json',
        },
        {
            label: t('text'),
            key: 'text',
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
            label: t('oss'),
            key: 'oss-home',
        },
        {
            label: t('webdav'),
            key: 'webdav-home',
        },
        // {
        //     label: t('http'),
        //     key: 'http-home',
        // },
        // {
        //     label: t('json_table'),
        //     key: 'json_table',
        // },
        {
            label: t('aliyun'),
            key: 'aliyun',
        },
        {
            label: t('swagger'),
            key: 'swagger',
        },
        {
            label: t('ip'),
            key: 'ip',
        },
        {
            label: t('project'),
            key: 'project',
        },
        {
            label: t('logger'),
            key: 'logger',
        },
        {
            label: t('model'),
            key: 'model',
        },
        {
            label: t('tcp/udp'),
            key: 'tcp/udp',
        },
        {
            label: t('elasticsearch'),
            key: 'elasticsearch',
        },
        {
            label: t('mongo'),
            key: 'mongo',
        },
        {
            label: t('alasql'),
            key: 'alasql',
        },
    ]
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
            closeTabByKey(targetKey)
        }
    }

    const tabRight = (
        <div className={styles.langBox}>
            <Space>
                {/* <Button
                    type="text"
                    onClick={() => {
                    }}
                >
                    {t('text')}
                </Button> */}
                <div className={styles.fakeInput}
                    onClick={() => {
                        handleCommand('command')
                    }}
                >
                    <SearchOutlined className={styles.icon} />
                    <div className={styles.placeholder}>{t('search')}</div>
                    <div className={styles.keyboardKey}>{'⌘K'}</div>
                </div>
                {/* <Input
                    placeholder={t('search')}
                    size="small"
                    prefix={<SearchOutlined />}
                    suffix={
                        <div className={styles.keyboardKey}>{'⌘K'}</div>
                    }
                /> */}
                <Dropdown
                    overlay={
                        <Menu
                            onClick={({ key }) => {
                                handleCommand(key)
                            }}
                            items={[
                                // {
                                //     label: t('command'),
                                //     key: 'command',
                                // },
                                // {
                                //     type: 'divider',
                                // },
                                ...funCommands,
                                {
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
                        tabBarGutter={-1}
                        tabBarExtraContent={{
                            left: (
                                <div className={styles.logoBox}>
                                    DMS
                                </div>
                            ),
                            right: tabRight
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
                                            event$={event$}
                                            onConnnect={({ id, curConnect }) => {
                                                // TODO 通过 setTimeout 解决这个问题，原因未知
                                                // Can't perform a React state update on an unmounted component. This is a no-op, but it indicates a memory leak in your application. To fix, cancel all subscriptions and asynchronous tasks in a useEffect cleanup function
                                                console.log('curConnect', curConnect)
                                                setTimeout(() => {
                                                    const key = '' + new Date().getTime()
                                                    addOrActiveTab({
                                                        title: `${curConnect.name || 'Unnamed'}`,
                                                        key,
                                                        type: 'database',
                                                        data: {
                                                            name: null,
                                                            connectionId: id,
                                                            databaseType: curConnect.type,
                                                            curConnect,
                                                        }
                                                    }, {
                                                        // closeCurrentTab: true,
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
                                            databaseType={item.data.databaseType}
                                            curConnect={item.data.curConnect}
                                            onJson={json => {
                                                addJsonTab(json)
                                            }}
                                        />
                                    }
                                    {item.type == 'mysql-compare' &&
                                        <MysqlCompare
                                            // event$={event$}
                                            config={config}
                                            // dbName={item.data.name}
                                            // connectionId={item.data.connectionId}
                                            // onJson={json => {
                                            //     addJsonTab(json)
                                            // }}
                                        />
                                    }
                                    {item.type == 'help' &&
                                        <Help
                                            config={config}
                                            event$={event$}
                                            data={item.data}
                                        />
                                    }
                                    {item.type == 'json' &&
                                        <JsonEditor
                                            // config={config}
                                            event$={event$}
                                            data={item.data}
                                            key={item.key}
                                            config={config}
                                            onUploaded={({ id }) => {
                                                const key = '' + new Date().getTime()
                                                addOrActiveTab({
                                                    // title: `${curConnect.name || 'Unnamed'}`,
                                                    title: t('alasql'),
                                                    key,
                                                    type: 'database',
                                                    data: {
                                                        name: null,
                                                        connectionId: id,
                                                        databaseType: 'alasql',
                                                    }
                                                }, {
                                                    // closeCurrentTab: true,
                                                })
                                            }}
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
                                            onCommand={command => {
                                                handleCommand(command)
                                            }}
                                        />
                                    }
                                    {item.type == 'redis-connect' &&
                                        <RedisConnect
                                            event$={event$}
                                            config={config}
                                            onConnnect={({ connectionId, name, defaultDatabase }) => {
                                                console.log('onConnnect', connectionId)
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
                                            event$={event$}
                                            onProject={(project, openInNewTab) => {
                                                addOrActiveTab({
                                                    // title: 'Redis',
                                                    title: project.name || `GIT`,
                                                    key: 'git-' + uid(16),
                                                    type: 'git-detail',
                                                    data: {
                                                        project,
                                                    },
                                                }, {
                                                    closeCurrentTab: !openInNewTab,
                                                })
                                            }}
                                        />
                                    }
                                    {item.type == 'git-detail' &&
                                        <GitProject
                                            config={config}
                                            event$={event$}
                                            project={item.data.project}
                                            // projectPath={curProject.path}
                                            onList={() => {
                                                addOrActiveTab({
                                                    // title: 'Redis',
                                                    title: `GIT`,
                                                    key: 'git-project',
                                                    type: 'git-project',
                                                    data: {},
                                                }, {
                                                    closeCurrentTab: true,
                                                })
                                            }}
                                        />
                                    }
                                    {item.type == 'oss-home' &&
                                        <OssHome
                                            event$={event$}
                                            onClickItem={item => {
                                                console.log('item', item)
                                                // return
                                                addOrActiveTab({
                                                    // title: t('oss') + `-${(window._fileCount++) + 1}`,
                                                    title: item.name,
                                                    // key: 'redis-' + uid(16),
                                                    key: `file-${uid(16)}`,
                                                    type: 'file-home',
                                                    data: {
                                                        sourceType: 'oss:' + item.bucket,
                                                        ossItem: item,
                                                        // url,
                                                    },
                                                })
                                            }}
                                        />
                                    }
                                    {item.type == 'webdav-home' &&
                                        <WebDavHome
                                            onClickItem={item => {
                                                addOrActiveTab({
                                                    title: item.name,
                                                    // title: t('webdav') + `-${(window._fileCount++) + 1}`,
                                                    // key: 'redis-' + uid(16),
                                                    key: `file-${uid(16)}`,
                                                    type: 'file-home',
                                                    data: {
                                                        sourceType: 'oss:' + item.bucket,
                                                        webdavItem: item,
                                                        // url,
                                                    },
                                                })
                                            }}
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
                                            sourceType={item.data.sourceType}
                                            webdavItem={item.data.webdavItem}
                                            ossItem={item.data.ossItem}
                                            defaultPath={item.data.path}
                                        />
                                    }
                                    {item.type == 'terminal' &&
                                        <SshDetail
                                            config={config}
                                            local={true}
                                            defaultPath={item.data.path}
                                        />
                                    }
                                    {item.type == 'tcp/udp' &&
                                        <SocketHome
                                            config={config}
                                            // local={true}
                                            // defaultPath={item.data.path}
                                        />
                                    }
                                    {item.type == 'http-home' &&
                                        <HttpEditor
                                            config={config}
                                            // local={true}
                                            // defaultPath={item.data.path}
                                        />
                                    }
                                    {item.type == 'json-table' &&
                                        <JsonTable
                                            config={config}
                                            // local={true}
                                            // defaultPath={item.data.path}
                                        />
                                    }
                                    {item.type == 'aliyun' &&
                                        <AliyunHome
                                            config={config}
                                            // local={true}
                                            // defaultPath={item.data.path}
                                        />
                                    }
                                    {item.type == 'ip' &&
                                        <IpHome
                                            config={config}
                                            // local={true}
                                            // defaultPath={item.data.path}
                                        />
                                    }
                                    {item.type == 'swagger' &&
                                        <SwaggerHome
                                            config={config}
                                            event$={event$}
                                            // local={true}
                                            // defaultPath={item.data.path}
                                        />
                                    }
                                    {item.type == 'project-home' &&
                                        <ProjectHome
                                            config={config}
                                            // local={true}
                                            // defaultPath={item.data.path}
                                        />
                                    }
                                    {item.type == 'logger-home' &&
                                        <LoggerHome
                                            config={config}
                                            onItem={item => {
                                                addOrActiveTab({
                                                    // title: 'Redis',
                                                    title: `${item.name}`,
                                                    key: 'logger-detail-' + uid(16),
                                                    type: 'logger-detail',
                                                    data: {
                                                        item,
                                                    },
                                                }, {
                                                    // closeCurrentTab: true,
                                                })
                                            }}
                                            // local={true}
                                            // defaultPath={item.data.path}
                                        />
                                    }
                                    {item.type == 'logger-detail' &&
                                        <LoggerDetail
                                            config={config}
                                            event$={event$}
                                            item={item.data.item}
                                        />
                                    }
                                    {item.type == 'model' &&
                                        <ModelHome />
                                    }
                                    {item.type == 'mongo' &&
                                        <MongoHome
                                            config={config}
                                            event$={event$}
                                            onConnnect={({ connectionId, name }) => {
                                                console.log('onConnnect', connectionId)
                                                addOrActiveTab({
                                                    // title: 'Redis',
                                                    title: `${name}`,
                                                    key: 'mongo-client-' + uid(16),
                                                    type: 'mongo-client',
                                                    data: {
                                                        connectionId,
                                                    },
                                                }, {
                                                    // closeCurrentTab: true,
                                                })
                                            }}
                                        />
                                    }
                                    {item.type == 'mongo-client' &&
                                        <MongoClient
                                            config={config}
                                            event$={event$}
                                            connectionId={item.data.connectionId}
                                        />
                                    }
                                    {item.type == 'alasql-home' &&
                                        <AlasqlHome
                                            config={config}
                                            event$={event$}
                                            onUploaded={({ id, name = '' }) => {
                                                const key = '' + new Date().getTime()
                                                addOrActiveTab({
                                                    // title: `${curConnect.name || 'Unnamed'}`,
                                                    title: name || t('alasql'),
                                                    key,
                                                    type: 'database',
                                                    data: {
                                                        name: null,
                                                        connectionId: id,
                                                        databaseType: 'alasql',
                                                    }
                                                }, {
                                                    // closeCurrentTab: true,
                                                })
                                            }}
                                            // connectionId={item.data.connectionId}
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

                <Commander
                    commands={[
                        ...funCommands.map(item => {
                            return {
                                name: item.label,
                                icon: 'app',
                                command: item.key,
                            }
                        }),
                        {
                            name: t('about'),
                            icon: 'tool',
                            command: 'about',
                        },
                        {
                            name: t('help'),
                            icon: 'tool',
                            command: 'help',
                        },
                        {
                            name: t('close_tab'),
                            icon: 'tool',
                            command: 'close_tab',
                            order: 2,
                        },
                    ]}
                    onCommand={command => {
                        handleCommand(command)
                    }}
                    onRef={ref => {
                        commanderRef.current = ref
                    }}
                />
            </div>
        </ConfigProvider>
    );
}
