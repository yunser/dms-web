import { getGlobalConfig } from '@/config'
import { request } from '@/views/db-manager/utils/http'
import React, { useState, useId, useEffect, ReactNode, useMemo, useRef } from 'react'
import styles from './s3-home.module.less'

export function S3Home({ onItem }) {
    const config = getGlobalConfig()

    const [connections, setConnections] = useState([])

    async function loadData() {
        let ret = await request.post(`${config.host}/s3/connection/list`, {
            // connectionId,
            // sql,
        })
        // console.log('ret', ret)
        if (ret.success) {
            setConnections(ret.data.list)
            // message.success('连接成功')
            // onConnect && onConnect()
            // message.success('Success')
            // onClose && onClose()
            // onSuccess && onSuccess()
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    return (
        <div>
            {/* <div>
            S3Home
            </div> */}
            <div className={styles.list}>
                {connections.map(item => {
                    return (
                        <div className={styles.item}
                            onClick={() => {
                                onItem && onItem(item)
                            }}
                        >
                            <div className={styles.name}>{item.name}</div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}