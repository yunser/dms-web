import { Button, Descriptions, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './help.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { request } from '../utils/http';
import { marked } from 'marked'

function Tester() {
    console.log(('Tester/render'))
    const [num, setNum] = useState(0)
    const [num2, setNum2] = useState(0)
    return (
        <div>
            {/* <div>{num}</div> */}
            <div>
                <Button
                    onClick={() => {
                        setNum(num + 1)
                        setNum2(num2 + 1)
                    }}
                >
                    +1
                </Button>
            </div>
        </div>
    )
}

export function Help(props) {
    // console.log('Help/props', props)
    const { config, event$, data = {} } = props
    // console.warn('Help/render')
    
    const { t } = useTranslation()
    const [docPath, setDocPath] = useState('')
    
    const [activeFile, setActiveFile] = useState(data.fileName ? `${data.fileName}.md` : 'README.md')
    const [loading, setLoading] = useState(true)
    const [content, setContent] = useState('')
    
    async function loadDocs() {
        let { success, data } = await request.post(`${config.host}/docs/path`, {
            // connectionId,
            // sql: lineCode,
            // tableName,
            // dbName,
            // logger: true,
        }, {
            noMessage: true,
        })
        // console.log('res', res)
        if (success) {
            console.log('文档', data)
            setDocPath(data.path)
        }
    }
    useEffect(() => {
        loadDocs()
    }, [])

    const files = [
        {
            title: 'DMS 介绍',
            name: 'README.md',
        },
        {
            title: 'Git',
            name: 'git.md',
        },
        {
            title: '编辑器',
            name: 'editor.md',
        },
        {
            title: 'JSON',
            name: 'json.md',
        },
        {
            title: 'Swagger',
            name: 'swagger.md',
        },
        {
            title: 'OSS',
            name: 'oss.md',
        },
    ]

    async function loadData() {
        if (!docPath) {
            return
        }
        setLoading(true)
        let res = await request.post(`${config.host}/file/read`, {
            path: `${docPath}/${activeFile}`,
            // sourceType,
        }, {
            // noMessage: true,
        })
        // console.log('res', res)
        if (res.success) {
            // console.log('res.data.content', res.data.content)
            const content = res.data.content
            // console.log('content', content)
            setContent(content)
            // console.log('degg/setCOntent', content)
            // contentRef.current = content
        }
        setLoading(false)
    }

    useEffect(() => {
        loadData()
    }, [activeFile, docPath])

    return (
        <div className={styles.layout}>
            <div className={styles.left}>
                <div className={styles.files}>
                    {files.map(item => {
                        return (
                            <div
                                className={classNames(styles.item, {
                                    [styles.active]: item.name == activeFile,
                                })}
                                onClick={() => {
                                    setActiveFile(item.name)
                                }}
                            >
                                <div className={styles.name}>{item.title}</div>
                            </div>
                        )
                    })}
                </div>
            </div>
            <div className={styles.right}>
                {!!content &&
                    <div className={styles.article} dangerouslySetInnerHTML={{
                        __html: marked.parse(content)
                    }}>

                    </div>
                }
                {false &&
                    <article className={styles.article}>
                        <h1>帮助</h1>
                        <p>如需帮助，请看 
                            {/* <a href="https://github.com/yunser/dms-public" target="_blank">文档</a> */}
                            <a
                                onClick={() => {
                                    event$.emit({
                                        type: 'event_open_folder',
                                        data: {
                                            path: docPath,
                                        }
                                    })
                                }}
                            > 文档</a>
                        </p>
                        <p>如有建议，请提 <a href="https://github.com/yunser/dms-public/issues" target="_blank">Issure</a></p>
                    </article>
                }
            </div>
        </div>
    )
}
