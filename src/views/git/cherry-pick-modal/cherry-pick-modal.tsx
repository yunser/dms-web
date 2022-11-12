import { Button, Descriptions, Form, Input, message, Modal, Popover, Select, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './cherry-pick-modal.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { DownloadOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
import { request } from '@/views/db-manager/utils/http';
import { CommitItem } from '../commit-item';
// import { saveAs } from 'file-saver'

export function CherryPickModal({ config, commit, event$, projectPath, onSuccess, onCancel }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()

    const [form] = Form.useForm()
    const [remotes, setRemotes] = useState([])
    const [current, setCurrent] = useState('')
    const [loading, setLoading] = useState(false)


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
        setLoading(true)
        // const values = await form.validateFields()
        // console.log('values', values)
        // return
        let res = await request.post(`${config.host}/git/cherryPick`, {
            projectPath,
            branch: values.branch,
            commit: commit.hash,
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
            event$.emit({
                type: 'event_refresh_branch',
                data: {},
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
                title={t('git.cherry_pick')}
                onCancel={onCancel}
                onOk={handleOk}
                confirmLoading={loading}
                // maskClosable={false}
                okText={t('git.cherry_pick')}
                // footer={null}
            >
                {/* {loading ? 'Pulling' : 'Pull Finished'} */}
                {/* <div className={styles.help}>合并以下分支到 {current} 分支</div> */}
                <Form
                    form={form}
                    labelCol={{ span: 4 }}
                    wrapperCol={{ span: 20 }}
                    initialValues={{
                        port: 3306,
                    }}
                    // layout={{
                    //     labelCol: { span: 0 },
                    //     wrapperCol: { span: 24 },
                    // }}
                >
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
                        // name="branch"
                        label={t('git.commit')}
                        // rules={[ { required: true, }, ]}
                    >
                        <CommitItem
                            commit={commit}
                        />
                        {/* <Select
                            options={branches.map(r => {
                                return {
                                    label: r.name,
                                    value: r.name,
                                }
                            })}
                        /> */}
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}
