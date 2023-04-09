import { Form, Input, Modal, Spin, message } from 'antd';
import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { request } from '@/views/db-manager/utils/http';
import copy from 'copy-to-clipboard';

export function SshKeyModal({ config, onCancel }) {
    const { t } = useTranslation()

    const [form] = Form.useForm()
    const [sshLoading, setSshLoading] = useState(false)
    const [sshRsa, setSshRsa] = useState('')
    const [loading, setLoading] = useState(false)

    async function loadSshKey() {
        setSshLoading(true)
        let res = await request.post(`${config.host}/git/getSshPublicKey`, {
        })
        setSshLoading(false)
        if (res.success) {
            setSshRsa(res.data.sshRsa)
        }
    }

    useEffect(() => {
        loadSshKey()
    }, [])
    
    async function handleOk() {
        copy(sshRsa)
        message.success(t('copied'))
    }

    return (
        <div>
            <Modal
                open={true}
                title={t('git.ssh_public_key')}
                onCancel={onCancel}
                onOk={handleOk}
                confirmLoading={loading}
                maskClosable={true}
                okText={t('copy')}
            >
                {sshLoading ?
                    <Spin />
                :
                    <div>{sshRsa}</div>
                }
            </Modal>
        </div>
    )
}
