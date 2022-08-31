import { Button, Descriptions, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useMemo } from 'react';
import styles from './help.module.less';
import _ from 'lodash';
import classNames from 'classnames'
// console.log('lodash', _)
import { useTranslation } from 'react-i18next';


export function Help({ config, }) {
    const { t } = useTranslation()

    return (
        <div>
            <article className={styles.article}>
                <h1>帮助</h1>
                <p>功能正在开发中...</p>
            </article>
        </div>
    )
}
