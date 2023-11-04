import React, { useState, useId, useEffect, ReactNode, useMemo, useRef } from 'react'
import styles from './index.module.less'
import { message, Input, Button, Tabs, Space, Form, Checkbox, InputNumber, ConfigProvider, Tree, Empty, Modal, Dropdown, Menu, Tag, Popover } from 'antd'
import storage from './storage'
import DatabaseList from './databases'
import { DataBaseDetail } from './databaseDetail'
import { request } from './utils/http'
import { useTranslation } from 'react-i18next'
import { IconButton } from './icon-button'
import { AppstoreOutlined, BulbOutlined, CloseOutlined, DatabaseOutlined, EllipsisOutlined, ExportOutlined, FolderOutlined, MenuOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import enUS from 'antd/es/locale/en_US';
import zhCN from 'antd/es/locale/zh_CN';
import { EsConnector } from './es-connectot'
import { EsDetail } from './es-detail'
import { uid } from 'uid'
import { Help } from './help'
import { JsonEditor } from './json'
import { Workbench } from './workbench'
import { SqlConnector } from './sql-connect'
import { UserList } from './user-list'
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
import { HttpClient } from '../http/editor'
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
import { FileList } from '../file/file-list'
import { MqttHome } from '../mqtt/mqtt-home/mqtt-home'
import { MqttConnect } from '../mqtt/mqtt-connect/mqtt-connect'
import { WebSocketHome } from '../websocket/websocket-home/websocket-home'
import { RedisConnect } from '../redis/redis-connect'
import { RedisClient } from '../redis/redis-client'
import { TextEditor } from '../text/text'
import { S3Home } from '../s3/s3-home'
import { HexEditor } from '../hex/hex-editor'
import { DockerDetail } from '../docker/docker-detail'

// console.log('styles', styles)
const { TextArea } = Input
const { TabPane } = Tabs

window._terminalCount = 0
window._fileCount = 0
window._sshCount = 0

const tab_mySql = {
    title: 'MySQL',
    key: 'mysql-connect-0',
    type: 'connect',
    data: {},
    // closable: false,
}

const tagIconLabel = {
    'git-project': 'GIT',
    'git-detail': 'GIT',
    'connect': 'DB',
    'database': 'DB',
    'mysql-compare': 'DB',
    'logger-home': 'LOG',
    'logger-detail': 'LOG',
    'oss-home': 'OSS',
    's3-home': 'S3',
    's3-client': 'S3',
    'file-home': 'FILE',
    'sftp-detail': 'SFTP',
    'ssh-detail': 'SSH',
    'ssh-connect': 'SSH',
    'redis-client': 'RDS',
    'redis-connect': 'RDS',
    'mqtt-home': 'MQTT',
    'mqtt-detail': 'MQTT',
    'websocket-home': 'WS',
    'mongo': 'MG',
    'mongo-client': 'MG',
    'swagger': 'API',
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
    const tabContentRef = useRef(null)
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

    useEffect(() => {
        if (!tabContentRef.current) {
            return () => {}
        }
        const handleKeyDown = e => {
            // console.log('e', e.code, e)
            // console.log('tabContentRef keydown', )
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [tabContentRef.current])

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
    // tabs 存在闭包问题，不知怎么解决，故引入 tabRef
    // 复现：开两个 ssh tab，在第二个 ssh tab 打开 sftp，会覆盖当前 tab 而不是新开 tab
    const tabRef = useRef(tabs_default)
    const [tabs, _setTabs] = useState(tabs_default)
    function setTabs(list) {
        _setTabs(list)
        tabRef.current = list
    }
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
            // console.log('e', e.code, e)
            if (document.activeElement?.nodeName == 'INPUT' || document.activeElement?.nodeName == 'TEXTAREA') {
                return
            }

            if (e.code == 'KeyW') {
                if (e.metaKey || e.ctrlKey) {
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
        let keyIdx = -1
        for (let i = 0; i < tabs.length; i++) {
            if (tabs[i].key === targetKey) {
                tabs.splice(i, 1)
                keyIdx = i
                break
            }
        }
        if (tabs.length == 0) {
            tabs.push(tab_workbench)
        }
        setTabs([
            ...tabs,
        ])
        if (tabs[keyIdx - 1]) {
            setActiveKey(tabs[keyIdx - 1].key)
        }
        else {
            setActiveKey(tabs[tabs.length - 1].key)
        }
    }

    function closeCurrentTab() {
        closeTabByKey(activeKey)
    }

    // const _render_tabs_length = tabs.length
    // console.log('_render_tabs_length', _render_tabs_length)

    function addOrActiveTab(tab, { closeCurrentTab = false, afterKey } = {}) {
        const tabs = tabRef.current
        const exists = tabs.find(t => t.key == tab.key)
        if (!exists) {
            let newTabs = [
                ...tabs,
                // tab,
            ]
            // console.log('新新新', _render_tabs_length, JSON.parse(JSON.stringify(tabs)))
            // console.log('tabRef.current', tabRef.current)
            if (afterKey) {
                const keyIdx = tabs.findIndex(t => t.key == afterKey)
                if (keyIdx == tabs.length - 1) {
                    newTabs.push(tab)
                }
                else {
                    newTabs.splice(keyIdx + 1, 0, tab)
                }
            }
            else {
                newTabs.push(tab)
            }
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
        const app = funCommands.find(item => item.key == key)
        if (app) {
            const historyApps = storage.get('historyApps', [])
            let newHistoryApps = historyApps.filter(item => item.command != app.key)
            newHistoryApps.unshift({
                name: app.label,
                command: app.key,
                id: '' + new Date().getTime(),
            })
            if (newHistoryApps.length > 8) {
                newHistoryApps = newHistoryApps.slice(0, 8)
            }
            storage.set('historyApps', newHistoryApps)
        }
        
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
        else if (key == 'workbench') {
            addOrActiveTab({
                ...tab_workbench,
                // title: 'Elasticsearch',
                // key: 'key-es',
                // type: 'elasticsearch',
                // data: {},
                // // closable: false,
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
        else if (key == 'mqtt') {
            addOrActiveTab({
                // title: `${curConnect.name || 'Unnamed'}`,
                title: t('mqtt'),
                key,
                type: 'mqtt-home',
                data: {}
            }, {
                // closeCurrentTab: true,
            })
        }
        else if (key == 'tcp_client') {
            window.open('/pages/tcp/client', '_blank')
        }
        else if (key == 'http_proxy') {
            window.open('/pages/http/proxy', '_blank')
        }
        else if (key == 'openai') {
            window.open('/pages/openai', '_blank')
        }
        else if (key == 'socket_proxy') {
            window.open('/pages/socket/proxy', '_blank')
        }
        else if (key == 'tcp_server') {
            window.open('/pages/tcp/server', '_blank')
        }
        else if (key == 'monitor') {
            window.open('/pages/monitor', '_blank')
        }
        else if (key == 'http_server') {
            window.open('/pages/http/server', '_blank')
        }
        else if (key == 'udp_client') {
            window.open('/pages/udp/client', '_blank')
        }
        else if (key == 'docker') {
            window.open('/pages/docker', '_blank')
        }
        else if (key == 'udp_server') {
            window.open('/pages/udp/server', '_blank')
        }
        else if (key == 'websocket') {
            window.open('/pages/websocket/client', '_blank')
        }
        else if (key == 'websocket-server') {
            window.open('/pages/websocket/server', '_blank')
        }
        else if (key == 'kafka-client') {
            window.open('/pages/kafka/client', '_blank')
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
        else if (key == 's3-home') {
            addOrActiveTab({
                title: t('s3'),
                // title: t('s3') + `-${(window._fileCount++) + 1}`,
                // key: 'redis-' + uid(16),
                key: `s3-${uid(16)}`,
                type: 's3-home',
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
        else if (key == 'http-client') {
            // addOrActiveTab({
            //     title: t('http_client'),
            //     // title: t('http') + `-${(window._fileCount++) + 1}`,
            //     // key: 'redis-' + uid(16),
            //     key: `http-0`,
            //     type: 'http-client',
            //     data: {
            //         // url,
            //     },
            // })
            window.open('/pages/http/client', '_blank')
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
        else if (key == 'hex_editor') {
            addOrActiveTab({
                title: t('hex_editor'),
                key: uid(16),
                type: 'hex_editor',
                data: {
                    // url,
                },
            })
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
            group: 'data',
        },
        {
            label: t('redis'),
            key: 'redis',
            group: 'data',
        },
        {
            label: t('git'),
            key: 'git',
            group: 'tool',
        },
        {
            label: t('ssh/sftp'),
            key: 'ssh',
            group: 'tool',
        },
        {
            label: t('file'),
            key: 'file',
            group: 'file',
        },
        // {
        //     label: t('terminal'),
        //     key: 'terminal',
        //     group: 'tool',
        // },
        {
            label: t('json'),
            key: 'json',
            group: 'tool',
        },
        {
            label: t('markdown'),
            key: 'markdown',
            group: 'tool',
        },
        {
            label: t('oss'),
            key: 'oss-home',
            group: 'file',
        },
        {
            label: t('s3'),
            key: 's3-home',
            group: 'file',
        },
        {
            label: t('webdav'),
            key: 'webdav-home',
            group: 'file',
        },
        // {
        //     label: t('json_table'),
        //     key: 'json_table',
        // },
        {
            label: t('aliyun'),
            key: 'aliyun',
            group: 'tool',
        },
        {
            label: t('swagger'),
            key: 'swagger',
            group: 'tool',
        },
        {
            label: t('logger'),
            key: 'logger',
            group: 'tool',
        },
        {
            label: t('mongo'),
            key: 'mongo',
            group: 'data',
        },
        {
            label: t('tcp_client'),
            key: 'tcp_client',
            group: 'network',
        },
        {
            label: t('tcp_server'),
            key: 'tcp_server',
            group: 'network',
        },
        {
            label: t('udp_client'),
            key: 'udp_client',
            group: 'network',
        },
        {
            label: t('udp_server'),
            key: 'udp_server',
            group: 'network',
        },
        {
            label: t('http_client'),
            key: 'http-client',
            group: 'network',
        },
        {
            label: t('http_server'),
            key: 'http_server',
            group: 'network',
        },
        {
            label: t('websocket_client'),
            key: 'websocket',
            group: 'network',
        },
        {
            label: t('websocket_server'),
            key: 'websocket-server',
            group: 'network',
        },
        {
            label: t('ip'),
            key: 'ip',
            group: 'network',
        },
        {
            label: t('http_proxy'),
            key: 'http_proxy',
            group: 'network',
        },
        {
            label: t('socket_proxy'),
            key: 'socket_proxy',
            group: 'network',
        },
        {
            label: t('mqtt'),
            key: 'mqtt',
            group: 'data',
        },
        {
            label: t('kafka'),
            key: 'kafka-client',
            group: 'data',
        },
        {
            label: t('elasticsearch'),
            key: 'elasticsearch',
            group: 'data',
        },
        {
            label: t('text'),
            key: 'text',
            group: 'tool',
        },
        {
            label: t('hex_editor'),
            key: 'hex_editor',
            group: 'tool',
        },
        // {
        //     label: t('udp'),
        //     key: 'tcp/udp',
        // },
        {
            label: t('openai'),
            key: 'openai',
            group: 'other',
        },
        {
            label: t('alasql'),
            key: 'alasql',
            group: 'other',
        },
        // {
        //     label: t('model'),
        //     key: 'model',
        // },
        // {
        //     label: t('project'),
        //     key: 'project',
        // },
        {
            label: t('monitor'),
            key: 'monitor',
            group: 'tool',
        },
        {
            label: t('docker'),
            key: 'docker',
            group: 'tool',
        },
    ]

    const funGroups = useMemo(() => {
        const groups = [
            {
                id: 'tool',
                name: t('app.group.tool'),
                apps: [],
            },
            {
                id: 'data',
                name: t('app.group.data'),
                apps: [],
            },
            {
                id: 'file',
                name: t('app.group.file'),
                apps: [],
            },
            {
                id: 'network',
                name: t('app.group.network'),
                apps: [],
            },
            {
                id: 'other',
                name: t('app.group.other'),
                apps: [],
            },
        ]
        for (let group of groups) {
            if (group.id == 'other') {
                group.apps = funCommands.filter(item => (item.group == 'other') || !item.group)
            }
            else {
                group.apps = funCommands.filter(item => item.group == group.id)
            }
        }
        return groups
    }, [funCommands])

    function handleTabChange(key: string) {
        setActiveKey(key)
    }

    const onEdit = (targetKey: string, action: string) => {
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

    const isMac = navigator.userAgent.indexOf('Macintosh') !== -1
    
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
                    <div className={styles.keyboardKey}>{`${isMac ? '⌘' : 'Ctrl'} K`}</div>
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
                                // ...funCommands,
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
                {/* <IconButton
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
                    }}
                >
                    <BulbOutlined />
                </IconButton> */}
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
                                    <Popover
                                        placement="bottomLeft"
                                        content={
                                            <div>
                                                <div className={styles.groups}>
                                                    {funGroups.map(group => {
                                                        return (
                                                            <div className={styles.group}>
                                                                <div className={styles.groupName}>{group.name}</div>
                                                                <div className={styles.apps}>
                                                                    {group.apps.map(item => {
                                                                        return (
                                                                            <div
                                                                                className={styles.item}
                                                                                key={item.key}
                                                                                onClick={() => {
                                                                                    handleCommand(item.key)
                                                                                }}
                                                                            >
                                                                                {item.label}</div>
                                                                        )
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        }
                                    >
                                        <IconButton
                                            onClick={e => e.preventDefault()}
                                        >
                                            <AppstoreOutlined />
                                        </IconButton>
                                    </Popover>
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
                                    <div className={styles.tabLabel}>
                                        {/* <div className={styles.tag}>GIT</div> */}
                                        {!!tagIconLabel[item.type] &&
                                            <Tag>{tagIconLabel[item.type]}</Tag>
                                        }
                                        {/* {item.type} */}
                                        {item.title.startsWith('$i18n.') ? t(item.title.replace('$i18n.', '')) : item.title}
                                    </div>
                                ),
                                key: item.key,
                                closable: item.closable !== false,
                            }
                        })}
                    />
                </div>
                <div className={styles.appBody}
                    ref={tabContentRef}
                    // onKeyDown={e }
                >
                    {tabs.map((item, tabIndex) => {
                        return (
                            <div
                                className={styles.tabContent}
                                key={item.key}
                                style={{
                                    display: item.key == activeKey ? undefined : 'none',
                                }}
                            >
                                    {item.type == 'elasticsearch' &&
                                        <EsConnector
                                            onConnect={({ url }) => {
                                                addOrActiveTab({
                                                    title: 'ES Indexs',
                                                    key: 'es-indexs',
                                                    type: 'es-index',
                                                    data: {
                                                        url,
                                                    },
                                                }, {
                                                    afterKey: item.key,
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
                                    {item.type == 'connect' &&
                                        <SqlConnector
                                            config={config}
                                            onJson={json => addJsonTab(json)}
                                            event$={event$}
                                            onConnect={({ id, curConnect }) => {
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
                                                            databaseType: curConnect.type,
                                                            curConnect,
                                                        }
                                                    }, {
                                                        afterKey: item.key,
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
                                            onUploaded={({ connectionId }) => {
                                                const key = '' + new Date().getTime()
                                                addOrActiveTab({
                                                    // title: `${curConnect.name || 'Unnamed'}`,
                                                    title: t('alasql'),
                                                    key,
                                                    type: 'database',
                                                    data: {
                                                        name: null,
                                                        connectionId,
                                                        databaseType: 'alasql',
                                                    }
                                                }, {
                                                    afterKey: item.key,
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
                                    {item.type == 'mqtt-home' &&
                                        <MqttConnect
                                            config={config}
                                            event$={event$}
                                            onConnect={({ connectionId, item, name }) => {
                                                console.log('onConnect', connectionId)
                                                addOrActiveTab({
                                                    title: `${name}`,
                                                    key: 'mqtt-' + uid(16),
                                                    type: 'mqtt-detail',
                                                    data: {
                                                        connectionId,
                                                        item,
                                                        // defaultDatabase,
                                                    },
                                                }, {
                                                    afterKey: item.key,
                                                    // closeCurrentTab: true,
                                                })
                                            }}
                                            // data={item.data}
                                        />
                                    }
                                    {item.type == 'mqtt-detail' &&
                                        <MqttHome
                                            config={config}
                                            event$={event$}
                                            data={item.data}
                                        />
                                    }
                                    {item.type == 'websocket-home' &&
                                        <WebSocketHome
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
                                            onConnect={({ connectionId, name, defaultDatabase, item }) => {
                                                console.log('onConnect', connectionId)
                                                addOrActiveTab({
                                                    // title: 'Redis',
                                                    title: `${name}`,
                                                    key: 'redis-' + uid(16),
                                                    type: 'redis-client',
                                                    data: {
                                                        item,
                                                        connectionId,
                                                        defaultDatabase,
                                                    },
                                                }, {
                                                    afterKey: item.key,
                                                    // closeCurrentTab: true,
                                                })
                                            }}
                                        />
                                    }
                                    {item.type == 'redis-client' &&
                                        <RedisClient
                                            config={config}
                                            event$={event$}
                                            item={item.data.item}
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
                                                    afterKey: item.key,
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
                                                    afterKey: item.key,
                                                    closeCurrentTab: true,
                                                })
                                            }}
                                        />
                                    }
                                    {item.type == 'oss-home' &&
                                        <OssHome
                                            event$={event$}
                                            onClickItem={ossItem => {
                                                console.log('item', ossItem)
                                                // return
                                                addOrActiveTab({
                                                    // title: t('oss') + `-${(window._fileCount++) + 1}`,
                                                    title: ossItem.name,
                                                    // key: 'redis-' + uid(16),
                                                    key: `file-${uid(16)}`,
                                                    type: 'file-home',
                                                    data: {
                                                        sourceType: 'oss:' + ossItem.bucket,
                                                        ossItem: ossItem,
                                                        // url,
                                                    },
                                                }, {
                                                    afterKey: item.key,
                                                })
                                            }}
                                        />
                                    }
                                    {item.type == 's3-home' &&
                                        <S3Home
                                            event$={event$}
                                            onItem={s3Item => {
                                                console.log('item', s3Item)
                                                // return
                                                addOrActiveTab({
                                                    // title: t('oss') + `-${(window._fileCount++) + 1}`,
                                                    title: s3Item.name,
                                                    // key: 'redis-' + uid(16),
                                                    key: `file-${uid(16)}`,
                                                    type: 's3-client',
                                                    data: {
                                                        sourceType: 's3:' + s3Item.id,
                                                        s3Item: s3Item,
                                                        // url,
                                                    },
                                                }, {
                                                    afterKey: item.key,
                                                })
                                            }}
                                        />
                                    }
                                    {item.type == 's3-client' &&
                                        <FileHome
                                            config={config}
                                            event$={event$}
                                            tabKey={item.key}
                                            sourceType={item.data.sourceType}
                                            s3Item={item.data.s3Item}
                                            // defaultPath={item.data.path}
                                            onClone={({ defaultPath }) => {
                                                // console.log('local file clone', defaultPath)
                                                // addOrActiveTab({
                                                //     title: t('file') + `-${(window._fileCount++) + 1}`,
                                                //     key: `file-${uid(16)}`,
                                                //     type: 'file-home',
                                                //     data: {
                                                //         ...item.data,
                                                //         path: defaultPath,
                                                //     },
                                                // })
                                            }}
                                        />
                                    }
                                    {item.type == 'webdav-home' &&
                                        <WebDavHome
                                            onClickItem={davItem => {
                                                addOrActiveTab({
                                                    title: davItem.name,
                                                    // title: t('webdav') + `-${(window._fileCount++) + 1}`,
                                                    // key: 'redis-' + uid(16),
                                                    key: `file-${uid(16)}`,
                                                    type: 'file-home',
                                                    data: {
                                                        sourceType: 'oss:' + davItem.bucket,
                                                        webdavItem: davItem,
                                                        // url,
                                                    },
                                                }, {
                                                    afterKey: item.key,
                                                })
                                            }}
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
                                            onClone={({ defaultPath }) => {
                                                console.log('local file clone', defaultPath)
                                                addOrActiveTab({
                                                    title: t('file') + `-${(window._fileCount++) + 1}`,
                                                    key: `file-${uid(16)}`,
                                                    type: 'file-home',
                                                    data: {
                                                        ...item.data,
                                                        path: defaultPath,
                                                    },
                                                }, {
                                                    afterKey: item.key,
                                                })
                                            }}
                                        />
                                    }
                                    {item.type == 'ssh-connect' &&
                                        <SshConnect
                                            config={config}
                                            event$={event$}
                                            tabKey={item.key}
                                            onSSh={({ item: sshItem }) => {
                                                addOrActiveTab({
                                                    title: sshItem.name,
                                                    key: `terminal-${uid(16)}`,
                                                    type: 'ssh-detail',
                                                    data: {
                                                        item: sshItem,
                                                    },
                                                }, {
                                                    afterKey: item.key,
                                                })
                                            }}
                                            onSftp={({ item: sshItem }) => {
                                                addOrActiveTab({
                                                    title: sshItem.name,
                                                    key: `terminal-${uid(16)}`,
                                                    type: 'sftp-detail',
                                                    data: {
                                                        item: sshItem,
                                                    },
                                                }, {
                                                    afterKey: item.key,
                                                })
                                            }}
                                            onDocker={({ item: sshItem }) => {
                                                addOrActiveTab({
                                                    title: `${sshItem.name} - Docker`,
                                                    key: `docker-${uid(16)}`,
                                                    type: 'docker-detail',
                                                    data: {
                                                        item: sshItem,
                                                    },
                                                }, {
                                                    afterKey: item.key,
                                                })
                                            }}
                                        />
                                    }
                                    {item.type == 'terminal' &&
                                        <SshDetail
                                            config={config}
                                            local={true}
                                            defaultPath={item.data.path}
                                            item={item.data.item}
                                        />
                                    }
                                    {item.type == 'ssh-detail' &&
                                        <SshDetail
                                            config={config}
                                            local={true}
                                            defaultPath={item.data.path}
                                            item={item.data.item}
                                            tabIndex={tabIndex}
                                            onSftpPath={path => {
                                                console.log('onSftpPath', path, item)
                                                console.log('onSftpPath/tabIndex', tabIndex)
                                                addOrActiveTab({
                                                    title: item.data.item.name,
                                                    key: `terminal-${uid(16)}`,
                                                    type: 'sftp-detail',
                                                    data: {
                                                        item: item.data.item,
                                                        defaultPath: path,
                                                    },
                                                }, {
                                                    afterKey: item.key,
                                                })
                                            }}
                                            onClone={() => {
                                                addOrActiveTab({
                                                    title: item.data.item.name,
                                                    key: `terminal-${uid(16)}`,
                                                    type: 'ssh-detail',
                                                    data: item.data,
                                                }, {
                                                    afterKey: item.key,
                                                })
                                            }}
                                        />
                                    }
                                    {item.type == 'docker-detail' &&
                                        <div className={styles.dockerBox}>
                                            <DockerDetail
                                                connection={{
                                                    id: `ssh:${item.data.item.id}`,
                                                }}
                                            />
                                        </div>
                                    }
                                    {item.type == 'sftp-detail' &&
                                        <FileList
                                            // tabKey={tabKey}
                                            config={config}
                                            event$={event$}
                                            sourceType="ssh"
                                            item={item.data.item}
                                            tabKey={item.key}
                                            defaultPath={item.data.defaultPath}
                                            onSshPath={path => {
                                                console.log('onSshPath', path)
                                                addOrActiveTab({
                                                    title: item.data.item.name,
                                                    key: `terminal-${uid(16)}`,
                                                    type: 'ssh-detail',
                                                    data: {
                                                        item: item.data.item,
                                                        path,
                                                    },
                                                }, {
                                                    afterKey: item.key,
                                                })
                                            }}
                                            onClone={({ defaultPath }) => {
                                                addOrActiveTab({
                                                    title: item.data.item.name,
                                                    key: `sftp-${uid(16)}`,
                                                    type: 'sftp-detail',
                                                    data: {
                                                        ...item.data,
                                                        defaultPath,
                                                    },
                                                }, {
                                                    afterKey: item.key,
                                                })
                                            }}
                                        />
                                    }
                                    {item.type == 'tcp/udp' &&
                                        <SocketHome
                                            config={config}
                                            // local={true}
                                            // defaultPath={item.data.path}
                                        />
                                    }
                                    {item.type == 'http-client' &&
                                        <HttpClient
                                            // config={config}
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
                                            tabKey={item.key}
                                            // local={true}
                                            // defaultPath={item.data.path}
                                        />
                                    }
                                    {item.type == 'hex_editor' &&
                                        <HexEditor
                                            config={config}
                                            tabKey={item.key}
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
                                            onItem={loggerItem => {
                                                addOrActiveTab({
                                                    title: `${loggerItem.name}`,
                                                    key: 'logger-detail-' + uid(16),
                                                    type: 'logger-detail',
                                                    data: {
                                                        item: loggerItem,
                                                        name: loggerItem.name,
                                                    },
                                                }, {
                                                    afterKey: item.key,
                                                })
                                            }}
                                        />
                                    }
                                    {item.type == 'logger-detail' &&
                                        <LoggerDetail
                                            config={config}
                                            event$={event$}
                                            item={item.data.item}
                                            onNew={({ keyword, time } = {}) => {
                                                addOrActiveTab({
                                                    title: `${item.data.name}`,
                                                    key: 'logger-detail-' + uid(16),
                                                    type: 'logger-detail',
                                                    data: {
                                                        item: {
                                                            ...item.data.item,
                                                            defaultKeyword: keyword,
                                                            defaultTime: time,
                                                        },
                                                        name: item.data.name,
                                                    },
                                                }, {
                                                    afterKey: item.key,
                                                })
                                            }}
                                        />
                                    }
                                    {item.type == 'model' &&
                                        <ModelHome />
                                    }
                                    {item.type == 'mongo' &&
                                        <MongoHome
                                            config={config}
                                            event$={event$}
                                            onConnect={({ connectionId, name, item: mongoItem }) => {
                                                console.log('onConnect', connectionId)
                                                addOrActiveTab({
                                                    // title: 'Redis',
                                                    title: `${name}`,
                                                    key: 'mongo-client-' + uid(16),
                                                    type: 'mongo-client',
                                                    data: {
                                                        connectionId,
                                                        item: mongoItem,
                                                    },
                                                }, {
                                                    afterKey: item.key,
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
                                            item={item.data.item}
                                        />
                                    }
                                    {item.type == 'alasql-home' &&
                                        <AlasqlHome
                                            config={config}
                                            event$={event$}
                                            onUploaded={({ connectionId, name = '' }) => {
                                                const key = '' + new Date().getTime()
                                                addOrActiveTab({
                                                    // title: `${curConnect.name || 'Unnamed'}`,
                                                    title: name || t('alasql'),
                                                    key,
                                                    type: 'database',
                                                    data: {
                                                        name: null,
                                                        connectionId,
                                                        databaseType: 'alasql',
                                                    }
                                                }, {
                                                    afterKey: item.key,
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
                        {
                            name: t('workbench'),
                            icon: 'tool',
                            command: 'workbench',
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
