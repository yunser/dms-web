import { Button, Descriptions, Form, Input, message, Modal, Popover, Select, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './push-modal.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { DownloadOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
import { request } from '@/views/db-manager/utils/http';
// import { saveAs } from 'file-saver'

export function ResetModal({ config, projectPath, curBranch, resetCommit, onSuccess, onCancel }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()

    const [form] = Form.useForm()
    const [remotes, setRemotes] = useState([])
    // const [current, setCurrent] = useState('')
    const [loading, setLoading] = useState(false)

    console.log('resetCommit', resetCommit)
    async function loadRemotes() {
        let res = await request.post(`${config.host}/git/remote/list`, {
            projectPath,
        })
        // console.log('res', res)
        if (res.success) {
            const remotes = res.data
            setRemotes(remotes)
            if (remotes.length) {
                form.setFieldsValue({
                    remoteName: remotes[0].name,
                })
            }

            // setCurrent(res.data.current)
        }
    }

    const [branches, setBranches] = useState([])

    async function loadBranches() {
        let res = await request.post(`${config.host}/git/branch`, {
            projectPath,
            // connectionId,
            // sql: lineCode,
            // tableName,
            // dbName,
            // logger: true,
        }, {
            // noMessage: true,
        })
        // console.log('res', res)
        if (res.success) {

            // const branchs = []
            // onBranch && onBranch(res.data.list)
            const curBranch = res.data.current
            console.log('curBranch', curBranch)
            setBranches(res.data.list.filter(item => {
                // 不显示远程的分支
                if (item.name.startsWith(('remotes/'))) {
                    return false
                }
                return true
            }))
            if (curBranch) {
                form.setFieldsValue({
                    branchName: curBranch,
                })
            }
            // setCurrent(res.data.current)
        }
    }

    
    useEffect(() => {
        loadRemotes()
        loadBranches()
    }, [])

    console.log('remotes', remotes)

    async function handleOk() {
        setLoading(true)
        const values = await form.validateFields()
        console.log('values', values)
        let res = await request.post(`${config.host}/git/command`, {
            projectPath,
            commands: ['reset', '--hard', resetCommit.hash],
        })
        // console.log('res', res)
        if (res.success) {
            // setRemotes(res.data)
            onSuccess && onSuccess()
            // setCurrent(res.data.current)
        }
        setLoading(false)
    }

    return (
        <div>
            <Modal
                open={true}
                title={t('git.reset')}
                onCancel={onCancel}
                onOk={handleOk}
                okButtonProps={{
                    danger: true,
                }}
                width={560}
                confirmLoading={loading}
            >
                <Form
                    form={form}
                    labelCol={{ span: 6 }}
                    wrapperCol={{ span: 18 }}
                    initialValues={{
                        mode: 'hard',
                    }}
                >
                    <Form.Item
                        name="branchName1"
                        label={t('git.reset.branch')}
                    >
                        {curBranch}
                    </Form.Item>
                    <Form.Item
                        name="remoteName2"
                        label={t('git.reset.to')}
                    >
                        {resetCommit.message}
                    </Form.Item>
                    <Form.Item
                        name="mode"
                        label={t('git.mode')}
                    >
                        <Select
                            options={[
                                {
                                    label: t('git.reset.hard'),
                                    value: 'hard',
                                }
                            ]}
                        />
                    </Form.Item>
                    
                </Form>
            </Modal>
        </div>
    )
}
