import { Button, Descriptions, Dropdown, Empty, Input, Menu, message, Modal, Popover, Space, Table, Tabs, Tag } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './file-home.module.less';
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

interface File {
    name: string
}

export function FileHome({ tabKey, sourceType, webdavItem, ossItem, config, event$, defaultPath }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()
    const [list, setList] = useState<File[]>([])
    const [curPath, setCurPath] = useState('')
    // const config = {
    //     host: 'http://localhost:10086'
    // }

    return (
        <div className={styles.fileLayout}>
            <div className={styles.layoutLeft}>
                <FileList
                    tabKey={tabKey}
                    config={config}
                    event$={event$}
                    sourceType={sourceType || 'local'}
                    showSide={true}
                    webdavItem={webdavItem}
                    ossItem={ossItem}
                    defaultPath={defaultPath}
                />
            </div>
            {/* <div className={styles.layoutRight}>
                <FileList
                    config={config}
                    sourceType="ssh"
                />
            </div> */}
        </div>
    )
}
