import React, { useEffect, useRef, useState } from 'react'

import styles from './docker.module.less'
import classNames from 'classnames'
import { Button, Drawer, Empty, Input, message, Modal, Popover, Radio, Space, Table, Tabs, Tag } from 'antd'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import storage from '../db-manager/storage'
import { AppstoreOutlined, SettingOutlined, ToolOutlined } from '@ant-design/icons'
import { FullCenterBox } from '../common/full-center-box'
import { getGlobalConfig } from '@/config'
import { request } from '../db-manager/utils/http'
import { render } from 'react-dom'
import moment from 'moment'
import TimeAgo from 'javascript-time-ago'
// English.
import en from 'javascript-time-ago/locale/en'
import { SearchUtil } from '@/utils/search'
import filesize from 'file-size'
import copy from 'copy-to-clipboard'
import { lastSplit } from '@/utils/helper'

TimeAgo.addDefaultLocale(en)
const timeAgo = new TimeAgo('en-US')

function parsePercent(percent: string) {
    return parseFloat(percent.replace('%', ''))
}

function parseSize(size: string) {
    let numWithUnit = size
    if (size.includes('/')) {
        numWithUnit = size.split('/')[0].trim()
    }
    let scale = 1
    let unit = 'B'
    const units = [
        {
            unit: 'GiB',
            scale: 1024 * 1024 * 1024,
        },
        {
            unit: 'GB',
            scale: 1000 * 1000 * 1000
        },
        {
            unit: 'MiB',
            scale: 1024 * 1024,
        },
        {
            unit: 'MB',
            scale: 1000 * 1000,
        },
        {
            unit: 'KiB',
            scale: 1024,
        },
        {
            unit: 'KB',
            scale: 1000,
        },
    ]
    for (let item of units) {
        if (numWithUnit.includes(item.unit)) {
            unit = item.unit
            scale = item.scale
            break
        }
    }
    let num = 0
    const m = numWithUnit.match(/[\d.]+/)
    if (m) {
        num = parseFloat(m[0])
    }
    return num * scale
}

function TimeAgoCellRender(value) {
    if (!value) {
        return <div>--</div>
    }
    let m
    if (typeof value == 'number') {
        m = moment(new Date(value * 1000))
    }
    else {
        m = moment(value)
    }
    const time = m.format('YYYY-MM-DD HH:mm:ss')
    const ago = timeAgo.format(m.toDate())
    return (
        <div>
            {time}
            <Tag>{ago}</Tag>
        </div>
    )
}

function StatsTab({ config, connectionId }) {
    const { t } = useTranslation()
    const [pluginLoading, setPluginLoading] = useState(false)
    const [plugins, setPlugins] = useState([])
    const [pluginKeyword, setPluginKeyword] = useState('')
    const filteredPlugins = useMemo(() => {
        return SearchUtil.search(plugins, pluginKeyword, {
            attributes: ['Id', 'Name'],
        })
    }, [plugins, pluginKeyword])


    useEffect(() => {
        loadPlugins()
    }, [connectionId])

    async function loadPlugins() {
        // setPlugins([
        //     {
        //         "BlockIO": "119kB / 4.1kB",
        //         "CPUPerc": "1.00%",
        //         "Container": "445ee427b18a",
        //         "ID": "445ee427b18a",
        //         "MemPerc": "4.00%",
        //         "MemUsage": "947.1MiB / 15GiB",
        //         "Name": "test-1",
        //         "NetIO": "136GB / 260GB",
        //         "PIDs": "2"
        //     },
        //     {
        //         "BlockIO": "0B / 44.8MB",
        //         "CPUPerc": "2.00%",
        //         "Container": "78bba52a4b10",
        //         "ID": "78bba52a4b10",
        //         "MemPerc": "6.00%",
        //         "MemUsage": "174.8MiB / 15GiB",
        //         "Name": "test-2",
        //         "NetIO": "75.8GB / 63.6GB",
        //         "PIDs": "23"
        //     },
        //     {
        //         "BlockIO": "0B / 44.8MB",
        //         "CPUPerc": "3.00%",
        //         "Container": "9170fb36b808",
        //         "ID": "9170fb36b808",
        //         "MemPerc": "5.00%",
        //         "MemUsage": "196.7MiB / 15GiB",
        //         "Name": "test-3",
        //         "NetIO": "75.8GB / 63.6GB",
        //         "PIDs": "23"
        //     }
        // ])
        // return

        setPlugins([])
        setPluginLoading(true)
        let res = await request.post(`${config.host}/docker/stats`, {
            connectionId,
        })
        setPluginLoading(false)
        if (res.success) {
            const list = res.data.list
                // .sort((a, b) => a.Name.localeCompare(b.Name))
                setPlugins(list)
        }
    }

    return (
        <div>
            <div className={styles.filterBox}>
                {/* <Input
                    className={styles.keyword}
                    placeholder={t('filter')}
                    value={pluginKeyword}
                    allowClear
                    onChange={e => {
                        setPluginKeyword(e.target.value)
                    }}
                /> */}
                <Button
                    size="small"
                    onClick={loadPlugins}
                >
                    {t('refresh')}
                </Button>
            </div>
            <Table
                loading={pluginLoading}
                dataSource={filteredPlugins}
                size="small"
                pagination={false}
                columns={[
                    {
                        title: t('Container ID'),
                        dataIndex: 'ID',
                        ellipsis: true,
                        width: 120,
                    },
                    {
                        title: t('Name'),
                        dataIndex: 'Name',
                        ellipsis: true,
                        width: 240,
                    },
                    // {
                    //     title: t('Container'),
                    //     dataIndex: 'Container',
                    //     ellipsis: true,
                    //     width: 120,
                    // },
                    {
                        title: t('CPU %'),
                        dataIndex: 'CPUPerc',
                        ellipsis: true,
                        width: 100,
                        sorter: (a, b) => parsePercent(a.CPUPerc) - parsePercent(b.CPUPerc),
                        sortDirections: ['descend'],
                    },
                    {
                        title: t('Mem Usage / Limit'),
                        dataIndex: 'MemUsage',
                        ellipsis: true,
                        width: 160,
                        sorter: (a, b) => parseSize(a.MemUsage) - parseSize(b.MemUsage),
                        sortDirections: ['descend'],
                    },
                    {
                        title: t('Mem %'),
                        dataIndex: 'MemPerc',
                        ellipsis: true,
                        width: 100,
                        sorter: (a, b) => parsePercent(a.MemPerc) - parsePercent(b.MemPerc),
                        sortDirections: ['descend'],
                    },
                    {
                        title: t('Net I/O'),
                        dataIndex: 'NetIO',
                        ellipsis: true,
                        width: 160,
                    },
                    {
                        title: t('Block I/O'),
                        dataIndex: 'BlockIO',
                        width: 140,
                        ellipsis: true,
                    },
                    {
                        title: t('PIDs'),
                        dataIndex: 'PIDs',
                        ellipsis: true,
                        // width: 120,
                    },
                    // {
                    //     title: t('enabled'),
                    //     dataIndex: ['Enabled'],
                    //     render(value) {
                    //         return (
                    //             <div>
                    //                 <Tag
                    //                     color={value ? 'green' : 'red'}
                    //                 >
                    //                     {value ? '是' : '否'}
                    //                 </Tag>
                    //             </div>
                    //         )
                    //     },
                    // },
                ]}
            />
        </div>
    )
}

function PluginTab({ config, connectionId }) {
    const { t } = useTranslation()
    const [pluginLoading, setPluginLoading] = useState(false)
    const [plugins, setPlugins] = useState([])
    const [pluginKeyword, setPluginKeyword] = useState('')
    const filteredPlugins = useMemo(() => {
        return SearchUtil.search(plugins, pluginKeyword, {
            attributes: ['Id', 'Name'],
        })
    }, [plugins, pluginKeyword])


    useEffect(() => {
        loadPlugins()
    }, [])

    async function loadPlugins() {
        setPlugins([])
        setPluginLoading(true)
        let res = await request.post(`${config.host}/docker/plugins`, {
            connectionId,
        })
        setPluginLoading(false)
        if (res.success) {
            const list = res.data.list
                .sort((a, b) => a.Name.localeCompare(b.Name))
                setPlugins(list)
        }
    }

    return (
        <div>
            <div className={styles.filterBox}>
                <Input
                    className={styles.keyword}
                    placeholder={t('filter')}
                    value={pluginKeyword}
                    allowClear
                    onChange={e => {
                        setPluginKeyword(e.target.value)
                    }}
                />
            </div>
            <Table
                loading={pluginLoading}
                dataSource={filteredPlugins}
                size="small"
                pagination={false}
                columns={[
                    {
                        title: t('id'),
                        dataIndex: 'Id',
                        width: 120,
                        ellipsis: true,
                    },
                    {
                        title: t('name'),
                        dataIndex: 'Name',
                        ellipsis: true,
                        width: 280,
                    },
                    {
                        title: t('enabled'),
                        dataIndex: ['Enabled'],
                        render(value) {
                            return (
                                <div>
                                    <Tag
                                        color={value ? 'green' : 'red'}
                                    >
                                        {value ? '是' : '否'}
                                    </Tag>
                                </div>
                            )
                        },
                    },
                ]}
            />
        </div>
    )
}

export function DockerDetail({ connection }) {
    const { t } = useTranslation()
    const config = getGlobalConfig()

    const [version, setVersion] = useState(null)


    const [containerLoading, setContainerLoading] = useState(false)
    const [containers, setContainers] = useState([])
    const [containerKeyword, setContainerKeyword] = useState('')
    const [containerType, setContainerType] = useState('running')
    const [containerNs, setContainerNs] = useState('')
    const [containerDetailVisible, setContainerDetailVisible] = useState(false)
    const [containerDetailItem, setContainerDetailItem] = useState(null)
    const containerNamespaces = useMemo(() => {
        const set = new Set()
        for (let container of containers) {
            if (container.Labels['com.docker.stack.namespace']) {
                set.add(container.Labels['com.docker.stack.namespace'])
            }
        }
        return Array.from(set)
    }, [containers])
    console.log('namespaces', containerNamespaces)


    const [imageLoading, setImageLoading] = useState(false)
    const [_images, setImages] = useState([])
    const [imageKeyword, setImageKeyword] = useState('')

    const [serviceLoading, setServiceLoading] = useState(false)
    const [_services, setServices] = useState([])
    const [serviceKeyword, setServiceKeyword] = useState('')
    const [serviceNs, setServiceNs] = useState('')
    const serviceNamespaces = useMemo(() => {
        const set = new Set()
        for (let service of _services) {
            if (service.Spec?.Labels?.['com.docker.stack.namespace']) {
                set.add(service.Spec.Labels['com.docker.stack.namespace'])
            }
        }
        return Array.from(set)
    }, [_services])
    const filteredServices = useMemo(() => {
        let _list = SearchUtil.search(_services, serviceKeyword, {
            attributes: ['ID', '_name'],
            // dataIndex: ['Spec', 'Name'],
        })
        if (serviceNs) {
            _list = _list.filter(item => item.Spec?.Labels?.['com.docker.stack.namespace'] == serviceNs)
        }
        return _list
    }, [_services, serviceKeyword, serviceNs])

    

    const [networkLoading, setNetworkLoading] = useState(true)
    const [_networks, setNetworks] = useState([])

    const [volumeLoading, setVolumeLoading] = useState([])
    const [volumes, setVolumes] = useState([])
    const [volumeDetailVisible, setVolumeDetailVisible] = useState(false)
    const [volumeDetailItem, setVolumeDetailItem] = useState(null)

    const [tab, setTab] = useState('container')

    const filteredContainers = useMemo(() => {
        let _list = containers
        if (containerType == 'running') {
            _list = containers.filter(item => item.running)
        }
        _list = SearchUtil.search(_list, containerKeyword, {
            attributes: ['Id', '_names', '_ports'],
        })
        if (containerNs) {
            _list = _list.filter(item => item.Labels['com.docker.stack.namespace'] == containerNs)
        }
        return _list
    }, [containers, containerKeyword, containerType, containerNs])

    

    
    const connectionId = connection.id

    useEffect(() => {
        loadAll()
    }, [connectionId])

    const networks = useMemo(() => {
        return _networks.map(network => {
            const fItems = _services.filter(c => c.Endpoint.VirtualIPs.find(it => it.NetworkID == network.Id))
            return {
                ...network,
                isUsed: fItems.length > 0,
                services: fItems.map(item => item._name)
            }
        })
    }, [_networks, _services])

    const images = useMemo(() => {
        return _images.map(image => {
            const fItem = containers.find(c => c.ImageID == image.Id)
            return {
                ...image,
                isUsed: !!fItem,
            }
        })
    }, [_images, containers])
    const filteredImages = useMemo(() => {
        return SearchUtil.search(images, imageKeyword, {
            attributes: ['Id', '_repoTags'],
        })
    }, [images, imageKeyword])

    const services = useMemo(() => {
        return _services.map(item => {
            return {
                ...item,
            }
        })
    }, [_services, networks])

    async function loadContainers() {
        setContainers([])
        setContainerLoading(true)
        let res = await request.post(`${config.host}/docker/container/list`, {
            connectionId,
        })
        console.log('res', res)
        setContainerLoading(false)
        if (res.success) {
            setContainers(res.data.list.map(item => {
                let _names = ''
                if (item.Names) {
                    _names = item.Names.join(', ')
                }
                let _ports = (item.Ports || []).map(port => `${port.PublicPort || ''}-${port.PrivatePort || ''}`)
                return {
                    ...item,
                    _names,
                    _ports,
                    running: item.Status?.includes('Up') ? true : false,
                }
            }))
        }
    }

    async function loadImages() {
        setImageLoading(true)
        setImages([])
        let res = await request.post(`${config.host}/docker/images`, {
            connectionId,
        })
        console.log('res', res)
        setImageLoading(false)
        if (res.success) {
            setImages(res.data.list.map(item => {
                let _repoTags = ''
                if (item.RepoTags) {
                    _repoTags = item.RepoTags.join(';')
                }
                return {
                    ...item,
                    _repoTags,
                }
            }))
        }
    }

    async function loadServices() {
        setServiceLoading(true)
        setServices([])
        let res = await request.post(`${config.host}/docker/services`, {
            connectionId,
        })
        console.log('res', res)
        if (res.success) {
            const list = res.data.list
                .map(item => {
                    let _name = ''
                    if (item.Spec?.Name) {
                        _name = item.Spec.Name
                    }
                    return {
                        _name,
                        ...item,
                    }
                })
                .sort((a, b) => a.Spec.Name.localeCompare(b.Spec.Name))
            setServices(list)
        }
        setServiceLoading(false)
    }

    async function loadVersion() {
        let res = await request.post(`${config.host}/docker/version`, {
            connectionId,
        })
        if (res.success) {
            setVersion(res.data)
        }
    }

    // async function loadConfigs() {
    //     let res = await request.post(`${config.host}/docker/config/list`, {
    //         connectionId,
    //     })
    //     if (res.success) {
    //     }
    // }

    async function loadNetworks() {
        setNetworkLoading(true)
        setNetworks([])
        let res = await request.post(`${config.host}/docker/networks`, {
            connectionId,
        })
        console.log('res', res)
        setNetworkLoading(false)
        if (res.success) {
            setNetworks(res.data.list)
        }
    }

    async function loadVolumes() {
        setVolumeLoading(true)
        setVolumes([])
        let res = await request.post(`${config.host}/docker/volumes`, {
            connectionId,
        })
        setVolumeLoading(false)
        console.log('res', res)
        if (res.success) {
            setVolumes(res.data.list.Volumes)
        }
    }

    async function stopItem(item) {
        let res = await request.post(`${config.host}/docker/container/stop`, {
            connectionId,
            id: item.Id,
        })
        console.log('res', res)
        if (res.success) {
            loadContainers()
        }
    }

    async function startItem(item) {
        let res = await request.post(`${config.host}/docker/container/start`, {
            connectionId,
            id: item.Id,
        })
        console.log('res', res)
        if (res.success) {
            loadContainers()
        }
    }

    async function removeItem(item) {
        Modal.confirm({
            content: `${t('delete_confirm')} ${item.Id}?`,
            okButtonProps: {
                danger: true,
            },
            async onOk() {
                let res = await request.post(`${config.host}/docker/container/remove`, {
                    connectionId,
                    id: item.Id,
                })
                console.log('res', res)
                if (res.success) {
                    loadContainers()
                }
            }
        })
    }

    async function removeNetwork(item) {
        Modal.confirm({
            content: `${t('delete_confirm')} ${item.Name}?`,
            async onOk() {
                let res = await request.post(`${config.host}/docker/network/remove`, {
                    connectionId,
                    id: item.Name,
                })
                console.log('res', res)
                if (res.success) {
                    loadNetworks()
                }
            }
        })
    }

    async function removeService(item) {
        Modal.confirm({
            content: `${t('delete_confirm')} ${item.Spec.Name}?`,
            async onOk() {
                let res = await request.post(`${config.host}/docker/service/remove`, {
                    connectionId,
                    id: item.ID,
                })
                console.log('res', res)
                if (res.success) {
                    loadServices()
                }
            }
        })
    }

    async function removeVolume(item) {
        Modal.confirm({
            content: `${t('delete_confirm')} ${item.Name}?`,
            async onOk() {
                let res = await request.post(`${config.host}/docker/volume/remove`, {
                    connectionId,
                    id: item.Name,
                })
                console.log('res', res)
                if (res.success) {
                    loadVolumes()
                }
            }
        })
    }
    
    async function removeImage(item) {
        Modal.confirm({
            content: `${t('delete_confirm')} ${item.Id}?`,
            async onOk() {
                let res = await request.post(`${config.host}/docker/image/remove`, {
                    connectionId,
                    id: item.Id,
                    // id: item.Id.replace('sha256:', ''),
                    // id: item.RepoTags[0],
                })
                console.log('res', res)
                if (res.success) {
                    loadImages()
                }
            }
        })
    }
    
    function loadAll() {
        loadContainers()
        loadImages()
        loadServices()
        loadNetworks()
        loadVolumes()
        // loadConfigs()
        loadVersion()
    }

    const volumeTab = (
        <div>
            {/* <div>volumes</div> */}
            <Table
                loading={volumeLoading}
                dataSource={volumes}
                pagination={false}
                size="small"
                columns={[
                    {
                        title: t('docker.driver'),
                        dataIndex: 'Driver',
                        width: 80,
                        ellipsis: true,
                    },
                    {
                        title: ('name'),
                        dataIndex: 'Name',
                        width: 240,
                        ellipsis: true,
                    },
                    {
                        title: t('docker.mountpoint'),
                        dataIndex: 'Mountpoint',
                        // width: 120,
                    },
                    {
                        title: t('docker.created'),
                        dataIndex: 'CreatedAt',
                        width: 200,
                        render: TimeAgoCellRender,
                    },
                    {
                        title: t('actions'),
                        dataIndex: '__actions',
                        render(_value, item) {
                            return (
                                <div>
                                    <Space>
                                        <Button
                                            size="small"
                                            onClick={() => {
                                                setVolumeDetailItem(item)
                                                setVolumeDetailVisible(true)
                                            }}
                                        >
                                            {t('view')}
                                        </Button>
                                        <Button
                                            size="small"
                                            danger
                                            onClick={() => {
                                                removeVolume(item)
                                            }}
                                        >
                                            {t('remove')}
                                        </Button>
                                    </Space>
                                </div>
                            )
                        }
                    },
                ]}
            />
        </div>
    )

    const networkTab = (
        <div>
            <Table
                loading={networkLoading}
                dataSource={networks}
                pagination={false}
                size="small"
                columns={[
                    {
                        title: t('id'),
                        dataIndex: 'Id',
                        width: 160,
                        ellipsis: true,
                    },
                    {
                        title: t('name'),
                        dataIndex: 'Name',
                        width: 200,
                        ellipsis: true,
                    },
                    {
                        title: t('docker.used'),
                        dataIndex: 'isUsed',
                        width: 364,
                        render(value, item) {
                            return (
                                <div>
                                    {value ? <Tag color="green">{t('docker.in_use')}</Tag> : ''}
                                    {value &&
                                        <div>
                                            {item.services.map(name => {
                                                return (
                                                    <div>{name}</div>
                                                )
                                            })}
                                        </div>
                                    }
                                </div>
                            )
                        }
                    },
                    {
                        title: t('docker.driver'),
                        dataIndex: 'Driver',
                        width: 80,
                        ellipsis: true,
                    },
                    {
                        title: t('docker.ip'),
                        dataIndex: 'IPAM',
                        // width: 100,
                        ellipsis: true,
                        render(value) {
                            const { Config = []} = value
                            return (
                                <div>
                                    {Config.map(item => {
                                        return (
                                            <div>
                                                <Tag>Gateway: {item.Gateway}</Tag>
                                                <div>
                                                    <Tag>Subnet: {item.Subnet}</Tag>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                        }
                    },
                    {
                        title: t('docker.scope'),
                        dataIndex: 'Scope',
                        width: 100,
                        ellipsis: true,
                    },
                    {
                        title: t('docker.created'),
                        dataIndex: 'Created',
                        width: 180,
                        render: TimeAgoCellRender,
                    },
                    {
                        title: t('actions'),
                        dataIndex: '__actions',
                        render(_value, item) {
                            return (
                                <div>
                                    <Button
                                        size="small"
                                        danger
                                        onClick={() => {
                                            removeNetwork(item)
                                        }}
                                    >
                                        {t('remove')}
                                    </Button>
                                </div>
                            )
                        }
                    },
                ]}
            />
        </div>
    )

    const serviceTab = (
        <div>
            <div className={styles.filterBox}>
                <Input
                    className={styles.keyword}
                    placeholder={t('filter')}
                    value={serviceKeyword}
                    allowClear
                    onChange={e => {
                        setServiceKeyword(e.target.value)
                    }}
                />
                {serviceNamespaces.length > 1 &&
                    <Radio.Group
                        value={serviceNs}
                        onChange={(e) => setServiceNs(e.target.value)}
                    >
                        <Radio.Button value="">all</Radio.Button>
                        {serviceNamespaces.map(ns => {
                            return (
                                <Radio.Button value={ns}>{ns}</Radio.Button>
                            )
                        })}
                    </Radio.Group>
                }
            </div>
            <Table
                loading={serviceLoading}
                dataSource={filteredServices}
                size="small"
                pagination={false}
                columns={[
                    {
                        title: t('id'),
                        dataIndex: 'ID',
                        width: 120,
                        ellipsis: true,
                    },
                    {
                        title: t('name'),
                        dataIndex: ['Spec', 'Name'],
                        ellipsis: true,
                        width: 280,
                        render(value) {
                            return (
                                <div
                                    className={styles.serviceNameCell}
                                    onClick={() => {
                                        copy(value)
                                        message.info(t('copied'))
                                    }}
                                >
                                    {value}
                                </div>
                            )
                        }
                    },
                    {
                        title: t('docker.mode'),
                        dataIndex: ['Spec', 'Mode'],
                        ellipsis: true,
                        width: 120,
                        render(value) {
                            if (!value) {
                                return <div>--</div>
                            }
                            if (value.Global) {
                                return <div>global</div>
                            }
                            if (value.Replicated) {
                                return (
                                    <Space>
                                        replicated
                                        <Tag>{value.Replicated.Replicas}</Tag>
                                    </Space>
                                )
                            }
                            return (
                                <div>--</div>
                            )
                        }
                    },
                    {
                        title: t('labels'),
                        dataIndex: 'Spec',
                        width: 80,
                        render(value = {}) {
                            const labelMap = value.Labels || {}
                            const labels = []
                            for (let key in labelMap) {
                                labels.push({
                                    key,
                                    value: labelMap[key],
                                })
                            }
                            return (
                                <div>
                                    <Popover
                                        title="属性"
                                        content={(
                                            <div className={styles.labels}>
                                                {labels.map(item => {
                                                    return (
                                                        <div className={styles.item}>
                                                            <Tag>{item.key}</Tag>
                                                            <div>{item.value}</div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    >
                                        <Tag>{labels.length}</Tag>
                                    </Popover>
                                </div>
                            )
                        }
                    },
                    {
                        title: t('docker.image'),
                        dataIndex: ['Spec', 'Labels', 'com.docker.stack.image'],
                        width: 320,
                        // width: 180,
                        // render: TimeAgoCellRender,
                        render(value) {
                            if (!value) {
                                return <div>--</div>
                            }
                            return (
                                <div>{value}</div>
                            )
                        }
                    },
                    {
                        title: t('docker.ports'),
                        dataIndex: ['Endpoint', 'Ports'],
                        width: 320,
                        // width: 180,
                        // render: TimeAgoCellRender,
                        render(value) {
                            if (!value) {
                                return <div>--</div>
                            }
                            return (
                                <Popover
                                    title="详情信息"
                                    placement="topLeft"
                                    content={
                                        <div>
                                            {value.map(item => {
                                                return (
                                                    <div>
                                                        *:{item.PublishedPort}{'->'}{item.TargetPort}/{item.Protocol}
                                                        <Tag>{item.PublishMode}</Tag>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    }
                                >
                                    <div>
                                        {value.map(item => {
                                            return `*:${item.PublishedPort}->${item.TargetPort}/${item.Protocol}`
                                        }).join(', ')}
                                    </div>
                                </Popover>
                            )
                        }
                    },
                    {
                        title: t('docker.created'),
                        dataIndex: ['CreatedAt'],
                        // width: 320,
                        width: 180,
                        render: TimeAgoCellRender,
                    },
                    {
                        title: t('actions'),
                        dataIndex: '__actions',
                        render(_value, item) {
                            return (
                                <div>
                                    <Button
                                        size="small"
                                        danger
                                        onClick={() => {
                                            removeService(item)
                                        }}
                                    >
                                        {t('remove')}
                                    </Button>
                                </div>
                            )
                        }
                    },
                ]}
            />
        </div>
    )

    const containerTab = (
        <div>
            <div className={styles.filterBox}>
                <Input
                    className={styles.keyword}
                    placeholder={t('filter')}
                    value={containerKeyword}
                    allowClear
                    onChange={e => {
                        setContainerKeyword(e.target.value)
                    }}
                />
                <Radio.Group
                    value={containerType}
                    onChange={(e) => setContainerType(e.target.value)}
                >
                    <Radio.Button value="all">all</Radio.Button>
                    <Radio.Button value="running">running</Radio.Button>
                </Radio.Group>
                {containerNamespaces.length > 1 &&
                    <Radio.Group
                        value={containerNs}
                        onChange={(e) => setContainerNs(e.target.value)}
                    >
                        <Radio.Button value="">all</Radio.Button>
                        {containerNamespaces.map(ns => {
                            return (
                                <Radio.Button value={ns}>{ns}</Radio.Button>
                            )
                        })}
                    </Radio.Group>
                }
            </div>
            <Table
                loading={containerLoading}
                dataSource={filteredContainers}
                size="small"
                pagination={false}
                columns={[
                    {
                        title: t('id'),
                        dataIndex: 'Id',
                        width: 160,
                        ellipsis: true,
                        render(value) {
                            return (
                                <div
                                    className={styles.containerIdCell}
                                    onClick={() => {
                                        copy(value.substring(0, 6))
                                        message.info(t('copied'))
                                    }}
                                >
                                    {value}
                                </div>
                            )
                        }
                    },
                    {
                        title: t('type'),
                        // dataIndex: 'Command',
                        width: 80,
                        ellipsis: true,
                        render(_, item) {
                            if (item.Image.includes('mysql')) {
                                return <div>MySQL</div>
                            }
                            if (item.Image.includes('kafka')) {
                                return <div>Kafka</div>
                            }
                            if (item.Image.includes('redis')) {
                                return <div>Redis</div>
                            }
                            if (item.Image.includes('mongo')) {
                                return <div>Mongo</div>
                            }
                            return <div></div>
                        }
                    },
                    {
                        title: t('docker.names'),
                        dataIndex: 'Names',
                        render(value, item) {
                            let showName = value.join(', ')
                            if (item.Labels) {
                                const taskName = item.Labels['com.docker.swarm.task.name']
                                if (taskName?.includes('.')) {
                                    const [prefix] = lastSplit(taskName, '.')
                                    showName = prefix
                                }
                            }
                            // {projectName}_{serviceName}.1.rcrpdj5drusfyic3s0q70mzxl
                            // {projectName}_{serviceName}.jgj0cddykbgvoa2uxeatd1v6e.inq0tv3bc6eu8whp9do8idb8z
                            
                            return (
                                <div
                                    className={styles.nameLink}
                                    onClick={() => {
                                        setContainerDetailVisible(true)
                                        setContainerDetailItem(item)
                                        console.log('item/', item)
                                    }}
                                >
                                    {showName}
                                </div>
                            )
                        }
                    },
                    // {
                    //     title: t('docker.image'),
                    //     dataIndex: 'Image',
                    //     render(value) {
                    //         return (
                    //             <div className={styles.cellTwoRow}>{value}</div>
                    //         )
                    //     }
                    // },
                    // {
                    //     title: t('command'),
                    //     dataIndex: 'Command',
                    //     width: 220,
                    //     ellipsis: true,
                    // },
                    {
                        title: t('labels'),
                        dataIndex: 'Labels',
                        width: 80,
                        // ellipsis: true,
                        render(labelMap = {}) {
                            const labels = []
                            for (let key in labelMap) {
                                labels.push({
                                    key,
                                    value: labelMap[key],
                                })
                            }
                            return (
                                <div>
                                    <Popover
                                        title="属性"
                                        content={(
                                            <div className={styles.labels}>
                                                {labels.map(item => {
                                                    return (
                                                        <div className={styles.item}>
                                                            <Tag>{item.key}</Tag>
                                                            <div>{item.value}</div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    >
                                        <Tag>{labels.length}</Tag>
                                    </Popover>
                                </div>
                            )
                        }
                    },
                    {
                        title: t('status'),
                        dataIndex: 'Status',
                        width: 160,
                        render(value) {
                            let color
                            if (value?.includes('Up')) {
                                color = 'green'
                            }
                            else if (value?.includes('Exited')) {
                                color = 'red'
                            }
                            return (
                                <div style={{ color }}>{value}</div>
                            )
                        }
                    },
                    {
                        title: t('docker.ports'),
                        dataIndex: 'Ports',
                        width: 220,
                        render(value) {
                            if (!value?.length) {
                                return '--'
                            }
                            return (
                                <div className={styles.portsCell}>{value.map(port => {
                                    if (!port.PublicPort) {
                                        return `${port.PrivatePort}/${port.Type}`    
                                    }
                                    return `${port.IP}:${port.PublicPort}->${port.PrivatePort}/${port.Type}`
                                }).join(', ')}</div>
                            )
                        }
                    },
                    {
                        title: t('docker.created'),
                        dataIndex: 'Created',
                        width: 180,
                        render: TimeAgoCellRender,
                    },
                    {
                        title: t('actions'),
                        dataIndex: 'Names',
                        render(value, item) {
                            return (
                                <div>
                                    <Space>
                                        {item.Status?.includes('Up') ?
                                            <Button
                                                size="small"
                                                danger
                                                onClick={() => {
                                                    stopItem(item)
                                                }}
                                            >
                                                {t('docker.stop')}
                                            </Button>
                                        :
                                            <Button
                                                size="small"
                                                type="primary"
                                                onClick={() => {
                                                    startItem(item)
                                                }}
                                            >
                                                {t('docker.start')}
                                            </Button>
                                        }
                                        {item.Status?.includes('Exited') &&
                                            <Button
                                                size="small"
                                                danger
                                                onClick={() => {
                                                    removeItem(item)
                                                }}
                                            >
                                                {t('remove')}
                                            </Button>
                                        }
                                    </Space>
                                </div>
                            )
                        }
                    },
                ]}
            />

        </div>
    )

    const imageTab = (
        <div>
            <div className={styles.filterBox}>
                <Input
                    className={styles.keyword}
                    placeholder={t('filter')}
                    value={imageKeyword}
                    allowClear
                    onChange={e => {
                        setImageKeyword(e.target.value)
                    }}
                />
            </div>
            <Table
                loading={imageLoading}
                dataSource={filteredImages}
                size="small"
                pagination={false}
                columns={[
                    {
                        title: t('id'),
                        dataIndex: 'Id',
                        width: 240,
                        ellipsis: true,
                    },
                    {
                        title: t('docker.repo_tags'),
                        dataIndex: 'RepoTags',
                        render(value, item) {
                            if (!value) {
                                return <div>--</div>
                            }
                            return (
                                <div>
                                    <Space>
                                        {value.join(', ')}
                                        {/* {item.isUsed &&
                                            <Tag color="green">{t('docker.in_use')}</Tag>
                                        } */}
                                    </Space>
                                </div>
                            )
                        }
                    },
                    {
                        title: t('docker.used'),
                        dataIndex: 'isUsed',
                        width: 80,
                        render(value, item) {
                            return (
                                <div>
                                    <Space>
                                        {item.isUsed &&
                                            <Tag color="green">{t('docker.in_use')}</Tag>
                                        }
                                    </Space>
                                </div>
                            )
                        }
                    },
                    {
                        title: t('size'),
                        dataIndex: 'Size',
                        width: 100,
                        render(value) {
                            return filesize(value, { fixed: 1, }).human()
                        },
                    },
                    {
                        title: t('docker.created'),
                        dataIndex: 'Created',
                        width: 180,
                        render: TimeAgoCellRender,
                    },
                    {
                        title: t('actions'),
                        dataIndex: 'Names',
                        render(value, item) {
                            return (
                                <div>
                                    <Space>
                                        <Button
                                            size="small"
                                            danger
                                            onClick={() => {
                                                removeImage(item)
                                            }}
                                        >
                                            {t('remove')}
                                        </Button>
                                    </Space>
                                </div>
                            )
                        }
                    },
                ]}
            />
        </div>
    )

    return (
        <div className={styles.dockerDetail}>
            <Space>
                <Button
                    size="small"
                    onClick={loadAll}
                >
                    {t('refresh')}
                </Button>
                {!!version &&
                    <div>
                        v{version.Version}
                    </div>
                }
            </Space>
            <Tabs
                activeKey={tab}
                onChange={key => {
                    setTab(key)
                }}
                items={[
                    {
                        key: 'container',
                        label: t('docker.container'),
                    },
                    {
                        key: 'service',
                        label: t('docker.service'),
                    },
                    {
                        key: 'network',
                        label: t('docker.network'),
                    },
                    {
                        key: 'image',
                        label: t('docker.images'),
                    },
                    {
                        key: 'volume',
                        label: t('docker.volume'),
                    },
                    {
                        key: 'plugin',
                        label: t('docker.plugin'),
                    },
                    {
                        key: 'stats',
                        label: t('docker.stats'),
                    },
                ]}
            />
            <div>
                {tab == 'volume' &&
                    <div>
                        {volumeTab}
                    </div>
                }
                {tab == 'network' &&
                    <div>
                        {networkTab}
                    </div>
                }
                {tab == 'service' &&
                    <div>
                        {serviceTab}
                    </div>
                }
                {tab == 'container' &&
                    <div>
                        {containerTab}
                    </div>
                }
                {tab == 'image' &&
                    <div>
                        {imageTab}
                    </div>
                }
                {tab == 'plugin' &&
                    <div>
                        <PluginTab
                            config={config}
                            connectionId={connectionId}
                        />
                    </div>
                }
                {tab == 'stats' &&
                    <div>
                        <StatsTab
                            config={config}
                            connectionId={connectionId}
                        />
                    </div>
                }
            </div>
            {volumeDetailVisible &&
                <VolumeDetail
                    item={volumeDetailItem}
                    connectionId={connectionId}
                    onClose={() => {
                        setVolumeDetailVisible(false)
                    }}
                />
            }
            {containerDetailVisible &&
                <ContainerDetail
                    item={containerDetailItem}
                    connectionId={connectionId}
                    onClose={() => {
                        setContainerDetailVisible(false)
                    }}
                />
            }
        </div>
    )
}

function VolumeDetail({ connectionId, item, onClose }) {
    const { t } = useTranslation()
    const config = getGlobalConfig()
    const [detail, setDetail] = useState(null)
    async function loadDetail() {
        let res = await request.post(`${config.host}/docker/volume/detail`, {
            connectionId,
            id: item.Name,
        })
        console.log('res', res)
        if (res.success) {
            setDetail(res.data)
        }
    }

    useEffect(() => {
        loadDetail()
    }, [item])

    return (
        <Drawer
            title="volumn detail"
            open={true}
            onClose={onClose}
            width={640}
        >
            {!!detail &&
                <div>{detail.Name}</div>
            }
        </Drawer>
    )
}


function ContainerDetail({ connectionId, item, onClose }) {
    const { t } = useTranslation()

    const networks = Object.keys(item.NetworkSettings.Networks)
        .map(name => {
            return {
                name,
                ...item.NetworkSettings.Networks[name],
            }
        })
    
    return (
        <Drawer
            title="container detail"
            open={true}
            onClose={onClose}
            width={800}
        >
            {!!item &&
                <div>
                    <div>{t('docker.image')}:</div>
                    {item.Image}
                    <hr />
                    <div>{t('command')}:</div>
                    {item.Command}
                    <hr />
                    <div>mounts:</div>
                    <div>
                        {item.Mounts.map(mount => {
                            return (
                                <div>
                                    {mount.Source} : {mount.Destination}
                                </div>
                            )
                        })}
                    </div>
                    <hr />
                    <div>networks:</div>
                    {networks.map(network => {
                        return (
                            <div>{network.name}</div>
                        )
                    })}
                    

                </div>
            }
        </Drawer>
    )
}