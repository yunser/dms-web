import { Button, Descriptions, Dropdown, Empty, Input, Menu, message, Modal, Popover, Space, Spin, Table, Tabs, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './file-info.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import { request } from '@/views/db-manager/utils/http';
import { FullCenterBox } from '@/views/db-manager/redis-client';
import moment from 'moment';
// import { saveAs } from 'file-saver'
import { FileUtil } from '../utils/utl';

interface File {
    name: string
}

export function FileInfo({ config, path, sourceType, onCancel }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [loading, setLoading] = useState(false)
    const [stat, setStat] = useState(null)
    const isImage = FileUtil.isImage(path)
    const isMarkdown = path.endsWith('.md')
    const isAudio = path.endsWith('.mp3')
    const isVideo = path.endsWith('.mp4')


    async function loadDetail() {
        setLoading(true)
        let res = await request.post(`${config.host}/file/stat`, {
            path,
            sourceType,
        }, {
            // noMessage: true,
        })
        // console.log('res', res)
        if (res.success) {
            setStat(res.data.stat)
        }
        setLoading(false)
    }

    useEffect(() => {
        // hack 经常会因为 path 为空接口报错
        if (!path) {
            return
        }
        loadDetail()
    }, [path])

    return (
        <Modal
            title={path}
            open={true}
            // width={800}
            onCancel={onCancel}
            footer={null}
        >
            {loading ?
                <FullCenterBox>
                    <Spin />
                </FullCenterBox>
            :
                <div>
                    {!!stat &&
                        <Descriptions column={1}>
                            {/* <Descriptions.Item
                                label="创建时间"
                            >
                                {moment(stat.birthtime).format('YYYY-MM-DD HH:mm:ss')}
                            </Descriptions.Item> */}
                            <Descriptions.Item
                                label="修改时间"
                            >
                                {moment(stat.modifyTime).format('YYYY-MM-DD HH:mm:ss')}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label="模式"
                            >
                                {stat.mode}
                            </Descriptions.Item>
                        </Descriptions>
                    }
                </div>
            }
        </Modal>
    )
}
