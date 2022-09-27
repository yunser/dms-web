import { Button, Checkbox, Descriptions, Form, Input, message, Modal, Popover, Space, Table, Tabs, Tag } from 'antd';
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
import { DiffText } from '../git-diff';
// import { saveAs } from 'file-saver'



function Commit({ config, projectPath, onSuccess }) {
    const [form] = Form.useForm()
    
    async function submit() {
        const values = await form.validateFields()
        console.log('msg', values)
        let res = await request.post(`${config.host}/git/commit`, {
            projectPath,
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
                // labelCol={{ span: 8 }}
                // wrapperCol={{ span: 16 }}
                size="small"
                initialValues={{
                    port: 3306,
                }}
                // style={{
                //     marginBottom: 0,
                // }}
                // layout={{
                //     labelCol: { span: 0 },
                //     wrapperCol: { span: 24 },
                // }}
            >
                <Form.Item
                    name="message"
                    // label="Message"
                    rules={[ { required: true, }, ]}
                >
                    <Input.TextArea
                        rows={2}
                    />
                </Form.Item>
                <Form.Item>
                    <Button
                        size="small"
                        onClick={() => {
                            submit()
                        }}
                    >Submit</Button>
                </Form.Item>
            </Form>
        </div>
    )
}

export function GitStatus({ config, projectPath, onTab, }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()

    const [curFile, setCurFile] = useState('')
    const [curFileType, setCurFileType] = useState('')
    const [status, setStatus] = useState(null)
    // const [current, setCurrent] = useState('')
    const [unstagedList, setUnstagedList] = useState([])
    const [diffText, setDiffText ] = useState('')
    async function loadList() {
        let res = await request.post(`${config.host}/git/status`, {
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
            const { status } = res.data
            setStatus(status)
            // setCurrent(res.data.current)
            setUnstagedList(status.files.filter(item => {
                return item.working_dir != ' '
            }))
            // setUnstagedList(status.modified.filter(file => {
            //     console.log('file', file)
            //     return !status.staged.includes(file)
            // }))
            
        }
    }


    useEffect(() => {
        loadList()
    }, [])

    async function add(files) {
        let res = await request.post(`${config.host}/git/add`, {
            projectPath,
            files,
            // files: [path],
        })
        // console.log('res', res)
        if (res.success) {
            loadList()
        }
    }

    async function reset(files) {
        let res = await request.post(`${config.host}/git/reset`, {
            projectPath,
            files,
            // files: [path],
        })
        // console.log('res', res)
        if (res.success) {
            loadList()
        }
    }

    async function cat(path) {
        setCurFile(path)
        setCurFileType('')
        let res = await request.post(`${config.host}/git/cat`, {
            projectPath,
            filePath: path,
        })
        console.log('res', res)
        if (res.success) {
            // loadList()
            setDiffText(res.data.content)
        }
    }

    async function diff(path, cached = false) {
        setCurFile(path)
        setCurFileType(cached ? 'cached' : '')
        let res = await request.post(`${config.host}/git/diff`, {
            projectPath,
            file: path,
            cached,
        })
        console.log('res', res)
        if (res.success) {
            // loadList()
            setDiffText(res.data)
        }
    }

    return (
        <div className={styles.statusBox}>
            {/* <div>状态:</div> */}
            {!!status &&
                <>
                    <div className={styles.layoutTop}>
                        <div className={styles.layoutLeft}>
                            <div className={styles.section}>
                                <div className={styles.header}>
                                    <Checkbox
                                        checked
                                        disabled={status.staged.length == 0}
                                        onClick={() => {
                                            // console.log('add', item.path)
                                            reset(status.staged)
                                        }}
                                    />
                                    <div className={styles.title}>Staged</div>
                                </div>
                                <div className={styles.body}>
                                    <div className={styles.list}>
                                        {status.staged.map(item => {
                                            return (
                                                <div
                                                    className={classNames(styles.item, {
                                                        [styles.active]: item == curFile && curFileType == 'cached'
                                                    })}
                                                    key={item}
                                                >
                                                    <Checkbox
                                                        checked
                                                        onClick={() => {
                                                            console.log('add', item)
                                                            reset([item])
                                                        }}
                                                    />
                                                    <div className={styles.fileName}
                                                        onClick={() => {
                                                            diff(item, true)
                                                        }}
                                                    >{item}</div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                            </div>
                            <div className={classNames(styles.section, styles.section2)}>
                                <div className={styles.header}>
                                    <Checkbox
                                        checked={false}
                                        disabled={unstagedList.length == 0}
                                        onClick={() => {
                                            // console.log('add', item.path)
                                            add(unstagedList.map(item => item.path))
                                        }}
                                    />
                                    <div className={styles.title}>Not Added</div>
                                    {/* {curFileType} */}
                                </div>
                                <div className={styles.body}>
                                    <div className={styles.list}>
                                        {unstagedList.map(item => {
                                            return (
                                                <div
                                                    className={classNames(styles.item, {
                                                        [styles.active]: item.path == curFile && curFileType == ''
                                                    })}
                                                    key={item.path}
                                                >
                                                    <Checkbox
                                                        checked={false}
                                                        onClick={() => {
                                                            console.log('add', item.path)
                                                            add([item.path])
                                                        }}
                                                    />
                                                    <div className={styles.fileName}
                                                        onClick={() => {
                                                            if (item.working_dir == '?') {
                                                                cat(item.path)
                                                            }
                                                            else {
                                                                diff(item.path)
                                                            }
                                                        }}
                                                    >
                                                        <Tag>{item.working_dir}</Tag>
                                                        {item.path}</div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>

                        </div>
                        <div className={styles.layoutRight}>
                            {unstagedList.length == 0 && status && status.staged.length == 0 &&
                                <div className={styles.empty}>没什么可提交的</div>
                            }
                            {!!diffText &&
                                <DiffText
                                    text={diffText}
                                />
                                // <pre>{diffText}</pre>
                            }
                        </div>

                    </div>
                    <div className={styles.layoutBottom}>
                        {/* <hr /> */}
                        <Commit
                            config={config}
                            projectPath={projectPath}
                            onSuccess={() => {
                                // loadList()
                                onTab && onTab()
                            }}
                        />
                    </div>
                </>
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
