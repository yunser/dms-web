import { Button, Col, Descriptions, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Popover, Row, Space, Spin, Table, Tabs, Tag, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './ip-home.module.less';
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
// import { saveAs } from 'file-saver'

function ExpireTimeRender(value) {
    const m = moment(value)
    let color
    if (m.isBefore(moment().add(7, 'days'))) {
        color = 'red'
    }
    else if (m.isBefore(moment().add(30, 'days'))) {
        color = 'orange'
    }
    return (
        <div style={{ color }}>{m.format('YYYY-MM-DD HH:mm:ss')}</div>
    )
}

export function IpHome({ tabKey, config, onClickItem }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [curIp, setCurIp] = useState('--')
    
    async function loadData() {
        let res = await request.get('https://nodeapi.yunser.com/ip/me')
        console.log('res', res)
        if (res.success) {
            setCurIp(res.data)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        function handleKeyDown(e) {
            if (tabKey && window.__activeKey && tabKey != window.__activeKey) {
                return
            }
            console.log('IP keydown', e.target)
            console.log('IP keydown/tabKey', tabKey, window.__activeKey)
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => {
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [])


    return (
        <div className={styles.container}
            onKeyDown={(e) => {
                console.log('IP keydown 22222', e.target)
            }}
        >
            <div className={styles.ip}>{curIp}</div>
        </div>
    )
}

