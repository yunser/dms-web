import { Button, Descriptions, Input, message, Modal, Popover, Select, Space, Table, Tabs } from 'antd';
import React, { useMemo } from 'react';
import { VFC, useRef, useState, useEffect } from 'react';
import { request } from '../utils/http';
import styles from './color-selector.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import copy from 'copy-to-clipboard';
import { CheckCircleOutlined, ClearOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import moment from 'moment'
import { IconButton } from '../icon-button';
import { ReloadOutlined } from '@ant-design/icons';
import { CodeDebuger } from '../code-debug';


export function ColorSelector({ value, onChange }) {
    const { t } = useTranslation()
    
    const colors = [
        {
            label: t('color.red'),
            value: 'red',
        },
        {
            label: t('color.blue'),
            value: 'blue',
        },
        {
            label: t('color.green'),
            value: 'green',
        },
        {
            label: t('color.orange'),
            value: 'orange',
        },
    ]

    function ColorItem(item) {
        return (
            <div className={styles.item}></div>
        )
    }

    return (
        <div className={styles.colors}>
            {/* {colors.map(ColorItem)} */}
            {/* 12 */}
            <Select
                value={value}
                onChange={onChange}
                options={colors}
                allowClear
            />
        </div>
    )
}
