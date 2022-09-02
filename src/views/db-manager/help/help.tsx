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
                <p>目前功能以查询为主，更多功能正在开发中...</p>
                <p>开发目标以满足自用为主，如有建议，请提 <a href="https://github.com/yunser/dms-public/issues" target="_blank">Issure</a>
                </p>
            </article>
        </div>
    )
}
