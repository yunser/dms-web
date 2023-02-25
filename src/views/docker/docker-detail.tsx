import React, { useEffect, useRef, useState } from 'react'

import styles from './docker.module.less'
import classNames from 'classnames'
import { Button, Drawer, Empty, message, Modal, Space, Table, Tabs, Tag } from 'antd'
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
    const [_images, setImages] = useState([])
    const [_services, setServices] = useState([])
    const [networks, setNetworks] = useState([])
    const [volumeDetailVisible, setVolumeDetailVisible] = useState(false)
    const [volumeDetailItem, setVolumeDetailItem] = useState(null)
    const [volumes, setVolumes] = useState([])
    const [tab, setTab] = useState('container')

    const connectionId = connection.id

    useEffect(() => {
        loadAll()
    }, [connectionId])

    const images = useMemo(() => {
        return _images.map(image => {
            const fItem = containers.find(c => c.ImageID == image.Id)
            return {
                ...image,
                isUsed: !!fItem,
            }
        })
    }, [_images, containers])

    const services = useMemo(() => {
        return _services.map(item => {
            return {
                ...item,
            }
        })
    }, [_services, networks])

    async function loadContainers() {
        let res = await request.post(`${config.host}/docker/container/list`, {
            connectionId,
        })
        console.log('res', res)
        if (res.success) {
            setContainers(res.data.list)
        }
    }

    async function loadImages() {
        let res = await request.post(`${config.host}/docker/images`, {
            connectionId,
        })
        console.log('res', res)
        if (res.success) {
            setImages(res.data.list)
        }
    }

    async function loadServices() {
        let res = await request.post(`${config.host}/docker/services`, {
            connectionId,
        })
        console.log('res', res)
        if (res.success) {
            setServices(res.data.list.sort((a, b) => a.Spec.Name.localeCompare(b.Spec.Name)))
        }
    }

    async function loadNetworks() {
        let res = await request.post(`${config.host}/docker/networks`, {
            connectionId,
        })
        console.log('res', res)
        if (res.success) {
            setNetworks(res.data.list)
        }
    }

    async function loadVolumes() {
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
                        title: 'Driver',
                        dataIndex: 'Driver',
                        width: 80,
                        ellipsis: true,
                    },
                    {
                        title: 'Name',
                        dataIndex: 'Name',
                        width: 240,
                        ellipsis: true,
                    },
                    {
                        title: 'CreatedAt',
                        dataIndex: 'CreatedAt',
                        width: 200,
                        render: TimeAgoCellRender,
                    },
                    {
                        title: 'Mountpoint',
                        dataIndex: 'Mountpoint',
                        // width: 120,
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
                        title: 'Id',
                        dataIndex: 'Id',
                        width: 160,
                        ellipsis: true,
                    },
                    {
                        title: 'Name',
                        dataIndex: 'Name',
                        width: 240,
                        ellipsis: true,
                    },
                    {
                        title: 'Driver',
                        dataIndex: 'Driver',
                        width: 80,
                        ellipsis: true,
                    },
                    {
                        title: 'Scope',
                        dataIndex: 'Scope',
                        width: 100,
                        ellipsis: true,
                    },
                    {
                        title: 'Created',
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
            <Table
                dataSource={services}
                size="small"
                pagination={false}
                columns={[
                    {
                        title: 'ID',
                        dataIndex: 'ID',
                        width: 120,
                        ellipsis: true,
                    },
                    {
                        title: 'Name',
                        dataIndex: ['Spec', 'Name'],
                        ellipsis: true,
                        width: 320,
                    },
                    {
                        title: 'CreatedAt',
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
            <Table
                dataSource={containers}
                size="small"
                pagination={false}
                columns={[
                    {
                        title: 'CONTAINER ID',
                        dataIndex: 'Id',
                        width: 160,
                        ellipsis: true,
                    },
                    {
                        title: 'NAMES',
                        dataIndex: 'Names',
                        render(value) {
                            return (
                                <div>{value.join(', ')}</div>
                            )
                        }
                    },
                    {
                        title: 'IMAGE',
                        dataIndex: 'Image',
                    },
                    {
                        title: 'COMMAND',
                        dataIndex: 'Command',
                        width: 220,
                        ellipsis: true,
                    },
                    {
                        title: 'CREATED',
                        dataIndex: 'Created',
                        width: 180,
                        render: TimeAgoCellRender,
                    },
                    {
                        title: 'STATUS',
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
                        title: 'PORTS',
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
            <Table
                dataSource={images}
                size="small"
                pagination={false}
                columns={[
                    {
                        title: 'ID',
                        dataIndex: 'Id',
                        width: 240,
                        ellipsis: true,
                    },
                    {
                        title: 'RepoTags',
                        dataIndex: 'RepoTags',
                        render(value, item) {
                            if (!value) {
                                return <div>--</div>
                            }
                            return (
                                <div>
                                    <Space>
                                        {value.join(', ')}
                                        {item.isUsed &&
                                            <Tag color="green">{t('docker.in_use')}</Tag>
                                        }
                                    </Space>
                                </div>
                            )
                        }
                    },
                    {
                        title: 'size',
                        dataIndex: 'Size',
                        width: 160,
                    },
                    {
                        title: 'Created',
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
                    refresh
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
                        label: t('docker.image'),
                    },
                    {
                        key: 'volume',
                        label: t('docker.volume'),
                    },
                    {
                        key: 'network',
                        label: t('docker.network'),
                    },
                    {
                        key: 'service',
                        label: t('docker.service'),
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