import { Button, Descriptions, Form, Input, message, Modal, Popover, Select, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './push-modal.module.less';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { request } from '@/views/db-manager/utils/http';

export function PushModal({ config, event$, projectPath, onSuccess, onCancel }) {
    const { t } = useTranslation()

    const [form] = Form.useForm()
    const [remotes, setRemotes] = useState([])
    const [loading, setLoading] = useState(false)
    const [isForce, setIsForce] = useState(false)
    const [error, setError] = useState('')

    async function loadRemotes() {
        let res = await request.post(`${config.host}/git/remote/list`, {
            projectPath,
        })
        if (res.success) {
            const remotes = res.data
            setRemotes(remotes)
            if (remotes.length) {
                form.setFieldsValue({
                    remoteName: remotes[0].name,
                })
            }
        }
    }

    const [branches, setBranches] = useState([])

    async function loadBranches() {
        let res = await request.post(`${config.host}/git/branch`, {
            projectPath,
        })
        if (res.success) {
            const curBranch = res.data.current
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
        }
    }
    
    useEffect(() => {
        loadRemotes()
        loadBranches()
    }, [])

    async function handleOk() {
        const values = await form.validateFields()
        setLoading(true)
        setError('')
        let res = await request.post(`${config.host}/git/push`, {
            projectPath,
            remoteName: values.remoteName,
            branchName: values.branchName,
            mode: values.mode,
        }, {
            noMessage: true,
        })
        if (res.success) {
            // setRemotes(res.data)
            onSuccess && onSuccess()
            // setCurrent(res.data.current)
            event$.emit({
                type: 'event_reload_history',
                data: {
                    commands: res.data.commands,
                }
            })
        }
        else {
            setError(res.data.message)
        }
        setLoading(false)
    }

    return (
        <div>
            <Modal
                open={true}
                title={t('git.push')}
                width={640}
                onCancel={onCancel}
                onOk={handleOk}
                okText={t('git.push')}
                confirmLoading={loading}
                maskClosable={false}
                okButtonProps={{
                    danger: isForce,
                }}
            >
                <Form
                    form={form}
                    labelCol={{ span: 8 }}
                    wrapperCol={{ span: 16 }}
                    initialValues={{
                        port: 3306,
                    }}
                >
                    <Form.Item
                        name="remoteName"
                        label={t('git.remote')}
                        rules={[ { required: true, }, ]}
                    >
                        <Select
                            options={remotes.map(r => {
                                return {
                                    label: r.name,
                                    value: r.name,
                                }
                            })}
                        />
                    </Form.Item>
                    <Form.Item
                        name="branchName"
                        label={t('git.push.push_branch')}
                        rules={[ { required: true, }, ]}
                    >
                        <Select
                            options={branches.map(r => {
                                return {
                                    label: r.name,
                                    value: r.name,
                                }
                            })}
                        />
                    </Form.Item>
                    <Form.Item
                        name="mode"
                        label={t('git.mode')}
                        extra={
                            <div>
                                {isForce &&
                                    <div className={styles.forceHelp}>{t('git.push.force_help')}</div>
                                }
                            </div>
                        }
                    >
                        <Select
                            options={[
                                {
                                    label: t('git.push.force_push'),
                                    value: 'force',
                                }
                            ]}
                            onChange={value => {
                                setIsForce(value == 'force')
                            }}
                            allowClear
                        />
                    </Form.Item>
                </Form>
                {!!error &&
                    <div className={styles.error}>
                        <pre>{error}</pre>
                    </div>
                }
            </Modal>
        </div>
    )
}
