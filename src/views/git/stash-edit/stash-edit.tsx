import { Button, Checkbox, Descriptions, Form, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './stash-edit.module.less';
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
import { CommitItem } from '../commit-item';
// import { saveAs } from 'file-saver'

export function StashEditor({ config, commit, event$, projectPath, onSuccess, onCancel, onList }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [curTab, setCurTab] = useState('status')
    // const [curTab, setCurTab] = useState('commit-list')
    const [curCommit, setCurCommit] = useState(null)
    const [pushRemote, setPushRemote] = useState(false)
    const [form] = Form.useForm()

    useEffect(() => {
        loadList()
    }, [])

    async function loadList() {
        // setListLoading(true)
        // loadBranch()
        // loadTags()
        let res = await request.post(`${config.host}/git/commit/list`, {
            projectPath,
            limit: 1,
        }, {
            // noMessage: true,
        })
        // console.log('res', res)
        if (res.success) {
            const list = res.data
            if (list.length > 0) {
                setCurCommit(list[0])
            }
        }
        // setListLoading(false)
    }

    console.log('commitHash', commit)
    async function handleOk() {
        const values = await form.validateFields()
        const reqData = {
            projectPath,
            message: values.message,
            // pushRemote,
        }
        // if (commit) {
        //     reqData.commit = commit.hash
        // }
        let res = await request.post(`${config.host}/git/stash/create`, reqData)
        // console.log('res', res)
        if (res.success) {
            onSuccess && onSuccess()
            // event$.emit({
            //     type: 'event_refresh_branch',
            //     data: {},
            // })
            // event$.emit({
            //     type: 'event_refresh_status',
            //     data: {},
            // })
            event$.emit({
                type: 'event_reload_history',
                data: {
                    commands: res.data.commands,
                }
            })
        }
    }

    return (
        <Modal
            visible={true}
            title={t('git.stash.create')}
            onCancel={onCancel}
            onOk={handleOk}
            width={560}
            maskClosable={false}
        >
            <Form
                form={form}
                labelCol={{ span: 4 }}
                wrapperCol={{ span: 20 }}
                initialValues={{
                    port: 3306,
                }}
                onFinish={() => {
                    handleOk()
                }}
                // layout={{
                //     labelCol: { span: 0 },
                //     wrapperCol: { span: 24 },
                // }}
            >
                <Form.Item
                    name="message"
                    label={t('message')}
                    rules={[ { required: true, }, ]}
                >
                    <Input.TextArea
                        rows={4}
                        autoFocus
                    />
                </Form.Item>
            </Form>
        </Modal>
    )
}
