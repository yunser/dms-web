import { Button, Checkbox, Descriptions, Form, Input, message, Modal, Popover, Select, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './branch-delete.module.less';
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

export function BranchDeleteModal({ config, event$, projectPath, branch, commit, onSuccess, onCancel }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()

    const [form] = Form.useForm()
    const [remotes, setRemotes] = useState([])
    // const [current, setCurrent] = useState('')
    const [loading, setLoading] = useState(false)
    const [force, setFource] = useState(false)
    const [error, setError] = useState('')
    const [deleteRemote, setDeleteRemote] = useState(false)
    const [branches, setBranches] = useState([])

    const isRemote = branch.name.startsWith('remotes/')

    console.log('remotes', remotes)

    async function handleOk() {
        // const values = await form.validateFields()
        setError('')
        setLoading(true)
        let res = await request.post(`${config.host}/git/branch/delete`, {
            projectPath,
            name: branch.name,
            force,
            deleteRemote,
        }, {
            noMessage: true,
        })
        // console.log('ret', ret)
        if (res.success) {
            // message.success('连接成功')
            // onConnect && onConnect()
            message.success(t('success'))
            // onClose && onClose()
            onSuccess && onSuccess()
            // loadBranches()
            event$.emit({
                type: 'event_refresh_branch',
                data: {},
            })
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

        // const reqData = {
        //     projectPath,
        //     name: values.name,
        // }
        // if (commit) {
        //     reqData.commit = commit.hash
        // }
        // let res = await request.post(`${config.host}/git/branch/create`, reqData)
        // console.log('pull/res', res)
        // if (res.success) {
        //     // setRemotes(res.data)
        //     onSuccess && onSuccess()
        //     // setCurrent(res.data.current)
        //     event$.emit({
        //         type: 'event_reload_history',
        //         data: {
        //             commands: res.data.commands,
        //         }
        //     })
        // }
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
                title={t('git.branch.delete')}
                onCancel={onCancel}
                onOk={handleOk}
                confirmLoading={loading}
                maskClosable={false}
                okText={t('delete')}
                // footer={null}
            >
                {`${t('git.branch.delete.confirm')}「${branch.name}」？`}
                {!isRemote &&
                    <div className={styles.form}>
                        <Checkbox
                            checked={force}
                            onChange={e => {
                                setFource(e.target.checked)
                            }}
                        >
                            {t('git.delete.force')}
                        </Checkbox>
                    </div>
                }
                {!isRemote &&
                    <div className={styles.form}>
                        <Checkbox
                            checked={deleteRemote}
                            onChange={e => {
                                setDeleteRemote(e.target.checked)
                            }}
                        >
                            删除远程分支（暂时仅支持 origin）
                            {/* {t('git.delete.force')} */}
                        </Checkbox>
                    </div>
                }
                {!!error &&
                    <div className={styles.error}>
                        <pre>{error}</pre>
                    </div>
                }
            </Modal>
        </div>
    )
}
