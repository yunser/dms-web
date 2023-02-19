import { Button, Descriptions, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Popover, Radio, Space, Spin, Table, Tabs, Tag, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './kafka-client.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { DownloadOutlined, EllipsisOutlined, KeyOutlined, PlusOutlined, ReloadOutlined, StarFilled } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
// import { GitProject } from '../git-project';
import { request } from '@/views/db-manager/utils/http';
// import { ProjectEditor } from '../project-edit';
import { IconButton } from '@/views/db-manager/icon-button';
import { FullCenterBox } from '@/views/common/full-center-box';
import moment from 'moment';
import { getGlobalConfig } from '@/config';
// import { saveAs } from 'file-saver'


export function KafkaClient({ onClickItem }) {
    // const { defaultJson = '' } = data

    const config = getGlobalConfig()
    const [socketType, setSocketType] = useState('udp_server')
    
    const [topics, setTopics] = useState([])

    const comData = useRef({
        // cursor: 0,
        connectTime: 0,
        connectionId: '',
    })

    async function loadTopics() {
        let res = await request.post(`${config.host}/kafka/topics`, {
            // connectionId,
        }, {
            // noMessage: true,
            // timeout: 2000,
        })
        if (res.success) {
            // setErr('')
            setTopics(res.data.list)
            // setCurSchema('')
        }
        else {
            // setErr('Connect rrror')
        }
    }

    async function init() {
        let res = await request.post(`${config.host}/kafka/init`, {
            // connectionId,
        }, {
            // noMessage: true,
            // timeout: 2000,
        })
        if (res.success) {
            loadTopics()
            // setErr('')
            // setCurSchema('')
        }
        else {
            // setErr('Connect rrror')
        }
    }

    useEffect(() => {

        init()
    }, [])

    return (
        <div className={styles.socketApp}>
            Kafka
            <div>
                topics:
                <div>
                    {topics.map(item => {
                        return (
                            <div>{item}</div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

