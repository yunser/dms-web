import { Button, Descriptions, Form, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './project-edit.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { DownloadOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
import { CommitList } from '../commit-list';
import { BranchList } from '../branch-list';
import { GitStatus } from '../git-status';
import { RemoteList } from '../remote-list';
import { TagList } from '../tag-list';
import { request } from '@/views/db-manager/utils/http';
// import { saveAs } from 'file-saver'

export function ProjectEditor({ config, item, createType, sourceType = 'exist', onSuccess, onCancel, onList }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [curTab, setCurTab] = useState('status')
    // const [curTab, setCurTab] = useState('commit-list')
    const editType = item ? 'update' : 'create'
    const [form] = Form.useForm()
    const [userConfig, setUserConfig] = useState('')

    async function loadUserHome() {
        let res = await request.post(`${config.host}/git/userConfig`, {
        })
        if (res.success) {
            console.log('res.data', res.data)
            setUserConfig(res.data)
        }
    }

    useEffect(() => {
        loadUserHome()
    }, [])
    async function handleOk() {
        setLoading(true)
        const values = await form.validateFields()
        let res
        if (editType == 'create') {
            res = await request.post(`${config.host}/git/project/create`, {
                url: values.url,
                name: values.name,
                path: values.path,
                init: createType == 'init',
            })
        }
        else {
            res = await request.post(`${config.host}/git/project/update`, {
                id: item.id,
                data: {
                    name: values.name,
                },
            })
        }
        // console.log('res', res)
        if (res.success) {
            onSuccess && onSuccess()
        }
        setLoading(false)
    }

    async function autoInput() {
        const url = form.getFieldValue('url')
        const name = form.getFieldValue('name')
        const path = form.getFieldValue('path')
        if (name) {
            return
        }
        console.log('url', url)
        // git@github.com:yunser/git-auto-8.git
        const m = url.match(/\/([\d\D]+?).git$/)
        if (m) {
            // if (m &)
            function aftersplit(text: string, sep: string = '.') {
                const idx = text.lastIndexOf(sep)
                if (idx == -1) {
                    return text.replaceAll('`', '')
                }
                return text.substring(idx + 1).replaceAll('`', '')
            }

            const last = aftersplit(url, '/')
            console.log('last', last)
            console.log('userHome', userConfig)
            // git-auto-8.git
            const gitName = last.split('.')[0]
            form.setFieldsValue({
                name: gitName,
            })
            if (gitName && userConfig && !path) {
                const _path = `${userConfig.userHome}${userConfig.fileSeparator}${gitName}`
                form.setFieldsValue({
                    path: _path,
                })
            }
        }
    }
    
    useEffect(() => {
        if (item) {
            form.setFieldsValue({
                ...item,
            })
        }
        else {
            form.setFieldsValue({
                ...item,
            })
        }
    }, [item])

    useEffect(() => {

        form.setFieldsValue({
            // url: 'git@github.com:yunser/git-auto3.git',
            // path: '/Users/yunser/app/git-auto3',
            // name: 'git-auto3',
        })
    }, [])

    return (
        <Modal
            visible={true}
            title={t('git.repository.create')}
            onCancel={onCancel}
            onOk={handleOk}
            confirmLoading={loading}
            maskClosable={false}
        >
            <Form
                form={form}
                labelCol={{ span: 8 }}
                wrapperCol={{ span: 16 }}
                initialValues={{
                    port: 3306,
                }}
                // layout={{
                //     labelCol: { span: 0 },
                //     wrapperCol: { span: 24 },
                // }}
            >
                {sourceType == 'clone' &&
                    <Form.Item
                        name="url"
                        label="URL"
                        rules={[ { required: true, }, ]}
                    >
                        <Input
                            onBlur={autoInput}
                        />
                    </Form.Item>
                }
                <Form.Item
                    name="name"
                    label="Name"
                    rules={[ { required: true, }, ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="path"
                    label="Path"
                    rules={[ { required: true, }, ]}
                >
                    <Input
                        disabled={editType == 'update'}
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}
