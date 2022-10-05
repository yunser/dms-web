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

interface File {
    name: string
}

export function FileDetail({ config, path, sourceType, onCancel }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [content, setContent] = useState('')
    const isImage = path.endsWith('.png') 
        || path.endsWith('.jpg') 
        || path.endsWith('.svg')
        || path.endsWith('.gif')
        || path.endsWith('.webp')
    const isMarkdown = path.endsWith('.md')
    const isAudio = path.endsWith('.mp3')
    const isVideo = path.endsWith('.mp4')

    const isText = !isImage && !isAudio && !isVideo

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
            setContent(res.data.content)
        }
        setLoading(false)
    }




    useEffect(() => {
        // hack 经常会因为 path 为空接口报错
        if (!path) {
            return
        }
        if (isText) {
            loadDetail()
        }
    }, [path, isText])

    return (
        <Modal
            title={path}
            open={true}
            width={800}
            onCancel={onCancel}
            footer={null}
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
                    <div className={styles.article} dangerouslySetInnerHTML={{
                        __html: marked.parse(content)
                    }}>

                    </div>
                </div>
            : isVideo ?
                <div className={styles.videoBox}>
                    <video
                        className={styles.video}
                        src={`${config.host}/file/imagePreview?sourceType=${sourceType}&path=${encodeURIComponent(path)}`}
                        controls
                        autoPlay
                    ></video>
                    <div className={styles.article} dangerouslySetInnerHTML={{
                        __html: marked.parse(content)
                    }}>

                    </div>
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
                <pre>{content}</pre>
            }
        </Modal>
    )
}
