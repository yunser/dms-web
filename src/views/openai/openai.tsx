import { getGlobalConfig } from '@/config'
import { Spin } from 'antd'
import React, { useEffect, useState } from 'react'
import { request } from '../db-manager/utils/http'
import { AiChat } from './chat'

export function OpenAiApp() {
    const config = getGlobalConfig()
    const [loading, setLoading] = useState(false)
    const [url, setUrl] = useState('')

    async function loadData() {
        let res = await request.post(`${config.host}/openai/info`, {
        })
        if (res.success) {
            setUrl(res.data.url)
            setLoading(false)
        }
        else {
            // setErr('Connect rrror')
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    return (
        <div>
            {loading ?
                <Spin />
            :
                <AiChat
                    host={url}
                />
            }
        </div>
    )
}
