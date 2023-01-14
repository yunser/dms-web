import { Button, Checkbox, Descriptions, Drawer, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Popover, Progress, Space, Spin, Table, Tabs, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './ssh-connect.module.less';
import _ from 'lodash';
import classNames from 'classnames'
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { CodeOutlined, DownloadOutlined, EllipsisOutlined, ExportOutlined, EyeInvisibleOutlined, EyeOutlined, FileOutlined, LineChartOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
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

function CircleProgress({ percent, width, ...otherProps }) {
    let color = '#4091f7'
    if (percent > 90) {
        color = '#ed5b56'
    }
    else if (percent > 80) {
        color = '#f0af41'
    }
    return (
        <Progress
            type="circle"
            percent={percent}
            width={width}
            strokeColor={color}
            trailColor="#eee"
            // format={() => ''}
            {...otherProps}
        />
    )
}

function LineProgress({ percent, ...otherProps }) {
    let color = '#4091f7'
    if (percent > 90) {
        color = '#ed5b56'
    }
    else if (percent > 80) {
        color = '#f0af41'
    }
    return (
        <Progress
            percent={percent}
            strokeColor={color}
            trailColor="#eee"
            {...otherProps}
        />
    )
}

function CheckboxInput({ value, onChange }) {
    return (
        <Checkbox
            checked={value === true}
            onChange={e => {
                onChange && onChange(e.target.checked)
            }}
        />
    )
}

const topText = `top - 01:16:10 up 168 days,  8:56,  0 users,  load average: 6.52, 3.56, 3.51
Tasks: 248 total,   2 running, 245 sleeping,   0 stopped,   1 zombie
%Cpu(s): 40.0 us, 26.7 sy,  0.0 ni, 33.3 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
KiB Mem : 15990592 total,   296452 free, 14415472 used,  1278668 buff/cache
KiB Swap:        0 total,        0 free,        0 used.  1191304 avail Mem 

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU %MEM     TIME+ COMMAND
10907 cjh       20   0 1130364  42536   2580 S  81.2  0.3   0:00.35 beam.smp
31238 root      20   0 5058368   1.1g   6472 S  31.2  6.9 941:25.81 java
32759 root      20   0       0      0      0 S   0.0  0.0   0:00.00 kworker/2:2
`
const toplist = parseTop(topText)
// console.log('toplist', )
function parseSize(sizeText: string) {
    return parseInt(sizeText.replace('kB', '').trim())
}

function parseStat(stat) {
    const rows = stat.split('\n')
    const cupStat = rows[0]
    const [ cpu, _user, _nice, _system, _idle ] = cupStat.split(/\s+/)
    // CPU利用率   =   100   *（user   +   nice   +   system）/（user   +   nice   +   system   +   idle）
    // console.log('ccpp', _user, _nice, _system, _idle)
    const [user, nice, system, idle] = [_user, _nice, _system, _idle].map(item => {
        return parseInt(item.trim())
    })
    // console.log('user, nice, system, idle', user, nice, system, idle)
    const cpuRate = (user + nice + system) / (user + nice + system + idle)
    return {
        cpuUsage: Math.floor(100 * cpuRate),
    }
}

function parseLoadAvg(loadavg) {
    const arr = loadavg.split(/\s+/)
    const num1 = parseFloat(arr[0])
    const num2 = parseFloat(arr[1])
    const num3 = parseFloat(arr[2])
    return {
        text: `${num1} / ${num2} / ${num3}`,
        nums: [num1, num2, num3]
    }
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

function parseLsb(lsb: string) {
    console.log('lsb', lsb)
    const infoObj = {}
    const arr = lsb.split('\n')
    for (let line of arr) {
        // console.log('line', line)
        const _arr = line.split(':')
        if (_arr[1]) {
            infoObj[_arr[0].trim()] = _arr[1].trim()
        }
    }
    // console.log('infoObj', infoObj)
    // Distributor ID: Ubuntu
    // Description:    Ubuntu 12.04.1 LTS
    // Release:        12.04
    // Codename:       precise

    if (!infoObj['Distributor ID']) {
        return ''
    }
    return `${infoObj['Distributor ID']} ${infoObj['Release']}`
}

function parseCpuInfo(cpuinfo: string) {
    // console.log('cpuinfo', cpuinfo)
    const infoObj = {}
    const arr = cpuinfo.split('\n')
    for (let line of arr) {
        // console.log('line', line)
        const _arr = line.split(':')
        if (_arr[1]) {
            infoObj[_arr[0].trim()] = _arr[1].trim()
        }
    }
    // console.log('infoObj', infoObj)   
    // return infoObj['cpu cores']
    return parseInt(infoObj['siblings'])
}

function parseDisk(disk: string) {
    // console.log('disk2', disk)
    const lines = disk.split('\n')
    // console.log('rows', lines)
    const results = []
    for (let line of lines) {
        const arr = line.split(/\s+/)
        // console.log('arr', arr)
        if (arr.length == 6) {
            // if (!line.includes('overlay')) {
            if (line.includes('/dev/vd')) {
                const name = arr[0].replace('/dev/', '')
                const percent = parseInt(arr[4].replace('%', '').trim())
                results.push({
                    name,
                    percent,
                    // text: `${name}：${percent}%`,
                })
            }
        }
    }
    return results
}

function parseTop(top) {
    // console.log('parseTop', top)
    const arr = top.split('\n\n')
    // console.log('parseTop/arr', arr)
    if (!arr[1]) {
        return []
    }
    const lines = arr[1].split('\n')
    // console.log('parseTop/lines', lines)
    const results = []
    for (let line of lines) {
        const lineArr = line.split(/\s+/)
        // console.log('parseTop/lineArr', lineArr)
        if (lineArr.length == 12) {
            const [PID, USER, PR, NI, VIRT, RES, SHR, S, CPU, MEM, TIME, COMMAND] = lineArr
            results.push({
                PID,
                CPU,
                MEM,
                COMMAND,
            })

        }
    }
    console.log('parseTop/results', results)
    return results
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

export function SshConnect({ config, tabKey, onSSh, onSftp, event$ }) {
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

    const [dashboardVisible, setDashboardVisible] = useState(false)
    const [dashboarItems, setDashboardItems] = useState([])
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
                // console.log('get/res', res.data)
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
                                <Button
                                    size="small"
                                    onClick={() => {
                                        setDashboardVisible(true)
                                        console.log('projects', projects)
                                        setDashboardItems(projects.filter(item => item.isMonitor))
                                        // setMoniteItem(item)
                                    }}
                                    icon={<LineChartOutlined />}
                                >
                                    {t('monitor')}
                                </Button>
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
                                                            // setView('detail')
                                                            // setCurItem(item)
                                                            onSSh && onSSh({ item })
                                                        }}
                                                        icon={<CodeOutlined />}
                                                    >
                                                        SSH
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        onClick={() => {
                                                            // setView('sftp')
                                                            // setCurItem(item)
                                                            onSftp && onSftp({ item })
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
                                                        icon={<LineChartOutlined />}
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
            {dashboardVisible &&
                <DashboardModal
                    dashboarItems={dashboarItems}
                    config={config}
                    onCancel={() => {
                        setDashboardVisible(false)
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
                isMonitor: false,
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
                privateKey: values.privateKey,
                username: values.username,
                isMonitor: values.isMonitor || false,
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
                    privateKey: values.privateKey,
                    username: values.username,
                    isMonitor: values.isMonitor || false,
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
            privateKey: values.privateKey,
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
                    extra={<div>{t('ssh.host_help')}</div>}
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
                <Form.Item
                    name="privateKey"
                    label={t('ssh.private_key')}
                    // extra="12"
                    // rules={[{ required: true, },]}
                >
                    <Input.TextArea
                        placeholder="填写后则不使用密码"
                    />
                </Form.Item>
                <Form.Item
                    name="isMonitor"
                    label={t('监控')}
                    // extra="12"
                    // rules={[{ required: true, },]}
                >
                    <CheckboxInput
                        // placeholder="填写后则不使用密码"
                    ></CheckboxInput>
                </Form.Item>
            </Form>
        </Modal>
    );
}

function parseMemInfo(meminfo: string) {
    // console.log('meminfo', meminfo)
    const result = {}
    meminfo.split('\n').filter(item => item).forEach(row => {
        // console.log('row', row)
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
            // console.log('loadData', res.data)
            // return
            // const { meminfo } = res.data
            const memInfo = parseMemInfo(res.data.meminfo)
            // console.log('memInfo', memInfo)
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
                disks: parseDisk(res.data.disk),
                processes: parseTop(res.data.top),
                // version: res.data.version,
                version: res.data.version.split('-')[0],
                lsb: parseLsb(res.data.lsb),
            })
        }
    }

    useEffect(() => {
        loadData()
    }, [item])

    return (
        <Modal
            title={t('monitor') + ` (${item.name})`}
            width={800}
            open={true}
            onCancel={onCancel}
            footer={null}
        >
            {loading ?
                <Spin />
            : !!result ?
                <div className={styles.body}>
                    <div className={styles.tools}>
                        <IconButton
                            tooltip={t('refresh')}
                            // size="small"
                            className={styles.refresh}
                            onClick={() => {
                                // loadKeys()
                                loadData()
                            }}
                        >
                            <ReloadOutlined />
                        </IconButton>
                    </div>

                    <div className={styles.dataList}>
                        <div className={styles.item}>
                            <div className={styles.key}>{t('ssh.memory')}</div>
                            <div className={styles.value}>
                                {/* {result.memoryPercent}% */}
                                <Progress
                                    className={styles.bigProgress}
                                    type="circle"
                                    percent={result.memoryPercent}
                                    width={48}
                                    trailColor="#eee"
                                />
                            </div>
                        </div>
                        <div className={styles.item}>
                            <div className={styles.key}>CPU
                                <div className={styles.tag}>{result.cpuinfo} {t('ssh.cores')}</div>
                            </div>
                            <div className={styles.value}>
                                {/* {result.cpuUsage}% */}
                                <Progress
                                    className={styles.bigProgress}
                                    type="circle"
                                    percent={result.cpuUsage}
                                    width={48}
                                    trailColor="#eee"
                                />
                            </div>
                        </div>
                        <div className={classNames(styles.item, styles.loadSvgItem)}>
                            <div className={styles.key}>{t('ssh.load_avg')}</div>
                            <div className={styles.value}>
                                <Space>
                                    <div className={styles.circles}>
                                        <div className={styles.layer}>
                                            <CircleProgress
                                                className={styles.bigProgress}
                                                percent={Math.floor(result.loadavg.nums[2] / result.cpuinfo * 100)}
                                                width={48}
                                                format={() => ''}
                                            />
                                        </div>
                                        <div className={styles.layer}>
                                            <CircleProgress
                                                className={styles.bigProgress}
                                                percent={Math.floor(result.loadavg.nums[1] / result.cpuinfo * 100)}
                                                width={32}
                                                format={() => ''}
                                            />
                                        </div>
                                        <div className={styles.layer}>
                                            <CircleProgress
                                                className={styles.bigProgress}
                                                percent={Math.floor(result.loadavg.nums[0] / result.cpuinfo * 100)}
                                                width={16}
                                                format={() => ''}
                                            />
                                        </div>
                                    </div>
                                    {result.loadavg.text}
                                </Space>
                            </div>
                        </div>

                        

                        <div className={styles.item}>
                            <div className={styles.key}>{t('ssh.disk')}</div>
                            <div className={styles.value}>
                                {result.disks.length > 0 ?
                                    <div className={styles.disks}>
                                        {result.disks.map(disk => {
                                            return (
                                                <div className={styles.item}>
                                                    <div className={styles.name}>{disk.name}</div>
                                                    <LineProgress
                                                        className={styles.progress} 
                                                        percent={disk.percent} 
                                                        size="small" />
                                                </div>
                                            )
                                        })}
                                    </div>
                                :
                                    <div>--</div>
                                }
                            </div>
                        </div>
                        <div className={styles.item}>
                            <div className={styles.key}>{t('ssh.uptime')}</div>
                            <div className={styles.value}>
                                {result.uptime}
                            </div>
                        </div>
                    </div>
                    <div className={styles.infoBox}>
                        <div className={styles.version}>{result.version}</div>
                        <div className={styles.lsb}>{result.lsb}</div>
                    </div>
                    <div className={styles.processBox}>
                        <Table
                            dataSource={result.processes}
                            columns={[
                                {
                                    title: '进程',
                                    dataIndex: 'PID',
                                    width: 160,
                                    sorter: (a, b) => a.PID - b.PID,
                                },
                                {
                                    title: 'CPU',
                                    dataIndex: 'CPU',
                                    width: 80,
                                    sortDirections: ['descend', 'ascend'],
                                    sorter: (a, b) => a.CPU - b.CPU,
                                },
                                {
                                    title: '内存',
                                    dataIndex: 'MEM',
                                    width: 80,
                                    sortDirections: ['descend', 'ascend'],
                                    sorter: (a, b) => a.MEM - b.MEM,
                                },
                                {
                                    title: '命令',
                                    dataIndex: 'COMMAND',
                                },
                            ]}
                            size="small"
                            scroll={{
                                y: 400,
                            }}
                            pagination={false}
                        />
                    </div>
                </div>
            :
                <div>error</div>
            }
        </Modal>
    )
}

function MonitorItem({ item, config }) {

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
            // console.log('loadData', res.data)
            // return
            // const { meminfo } = res.data
            const memInfo = parseMemInfo(res.data.meminfo)
            // console.log('memInfo', memInfo)
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
                disks: parseDisk(res.data.disk),
                processes: parseTop(res.data.top),
                // version: res.data.version,
                version: res.data.version.split('-')[0],
            })
        }
    }

    useEffect(() => {
        loadData()
    }, [item])

    return (
        <div>
            {loading ?
                <Spin />
            : !!result ?
                <div className={styles.body}>
                    <div className={styles.tools}>
                        <IconButton
                            tooltip={t('refresh')}
                            // size="small"
                            className={styles.refresh}
                            onClick={() => {
                                // loadKeys()
                                loadData()
                            }}
                        >
                            <ReloadOutlined />
                        </IconButton>
                    </div>

                    <div className={styles.dataList}>
                        <div className={styles.item}>
                            <div className={styles.key}>{t('ssh.memory')}</div>
                            <div className={styles.value}>
                                {/* {result.memoryPercent}% */}
                                <CircleProgress
                                    className={styles.bigProgress}
                                    percent={result.memoryPercent}
                                    width={48}
                                />
                            </div>
                        </div>
                        <div className={styles.item}>
                            <div className={styles.key}>CPU
                                <div className={styles.tag}>{result.cpuinfo} {t('ssh.cores')}</div>
                            </div>
                            <div className={styles.value}>
                                {/* {result.cpuUsage}% */}
                                <CircleProgress
                                    className={styles.bigProgress}
                                    percent={result.cpuUsage}
                                    width={48}
                                />
                            </div>
                        </div>
                        <div className={classNames(styles.item, styles.loadSvgItem)}>
                            <div className={styles.key}>{t('ssh.load_avg')}</div>
                            <div className={styles.value}>
                                <Space>
                                    <div className={styles.circles}>
                                        <div className={styles.layer}>
                                            <CircleProgress
                                                className={styles.bigProgress}
                                                percent={Math.floor(result.loadavg.nums[2] / result.cpuinfo * 100)}
                                                width={48}
                                                format={() => ''}
                                            />
                                        </div>
                                        <div className={styles.layer}>
                                            <CircleProgress
                                                className={styles.bigProgress}
                                                percent={Math.floor(result.loadavg.nums[1] / result.cpuinfo * 100)}
                                                width={32}
                                                format={() => ''}
                                            />
                                        </div>
                                        <div className={styles.layer}>
                                            <CircleProgress
                                                className={styles.bigProgress}
                                                percent={Math.floor(result.loadavg.nums[0] / result.cpuinfo * 100)}
                                                width={16}
                                                format={() => ''}
                                            />
                                        </div>
                                    </div>
                                    {result.loadavg.text}
                                </Space>
                            </div>
                        </div>

                        

                        <div className={styles.item}>
                            <div className={styles.key}>{t('ssh.disk')}</div>
                            <div className={styles.value}>
                                {result.disks.length > 0 ?
                                    <div className={styles.disks}>
                                        {result.disks.map(disk => {
                                            return (
                                                <div className={styles.item}>
                                                    <div className={styles.name}>{disk.name}</div>
                                                    <LineProgress
                                                        className={styles.progress} 
                                                        percent={disk.percent} 
                                                        size="small" />
                                                </div>
                                            )
                                        })}
                                    </div>
                                :
                                    <div>--</div>
                                }
                            </div>
                        </div>
                        <div className={styles.item}>
                            <div className={styles.key}>{t('ssh.uptime')}</div>
                            <div className={styles.value}>
                                {result.uptime}
                            </div>
                        </div>
                    </div>
                    {/* <div className={styles.infoBox}>{result.version}</div>
                    <div className={styles.processBox}>
                        <Table
                            dataSource={result.processes}
                            columns={[
                                {
                                    title: '进程',
                                    dataIndex: 'PID',
                                    width: 160,
                                    sorter: (a, b) => a.PID - b.PID,
                                },
                                {
                                    title: 'CPU',
                                    dataIndex: 'CPU',
                                    width: 80,
                                    sortDirections: ['descend', 'ascend'],
                                    sorter: (a, b) => a.CPU - b.CPU,
                                },
                                {
                                    title: '内存',
                                    dataIndex: 'MEM',
                                    width: 80,
                                    sortDirections: ['descend', 'ascend'],
                                    sorter: (a, b) => a.MEM - b.MEM,
                                },
                                {
                                    title: '命令',
                                    dataIndex: 'COMMAND',
                                },
                            ]}
                            size="small"
                            scroll={{
                                y: 400,
                            }}
                            pagination={false}
                        />
                    </div> */}
                </div>
            :
                <div>error</div>
            }
        </div>
    )
}

function DashboardModal({ config, onCancel, dashboarItems }) {
    const { t } = useTranslation()

    return (
        <Drawer
            open={true}
            title={t('monitor')}
            width={840}
            // onCancel={onCancel}
            onClose={onCancel}
            footer={null}
        >
            <div className={styles.items}>
                {dashboarItems.map(item => {
                    return (
                        <div className={styles.item}>
                            <div className={styles.serverName}>{item.name}</div>
                            <MonitorItem
                                item={item}
                                config={config}
                            />
                        </div>
                    )
                })}
            </div>
            {/* 212 */}
        </Drawer>
    )
}