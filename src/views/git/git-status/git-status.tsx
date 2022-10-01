import { Button, Checkbox, Descriptions, Dropdown, Empty, Form, Input, Menu, message, Modal, Popover, Space, Table, Tabs, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './git-status.module.less';
import _, { add } from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { DownloadOutlined, EllipsisOutlined, MinusOutlined, QuestionOutlined, UserOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
import { request } from '@/views/db-manager/utils/http';
import { DiffText } from '../git-diff';
import { IconButton } from '@/views/db-manager/icon-button';
import { FullCenterBox } from '@/views/db-manager/redis-client';
// import { saveAs } from 'file-saver'



function Commit({ config, event$, stagedLength, gitConfig, projectPath, onSuccess }) {
    // const [form] = Form.useForm()
    const { t } = useTranslation()
    const [infoVisible, setInfoVisible] = useState(false)
    const [formData, setFormData] = useState({
        message: '',
    })

    
    async function submit() {
        if (!formData.message) {
            message.warn('Message required')
            return
        }
        // const values = await form.validateFields()
        // console.log('msg', values)
        let res = await request.post(`${config.host}/git/commit`, {
            projectPath,
            message: formData.message,
        })
        // console.log('res', res)
        if (res.success) {
            message.success('success')
            onSuccess && onSuccess()
            event$.emit({
                type: 'event_reload_history',
                data: {
                    commands: res.data.commands,
                }
            })
            // setStatus(res.data.status)
            // setCurrent(res.data.current)
        }
    }

    return (
        <div className={styles.commitBox}>
            {!!gitConfig && infoVisible &&
                <div className={styles.user}>
                    <UserOutlined />
                    {' '}
                    {gitConfig.user.name}
                    {' <'}{gitConfig.user.email}{'>'}

                </div>
            }
            <Input.TextArea
                value={formData.message}
                onChange={e => {
                    setFormData({
                        ...formData,
                        message: e.target.value,
                    })
                }}
                placeholder={t('git.commit_message')}
                rows={infoVisible ? 4 : 1}
                onFocus={() => {
                    setInfoVisible(true)
                }}
            />
            {infoVisible &&
                <div className={styles.button}>
                    <Space>
                        <Button
                            // type="primary"
                            size="small"
                            onClick={() => {
                                setInfoVisible(false)
                            }}
                        >{t('cancel')}</Button>
                        <Button
                            type="primary"
                            size="small"
                            disabled={stagedLength == 0}
                            onClick={() => {
                                submit()
                            }}
                        >{t('git.submit')}</Button>
                    </Space>
                </div>
            }
            {/* <Form
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
                    
                </Form.Item>
                <Form.Item>
                    
                </Form.Item>
            </Form> */}
        </div>
    )
}

export function GitStatus({ config, event$, projectPath, onTab, }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()

    const [gitConfig, setConfig] = useState(null)
    const [curFile, setCurFile] = useState('')
    const [curFileType, setCurFileType] = useState('')
    const [status, setStatus] = useState(null)
    // const [current, setCurrent] = useState('')
    const [unstagedList, setUnstagedList] = useState([])
    const [diffText, setDiffText ] = useState('')
    const canCommit = !(unstagedList.length == 0 && status?.staged?.length == 0)

    useEffect(() => {
        loadStatuses()
        getConfig()
    }, [])

    async function loadStatuses() {
        setCurFile('')
        setDiffText('')
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

    event$.useSubscription(msg => {
        console.log('CommitList/onmessage', msg)
        // console.log(val);
        if (msg.type == 'event_refresh_status') {
            // const { json } = msg.data
            // addJsonTab(json)
            loadStatuses()
        }
    })

    async function getConfig() {
        // loadBranch()
        let res = await request.post(`${config.host}/git/getConfig`, {
            projectPath,
            // remoteName: 'origin',
            // connectionId,
            // sql: lineCode,
            // tableName,
            // dbName,
            // logger: true,
        }, {
            // noMessage: true,
        })
        console.log('getConfig/res', res.data)
        if (res.success) {
            setConfig(res.data.config)
            // const list = res.data
            // setList(list)
        }

    }

    async function add(files) {
        let res = await request.post(`${config.host}/git/add`, {
            projectPath,
            files,
            // files: [path],
        })
        // console.log('res', res)
        if (res.success) {
            loadStatuses()
            event$.emit({
                type: 'event_reload_history',
                data: {
                    commands: res.data.commands,
                }
            })
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
            loadStatuses()
            event$.emit({
                type: 'event_reload_history',
                data: {
                    commands: res.data.commands,
                }
            })
        }
    }

    async function removeFile(path) {
        Modal.confirm({
            // title: 'Confirm',
            // icon: <ExclamationCircleOutlined />,
            title: `确认删除文件「${path}」?`,
            content: '这个文件不在版本控制内，若被删除，将无法找回',
            async onOk() {
                let res = await request.post(`${config.host}/git/deleteFile`, {
                    projectPath,
                    filePath: path,
                })
                // console.log('res', res)
                if (res.success) {
                    // loadList()
                    // setDiffText(res.data.content)
                    loadStatuses()
                }
            }
        })
    }

    async function checkoutFile(path) {
        Modal.confirm({
            // title: 'Confirm',
            // icon: <ExclamationCircleOutlined />,
            content: `确认丢弃文件「${path}」的所有更改?`,
            async onOk() {
                let res = await request.post(`${config.host}/git/checkoutFile`, {
                    projectPath,
                    filePath: path,
                })
                // console.log('res', res)
                if (res.success) {
                    // loadList()
                    // setDiffText(res.data.content)
                    loadStatuses()
                    event$.emit({
                        type: 'event_reload_history',
                        data: {
                            commands: res.data.commands,
                        }
                    })
                }
            }
        })
    }
    
    async function cat(path) {
        setCurFile(path)
        setCurFileType('')
        setDiffText('')
        let res = await request.post(`${config.host}/git/cat`, {
            projectPath,
            filePath: path,
        })
        // console.log('res', res)
        if (res.success) {
            // loadList()
            setDiffText(res.data.content)
            event$.emit({
                type: 'event_reload_history',
                data: {
                    commands: res.data.commands,
                }
            })
        }
    }

    async function diff(path, cached = false) {
        setCurFile(path)
        setCurFileType(cached ? 'cached' : '')
        setDiffText('')
        let res = await request.post(`${config.host}/git/diff`, {
            projectPath,
            file: path,
            cached,
        })
        // console.log('res', res)
        if (res.success) {
            // loadList()
            setDiffText(res.data.content)
            event$.emit({
                type: 'event_reload_history',
                data: {
                    commands: res.data.commands,
                }
            })
        }
    }

    return (
        <div className={styles.statusBox}>
            {/* <div>状态:</div> */}
            {!!status &&
                <>
                    <div className={styles.layoutTop}>
                        {canCommit &&
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
                                        <div className={styles.title}>{t('git.staged')}</div>
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
                                        <div className={styles.title}>{t('git.unstage')}</div>
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
                                                            {item.working_dir == '?' ?
                                                                <div className={classNames(styles.icon, styles.added)}>
                                                                    <QuestionOutlined />
                                                                </div>
                                                            : item.working_dir == 'M' ?
                                                                <div className={classNames(styles.icon, styles.modified)}>
                                                                    <EllipsisOutlined />
                                                                </div>
                                                            : item.working_dir == 'D' ?
                                                                <div className={classNames(styles.icon, styles.deleted)}>
                                                                    <MinusOutlined />
                                                                </div>
                                                            :
                                                                <Tag>{item.working_dir}</Tag>
                                                            }
                                                            <div className={styles.path}>{item.path}</div></div>
                                                            {/* <Button
                                                                size="small"
                                                                onClick={() => {
                                                                    checkoutFile(item.path)
                                                                }}
                                                            >
                                                                checkout</Button> */}
                                                            <Dropdown
                                                                trigger={['click']}
                                                                overlay={
                                                                    <Menu
                                                                        items={[
                                                                            ...(item.working_dir == '?' ? [
                                                                                {
                                                                                    label: t('git.delete_file'),
                                                                                    key: 'remove_file',
                                                                                },
                                                                            ] : [
                                                                                {
                                                                                    label: t('git.discard_change'),
                                                                                    key: 'key_checkout_file',
                                                                                },
                                                                            ])
                                                                        ]}
                                                                        onClick={({ key }) => {
                                                                            if (key == 'key_checkout_file') {
                                                                                checkoutFile(item.path)
                                                                            }
                                                                            if (key == 'remove_file') {
                                                                                removeFile(item.path)
                                                                            }
                                                                            
                                                                        }}
                                                                    />
                                                                }
                                                            >
                                                                <IconButton
                                                                    onClick={e => e.preventDefault()}
                                                                >
                                                                    <EllipsisOutlined />
                                                                </IconButton>
                                                            </Dropdown>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        }
                        <div className={styles.layoutRight}>
                            {!canCommit &&
                                <FullCenterBox>
                                    <Empty
                                        description={t('git.submit.empty')}
                                    />
                                </FullCenterBox>
                            }
                            {!!diffText &&
                                <>
                                    <div className={styles.header}>
                                        {curFile}
                                    </div>
                                    <div className={styles.body}>
                                        <DiffText
                                            text={diffText}
                                        />
                                    </div>
                                </>
                                // <pre>{diffText}</pre>
                            }
                        </div>

                    </div>
                    {canCommit &&
                        <div className={styles.layoutBottom}>
                            {/* <hr /> */}
                            <Commit
                                gitConfig={gitConfig}
                                config={config}
                                event$={event$}
                                projectPath={projectPath}
                                stagedLength={status.staged.length}
                                onSuccess={() => {
                                    // loadList()
                                    onTab && onTab()
                                    loadStatuses()
                                    event$.emit({
                                        type: 'event_refresh_commit_list',
                                        data: {},
                                    })
                                }}
                            />
                        </div>
                    }
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
