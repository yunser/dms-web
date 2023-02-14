import { Button, Descriptions, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Popover, Radio, Space, Spin, Table, Tabs, Tag, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './socket-home.module.less';
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


export function SocketHome({ config, onClickItem }) {
    // const { defaultJson = '' } = data

    const [socketType, setSocketType] = useState('udp_server')


    return (
        <div className={styles.socketApp}>
            <div>
                <Radio.Group 
                    value={socketType} 
                    onChange={(e) => {
                        setSocketType(e.target.value)
                    }}
                >
                    {/* <Radio.Button value="tcp_server">TCP 服务端</Radio.Button> */}
                    <Radio.Button value="udp">UDP</Radio.Button>
                    <Radio.Button value="udp_server">UDP 服务端</Radio.Button>
                </Radio.Group>
            </div>
        </div>
    )
}

