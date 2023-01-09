import { Button, Descriptions, Input, message, Modal, Popover, Space, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import styles from './workbench.module.less';
import _ from 'lodash';
import classNames from 'classnames'
import { useTranslation } from 'react-i18next';
import storage from '@/utils/storage'
import { useInterval } from 'ahooks';

const prodLogos = {
    'mysql': 'mysql.svg',
    'git': 'git.svg',
    'json': 'json.svg',
    'ssh': 'ssh.svg',
    'aliyun': 'aliyun.svg',
    'redis': 'redis.svg',
    'logger': 'logger.svg',
    'swagger': 'api.svg',
}

export function Workbench({ config, onCommand }) {
    const { t } = useTranslation()

    const [historyApps, setHistoryApps] = useState([])

    async function loadHistoryApps() {
        const historyApps = storage.get('historyApps', [])        
        setHistoryApps(historyApps)
    }

    useEffect(() => {
        loadHistoryApps()
    }, [])

    useInterval(() => {
        loadHistoryApps()
    }, 1000)

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
            {historyApps.length > 0 &&
                <div className={styles.section}>
                    <div className={styles.title}>{t('recently_used')}</div>
                    <div className={styles.list}>
                        {historyApps.map(item => {
                            return (
                                <div className={styles.item}
                                    key={item.id}
                                    onClick={() => {
                                        onCommand && onCommand(item.command)
                                    }}
                                >
                                    <div className={styles.name}>{item.name}</div>
                                    {!!prodLogos[item.command] &&
                                        <img className={styles.logo} src={`/prod-logo/${prodLogos[item.command]}`} />
                                    }
                                </div>
                            )
                        })}
                    </div>
                </div>
            }
            <div className={styles.section}>
                <div className={styles.title}>{t('recommend')}</div>
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
                                {!!prodLogos[item.command] &&
                                    <img className={styles.logo} src={`/prod-logo/${prodLogos[item.command]}`} />
                                }
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
