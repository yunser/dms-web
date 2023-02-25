import React, { useEffect, useRef, useState } from 'react'

import styles from './docker.module.less'
import classNames from 'classnames'
import { Button, Empty, message, Modal, Space, Table, Tabs, Tag } from 'antd'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import storage from '../db-manager/storage'
import { AppstoreOutlined, SettingOutlined, ToolOutlined } from '@ant-design/icons'
import { FullCenterBox } from '../common/full-center-box'
import { getGlobalConfig } from '@/config'
import { request } from '../db-manager/utils/http'
import { render } from 'react-dom'
import { DockerDetail } from './docker-detail'

export function DockerClient() {
    const { t } = useTranslation()
    const config = getGlobalConfig()

    const [connections, setConnections] = useState([])
    const [_images, setImages] = useState([])
    const [_services, setServices] = useState([])
    // const [tab, setTab] = useState('container')
    const [currentConnection, setCurrentConnection] = useState(null)

    async function loadConnection() {
        let res = await request.post(`${config.host}/docker/connection/list`, {
        })
        console.log('res', res)
        if (res.success) {
            setConnections(res.data.list)
        }
    }


    function loadAll() {
        loadConnection()
    }

    useEffect(() => {
        loadAll()
    }, [])


    return (
        <div className={styles.dockerApp}>
            <div className={styles.layoutHeader}>
                <div>{t('docker.client')}</div>
            </div>
            <div className={styles.layoutBody}>
                <div className={styles.layoutSide}>
                    <Space>
                        <Button
                            size="small"
                            onClick={loadAll}
                        >
                            refresh
                        </Button>
                    </Space>
                    {connections.length == 0 ?
                        <div>没有可用连接</div>
                    :
                        <div className={styles.connections}>
                            {connections.map(item => (
                                <div
                                    className={classNames(styles.item, {
                                        [styles.active]: currentConnection && item.id == currentConnection.id,
                                    })}
                                    onClick={() => {
                                        setCurrentConnection(item)
                                    }}
                                >
                                    {item.name}
                                </div>
                            ))}
                        </div>
                    }
                </div>
                <div className={styles.layoutMain}>
                    {!!currentConnection ?
                        <DockerDetail
                            connection={currentConnection}
                        />
                    :
                        <div>请选择连接</div>
                    }
                </div>
            </div>
        </div>
    )
}