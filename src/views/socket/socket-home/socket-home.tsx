import { Button, Descriptions, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Popover, Space, Spin, Table, Tabs, Tag, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './socket-home.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { DownloadOutlined, EllipsisOutlined, KeyOutlined, PlusOutlined, ReloadOutlined, StarFilled } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
// import { GitProject } from '../git-project';
import { request } from '@/views/db-manager/utils/http';
// import { ProjectEditor } from '../project-edit';
import { IconButton } from '@/views/db-manager/icon-button';
import { FullCenterBox } from '@/views/common/full-center-box';
// import { saveAs } from 'file-saver'

export function SocketHome({ config, onClickItem }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [form] = Form.useForm()
    const [connecting, setConnecting] = useState(false)
    const [connected, setConnected] = useState(false)
    const [content, setContent] = useState('')

    

    async function connect() {
        const values = await form.validateFields()
        setConnecting(true)
        let res = await request.post(`${config.host}/socket/connect`, {
            host: values.host,
            port: values.port,
        })
        if (res.success) {
            // onSuccess && onSuccess()
            message.success(t('success'))
            setConnected(true)
        }
        setConnecting(false)
    }

    async function send() {
        if (!content) {
            message.error('no content')
            return
        }
        let res = await request.post(`${config.host}/socket/send`, {
            content,
        })
        if (res.success) {
            // onSuccess && onSuccess()
            message.success(t('success'))
            setContent('')
            // setConnected(true)
        }
    }

    async function exit() {
        setConnected(false)
        let res = await request.post(`${config.host}/socket/close`, {
            content,
        })
    }

    return (
        <div className={styles.socketApp}>
            {/* socket */}
            {connected ?
                <div>
                    <Space direction="vertical">
                        <div>
                            <Button
                                // loading={connecting}
                                // type="primary"
                                onClick={exit}
                            >
                                {t('关闭连接')}
                            </Button>
                        </div>
                        <div>
                            <Input.TextArea
                                value={content}
                                onChange={e => {
                                    setContent(e.target.value)
                                }}
                            />
                        </div>

                        <Button
                            // loading={connecting}
                            type="primary"
                            onClick={send}
                        >
                            {t('send')}
                        </Button>
                    </Space>
                </div>
            :
                <div className={styles.form}>
                    <Form
                        form={form}
                        labelCol={{ span: 8 }}
                        wrapperCol={{ span: 16 }}
                        initialValues={{
                            host: '127.0.0.1',
                            port: 465,
                            // port: 3306,
                        }}
                        // layout={{
                        //     labelCol: { span: 0 },
                        //     wrapperCol: { span: 24 },
                        // }}
                    >
                        <Form.Item
                            name="host"
                            label={t('host')}
                            rules={[ { required: true, }, ]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="port"
                            label={t('port')}
                            rules={[ { required: true, }, ]}
                        >
                            <InputNumber />
                        </Form.Item>
                        <Form.Item
                            wrapperCol={{ offset: 8, span: 16 }}
                            extra="Only support TCP"
                            // name="passowrd"
                            // label="Passowrd"
                            // rules={[{ required: true, },]}
                        >
                            <Space>
                                <Button
                                    loading={connecting}
                                    type="primary"
                                    onClick={connect}
                                >
                                    {t('connect')}
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </div>
            }
        </div>
    )
}

