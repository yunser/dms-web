import { Button, Descriptions, Form, Input, message, Modal, Popover, Select, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './user-setting.module.less';
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

export function UserSetting({ config, event$, projectPath, onSuccess, onCancel }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()

    const [form] = Form.useForm()
    const [remotes, setRemotes] = useState([])
    // const [current, setCurrent] = useState('')
    const [loading, setLoading] = useState(false)

    const [userConfig, setUserConfig] = useState('')

    async function loadUserHome() {
        let res = await request.post(`${config.host}/git/userConfig`, {
        })
        if (res.success) {
            console.log('res.data', res.data)
            const userConfig = res.data
            setUserConfig(userConfig)
            form.setFieldsValue(userConfig)
        }
    }

    useEffect(() => {
        loadUserHome()
    }, [])

    async function pull() {
        const values = await form.validateFields()
        setLoading(true)
        // console.log('values', values)
        // return
        let res = await request.post(`${config.host}/git/userConfig/update`, {
            defaultClonePath: values.defaultClonePath,
        })
        console.log('pull/res', res)
        if (res.success) {
            // setRemotes(res.data)
            onSuccess && onSuccess()
            // setCurrent(res.data.current)
            // event$.emit({
            //     type: 'event_reload_history',
            //     data: {
            //         commands: res.data.commands,
            //     }
            // })
        }
        setLoading(false)
    }

    return (
        <div>
            <Modal
                open={true}
                title={t('user_setting')}
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
                        name="defaultClonePath"
                        label={t('default_clone_path')}
                        // rules={[ { required: true, }, ]}
                    >
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}
