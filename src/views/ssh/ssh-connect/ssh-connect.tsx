import { Button, Descriptions, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Popover, Space, Spin, Table, Tabs, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './ssh-connect.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { CodeOutlined, DownloadOutlined, EllipsisOutlined, ExportOutlined, EyeInvisibleOutlined, EyeOutlined, FileOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
// import { GitProject } from '../git-project';
import { request } from '@/views/db-manager/utils/http';
// import { ProjectEditor } from '../project-edit';
import { IconButton } from '@/views/db-manager/icon-button';
import { FullCenterBox } from '@/views/db-manager/redis-client';
import { SshDetail } from '../ssh-home';
// import { saveAs } from 'file-saver'
import { FileList } from '../../file/file-list'
import storage from '@/utils/storage';
import { uid } from 'uid';

function parseSize(sizeText: string) {
    return parseInt(sizeText.replace('kB', '').trim())
}

function parseStat(stat) {
    const rows = stat.split('\n')
    const cupStat = rows[0]
    const [ cpu, _user, _nice, _system, _idle ] = cupStat.split(/\s+/)
    // CPU利用率   =   100   *（user   +   nice   +   system）/（user   +   nice   +   system   +   idle）
    console.log('ccpp', _user, _nice, _system, _idle)
    const [user, nice, system, idle] = [_user, _nice, _system, _idle].map(item => {
        return parseInt(item.trim())
    })
    console.log('user, nice, system, idle', user, nice, system, idle)
    const cpuRate = (user + nice + system) / (user + nice + system + idle)
    return {
        cpuUsage: Math.floor(100 * cpuRate),
    }
}

function parseLoadAvg(loadavg) {
    const arr = loadavg.split(/\s+/)
    return `${arr[0]} / ${arr[1]} / ${arr[2]}`
}

function parseUpTime(uptime) {
    const arr = uptime.split(/\s+/)
    const second = parseFloat(arr[0])
    // const m = moment().add(-1 * second, 'seconds')
    const minite = 60
    const hour = 60 * minite
    const day = 24 * hour
    if (second > day) {
        return Math.floor(second / day) + 'd'
    }
    if (second > hour) {
        return Math.floor(second / hour) + 'h'
    }
    if (second > minite) {
        return Math.floor(second / minite) + 'min'
    }
    return second + 's'
}

function parseCpuInfo(cpuinfo) {
    console.log('cpuinfo', cpuinfo)
    const infoObj = {}
    const arr = cpuinfo.split('\n')
    for (let line of arr) {
        console.log('line', line)
        const _arr = line.split(':')
        if (_arr[1]) {
            infoObj[_arr[0].trim()] = _arr[1].trim()
        }
    }
    console.log('infoObj', infoObj)   
    // return infoObj['cpu cores']
    return infoObj['siblings']
}

function InputPassword(props) {
    const [visible, setVisible] = useState(false)
    return (
        <Input
            {...props}
            type={visible ? 'text' : 'password'}
            addonAfter={
                <div>
                    <IconButton
                        size="small"
                        onClick={() => {
                            setVisible(!visible)
                        }}
                    >
                        {visible ? <EyeOutlined /> : <EyeInvisibleOutlined /> }
                    </IconButton>
                </div>
            }
        />
    )
}

export function SshConnect({ config, tabKey, event$ }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [modalVisible, setModalVisible] = useState(false)
    const [modalItem, setModalItem] = useState(false)
    const [loading, setLoading] = useState(false)
    const [curItem, setCurItem] = useState(null)
    const [view, setView] = useState('list')
    const [keyword, setKeyword] = useState('')

    const [moniteItem, setMoniteItem] = useState(null)
    const [moniteVisible, setMoniteVisible] = useState(false)
    // const [curTab, setCurTab] = useState('commit-list')
    // const config = {
    //     host: 'http://localhost:10086',
    // }
    const [projects, setProjects] = useState([])
    // const projects = [
    //     {
    //         name: 'dms-new',
    //         path: '/Users/yunser/app/dms-new',
    //     },
    //     {
    //         name: 'git-auto',
    //         path: '/Users/yunser/app/git-auto',
    //     },
    // ]
    const filterdProjects = useMemo(() => {
        if (!keyword) {
            return projects    
        }
        return projects.filter(p => p.name.toLowerCase().includes(keyword.toLowerCase()))
        // return projects
    }, [projects, keyword])

    // const event$ = useEventEmitter()

    const [cloneModalVisible, setCloneModalVisible] = useState(false)
    const [projectItem, setProjectItem] = useState(null)
    const [projectModalVisible, setProjectModalVisible] = useState(false)
    const [createType, setCreateType] = useState(false)

    async function loadList() {
        setLoading(true)
        let res = await request.post(`${config.host}/ssh/connection/list`, {
            // projectPath,
            // connectionId,
            // sql: lineCode,
            // tableName,
            // dbName,
            // logger: true,
        }, {
            // noMessage: true,
        })
        // console.log('res', res)
        if (res.success) {
            // setProjects([])
            setProjects(res.data.list.sort((a, b) => {
                return a.name.localeCompare(b.name)
            }))
            // setCurrent(res.data.current)
        }
        setLoading(false)
    }

    useEffect(() => {
        loadList()
    }, [])

    

    function editProject(item) {
        setProjectModalVisible(true)
        setProjectItem(item)
    }

    async function deleteItem(item) {
        Modal.confirm({
            title: '',
            // icon: <ExclamationCircleOutlined />,
            content: `${t('delete')}「${item.name}」?`,
            async onOk() {
                let res = await request.post(`${config.host}/ssh/connection/delete`, {
                    id: item.id,
                })
                console.log('get/res', res.data)
                if (res.success) {
                    message.success(t('success'))
                    // onSuccess && onSuccess()
                    loadList()
                    // loadKeys()
                    // setResult(null)
                    // setResult({
                    //     key: item,
                    //     ...res.data,
                    // })
                    // setInputValue(res.data.value)
                }
            }
        })
    }

    function exportAll() {
        event$.emit({
            type: 'event_show_json',
            data: {
                json: JSON.stringify(projects, null, 4)
                // connectionId,
            },
        })
    }

    return (
        <div className={styles.gitApp}>
            {view == 'list' &&
                <div className={styles.listBox}>
                    <div className={styles.listContent}>
                        <div className={styles.tool}
                            
                        >
                            <Space>
                                <IconButton
                                    tooltip={t('refresh')}
                                    onClick={() => {
                                        loadList()
                                    }}
                                >
                                    <ReloadOutlined />
                                </IconButton>
                                <IconButton
                                    tooltip={t('add')}
                                    // className={styles.refresh}
                                    onClick={() => {
                                        setModalVisible(true)
                                        setModalItem(null)
                                    }}
                                >
                                    <PlusOutlined />
                                </IconButton>
                                <IconButton
                                    tooltip={t('export_json')}
                                    // size="small"
                                    // className={styles.refresh}
                                    onClick={() => {
                                        exportAll()
                                    }}
                                >
                                    <ExportOutlined />
                                </IconButton>
                            </Space>
                        </div>
                        <div>
                            <Input
                                placeholder={t('filter')}
                                value={keyword}
                                allowClear
                                onChange={e => {
                                    setKeyword(e.target.value)
                                }}
                            />
                        </div>
                        {loading ?
                            <FullCenterBox
                                height={320}
                            >
                                <Spin />
                            </FullCenterBox>
                        : filterdProjects.length == 0 ?
                            <FullCenterBox
                                height={320}
                            >
                                <Empty />
                            </FullCenterBox>
                        :
                            <div className={styles.listWrap}>
                                <div className={styles.list}>
                                    {filterdProjects.map(item => {
                                        return (
                                            <div
                                                key={item.id}
                                                className={styles.item}
                                                onClick={() => {
                                                    
                                                }}
                                            >
                                                <Space>
                                                    <div className={styles.name}>{item.name}</div>
                                                    <div className={styles.info}>{item.username}@{item.host}</div>
                                                </Space>
                                                <Space
                                                    onClick={(e) => {
                                                        e.preventDefault()
                                                        e.stopPropagation()
                                                    }}
                                                >
                                                    <Button
                                                        size="small"
                                                        onClick={() => {
                                                            setView('detail')
                                                            setCurItem(item)
                                                        }}
                                                        icon={<CodeOutlined />}
                                                    >
                                                        SSH
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        onClick={() => {
                                                            setView('sftp')
                                                            setCurItem(item)
                                                        }}
                                                        icon={<FileOutlined />}
                                                    >
                                                        SFTP
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        onClick={() => {
                                                            setMoniteVisible(true)
                                                            setMoniteItem(item)
                                                        }}
                                                        icon={<FileOutlined />}
                                                    >
                                                        {t('monitor')}
                                                    </Button>
                                                    
                                                    <Dropdown
                                                        trigger={['click']}
                                                        overlay={
                                                            <Menu
                                                                items={[
                                                                    {
                                                                        label: t('edit'),
                                                                        key: 'edit',
                                                                    },
                                                                    {
                                                                        label: t('delete'),
                                                                        key: 'delete',
                                                                        danger: true,
                                                                    },
                                                                ]}
                                                                onClick={({ key, domEvent }) => {
                                                                    // domEvent.preventDefault()
                                                                    domEvent.stopPropagation()
                                                                    if (key == 'delete') {
                                                                        deleteItem(item)
                                                                    }
                                                                    else if (key == 'edit') {
                                                                        setModalVisible(true)
                                                                        setModalItem((item))
                                                                    }
                                                                }}
                                                            />
                                                        }
                                                    >
                                                        <IconButton
                                                            // tooltip={t('add')}
                                                            className={styles.refresh}
                                                            // onClick={() => {
                                                            //     setProjectModalVisible(true)
                                                            // }}
                                                        >
                                                            <EllipsisOutlined />
                                                        </IconButton>
                                                    </Dropdown>
                                                </Space>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        }
                    </div>
                </div>
            }
            {view == 'detail' &&
                <SshDetail
                    config={config}
                    event$={event$}
                    item={curItem}
                    // projectPath={curProject.path}
                    onList={() => {
                        setView('list')
                    }}
                    onBack={() => {
                        setView('list')
                    }}
                />
            }
            {view == 'sftp' &&
                <FileList
                    tabKey={tabKey}
                    config={config}
                    event$={event$}
                    sourceType="ssh"
                    item={curItem}
                />
            }
            {/* {projectModalVisible &&
                <ProjectEditor
                    config={config}
                    item={projectItem}
                    createType={createType}
                    onCancel={() => {
                        setProjectModalVisible(false)
                    }}
                    onSuccess={() => {
                        setProjectModalVisible(false)
                        loadList()
                    }}
                />
            } */}
            {/* {cloneModalVisible &&
                <ProjectEditor
                    config={config}
                    sourceType="clone"
                    onCancel={() => {
                        setCloneModalVisible(false)
                    }}
                    onSuccess={() => {
                        setCloneModalVisible(false)
                        loadList()
                    }}
                />
            } */}
            {modalVisible &&
                <DatabaseModal
                    item={modalItem}
                    config={config}
                    onCancel={() => {
                        setModalVisible(false)
                    }}
                    onSuccess={() => {
                        setModalVisible(false)
                        loadList()
                    }}
                />
            }
            {moniteVisible &&
                <MonitorModal
                    item={moniteItem}
                    config={config}
                    onCancel={() => {
                        setMoniteVisible(false)
                    }}
                />
            }
        </div>
    )
}



function DatabaseModal({ config, onCancel, item, onSuccess, onConnect, }) {
    const { t } = useTranslation()

    const editType = item ? 'update' : 'create'
    const [loading, setLoading] = useState(false)
    const [form] = Form.useForm()
//     const [code, setCode] = useState(`{
//     "host": "",
//     "user": "",
//     "password": ""
// }`)

    

    useEffect(() => {
        if (item) {
            form.setFieldsValue({
                ...item,
                defaultDatabase: item.defaultDatabase || 0,
            })
        }
        else {
            form.setFieldsValue({
                name: '',
                host: '',
                port: null,
                password: '',
                defaultDatabase: null,
                userName: '',
            })
        }
    }, [item])

    async function handleOk() {
        const values = await form.validateFields()
        // setLoading(true)
        let _connections
        if (editType == 'create') {
            let res = await request.post(`${config.host}/ssh/connection/create`, {
                // id: item.id,
                // data: {
                // }
                name: values.name || t('unnamed'),
                host: values.host || 'localhost',
                port: values.port || 22,
                password: values.password,
                username: values.username,
            })
            if (res.success) {
                onSuccess && onSuccess()
            }
        }
        else {
            let res = await request.post(`${config.host}/ssh/connection/update`, {
                id: item.id,
                data: {
                    name: values.name || t('unnamed'),
                    host: values.host || 'localhost',
                    port: values.port || 22,
                    password: values.password,
                    username: values.username,
                }
            })
            if (res.success) {
                onSuccess && onSuccess()
            }
        }
    }

    async function handleTestConnection() {
        const values = await form.validateFields()
        setLoading(true)
        const reqData = {
            host: values.host,
            port: values.port || 22,
            username: values.username,
            password: values.password,
            test: true,
            // remember: values.remember,
        }
        let ret = await request.post(`${config.host}/ssh/connect`, reqData)
        // console.log('ret', ret)
        if (ret.success) {
            message.success(t('success'))
        }
        setLoading(false)
    }

    return (
        <Modal
            title={editType == 'create' ? t('connection_create') : t('connection_update')}
            visible={true}
            maskClosable={false}
            onCancel={onCancel}
            // onOk={async () => {
                
            // }}
            footer={(
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    {/* <div></div> */}
                    <Button key="back"
                        loading={loading}
                        disabled={loading}
                        onClick={handleTestConnection}
                    >
                        {t('test_connection')}
                    </Button>
                    <Space>
                        <Button
                            // key="submit"
                            // type="primary"
                            disabled={loading}
                            onClick={onCancel}
                        >
                            {t('cancel')}
                        </Button>
                        <Button
                            type="primary"
                            disabled={loading}
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
                // layout={{
                //     labelCol: { span: 0 },
                //     wrapperCol: { span: 24 },
                // }}
            >
                <Form.Item
                    name="name"
                    label={t('title')}
                    // rules={[ { required: true, }, ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="host"
                    label={t('host')}
                    rules={[ { required: true, }, ]}
                >
                    <Input
                        // placeholder="localhost"
                    />
                </Form.Item>
                <Form.Item
                    name="port"
                    label={t('port')}
                    // rules={[{ required: true, },]}
                >
                    <InputNumber
                        placeholder="22"
                    />
                </Form.Item>
                {/* <Form.Item
                    name="user"
                    label="User"
                    rules={[{ required: true, },]}
                >
                    <Input />
                </Form.Item> */}
                <Form.Item
                    name="username"
                    label={t('user_name')}
                    rules={[{ required: true, },]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="password"
                    label={t('password')}
                    rules={[{ required: true, },]}
                >
                    <InputPassword />
                </Form.Item>
            </Form>
        </Modal>
    );
}

function parseMemInfo(meminfo: string) {
    console.log('meminfo', meminfo)
    const result = {}
    meminfo.split('\n').filter(item => item).forEach(row => {
        console.log('row', row)
        const [ key, value ] = row.split(':')
        result[key] = value.trim()
    })
    return result
}

function MonitorModal({ item, onCancel, config }) {

    const { t } = useTranslation()
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    
    async function loadData() {
        setLoading(true)
        let res = await request.post(`${config.host}/ssh/connection/monite`, {
            id: item.id,
        })
        setLoading(false)
        if (res.success) {
            console.log('loadData', res.data)
            // const { meminfo } = res.data
            const memInfo = parseMemInfo(res.data.meminfo)
            console.log('memInfo', memInfo)
            // total=used+free+buff/cache
            // MemAvailable
            // MemFree

            // MemTotal
            // Buffers
            // Cached
            // total=used+free+buff/cache
            // https://blog.csdn.net/heymyyl/article/details/80073534

            const { cpuUsage } = parseStat(res.data.stat)
            setResult({
                // MemTotal: memInfo.MemTotal,
                memoryPercent: Math.floor((parseSize(memInfo.MemTotal) - parseSize(memInfo.MemFree) - parseSize(memInfo.Buffers) - parseSize(memInfo.Cached)) / parseSize(memInfo.MemTotal) * 100),
                cpuUsage,
                loadavg: parseLoadAvg(res.data.loadavg),
                uptime: parseUpTime(res.data.uptime),
                cpuinfo: parseCpuInfo(res.data.cpuinfo),
            })
        }
    }

    useEffect(() => {
        loadData()
    }, [item])

    return (
        <Modal
            title={t('monitor')}
            open={true}
            onCancel={onCancel}
            footer={null}
        >
            {loading ?
                <Spin />
            : !!result ?
                <div className={styles.dataList}>
                    <div className={styles.item}>
                        <div className={styles.key}>CPU
                            <div className={styles.tag}>{result.cpuinfo} {t('ssh.cores')}</div>
                        </div>
                        <div className={styles.value}>
                             {result.cpuUsage}%
                        </div>
                    </div>
                    <div className={styles.item}>
                        <div className={styles.key}>{t('ssh.memory')}</div>
                        <div className={styles.value}>
                            {result.memoryPercent}%
                        </div>
                    </div>
                    <div className={styles.item}>
                        <div className={styles.key}>{t('ssh.load_avg')}</div>
                        <div className={styles.value}>
                            {result.loadavg}
                        </div>
                    </div>

                    <div className={styles.item}>
                        <div className={styles.key}>{t('ssh.uptime')}</div>
                        <div className={styles.value}>
                            {result.uptime}
                        </div>
                    </div>
                </div>
            :
                <div>error</div>
            }
        </Modal>
    )
}