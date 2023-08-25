import { Modal, Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { request } from '@/views/db-manager/utils/http';
import { getGlobalConfig } from '@/config';

export function BlameModal({ projectPath, filePath, onCancel }) {
    const { t } = useTranslation()
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(true)

    async function loadBlame() {
        const config = getGlobalConfig()
        setLoading(true)
        let res = await request.post(`${config.host}/git/blame`, {
            projectPath,
            filePath,
            end: 900,
        })
        setLoading(false)
        if (res.success) {
            setContent(res.data.content)
        }
        setLoading(false)
    }
    
    async function handleOk() {
        onCancel && onCancel()
    }

    useEffect(() => {
        loadBlame()
    }, [filePath])

    return (
        <Modal
            title={t('git.blame')}
            width={1200}
            open={true}
            onCancel={onCancel}
            onOk={handleOk}
            maskClosable={false}
        >
            {loading &&
                <Spin />
            }
            {!!content &&
                <pre>{content}</pre>
            }
        </Modal>
    )
}
