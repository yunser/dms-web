import { Alert, Button } from 'antd';
import React, { useState } from 'react';
import styles from './data-backup.module.less';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { request } from '@/views/db-manager/utils/http';
import { TaskDetail } from '../table-data-exporter/table-data-exporter';

export function SqlDataBackup({ config, dbName, connectionId }: any) {
    
    const { t } = useTranslation()
    const [taskId, setTaskId] = useState(false)
    const [exporting, setExporting] = useState(false)

    async function dataImport() {
        setExporting(true)
        let res = await request.post(`${config.host}/mysql/backup`, {
            connectionId,
            dbName,
        })
        if (res.success) {
            setTaskId(res.data.taskId)
        }
    }

    return (
        <div className={styles.docBox}>
            <div className={styles.body}>
            <div className={styles.helpBox}>
                <Alert 
                    type="warning"
                    message={t('mysql.export_data.big_table')}
                />
            </div>
                <div className={styles.infoBox}>
                    {t('mysql.backup')} {dbName}
                </div>
                <div>
                    <Button
                        type="primary"
                        size="small"
                        onClick={() => {
                            dataImport()
                        }}
                        disabled={exporting}
                    >
                        {t('run')}
                    </Button>
                </div>
                <div>
                    {!!taskId &&
                        <TaskDetail
                            config={config}
                            id={taskId}
                        />
                    }
                </div>
            </div>
        </div>
    )
}
