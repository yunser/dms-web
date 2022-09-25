import { Button, Checkbox, Descriptions, Form, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './git-status.module.less';
import _, { add } from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { DownloadOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
import { request } from '@/views/db-manager/utils/http';
// import { saveAs } from 'file-saver'

function Commit({ config, onSuccess }) {
    const [form] = Form.useForm()
    
    async function submit() {
        const values = await form.validateFields()
        console.log('msg', values)
        let res = await request.post(`${config.host}/git/commit`, {
            message: values.message,
        })
        // console.log('res', res)
        if (res.success) {
            message.success('success')
            onSuccess && onSuccess()
            // setStatus(res.data.status)
            // setCurrent(res.data.current)
        }
    }

    return (
        <div>
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
                    name="message"
                    label="Message"
                    rules={[ { required: true, }, ]}
                >
                    <Input />
                </Form.Item>
            </Form>
            <Button
                onClick={() => {
                    submit()
                }}
            >Submit</Button>
        </div>
    )
}

export function GitStatus({ config, onTab, }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()

    const [curFile, setCurFile] = useState('')
    const [status, setStatus] = useState(null)
    // const [current, setCurrent] = useState('')
    const [unstagedList, setUnstagedList] = useState([])
    const [diffText, setDiffText ] = useState('')
    async function loadList() {
        let res = await request.post(`${config.host}/git/status`, {
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
            const { status } = res.data
            setStatus(status)
            // setCurrent(res.data.current)
            setUnstagedList(status.modified.filter(file => {
                console.log('file', file)
                return !status.staged.includes(file)
            }))
            
        }
    }


    useEffect(() => {
        loadList()
    }, [])

    async function add(path) {
        let res = await request.post(`${config.host}/git/add`, {
            files: [path],
        })
        // console.log('res', res)
        if (res.success) {
            loadList()
        }
    }

    async function reset(path) {
        let res = await request.post(`${config.host}/git/reset`, {
            files: [path],
        })
        // console.log('res', res)
        if (res.success) {
            loadList()
        }
    }

    async function diff(path) {
        let res = await request.post(`${config.host}/git/diff`, {
            file: path,
        })
        console.log('res', res)
        if (res.success) {
            // loadList()
            setDiffText(res.data)
        }
    }

    return (
        <div>
            {/* <div>状态:</div> */}
            {!!status &&
                <div className={styles.statusBox}>
                    <div className={styles.layoutTop}>
                        <div className={styles.layoutLeft}>
                            <div className={styles.section}>
                                <div>staged:</div>
                                <div className={styles.list}>
                                    {status.staged.map(item => {
                                        return (
                                            <div
                                                key={item}
                                            >
                                                <Checkbox
                                                    checked
                                                    onClick={() => {
                                                        console.log('add', item)
                                                        reset(item)
                                                    }}
                                                />
                                                <div className={styles.fileName}
                                                    onClick={() => {
                                                        diff(item)
                                                    }}
                                                >{item}</div>
                                            </div>
                                        )
                                    })}
                                </div>

                            </div>
                            {/* <hr /> */}
                            <div className={classNames(styles.section, styles.section2)}>
                                <div>not_added:</div>
                                <div className={styles.list}>
                                    {unstagedList.map(item => {
                                        return (
                                            <div
                                                className={styles.item}
                                                key={item}
                                            >
                                                <Checkbox
                                                    checked={false}
                                                    onClick={() => {
                                                        console.log('add', item)
                                                        add(item)
                                                    }}
                                                />
                                                <div className={styles.fileName}
                                                    onClick={() => {
                                                        diff(item)
                                                    }}
                                                >{item}</div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                        </div>
                        <div className={styles.layoutRight}>
                            {!!diffText &&
                                <pre>{diffText}</pre>
                            }
                        </div>

                    </div>
                    <div className={styles.layoutBottom}>
                        {/* <hr /> */}
                        <Commit
                            config={config}
                            onSuccess={() => {
                                // loadList()
                                onTab && onTab()
                            }}
                        />
                    </div>
                </div>
            }
            {/* <div className={styles.list}>
                {list.map(item => {
                    return (
                        <div className={styles.item}>
                            <div className={styles.name}>{item.name}</div>
                            {item.name == current &&
                                <div className={styles.current}></div>
                            }
                        </div>
                    )
                })}
            </div> */}
        </div>
    )
}
