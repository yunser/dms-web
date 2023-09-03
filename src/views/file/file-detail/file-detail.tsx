import { Button, Empty, message, Modal, Space, Spin } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './file-detail.module.less';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { request } from '@/views/db-manager/utils/http';
import { marked } from 'marked'
import { FileUtil } from '../utils/utl';
import { Editor } from '@/views/db-manager/editor/Editor';
import { ZipList } from '../zip-list';
import { pdfjs, Document, Page } from 'react-pdf'
import { read, utils } from "xlsx";
import copy from 'copy-to-clipboard';
import { FullCenterBox } from '@/views/common/full-center-box';

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
                className={styles.pdfDoc}
                file={src}
                // file={'https://yunser-public.oss-cn-hangzhou.aliyuncs.com/pdf-article.pdf'}
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

function XlsxViewer({ src }) {
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [table, setTable] = useState({
        header: [],
        body: [],
    })
    // async function process_RS(stream) {
    //     /* collect data */
    //     const buffers = [];
    //     const reader = stream.getReader();
    //     for(;;) {
    //       const res = await reader.read();
    //       if(res.value) buffers.push(res.value);
    //       if(res.done) break;
    //     }
      
    //     /* concat */
    //     const out = new Uint8Array(buffers.reduce((acc, v) => acc + v.length, 0));
      
    //     let off = 0;
    //     for(const u8 of arr) {
    //       out.set(u8, off);
    //       off += u8.length;
    //     }
      
    //     return out;
    //   }
    
    function dealWorkBook(wb) {
        //wb.SheetNames[0]是获取Sheets中第一个Sheet的名字
        //wb.Sheets[Sheet名]获取第一个Sheet的数据
        let result = utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])
        // console.log(result)
        // console.log('result', result)
        if (result.length) {
            const header = Object.keys(result[0])
            const body = []
            for (let item of result) {
                const row = header.map(key => item[key])
                // for (let key of header) {
                //     row.push()
                // }
                body.push(row)
                
            }
            setTable({
                header,
                body,
            })

        }
    }
        // function arr2arr (arr) {
        //     console.log('before', arr)
        //     let result = []
        //     let keys = []
        //     for (let key in arr[0]) {
        //         keys.push(key)
        //     }
        //     result.push(keys)
        //     for (let item of arr) {
        //         console.log('item', item)
        //         let newItem = []
        //         for (let key of keys) {
        //             console.log('key', key)
        //             newItem.push(item[key])
        //         }
        //         result.push(newItem)
        //     }
        //     console.log('after', result)
        //     return result
        // }

    async function readData() {
        setLoading(true)
        fetch(src)
            .then(async res => {
                // console.log('res', res)
                return res.arrayBuffer()
                // const u8aData = await process_RS(res.body)
                // const workbook = read(u8aData)
                // console.log('workbook', workbook)
            })
            .then(res => {
                // console.log('res2', res)
                const workbook = read(res, {
                    type: 'binary',
                })
                // console.log('workbook', workbook)
                dealWorkBook(workbook)
                setLoading(false)
            })
            .catch(() => {
                setLoading(false)
                message.error(t('fail'))
            })
    }

    useEffect(() => {
        readData()
    }, [src])
    // const workbook = read('', {
    //     // type: type?: 'base64' | 'binary' | 'buffer' | 'file' | 'array' | 'string';
        
    // })
    return (
        <div>
            {loading ?
                <Spin />
            :
                <div className={styles.tableBox}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                {table.header.map((cell, idx) => {
                                    return (
                                        <th key={idx}>{cell}</th>
                                    )
                                })}
                            </tr>
                        </thead>
                        <tbody>
                            {table.body.map((row, idx) => {
                                return (
                                    <tr key={idx}>
                                        {row.map((cell, idx) => {
                                            return (
                                                <td
                                                    key={idx}
                                                >{cell}</td>
                                            )
                                        })}
                                        {/* <td>1</td> */}
                                    </tr>
                                )
                            })}
                            {/* <tr>
                                <td>1</td>
                                <td>1</td>
                            </tr> */}
                        </tbody>
                    </table>
                </div>
            }
        </div>
    )
}

function TableViewer({ content }) {

    const table = useMemo(() => {
        return content.split('\n').map(line => line.split(','))
    }, [content])

    return (
        <div>
            <div className={styles.tableBox}>
                <table className={styles.table}>
                    {/* <thead>
                        <tr>
                            {table.header.map((cell, idx) => {
                                return (
                                    <th key={idx}>{cell}</th>
                                )
                            })}
                        </tr>
                    </thead> */}
                    <tbody>
                        {table.map((row, idx) => {
                            return (
                                <tr key={idx}>
                                    {row.map((cell, idx) => {
                                        return (
                                            <td
                                                key={idx}
                                            >{cell}</td>
                                        )
                                    })}
                                    {/* <td>1</td> */}
                                </tr>
                            )
                        })}
                        {/* <tr>
                            <td>1</td>
                            <td>1</td>
                        </tr> */}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export function FileDetail({ config, path, sourceType, onCancel, onMin, onEdit }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [loading, setLoading] = useState(true)
    const [content, setContent] = useState('')
    const contentRef = useRef('')
    const isImage = FileUtil.isImage(path)
    let mediaType = ''
    let isText = false
    if (isImage) {
        mediaType = 'image'
    }
    else if (path.endsWith('.mp4') || path.endsWith('.3gp') || path.endsWith('.webm')) {
        // || path.endsWith('.avi')
        // || path.endsWith('.flv')
        mediaType = 'video'
    }
    else if (path.endsWith('.mp3') || path.endsWith('.wav') || path.endsWith('.ogg') || path.endsWith('.m4a')) {
        // || path.endsWith('.mid'))
        mediaType = 'audio'
    }
    else if (path.endsWith('.pdf')) {
        mediaType = 'pdf'
    }
    else if (path.endsWith('.zip')) {
        mediaType = 'zip'
    }
    else if (path.endsWith('.csv')) {
        mediaType = 'csv'
        isText = true
    }
    else if (path.endsWith('.xlsx')) {
        mediaType = 'xlsx'
    }
    else if (path.endsWith('.md')) {
        mediaType = 'md'
        isText = true
    }
    else {
        isText = true
    }

    

    const isPureText = (mediaType != 'image') && (mediaType != 'audio') && !mediaType

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
            // console.log('content', content)
            setContent(content)
            // console.log('degg/setCOntent', content)
            contentRef.current = content
        }
        setLoading(false)
    }

    useEffect(() => {
        console.log('degg/useEffect', path, isPureText)
        // hack 经常会因为 path 为空接口报错
        if (!path) {
            return
        }
        if (isPureText || mediaType == 'md' || mediaType == 'zip') {
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
            footer={
                <Space>
                    <Button
                        onClick={() => {
                            onMin && onMin()       
                        }}
                    >
                        {t('minimize')}
                    </Button>
                    {isText &&
                        <Button
                            onClick={() => {
                                onEdit && onEdit()       
                            }}
                        >
                            {t('edit')}
                        </Button>
                    }
                </Space>
            }
            destroyOnClose={true}
        >
            {loading ?
                <FullCenterBox>
                    <Spin />
                </FullCenterBox>
            : mediaType == 'zip' ?
                <div>
                    <ZipList
                        config={config}
                        event$={null}
                        path={path}
                    />
                </div>
            : mediaType == 'csv' ?
                <div>
                    <TableViewer
                        content={content}
                    />
                </div>
            : mediaType == 'xlsx' ?
                <div>
                    <XlsxViewer
                        src={`${config.host}/file/imagePreview?sourceType=${sourceType}&path=${encodeURIComponent(path)}`}
                    />
                </div>
            : mediaType == 'audio' ?
                <div className={styles.audioBox}>
                    <audio
                        className={styles.video}
                        src={`${config.host}/file/imagePreview?sourceType=${sourceType}&path=${encodeURIComponent(path)}`}
                        controls
                        autoPlay
                    ></audio>
                </div>
            : mediaType == 'video' ?
                <div className={styles.videoBox}>
                    <video
                        className={styles.video}
                        src={`${config.host}/file/imagePreview?sourceType=${sourceType}&path=${encodeURIComponent(path)}`}
                        controls
                        autoPlay
                    ></video>
                </div>
            : mediaType == 'md' ?
                <div>
                    <div className={styles.article} dangerouslySetInnerHTML={{
                        __html: marked.parse(content)
                    }}>

                    </div>
                </div>
            : mediaType == 'pdf' ?
                <PdfViewer
                    src={`${config.host}/file/imagePreview?sourceType=${sourceType}&path=${encodeURIComponent(path)}`}
                />
            : mediaType == 'image' ?
                <ImageViewer
                    src={`${config.host}/file/imagePreview?sourceType=${sourceType}&path=${encodeURIComponent(path)}`}
                />
                // file:///Users/yunser/Desktop/face.jpg
            : content == '' ?
                <FullCenterBox>
                    <Empty />
                </FullCenterBox>
            :
                <div>
                    <div className={styles.toolBox}>
                        <Button
                            size="small" 
                            onClick={() => {
                                copy(content)
                                message.info(t('copied'))
                            }}
                        >
                            {t('copy')}
                        </Button>
                    </div>
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
                </div>
                // <pre>{content}</pre>
            }
        </Modal>
    )
}
