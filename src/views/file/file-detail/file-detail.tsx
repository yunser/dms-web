import { Button, Descriptions, Dropdown, Empty, Input, Menu, message, Modal, Pagination, Popover, Space, Spin, Table, Tabs, Tag } from 'antd';
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
import { ZipList } from '../zip-list';
import { pdfjs, Document, Page } from 'react-pdf'

interface File {
    name: string
}

// pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.12.313/pdf.worker.min.js'
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.js/2.12.313/pdf.worker.min.js'

function PdfViewer({ src }) {
    const [totalPage, setTotalPage] = useState(0);
    const [pageNumber, setPageNumber] = useState(1);
    const [pages, setPages] = useState([])

    function onDocumentLoadSuccess({ numPages }) {
        console.log('numPages', numPages)
        setTotalPage(numPages);
        const pages = []
        for (let i = 1; i <= numPages; i++) {
            pages.push({
                page: i,
            })
        }
        setPages(pages)
    }

    return (
        <div>
            {/* pdf: */}
            {/* <div>{src}</div> */}
            {/* <div></div> */}
            {/* <p>
                Page {pageNumber} of {totalPage}
            </p> */}
            {/* <Button>下一页</Button> */}
            {/* <Pagination
                current={pageNumber}
                pageSize={1}
                total={totalPage}
                onChange={page => {
                    setPageNumber(page)
                }}
            /> */}
            <Document
                // file={src}
                className={styles.pdfDoc}
                file={'https://yunser-public.oss-cn-hangzhou.aliyuncs.com/pdf-article.pdf'}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={err => {
                    console.log('onLoadError', err)
                }}
            >
                {pages.map(item => {
                    return (
                        <Page 
                            className={styles.page}
                            // pageNumber={pageNumber}
                            pageNumber={item.page}
                        />
                    )
                })}
            </Document>
        </div>
    )
}

function ImageViewer({ src }) {
    
    const [loading, setLoading] = useState(false)
    const boxRef = useRef(null)
    const imgRef = useRef(null)

    useEffect(() => {
        setLoading(true)
        const img = new Image()
        img.onload = () => {
            setLoading(false)
            console.log('imgRef', imgRef)
            // imgRef.current.src = img
            boxRef.current.appendChild(img)
        }
        img.src = src
    }, [src])

    return (
        <div>
            {loading ?
                <FullCenterBox>
                    <Spin />
                </FullCenterBox>
            :
                <div 
                    ref={boxRef}
                    className={styles.imgBox}
                ></div>
                // <img 
                //     ref={imgRef}
                //     className={styles.img} 
                //     // src={src}
                // />
            }
        </div>
    )
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
    const isPdf = path.endsWith('.pdf')
    const isVideo = path.endsWith('.mp4')
    const isZip = path.endsWith('.zip')

    

    const isPureText = !isImage && !isAudio && !isVideo && !isMarkdown
        && !isPdf

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
            console.log('content', content)
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
        if (isPureText || isMarkdown || isZip) {
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
            : isZip ?
                <div>
                    <ZipList
                        config={config}
                        event$={null}
                        path={path}
                    />
                </div>
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
            : isPdf ?
                <PdfViewer
                    src={`${config.host}/file/imagePreview?sourceType=${sourceType}&path=${encodeURIComponent(path)}`}
                />
            : isImage ?
                <ImageViewer
                    src={`${config.host}/file/imagePreview?sourceType=${sourceType}&path=${encodeURIComponent(path)}`}
                />
                // file:///Users/yunser/Desktop/face.jpg
            : content == '' ?
                <FullCenterBox>
                    <Empty />
                </FullCenterBox>
            :
                <div className={styles.editorBox}>
                    <Editor
                        lang={FileUtil.getLang(path)}
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
