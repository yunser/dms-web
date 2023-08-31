import React, { useEffect, useRef, useState } from 'react'

import styles from './docker.module.less'
import classNames from 'classnames'
import { Button, Drawer, Empty, Input, message, Modal, Space, Table, Tabs, Tag } from 'antd'
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

TimeAgo.addDefaultLocale(en)
const timeAgo = new TimeAgo('en-US')

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

export function DockerDetail({ connection }) {
    const { t } = useTranslation()
    const config = getGlobalConfig()

    const [containers, setContainers] = useState([])
    const [containerKeyword, setContainerKeyword] = useState('')
    const [_images, setImages] = useState([])
    const [imageKeyword, setImageKeyword] = useState('')
    const [_services, setServices] = useState([])
    const [serviceKeyword, setServiceKeyword] = useState('')
    const [_networks, setNetworks] = useState([])
    const [volumeDetailVisible, setVolumeDetailVisible] = useState(false)
    const [volumeDetailItem, setVolumeDetailItem] = useState(null)
    const [volumes, setVolumes] = useState([])
    const [tab, setTab] = useState('container')

    const filteredContainers = useMemo(() => {
        return SearchUtil.search(containers, containerKeyword, {
            attributes: ['Id', '_names'],
        })
    }, [containers, containerKeyword])

    const filteredServices = useMemo(() => {
        return SearchUtil.search(_services, serviceKeyword, {
            attributes: ['ID', '_name'],
            // dataIndex: ['Spec', 'Name'],
        })
    }, [_services, serviceKeyword])

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
        let res = await request.post(`${config.host}/docker/container/list`, {
            connectionId,
        })
        console.log('res', res)
        if (res.success) {
            setContainers(res.data.list.map(item => {
                let _names = ''
                if (item.Names) {
                    _names = item.Names.join(', ')
                }
                return {
                    ...item,
                    _names,
                }
            }))
        }
    }

    async function loadImages() {
        setImages([])
        let res = await request.post(`${config.host}/docker/images`, {
            connectionId,
        })
        console.log('res', res)
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
    }

    async function loadNetworks() {
        setNetworks([])
        let res = await request.post(`${config.host}/docker/networks`, {
            connectionId,
        })
        console.log('res', res)
        if (res.success) {
            setNetworks(res.data.list)
        }
    }

    async function loadVolumes() {
        setVolumes([])
        let res = await request.post(`${config.host}/docker/volumes`, {
            connectionId,
        })
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
    }

    


    const volumeTab = (
        <div>
            {/* <div>volumes</div> */}
            <Table
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
            </div>
            <Table
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
                                <div>{value.map(item => {
                                    return `*:${item.PublishedPort}->${item.TargetPort}/${item.Protocol}`
                                }).join(', ')}</div>
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
            </div>
            <Table
                dataSource={filteredContainers}
                size="small"
                pagination={false}
                columns={[
                    {
                        title: t('id'),
                        dataIndex: 'Id',
                        width: 160,
                        ellipsis: true,
                    },
                    {
                        title: t('docker.names'),
                        dataIndex: 'Names',
                        render(value) {
                            return (
                                <div>{value.join(', ')}</div>
                            )
                        }
                    },
                    {
                        title: t('docker.image'),
                        dataIndex: 'Image',
                    },
                    {
                        title: t('command'),
                        dataIndex: 'Command',
                        width: 220,
                        ellipsis: true,
                    },
                    {
                        title: t('status'),
                        dataIndex: 'Status',
                        width: 220,
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
                        key: 'image',
                        label: t('docker.images'),
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
                        key: 'volume',
                        label: t('docker.volume'),
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