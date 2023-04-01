import { Button, Col, Descriptions, Dropdown, Empty, Input, Menu, message, Modal, Popover, Row, Space, Spin, Table, Tabs, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './git-graph.module.less';
import _, { cloneDeep } from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { BranchesOutlined, CopyOutlined, DownloadOutlined, EllipsisOutlined, ExportOutlined, PlusOutlined, TagOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
import { request } from '@/views/db-manager/utils/http';
import { DiffText } from '../git-diff';
import moment from 'moment';
import { FullCenterBox } from '@/views/common/full-center-box';
// import { saveAs } from 'file-saver'
import { Gitgraph } from '@gitgraph/react'
import { CopyButton } from '@/views/db-manager/copy-button';
import { IconButton } from '@/views/db-manager/icon-button';
import { ResetModal } from '../reset-modal';
import { TagEditor } from '../tag-edit';
import { BranchModal } from '../branch-modal';
import ReactEcharts from 'echarts-for-react';


export function GitGraph({ config, event$, projectPath, }) {
    const { t } = useTranslation()

    const [listLoading, setListLoading] = useState(false)
    const [result, setResult] = useState('')

    async function loadGraph() {
        setListLoading(true)
        let res = await request.post(`${config.host}/git/graph`, {
            projectPath,
        })
        if (res.success) {
            const { result } = res.data
            setResult(result.substring(0, 20000) + '\n...')
        }
        setListLoading(false)
    }

    useEffect(() => {
        loadGraph()
    }, [])

    // event$.useSubscription(msg => {
    //     // console.log('CommitList/onmessage', msg)
    //     // console.log(val);
    //     if (msg.type == 'event_refresh_commit_list') {
    //         // const { json } = msg.data
    //         // addJsonTab(json)
    //         loadList()
    //     }
    //     else if (msg.type == 'event_refresh_branch') {
    //         // const { json } = msg.data
    //         // addJsonTab(json)
    //         loadList()
    //     }
    // })

    return (
        <div className={styles.graphBox}>
            {listLoading ?
                <FullCenterBox>
                    <Spin />
                </FullCenterBox>
                : !result ?
                    <FullCenterBox
                    // height={160}
                    >
                        <Empty />
                    </FullCenterBox>
                    :
                    <div className={styles.result}>
                        {!!result &&
                            <pre>
                                {result}
                            </pre>
                        }
                    </div>
            }
        </div>
    )
}
