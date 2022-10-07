import { Button, Descriptions, Dropdown, Empty, Input, Menu, message, Modal, Popover, Space, Spin, Table, Tabs, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './file-detail.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { DownloadOutlined, EllipsisOutlined, FileOutlined, FolderOutlined, LeftOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
import { request } from '@/views/db-manager/utils/http';
import { IconButton } from '@/views/db-manager/icon-button';
import { FullCenterBox } from '@/views/db-manager/redis-client';
import moment from 'moment';
// import { saveAs } from 'file-saver'
import filesize from 'file-size'
import { FileList } from '../file-list'
import { marked } from 'marked'
import { FileUtil } from '../utils/utl';
import { Editor } from '@/views/db-manager/editor/Editor';

interface File {
    name: string
}

export function FileDetail({ config, path, sourceType, onCancel }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [loading, setLoading] = useState(true)
    const [content, setContent] = useState('')
    const contentRef = useRef('')
    const isImage = FileUtil.isImage(path)
    const isMarkdown = path.endsWith('.md')
    const isAudio = path.endsWith('.mp3')
    const isVideo = path.endsWith('.mp4')

    const isPureText = !isImage && !isAudio && !isVideo && !isMarkdown

    async function loadDetail() {
        setLoading(true)
        let res = await request.post(`${config.host}/file/read`, {
            path,
            sourceType,
        }, {
            // noMessage: true,
        })
        // console.log('res', res)
        if (res.success) {
            // console.log('res.data.content', res.data.content)
            const content = res.data.content
            setContent(content)
            // console.log('degg/setCOntent', content)
            contentRef.current = content
        }
        setLoading(false)
    }


    // console.log('content', content)
    // console.log('md', marked.parse('123'))

    useEffect(() => {
        console.log('degg/useEffect', path, isPureText)
        // hack 经常会因为 path 为空接口报错
        if (!path) {
            return
        }
        if (isPureText || isMarkdown) {
            loadDetail()
        }
        else {
            setLoading(false)
        }
    }, [path, isPureText])

    return (
        <Modal
            title={path}
            open={true}
            width={isPureText ? 1200 : 800}
            centered={isPureText}
            onCancel={onCancel}
            footer={null}
            destroyOnClose={true}
        >
            {loading ?
                <FullCenterBox>
                    <Spin />
                </FullCenterBox>
            : isAudio ?
                <div className={styles.audioBox}>
                    <audio
                        className={styles.video}
                        src={`${config.host}/file/imagePreview?sourceType=${sourceType}&path=${encodeURIComponent(path)}`}
                        controls
                        autoPlay
                    ></audio>
                </div>
            : isVideo ?
                <div className={styles.videoBox}>
                    <video
                        className={styles.video}
                        src={`${config.host}/file/imagePreview?sourceType=${sourceType}&path=${encodeURIComponent(path)}`}
                        controls
                        autoPlay
                    ></video>
                </div>
            : isMarkdown ?
                <div>
                    <div className={styles.article} dangerouslySetInnerHTML={{
                        __html: marked.parse(content)
                    }}>

                    </div>
                </div>
            : isImage ?
                <div className={styles.imgBox}>
                    <img 
                        className={styles.img} 
                        src={`${config.host}/file/imagePreview?sourceType=${sourceType}&path=${encodeURIComponent(path)}`}
                    />
                </div>
                // file:///Users/yunser/Desktop/face.jpg
            : content == '' ?
                <FullCenterBox>
                    <Empty />
                </FullCenterBox>
            :
                <div className={styles.editorBox}>
                    <Editor
                        // lang="plain"
                        value={content}
                        autoFocus={false}
                        // value=""
                        // event$={event$}
                        // onChange={value => setCodeASD(value)}
                        // autoFoucs={true}
                        // destroy={true}
                        // onEditor={editor => {
                        //     // setEditor(editor)
                        //     // console.log('degg', content == contentRef.current, content, contentRef.current)
                        //     editor.setValue(content)
                        //     // content
                        // }}
                        // onSelectionChange={({selection, selectionTextLength}) => {
                        //     console.log('selection', selection)
                        //     selectionEvent.emit({
                        //         data: {
                        //             selection: {
                        //                 ...selection,
                        //                 textLength: selectionTextLength,
                        //             }
                        //         }
                        //     })
                        // }}
                    />
                </div>
                // <pre>{content}</pre>
            }
        </Modal>
    )
}
