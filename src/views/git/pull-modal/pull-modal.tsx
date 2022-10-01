import { Button, Descriptions, Form, Input, message, Modal, Popover, Select, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './pull-modal.module.less';
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

export function PullModal({ config, event$, projectPath, onSuccess, onCancel }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()

    const [form] = Form.useForm()
    const [remotes, setRemotes] = useState([])
    // const [current, setCurrent] = useState('')
    const [loading, setLoading] = useState(false)

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
    const [current, setCurrent] = useState('')
    
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
        loadRemotes()
        loadBranches()
    }, [])

    
    console.log('remotes', remotes)

    async function pull() {
        const values = await form.validateFields()
        setLoading(true)
        // console.log('values', values)
        // return
        let res = await request.post(`${config.host}/git/pull`, {
            projectPath,
            remoteName: values.remoteName,
            branchName: current,
        })
        console.log('pull/res', res)
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
        setLoading(false)
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
                title={t('git.pull')}
                onCancel={onCancel}
                onOk={pull}
                confirmLoading={loading}
                // footer={null}
            >
                {/* <div className={styles.help}>合并以下分支到 {current} 分支</div> */}
                {/* {loading ? 'Pulling' : 'Pull Finished'} */}
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
                        // name="remoteName2"
                        label={t('git.pull.remoteBranch')}
                        // rules={[ { required: true, }, ]}
                    >
                        {current}
                    </Form.Item>
                    <Form.Item
                        // name="remoteName2"
                        label={t('git.pull.localBranch')}
                        // rules={[ { required: true, }, ]}
                    >
                        {current}
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}
