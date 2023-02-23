import React, { useEffect, useRef, useState } from 'react'

import styles from './docker.module.less'
import classNames from 'classnames'
import { Button, Empty, message, Modal, Space, Table, Tabs } from 'antd'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import storage from '../db-manager/storage'
import { AppstoreOutlined, SettingOutlined, ToolOutlined } from '@ant-design/icons'
import { FullCenterBox } from '../common/full-center-box'
import { getGlobalConfig } from '@/config'
import { request } from '../db-manager/utils/http'
import { render } from 'react-dom'

export function DockerClient() {
    const { t } = useTranslation()
    const config = getGlobalConfig()

    const [containers, setContainers] = useState([])
    const [images, setImages] = useState([])
    const [services, setServices] = useState([])
    const [networks, setNetworks] = useState([])
    const [volumes, setVolumes] = useState([])
    const [tab, setTab] = useState('container')

    async function loadContainers() {
        let res = await request.post(`${config.host}/docker/container/list`, {
        })
        console.log('res', res)
        if (res.success) {
            setContainers(res.data.list)
        }
    }

    async function loadImages() {
        let res = await request.post(`${config.host}/docker/images`, {
        })
        console.log('res', res)
        if (res.success) {
            setImages(res.data.list)
        }
    }

    async function loadServices() {
        let res = await request.post(`${config.host}/docker/services`, {
        })
        console.log('res', res)
        if (res.success) {
            setServices(res.data.list)
        }
    }

    async function loadNetworks() {
        let res = await request.post(`${config.host}/docker/networks`, {
        })
        console.log('res', res)
        if (res.success) {
            setNetworks(res.data.list)
        }
    }

    async function loadVolumes() {
        let res = await request.post(`${config.host}/docker/volumes`, {
        })
        console.log('res', res)
        if (res.success) {
            setVolumes(res.data.list.Volumes)
        }
    }

    async function stopItem(item) {
        let res = await request.post(`${config.host}/docker/container/stop`, {
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
                    id: item.Id,
                })
                console.log('res', res)
                if (res.success) {
                    loadContainers()
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

    useEffect(() => {
        loadAll()
    }, [])


    const volumeTab = (
        <div>
            {/* <div>volumes</div> */}
            <Table
                dataSource={volumes}
                size="small"
                columns={[
                    {
                        title: 'Driver',
                        dataIndex: 'Driver',
                        width: 120,
                        ellipsis: true,
                    },
                    {
                        title: 'Name',
                        dataIndex: 'Name',
                        // width: 120,
                        ellipsis: true,
                    },
                    
                    
                    // {
                    //     title: 'Name',
                    //     dataIndex: ['Spec', 'Name'],
                    //     width: 160,
                    //     ellipsis: true,
                    // },
                ]}
            />
        </div>
    )

    const networkTab = (
        <div>
            <Table
                dataSource={networks}
                size="small"
                columns={[
                    {
                        title: 'Id',
                        dataIndex: 'Id',
                        width: 120,
                        ellipsis: true,
                    },
                    {
                        title: 'Name',
                        dataIndex: 'Name',
                        width: 160,
                        ellipsis: true,
                    },
                    {
                        title: 'Driver',
                        dataIndex: 'Driver',
                        width: 120,
                        ellipsis: true,
                    },
                    {
                        title: 'Scope',
                        dataIndex: 'Scope',
                        // width: 120,
                        ellipsis: true,
                    },
                    
                    
                    // {
                    //     title: 'Name',
                    //     dataIndex: ['Spec', 'Name'],
                    //     width: 160,
                    //     ellipsis: true,
                    // },
                ]}
            />
        </div>
    )

    const serviceTab = (
        <div>
            <Table
                dataSource={services}
                size="small"
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
                        // width: 160,
                        ellipsis: true,
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
                        title: 'IMAGE',
                        dataIndex: 'Image',
                    },
                    {
                        title: 'COMMAND',
                        dataIndex: 'Command',
                        width: 220,
                    },
                    {
                        title: 'CREATED',
                        dataIndex: 'Created',
                        width: 120,
                    },
                    {
                        title: 'STATUS',
                        dataIndex: 'Status',
                        width: 220,
                    },
                    {
                        title: 'PORTS',
                        dataIndex: 'Ports',
                        width: 220,
                        render(value) {
                            return (
                                <div className={styles.portsCell}>{value.join(', ')}</div>
                            )
                        }
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
                                                stopItem(item)
                                            }}
                                        >
                                            {t('docker.stop')}
                                        </Button>
                                        <Button
                                            size="small"
                                            danger
                                            onClick={() => {
                                                removeItem(item)
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

    const imageTab = (
        <div>
            <Table
                dataSource={images}
                size="small"
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
                        render(value) {
                            if (!value) {
                                return <div>--</div>
                            }
                            return (
                                <div>{value.join(', ')}</div>
                            )
                        }
                    },
                    {
                        title: 'size',
                        dataIndex: 'Size',
                    },
                    {
                        title: 'Created',
                        dataIndex: 'Created',
                    },
                    // {
                    //     title: 'STATUS',
                    //     dataIndex: 'Status',
                    // },
                    // {
                    //     title: 'PORTS',
                    //     dataIndex: 'Ports',
                    //     render(value) {
                    //         return (
                    //             <div>{value.join(', ')}</div>
                    //         )
                    //     }
                    // },
                    // {
                    //     title: 'NAMES',
                    //     dataIndex: 'Names',
                    //     render(value) {
                    //         return (
                    //             <div>{value.join(', ')}</div>
                    //         )
                    //     }
                    // },
                ]}
            />
        </div>
    )

    return (
        <div className={styles.dockerApp}>
            <div className={styles.layoutHeader}>
                <Space>
                    <div>{t('docker.client')}</div>
                    <Button
                        onClick={loadAll}
                    >
                        refresh
                    </Button>
                </Space>
            </div>
            <div className={styles.layoutBody}>
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
                            label: 'images',
                        },
                        {
                            key: 'volume',
                            label: 'volumes',
                        },
                        {
                            key: 'network',
                            label: 'networks',
                        },
                        {
                            key: 'service',
                            label: 'services',
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
            </div>
        </div>
    )
}