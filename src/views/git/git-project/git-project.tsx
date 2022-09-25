import { Button, Descriptions, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import styles from './git-project.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { DownloadOutlined } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
import { CommitList } from '../commit-list';
import { BranchList } from '../branch-list';
// import { saveAs } from 'file-saver'

export function GitProject() {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()

    const config = {
        host: 'http://localhost:10086',
    }

    return (
        <div className={styles.gitApp}>
            <div className={styles.layoutLeft}>
                <BranchList
                    config={config}
                />
            </div>
            <div className={styles.layoutRight}>
                <CommitList
                    config={config}
                />
            </div>
        </div>
    )
}
