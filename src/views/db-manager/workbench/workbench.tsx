import { Button, Descriptions, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useMemo, useState } from 'react';
import styles from './workbench.module.less';
import _ from 'lodash';
import classNames from 'classnames'
import { useTranslation } from 'react-i18next';

export function Workbench({ config, onCommand }) {
    const { t } = useTranslation()

    const commands = [
        {
            name: 'MySQL',
            command: 'mysql',
        },
        {
            name: 'Git',
            command: 'git',
        },
        {
            name: 'JSON',
            command: 'json',
        },
    ]

    return (
        <div className={styles.workbenchBox}>
            {/* <div className={styles.welcome}>
                {t('welcome')}
            </div> */}
            <div className={styles.list}>
                {commands.map(item => {
                    return (
                        <div className={styles.item}
                            key={item.command}
                            onClick={() => {
                                onCommand && onCommand(item.command)
                            }}
                        >
                            <div className={styles.name}>{item.name}</div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
