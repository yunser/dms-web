import { Button, Checkbox, Descriptions, Dropdown, Empty, Form, Input, Menu, message, Modal, Popover, Select, Space, Spin, Table, Tabs, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './git-status.module.less';
import _, { add } from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { DownloadOutlined, EllipsisOutlined, MinusOutlined, QuestionOutlined, ReloadOutlined, UserOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
import { request } from '@/views/db-manager/utils/http';
import { DiffText } from '../git-diff';
import { IconButton } from '@/views/db-manager/icon-button';
import { FullCenterBox } from '@/views/common/full-center-box';
import { FileUtil } from '@/views/file/utils/utl';
import copy from 'copy-to-clipboard';
import { UserEditModal } from '@/views/db-manager/user-list/user-edit';
import { GitAuthorEditModal } from '../user-edit-modal';
// import { saveAs } from 'file-saver'

function CommonErrorMessageBox({ message }) {
    return (
        <div className={styles.commonErrorBox}>
            <pre>{message}</pre>
        </div>
    )
}

function Commit({ config, event$, stagedLength, gitConfig, onUpdateGitConfig, projectPath, onSuccess }) {
    const { t } = useTranslation()
    const [infoVisible, setInfoVisible] = useState(false)
    const [userEditVisible, setUserEditVisible] = useState(false)
    const [pushRemote, setPushRemote] = useState(false)
    const [commitLoading, setCommitLoading] = useState(false)
    const [commitOptions, setCommitOptions] = useState('')
    const [error, setError] = useState('')
    const [formData, setFormData] = useState({
        message: '',
    })
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
        }
    }

    
    useEffect(() => {
        // loadRemotes()
        loadBranches()
    }, [])
    
    async function submit() {
        if (!formData.message) {
            message.warn('Message required')
            return
        }
        // const values = await form.validateFields()
        // console.log('msg', values)
        setCommitLoading(true)
        let res = await request.post(`${config.host}/git/commit`, {
            projectPath,
            message: formData.message,
            amend: commitOptions == 'amend',
            pushRemote,
            remoteName: 'origin',
            branchName: current,
        }, {
            noMessage: true
        })
        setCommitLoading(false)
        if (res.success) {
            // message.success('success')
            onSuccess && onSuccess()
            setFormData({
                message: '',
            })
            setCommitOptions('')
            event$.emit({
                type: 'event_reload_history',
                data: {
                    commands: res.data.commands,
                }
            })
            // setStatus(res.data.status)
            // setCurrent(res.data.current)

            // if (pushRemote) {
            //     let res2 = await request.post(`${config.host}/git/push`, {
            //         projectPath,
            //         // remoteName: values.remoteName,
            //         remoteName: 'origin',
            //         branchName: current,
            //     }, {
            //         // noMessage: true,
            //     })
            //     if (res2.success) {
            //         event$.emit({
            //             type: 'event_reload_history',
            //             data: {
            //                 commands: res.data.commands,
            //             }
            //         })
            //     }
            // }
        }
        else {
            setError(res.data.message)
        }
    }

    return (
        <div className={styles.commitBox}>
            {!!gitConfig && infoVisible &&
                <div className={styles.header}>
                    <div 
                        className={styles.user}
                        onClick={() => {
                            setUserEditVisible(true)
                        }}
                    >
                        <UserOutlined />
                        {' '}
                        {gitConfig.user.name}
                        {' <'}{gitConfig.user.email}{'>'}
                    </div>
                    <Space>
                        <div className={styles.opts}>{t('git.commit_options')}:</div>
                        <Select
                            disabled={commitLoading}
                            className={styles.select}
                            size="small"
                            value={commitOptions}
                            onChange={value => {
                                setCommitOptions(value)
                            }}
                            options={[
                                {
                                    label: t('git.amend'),
                                    value: 'amend',
                                }
                            ]}
                        />
                    </Space>
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
                disabled={commitLoading}
                // placeholder={t('git.commit_message') + `, ${t('git.enter_to_commit')}`}
                placeholder={t('git.commit_message')}
                rows={infoVisible ? 4 : 1}
                onFocus={() => {
                    setInfoVisible(true)
                }}
                onKeyDown={e => {
                    // console.log('e', e.code)
                    if (e.code == 'Enter' && (e.metaKey || e.ctrlKey)) {
                        submit()
                    }
                }}
            />
            {infoVisible &&
                <div className={styles.button}>
                    <Space>
                        <Checkbox
                            checked={pushRemote}
                            disabled={commitLoading}
                            onClick={() => {
                                // console.log('add', item.path)
                                setPushRemote(!pushRemote)
                            }}
                        >
                            {t('git.push.now')} origin/{current}
                        </Checkbox>
                    </Space>
                    <Space>
                        <Button
                            // type="primary"
                            size="small"
                            onClick={() => {
                                setInfoVisible(false)
                            }}
                            disabled={commitLoading}
                        >{t('cancel')}</Button>
                        <Button
                            type="primary"
                            size="small"
                            loading={commitLoading}
                            disabled={!(((stagedLength > 0) || (commitOptions == 'amend')) && !commitLoading)}
                            onClick={() => {
                                submit()
                            }}
                        >{t('git.submit')}</Button>
                    </Space>
                </div>
            }
            {userEditVisible &&
                <GitAuthorEditModal
                    config={config}
                    projectPath={projectPath}
                    item={{
                        name: gitConfig?.user?.name || '',
                        email: gitConfig?.user?.email || '',
                    }}
                    onSuccess={() => {
                        setUserEditVisible(false)
                        onUpdateGitConfig && onUpdateGitConfig()
                    }}
                    onCancel={() => {
                        setUserEditVisible(false)
                    }}
                />
            }
            {!!error &&
                <Modal
                    title={t('error')}
                    open={true}
                    onCancel={() => {
                        setError('')
                    }}
                    // onOk={() => {
                    //     setError('')
                    // }}
                    width={800}
                    maskClosable={false}
                    footer={(
                        <div>
                            <Button
                                onClick={() => {
                                    setError('')  
                                }}
                            >
                                {t('close')}
                            </Button>
                        </div>
                    )}
                >
                    <CommonErrorMessageBox
                        message={error}
                    />
                </Modal>
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
    const [stagedList, setStagedList] = useState([])
    const [unstagedList, setUnstagedList] = useState([])
    const [diffItem, setDiffItem ] = useState(null)
    const [diffType, setDiffType ] = useState('text')
    const [diffText, setDiffText ] = useState('')
    const [diffError, setDiffError ] = useState('')
    const [diffLoading, setDiffLoading ] = useState(false)
    const canCommit = !(unstagedList.length == 0 && status?.staged?.length == 0)

    useEffect(() => {
        loadStatuses()
        getConfig()
    }, [])

    async function loadStatuses(lastFile?) {
        setCurFile('')
        setDiffText('')
        let res = await request.post(`${config.host}/git/status`, {
            projectPath,
            // connectionId,
            // sql: lineCode,
            // tableName,
            // dbName,
            // logger: true,
        })
        // console.log('res', res)
        if (res.success) {
            const { status } = res.data
            setStatus(status)
            // setCurrent(res.data.current)
            // status.deleted: 删除的文件，暂存后不为空
            // status.conflicted: 有冲突的文件，冲突解决暂存后为空，取消暂存恢复冲突后也为空
            // status.staged: 已暂存的文件
            // status.renamed: 重命名的文件
            // status.modified: 修改过内容的文件，暂存后不为空
            // status.not_added: 未添加到 git 跟踪的文件，暂存后为空，放到 status.created
            // status.created: 新添加的，且暂存后的文件
            // status.files: 所有文件，暂存和未暂存的
            // 
            // files 示例：
            // [
            //     {
            //         "path": "delete-test.md",
            //         "index": " ",
            //         "working_dir": "D"
            //     },
            //     {
            //         "path": "modify-test.md",
            //         "index": " ",
            //         "working_dir": "M"
            //     },
            //     {
            //         "path": "rename-test.md",
            //         "index": "R",
            //         "working_dir": " "
            //     },
            //     {
            //         "path": "new-test.md",
            //         "index": "?",
            //         "working_dir": "?"
            //     }
            // ],
            // 合并后，如果有冲突，已暂存的文件中，files 可能是：
            // [
            //     {
            //         "path": "README.md",
            //         "index": "U",
            //         "working_dir": "U"
            //     },
            //     {
            //         "path": "delete-test.md",
            //         "index": "A",
            //         "working_dir": " "
            //     },
            //     {
            //         "path": "modify-test.md",
            //         "index": "A",
            //         "working_dir": " "
            //     },
            //     {
            //         "path": "rename-test-old.md",
            //         "index": "A",
            //         "working_dir": " "
            //     },
            //     {
            //         "path": "tmp-a.md",
            //         "index": "A",
            //         "working_dir": " "
            //     },
            //     {
            //         "path": "tmp-b.md",
            //         "index": "A",
            //         "working_dir": " "
            //     },
            //     {
            //         "path": "new-test.md",
            //         "index": "?",
            //         "working_dir": "?"
            //     }
            // ]
            const _unstagedList = status.files.filter(item => {
                return !status.staged.includes(item.path) && !status.renamed.find(rItem => rItem.to == item.path)
            })
            if (_unstagedList.length) {
                if (lastFile) {
                    const prevIdx = unstagedList.findIndex(item => item.path == lastFile)
                    if (prevIdx == -1) {
                        handleClickItem(_unstagedList[0])
                    }
                    else {
                        if (_unstagedList[prevIdx]) {
                            handleClickItem(_unstagedList[prevIdx])
                        }
                        else {
                            handleClickItem(_unstagedList[0])
                        }
                    }
                }
                else {
                    handleClickItem(_unstagedList[0])
                }
            }
            setUnstagedList(_unstagedList)
            const _stagedList = status.files.filter(item => {
                return status.staged.includes(item.path) || status.renamed.find(rItem => rItem.to == item.path)
            })
            setStagedList(_stagedList)
        }
    }

    function handleClickItem(item) {
        if (item.working_dir == '?') {
            setDiffItem(item)
            cat(item.path)
        }
        else {
            setDiffItem(item)
            diff(item.path)
        }
    }

    event$.useSubscription(msg => {
        // console.log('CommitList/onmessage', msg)
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
        })
        if (res.success) {
            setConfig(res.data.config)
            // const list = res.data
            // setList(list)
        }

    }

    async function addItem(files, activeNext = false) {
        let res = await request.post(`${config.host}/git/add`, {
            projectPath,
            files,
            // files: [path],
        })
        // console.log('res', res)
        if (res.success) {
            loadStatuses(activeNext ? files[0] : null)
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

    async function discardFile(filePath, line) {
        let res = await request.post(`${config.host}/git/fileDiscard`, {
            projectPath,
            filePath,
            line: line.line - 1,
            type: line.type,
            lineContent: line.content,
        })
        if (res.success) {
            diff(filePath)
        }
    }

    async function fileConflictResolve(filePath, params) {
        const { start, center, end, type } = params
        let res = await request.post(`${config.host}/git/fileConflictResolve`, {
            projectPath,
            ...params,
            filePath,
            start,
            center,
            end,
            type,
        })
        if (res.success) {
            diff(filePath)
        }
    }

    async function removeFile(path) {
        Modal.confirm({
            // title: 'Confirm',
            // icon: <ExclamationCircleOutlined />,
            title: `${t('git.file.delete_confirm')}「${path}」?`,
            content: t('git.file.delete_help'),
            okButtonProps: {
                danger: true,
            },
            async onOk() {
                let res = await request.post(`${config.host}/git/deleteFile`, {
                    projectPath,
                    filePath: path,
                })
                // console.log('res', res)
                if (res.success) {
                    // loadList()
                    loadStatuses()
                }
            }
        })
    }

    async function openInFinder(path: string) {
        let ret = await request.post(`${config.host}/file/openInFinder`, {
            path,
        })
    }

    async function openInVsCode(path: string) {
        let ret = await request.post(`${config.host}/file/openInVsCode`, {
            path,
        })
    }
    
    async function openInIdea(path: string) {
        let ret = await request.post(`${config.host}/file/openInIdea`, {
            path,
        })
    }

    async function checkoutFile(path) {
        Modal.confirm({
            content: `${t('git.file.discard_confirm')}「${path}」?`,
            okButtonProps: {
                danger: true,
            },
            async onOk() {
                let res = await request.post(`${config.host}/git/checkoutFile`, {
                    projectPath,
                    filePath: path,
                })
                // console.log('res', res)
                if (res.success) {
                    // loadList()
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
        setDiffLoading(true)
        setCurFile(path)
        setCurFileType('')
        setDiffText('')
        setDiffType('')
        setDiffError('')
        if (FileUtil.isImage(path)) {
            console.log('img', path)
            const filePath = projectPath + config.pathSeparator + path
            setDiffType('image')
            setDiffText(`${config.host}/file/imagePreview?sourceType=local&path=${encodeURIComponent(filePath)}`)
        }
        else {
            let res = await request.post(`${config.host}/git/cat`, {
                projectPath,
                filePath: path,
                sizeLimit: 1 * 1024 * 1024,
            }, {
                noMessage: true,
            })
            // console.log('res', res)
            if (res.success) {
                // loadList()
                setDiffType('text')
                setDiffText(res.data.content)
                event$.emit({
                    type: 'event_reload_history',
                    data: {
                        commands: res.data.commands,
                    }
                })
            }
            else {
                console.log('res?', res)
                setDiffError(res.data?.message || 'error')
            }
        }
        setDiffLoading(false)
    }

    async function diff(path, cached = false) {
        setDiffLoading(true)
        setCurFile(path)
        setCurFileType(cached ? 'cached' : '')
        setDiffType('')
        setDiffText('')
        setDiffError('')
        let res = await request.post(`${config.host}/git/diff`, {
            projectPath,
            file: path,
            cached,
        })
        // console.log('res', res)
        if (FileUtil.isImage(path)) {
            console.log('img', path)
            const filePath = projectPath + config.pathSeparator + path.replace(/\//g, config.pathSeparator)
            setDiffType('image')
            setDiffText(`${config.host}/file/imagePreview?sourceType=local&path=${encodeURIComponent(filePath)}`)
        }
        else {
            if (res.success) {
                // loadList()
                setDiffType('text')
                setDiffText(res.data.content)
                event$.emit({
                    type: 'event_reload_history',
                    data: {
                        commands: res.data.commands,
                    }
                })
            }
        }
        setDiffLoading(false)
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
                                            disabled={stagedList.length == 0}
                                            onClick={() => {
                                                // console.log('add', item.path)
                                                reset(stagedList.map(item => item.path))
                                            }}
                                        />
                                        <div className={styles.title}>{t('git.staged')}</div>
                                    </div>
                                    <div className={styles.body}>
                                        <div className={styles.list}>
                                            {stagedList.map(item => {
                                                return (
                                                    <div
                                                        className={classNames(styles.item, {
                                                            [styles.active]: item.path == curFile && curFileType == 'cached'
                                                        })}
                                                        key={item.path}
                                                    >
                                                        <Checkbox
                                                            checked
                                                            disabled={item.index == 'R'}
                                                            onClick={() => {
                                                                console.log('add', item.path)
                                                                reset([item.path])
                                                            }}
                                                        />
                                                        <div className={styles.fileName}
                                                            onClick={() => {
                                                                diff(item.path, true)
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
                                                            : item.index == 'R' ?
                                                                <div className={classNames(styles.icon, styles.modified)}>
                                                                    <div>R</div>
                                                                </div>
                                                            : item.index == 'A' ?
                                                                <div className={classNames(styles.icon, styles.added)}>
                                                                    <div>A</div>
                                                                </div>
                                                            : item.index == 'U' ?
                                                                <div className={classNames(styles.icon, styles.modified)}>
                                                                    <div>U</div>
                                                                </div>
                                                            : item.working_dir == 'D' ?
                                                                <div className={classNames(styles.icon, styles.deleted)}>
                                                                    <MinusOutlined />
                                                                </div>
                                                            :
                                                                <Tag>{item.working_dir}</Tag>
                                                            }
                                                            <div className={styles.path}>{item.path}</div>
                                                        </div>
                                                        <Dropdown
                                                            trigger={['click']}
                                                            overlay={
                                                                <Menu
                                                                    items={[
                                                                        {
                                                                            label: t('file.open_in_file_manager'),
                                                                            key: 'finder',
                                                                        },
                                                                    ]}
                                                                    onClick={({ key }) => {
                                                                        if (key == 'finder') {
                                                                            console.log('item', item.path)
                                                                            openInFinder(projectPath + config.pathSeparator + item.path.replace(/\//g, config.pathSeparator))
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
                                <div className={classNames(styles.section, styles.section2)}>
                                    <div className={styles.header}>
                                        <Checkbox
                                            checked={false}
                                            disabled={unstagedList.length == 0}
                                            onClick={() => {
                                                // console.log('add', item.path)
                                                addItem(unstagedList.map(item => item.path))
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
                                                                addItem([item.path], true)
                                                            }}
                                                        />
                                                        <div className={styles.fileName}
                                                            onClick={() => {
                                                                handleClickItem(item)
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
                                                            : item.index == 'R' ?
                                                                <div className={classNames(styles.icon, styles.modified)}>
                                                                    <div>R</div>
                                                                </div>
                                                            : item.working_dir == 'D' ?
                                                                <div className={classNames(styles.icon, styles.deleted)}>
                                                                    <MinusOutlined />
                                                                </div>
                                                            :
                                                                <Tag>{item.working_dir}</Tag>
                                                            }
                                                            <div className={styles.path}>{item.path}</div>
                                                        </div>
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
                                                                                danger: true,
                                                                                key: 'remove_file',
                                                                            },
                                                                        ] : [
                                                                            {
                                                                                label: t('git.discard_change'),
                                                                                danger: true,
                                                                                key: 'key_checkout_file',
                                                                            },
                                                                        ]),
                                                                        {
                                                                            label: t('file.open_in_file_manager'),
                                                                            key: 'finder',
                                                                        },
                                                                        {
                                                                            label: t('file.open_in_vscode'),
                                                                            key: 'open_in_vscode',
                                                                        },
                                                                        {
                                                                            label: t('file.open_in_idea'),
                                                                            key: 'open_in_idea',
                                                                        },
                                                                        {
                                                                            label: t('copy_path'),
                                                                            key: 'copy_path',
                                                                        },
                                                                        {
                                                                            label: t('copy_relative_path'),
                                                                            key: 'copy_relative_path',
                                                                        },
                                                                    ]}
                                                                    onClick={({ key }) => {
                                                                        const fullPath = projectPath + config.pathSeparator + item.path.replace(/\//g, config.pathSeparator)
                                                                        if (key == 'key_checkout_file') {
                                                                            checkoutFile(item.path)
                                                                        }
                                                                        else if (key == 'remove_file') {
                                                                            removeFile(item.path)
                                                                        }
                                                                        else if (key == 'finder') {
                                                                            openInFinder(fullPath)
                                                                        }
                                                                        else if (key == 'open_in_vscode') {
                                                                            openInVsCode(fullPath)
                                                                        }
                                                                        else if (key == 'open_in_idea') {
                                                                            openInIdea(fullPath)
                                                                        }
                                                                        else if (key == 'copy_path') {
                                                                            copy(fullPath)
                                                                            message.info(t('copied'))
                                                                        }
                                                                        else if (key == 'copy_relative_path') {
                                                                            copy(item.path)
                                                                            message.info(t('copied'))
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
                            {diffLoading ?
                                <FullCenterBox>
                                    <Spin />
                                </FullCenterBox>
                            : !!diffError ?
                                <FullCenterBox>
                                    <div className={styles.errorBox}>
                                        {diffError}
                                    </div>
                                </FullCenterBox>
                            : diffType == 'image' ?
                                <>
                                    <div className={styles.header}>
                                        <div className={styles.path}>
                                            {curFile}
                                        </div>
                                        {!!diffItem && diffItem.working_dir == 'M' &&
                                            <div className={styles.after}>{t('git.after')}</div>
                                        }
                                    </div>
                                    <div className={styles.body}>
                                        <div className={styles.imgBox}>
                                            <img src={diffText} />
                                        </div>
                                    </div>
                                </>
                            :
                                <>
                                    <div className={styles.header}>
                                        <div className={styles.path}>{curFile}</div>
                                        <div>
                                            <IconButton
                                                size="small"
                                                className={styles.refresh}
                                                onClick={() => {
                                                    handleClickItem(diffItem)
                                                }}
                                            >
                                                <ReloadOutlined />
                                            </IconButton>
                                        </div>
                                    </div>
                                    <div className={styles.body}>
                                        <DiffText
                                            text={diffText}
                                            editable={true}
                                            onDiscard={(line) => {
                                                discardFile(curFile, line)
                                            }}
                                            onConflictResolve={(params) => {
                                                fileConflictResolve(curFile, params)
                                            }}
                                        />
                                    </div>
                                </>
                            }
                        </div>

                    </div>
                    {canCommit &&
                        <div className={styles.layoutBottom}>
                            {/* <hr /> */}
                            <Commit
                                gitConfig={gitConfig}
                                onUpdateGitConfig={() => {
                                    getConfig()
                                }}
                                config={config}
                                event$={event$}
                                projectPath={projectPath}
                                stagedLength={stagedList.length}
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
