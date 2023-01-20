import { Button, Col, Descriptions, Drawer, Dropdown, Empty, Form, Input, InputNumber, Menu, message, Modal, Popover, Row, Space, Spin, Table, Tabs, Tag, Tree } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './project-detail.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import { CloseCircleOutlined, CloseOutlined, CopyOutlined, DownloadOutlined, EllipsisOutlined, HomeOutlined, KeyOutlined, PlusOutlined, ReloadOutlined, StarFilled } from '@ant-design/icons';
import saveAs from 'file-saver';
import { useEventEmitter } from 'ahooks';
// import { GitProject } from '../git-project';
import { request } from '@/views/db-manager/utils/http';
// import { ProjectEditor } from '../project-edit';
import { IconButton } from '@/views/db-manager/icon-button';
import { FullCenterBox } from '@/views/common/full-center-box';
import moment from 'moment';
// import { saveAs } from 'file-saver'

import { OpenAPIObject, PathItemObject } from 'openapi3-ts'
import { marked } from 'marked';
import { CopyButton } from '@/views/db-manager/copy-button';

export function ProjectDetail({ config, project, onHome }) {
    // const { defaultJson = '' } = data
    const { t } = useTranslation()

   
    return (
        <div className={styles.projectApp}>
            项目详情
        </div>
    )
}

