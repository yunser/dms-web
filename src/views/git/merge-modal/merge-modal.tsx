import { Button, Checkbox, Descriptions, Form, Input, message, Modal, Popover, Select, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './merge-modal.module.less';
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

export function MergeModal({ config, event$, projectPath, onSuccess, onCancel }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()

    const [form] = Form.useForm()
    const [remotes, setRemotes] = useState([])
    const [current, setCurrent] = useState('')
    const [loading, setLoading] = useState(false)
    const [tab, setTab] = useState('mergeFrom')
    const [pushRemote, setPushRemote] = useState(false)
    // const [tab, setTab] = useState('mergeTo')

    const [branches, setBranches] = useState([])

    
    async function loadBranches() {
        const reqData = {
            projectPath,
        }
        let res = await request.post(`${config.host}/git/branch`, reqData)
        if (res.success) {
            // const branchs = []
            // onBranch && onBranch(res.data.list)
            const curBranch = res.data.current
            console.log('curBranch', curBranch)
            setCurrent(curBranch)
            setBranches(res.data.list.filter(item => {
                // 不显示远程的分支
                if (item.name.startsWith(('remotes/'))) {
                    return false
                }
                if (curBranch && item.name == curBranch) {
                    return false
                }
                // 不显示当前分支
                return true
            }))
            // if (curBranch) {
            //     form.setFieldsValue({
            //         branchName: curBranch,
            //     })
            // }
            // setCurrent(res.data.current)
        }
    }

    
    useEffect(() => {
        // loadRemotes()
        loadBranches()
    }, [])
    console.log('remotes', remotes)

    async function handleOk() {
        const values = await form.validateFields()
        if (tab == 'mergeFrom') {
            setLoading(true)
            const reqData = {
                projectPath,
                fromBranch: values.branch,
                toBranch: current,
            }
            if (tab == 'mergeFrom' && pushRemote) {
                reqData.pushRemote = pushRemote
            }
            let res = await request.post(`${config.host}/git/merge`, reqData)
            console.log('pull/res', res)
            if (res.success) {
                onSuccess && onSuccess()
                event$.emit({
                    type: 'event_reload_history',
                    data: {
                        commands: res.data.commands,
                    }
                })
            }
            setLoading(false)
        }
        else {
            message.info(`正在切换分支到 ${values.branch}`)
            setLoading(true)
            let res = await request.post(`${config.host}/git/checkout`, {
                projectPath,
                branchName: values.branch,
            })
            // console.log('ret', ret)
            if (res.success) {
                let res = await request.post(`${config.host}/git/merge`, {
                    projectPath,
                    fromBranch: current,
                    toBranch: values.branch,
                })
                console.log('pull/res', res)
                if (res.success) {
                    onSuccess && onSuccess()
                    event$.emit({
                        type: 'event_reload_history',
                        data: {
                            commands: res.data.commands,
                        }
                    })
                }
                // message.success('连接成功')
                // onConnect && onConnect()
                // message.success(t('success'))
                // onClose && onClose()
                // onSuccess && onSuccess()
                // loadBranches()
                // event$.emit({
                //     type: 'event_reload_history',
                //     data: {
                //         commands: res.data.commands,
                //     }
                // })
                // event$.emit({
                //     type: 'event_refresh_commit_list',
                //     data: {
                //         commands: res.data.commands,
                //     }
                // })
            }
            else {
                setLoading(false)
            }
        }
    }

    useEffect(() => {
        // loadRemotes()
        // loadBranches()
        // pull()
    }, [])

    return (
        <div>
            <Modal
                open={true}
                title={t('git.merge.merge_branch')}
                onCancel={onCancel}
                onOk={handleOk}
                confirmLoading={loading}
                // maskClosable={false}
                okText={t('git.merge')}
                // footer={null}
            >
                {/* {loading ? 'Pulling' : 'Pull Finished'} */}
                {/* <div className={styles.help}>合并以下分支到 {current} 分支</div> */}
                <Tabs
                    activeKey={tab}
                    defaultActiveKey="1"
                    onChange={key => {
                        setTab(key)
                    }}
                    items={[
                        {
                            label: t('git.merge'),
                            key: 'mergeFrom',
                        },
                        {
                            label: t('git.merge.merge_to'),
                            key: 'mergeTo',
                        },
                    ]}
                />
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
                    {tab == 'mergeFrom' &&
                        <>
                            <Form.Item
                                name="branch"
                                label={t('git.branch')}
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
                                label={t('git.merge.toBranch')}
                            >
                                {current}
                            </Form.Item>
                        </>
                    }
                    {tab == 'mergeTo' &&
                        <>
                            <Form.Item
                                label={t('git.merge.fromBranch')}
                            >
                                {current}
                            </Form.Item>
                            <Form.Item
                                name="branch"
                                label={t('git.merge.toBranch')}
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
                            
                        </>
                    }
                </Form>
                {tab == 'mergeFrom' &&
                    <Space>
                        <Checkbox
                            checked={pushRemote}
                            // disabled={commitLoading}
                            onClick={() => {
                                // console.log('add', item.path)
                                setPushRemote(!pushRemote)
                            }}
                        >
                            {t('git.push.now')} origin/{current}
                        </Checkbox>
                    </Space>
                }
            </Modal>
        </div>
    )
}
