import { Button, Descriptions, Dropdown, Empty, Form, Input, Menu, message, Modal, Popover, Space, Table, Tabs, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './oss-info.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { request } from '@/views/db-manager/utils/http';
import copy from 'copy-to-clipboard';


export function OssInfoModal({ config, sourceType, item, onOk, onCancel, ossItem }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [info, setInfo] = useState(null)

    const [form] = Form.useForm()

    console.log('OssInfoModal/item', item)
    async function handleOk() {
        const values = await form.validateFields()
        onOk && onOk({
            name: values.name,
        })
        // setLoading(true)
        // const folder = getParentPath(item.path)
        // const res = await request.post(`${config.host}/file/rename`, {
        //     // connectionId: connectionId,
        //     fromPath: item.path,
        //     toPath: (folder == '/' ? '/' : (folder + '/')) + values.name,
        //     sourceType,
        //     type,
        //     // field: '',
        //     // value: 'New Item',
        //     // dbName,
        // })
        // if (res.success) {
        //     onSuccess && onSuccess()
        // }
        // setLoading(false)
    }

    let domainUrl = ''
    if (ossItem.domain) {
        domainUrl = ossItem.domain + encodeURI(item.path)
        // domainUrl = ossItem.domain + encodeURIComponent(item.path)
    }
    function copyDomainUrl() {
        copy(domainUrl)
        message.success(t('copied'))
        onCancel && onCancel()
    }

    function openDomainUrl() {
        window.open(domainUrl, '_blank')
    }

    async function loadInfo() {
        let res = await request.post(`${config.host}/oss/info`, {
            sourceType,
            path: item.path,
        })
        console.log('res', res)
        if (res.success) {
            setInfo(res.data)
        }
    }

    useEffect(() => {
        loadInfo()
    }, [])

    return (
        <Modal
            title={t('oss_info')}
            open={true}
            onCancel={onCancel}
            width={800}
            // onOk={handleOk}
            footer={
                <Space>
                    <Button
                        onClick={() => {
                            copy(info.url)
                            message.info(t('copied'))
                        }}
                    >
                        {t('copy_link')}
                    </Button>
                </Space>
            }
            // maskClosable={false}
        >
            {!!info &&
                <div>
                    <div>{t('link')}：{info.url}</div>
                    {!!ossItem.domain &&
                        <div className={styles.domainBox}>
                            {/* <div className={styles.url}>{ossItem.domain}{item.path}</div> */}
                            <div className={styles.url}>{domainUrl}</div>
                            <Space>
                                <Button
                                    onClick={() => {
                                        copyDomainUrl()  
                                    }}
                                >
                                    {t('copy')}
                                </Button>
                                <Button
                                    onClick={() => {
                                        openDomainUrl()  
                                    }}
                                >
                                    {t('open')}
                                </Button>
                            </Space>
                        </div>
                    }
                    <div className={styles.headers}>{t('oss.headers')}</div>
                    <Table
                        size="small"
                        dataSource={info.headers}
                        pagination={false}
                        columns={[
                            {
                                title: t('key'),
                                dataIndex: 'key',
                            },
                            {
                                title: t('value'),
                                dataIndex: 'value',
                            },
                        ]}
                    />
                </div>
            }
        </Modal>
    )
}
